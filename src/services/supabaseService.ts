import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  DbProfile, 
  DbProblem, 
  DbUserProgress, 
  DbSubmissionProof, 
  DbCertificate,
  Problem,
  ProblemStatus,
  UserProgress
} from '../types';
import { PROBLEMS_DATA } from '../data/problems';

export class SupabaseService {
  private schemaMissing: boolean = false;
  private schemaMissingListeners: Set<(isMissing: boolean) => void> = new Set();

  onSchemaMissingChange(listener: (isMissing: boolean) => void): () => void {
    this.schemaMissingListeners.add(listener);
    return () => this.schemaMissingListeners.delete(listener);
  }

  isSchemaMissing(): boolean {
    return this.schemaMissing;
  }

  private setSchemaMissing(missing: boolean) {
    if (this.schemaMissing !== missing) {
      this.schemaMissing = missing;
      this.schemaMissingListeners.forEach((l) => l(missing));
    }
  }

  private isTableMissingError(error: any): boolean {
    if (!error) return false;
    return (
      error.code === 'PGRST205' ||
      (typeof error.message === 'string' && error.message.includes('schema cache')) ||
      (typeof error.message === 'string' && error.message.includes('relation') && error.message.includes('does not exist'))
    );
  }

  // ========================================================
  // LOCAL STORAGE FALLBACK HELPERS
  // ========================================================
  private getLocalProfile(userId: string, fullName: string, email: string): DbProfile {
    try {
      const stored = localStorage.getItem(`dpquest_profile_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {}

    const profile: DbProfile = {
      id: userId,
      full_name: fullName,
      email: email,
      total_xp: 0,
      current_streak: 1
    };
    try {
      localStorage.setItem(`dpquest_profile_${userId}`, JSON.stringify(profile));
    } catch {}
    return profile;
  }

  private getLocalProgress(userId: string, problems: Problem[]): Record<string, UserProgress> {
    try {
      const stored = localStorage.getItem(`dpquest_progress_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const defaultProgressMap: Record<string, UserProgress> = {};
    problems.forEach((p, idx) => {
      defaultProgressMap[p.id] = {
        userId,
        problemId: p.id,
        status: idx === 0 ? 'AVAILABLE' : 'LOCKED',
        xpEarned: 0
      };
    });

    try {
      localStorage.setItem(`dpquest_progress_${userId}`, JSON.stringify(defaultProgressMap));
    } catch {}

    return defaultProgressMap;
  }

  private saveLocalProgress(userId: string, progress: Record<string, UserProgress>) {
    try {
      localStorage.setItem(`dpquest_progress_${userId}`, JSON.stringify(progress));
    } catch {}
  }

  private getLocalCertificate(userId: string): DbCertificate | null {
    try {
      const stored = localStorage.getItem(`dpquest_cert_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  }

  private saveLocalCertificate(userId: string, cert: DbCertificate) {
    try {
      localStorage.setItem(`dpquest_cert_${userId}`, JSON.stringify(cert));
    } catch {}
  }

  // ========================================================
  // 1. PROFILES
  // ========================================================
  async getProfile(userId: string): Promise<DbProfile | null> {
    if (!isSupabaseConfigured() || this.schemaMissing) {
      return this.getLocalProfile(userId, '', '');
    }

    try {
      const { data: existing, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
        }
        return null;
      }

      return (existing as DbProfile) || null;
    } catch (e) {
      return null;
    }
  }

  async ensureProfile(userId: string, fullName: string, email: string): Promise<DbProfile | null> {
    if (!isSupabaseConfigured() || this.schemaMissing) {
      return this.getLocalProfile(userId, fullName, email);
    }

    try {
      // 1. Check if profile exists
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchErr) {
        if (this.isTableMissingError(fetchErr)) {
          this.setSchemaMissing(true);
          return this.getLocalProfile(userId, fullName, email);
        }
        if (fetchErr.code !== 'PGRST116') {
          console.warn('Profile fetch notice:', fetchErr.message);
        }
      }

      if (existing) {
        return existing as DbProfile;
      }

      // 2. Create profile
      const newProfile: Partial<DbProfile> = {
        id: userId,
        full_name: fullName,
        email: email,
        total_xp: 0,
        current_streak: 1
      };

      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertErr) {
        if (this.isTableMissingError(insertErr)) {
          this.setSchemaMissing(true);
          return this.getLocalProfile(userId, fullName, email);
        }
        console.warn('Profile create notice:', insertErr.message);
        return this.getLocalProfile(userId, fullName, email);
      }

      return created as DbProfile;
    } catch (e) {
      return this.getLocalProfile(userId, fullName, email);
    }
  }

  // ========================================================
  // 2. PROBLEMS
  // ========================================================
  async getProblems(): Promise<Problem[]> {
    if (!isSupabaseConfigured() || this.schemaMissing) {
      return PROBLEMS_DATA;
    }

    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
        }
        return PROBLEMS_DATA;
      }

      if (!data || data.length === 0) {
        this.seedProblems().catch(() => {});
        return PROBLEMS_DATA;
      }

      return data.map((row: DbProblem) => {
        const canonical = PROBLEMS_DATA.find(
          (p) => p.number === row.problem_number || p.id === row.id || p.title.toLowerCase() === row.title.toLowerCase()
        );
        return {
          id: row.id,
          number: row.problem_number,
          title: row.title,
          platform: row.platform as any,
          problemNumber: row.problem_number_external || canonical?.problemNumber || undefined,
          url: canonical?.url || row.url,
          xp: row.xp || 10,
          category: (row.category || canonical?.category || '1D DP') as any,
          order: row.display_order,
          hintSnippet: row.hint_snippet || canonical?.hintSnippet || undefined
        };
      });
    } catch (e) {
      return PROBLEMS_DATA;
    }
  }

  async seedProblems(): Promise<void> {
    if (!isSupabaseConfigured() || this.schemaMissing) return;

    try {
      const { count, error } = await supabase
        .from('problems')
        .select('*', { count: 'exact', head: true });

      if (error && this.isTableMissingError(error)) {
        this.setSchemaMissing(true);
        return;
      }

      if (count && count >= 25) return;

      const records = PROBLEMS_DATA.map((p) => ({
        problem_number: p.number,
        title: p.title,
        platform: p.platform,
        problem_number_external: p.problemNumber ? String(p.problemNumber) : null,
        url: p.url,
        xp: p.xp,
        display_order: p.order,
        category: p.category,
        hint_snippet: p.hintSnippet || null
      }));

      await supabase.from('problems').upsert(records, { onConflict: 'problem_number' });
    } catch {}
  }

  // ========================================================
  // 3. USER PROGRESS
  // ========================================================
  async initializeUserProgress(userId: string, problems: Problem[]): Promise<Record<string, UserProgress>> {
    const defaultProgressMap: Record<string, UserProgress> = {};
    problems.forEach((p, idx) => {
      defaultProgressMap[p.id] = {
        userId,
        problemId: p.id,
        status: idx === 0 ? 'AVAILABLE' : 'LOCKED',
        xpEarned: 0
      };
    });

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return this.getLocalProgress(userId, problems);
    }

    try {
      // 1. Check existing progress records
      const { data: existing, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
          return this.getLocalProgress(userId, problems);
        }
        console.warn('Progress fetch notice:', error.message);
        return this.getLocalProgress(userId, problems);
      }

      if (existing && existing.length >= problems.length) {
        const resultMap: Record<string, UserProgress> = {};
        existing.forEach((row: DbUserProgress) => {
          resultMap[row.problem_id] = {
            userId: row.user_id,
            problemId: row.problem_id,
            status: row.status,
            xpEarned: row.xp_earned,
            completedAt: row.completed_at || undefined
          };
        });
        return resultMap;
      }

      // Prepare batch records
      const existingProblemIds = new Set(existing?.map((r) => r.problem_id) || []);
      const toInsert = problems
        .filter((p) => !existingProblemIds.has(p.id))
        .map((p, idx) => {
          const isFirst = existing?.length === 0 && idx === 0;
          return {
            user_id: userId,
            problem_id: p.id,
            status: isFirst ? 'AVAILABLE' : 'LOCKED',
            xp_earned: 0
          };
        });

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from('user_progress')
          .insert(toInsert);

        if (insertErr && this.isTableMissingError(insertErr)) {
          this.setSchemaMissing(true);
          return this.getLocalProgress(userId, problems);
        }
      }

      // Fetch fresh progress
      const { data: fresh } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (fresh && fresh.length > 0) {
        const resultMap: Record<string, UserProgress> = {};
        fresh.forEach((row: DbUserProgress) => {
          resultMap[row.problem_id] = {
            userId: row.user_id,
            problemId: row.problem_id,
            status: row.status,
            xpEarned: row.xp_earned,
            completedAt: row.completed_at || undefined
          };
        });
        return resultMap;
      }

      return defaultProgressMap;
    } catch (e) {
      return this.getLocalProgress(userId, problems);
    }
  }

  async completeProblem(
    userId: string,
    problemId: string,
    allProblems: Problem[],
    currentProgress: Record<string, UserProgress>
  ): Promise<{ success: boolean; nextProblemId?: string; error?: string }> {
    const currentIndex = allProblems.findIndex((p) => p.id === problemId);
    let nextProblemId: string | undefined = undefined;
    if (currentIndex !== -1 && currentIndex + 1 < allProblems.length) {
      nextProblemId = allProblems[currentIndex + 1].id;
    }

    const updatedProgress = { ...currentProgress };
    updatedProgress[problemId] = {
      ...updatedProgress[problemId],
      status: 'COMPLETED',
      xpEarned: 10,
      completedAt: new Date().toISOString()
    };

    if (nextProblemId && updatedProgress[nextProblemId]?.status === 'LOCKED') {
      updatedProgress[nextProblemId] = {
        ...updatedProgress[nextProblemId],
        status: 'AVAILABLE'
      };
    }

    this.saveLocalProgress(userId, updatedProgress);

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return { success: true, nextProblemId };
    }

    try {
      const now = new Date().toISOString();

      await supabase
        .from('user_progress')
        .update({
          status: 'COMPLETED',
          xp_earned: 10,
          completed_at: now,
          updated_at: now
        })
        .match({ user_id: userId, problem_id: problemId });

      if (nextProblemId) {
        await supabase
          .from('user_progress')
          .update({
            status: 'AVAILABLE',
            updated_at: now
          })
          .match({ user_id: userId, problem_id: nextProblemId });
      }

      return { success: true, nextProblemId };
    } catch (e: any) {
      return { success: true, nextProblemId };
    }
  }

  // ========================================================
  // 4. STORAGE & PROOFS
  // ========================================================
  async uploadScreenshot(
    userId: string,
    problemId: string,
    file: File | Blob,
    fileNameHint: string = 'proof.png'
  ): Promise<{ success: boolean; storagePath?: string; error?: string }> {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Image must be smaller than 10 MB.' };
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const mimeType = file.type || 'image/png';
    if (!allowedTypes.includes(mimeType)) {
      return { success: false, error: 'File must be PNG, JPG, JPEG, or WEBP.' };
    }

    let ext = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('webp')) ext = 'webp';

    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storagePath = `${userId}/${problemId}/${safeFileName}`;

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return { success: true, storagePath: `local://${storagePath}` };
    }

    try {
      const { data, error } = await supabase.storage
        .from('submission-proofs')
        .upload(storagePath, file, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        // If storage bucket is missing, use local storage path gracefully
        return { success: true, storagePath: `local://${storagePath}` };
      }

      return { success: true, storagePath: data.path };
    } catch (e: any) {
      return { success: true, storagePath: `local://${storagePath}` };
    }
  }

  async submitProofPending(
    userId: string,
    problemId: string,
    storagePath: string
  ): Promise<{ success: boolean; proof?: DbSubmissionProof; error?: string }> {
    const localProof: DbSubmissionProof = {
      id: `prf_${Date.now()}`,
      user_id: userId,
      problem_id: problemId,
      image_url: storagePath,
      verification_status: 'PENDING',
      verification_score: 0,
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return { success: true, proof: localProof };
    }

    try {
      const { data, error } = await supabase
        .from('submission_proofs')
        .insert({
          user_id: userId,
          problem_id: problemId,
          image_url: storagePath,
          verification_status: 'PENDING',
          verification_score: 0
        })
        .select()
        .single();

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
        }
        return { success: true, proof: localProof };
      }

      return { success: true, proof: data as DbSubmissionProof };
    } catch {
      return { success: true, proof: localProof };
    }
  }

  // ========================================================
  // 5. CERTIFICATES
  // ========================================================
  async getCertificate(userId: string): Promise<DbCertificate | null> {
    if (!isSupabaseConfigured() || this.schemaMissing) {
      return this.getLocalCertificate(userId);
    }

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
          return this.getLocalCertificate(userId);
        }
        console.warn('Certificate fetch notice:', error.message);
        return this.getLocalCertificate(userId);
      }
      return (data as DbCertificate | null) || this.getLocalCertificate(userId);
    } catch (e) {
      return this.getLocalCertificate(userId);
    }
  }

  async createCertificate(
    userId: string,
    certificateId: string,
    verificationUrl: string,
    userName?: string
  ): Promise<DbCertificate | null> {
    const localCert: DbCertificate = {
      id: `cert_${Date.now()}`,
      user_id: userId,
      certificate_id: certificateId,
      user_name: userName || 'Quest Explorer',
      completed_at: new Date().toISOString(),
      verification_url: verificationUrl
    };

    this.saveLocalCertificate(userId, localCert);

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return localCert;
    }

    try {
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          certificate_id: certificateId,
          user_name: userName,
          verification_url: verificationUrl
        })
        .select()
        .single();

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
        }
        return localCert;
      }

      return data as DbCertificate;
    } catch {
      return localCert;
    }
  }

  async resetUserProgress(userId: string): Promise<boolean> {
    try {
      localStorage.removeItem(`dpquest_progress_${userId}`);
      localStorage.removeItem(`dpquest_cert_${userId}`);
      localStorage.removeItem(`dpquest_profile_${userId}`);
    } catch {}

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return true;
    }

    try {
      await supabase.from('user_progress').delete().eq('user_id', userId);
      await supabase.from('submission_proofs').delete().eq('user_id', userId);
      await supabase.from('certificates').delete().eq('user_id', userId);
      return true;
    } catch {
      return true;
    }
  }
}

export const supabaseService = new SupabaseService();
