import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Problem, 
  UserProgress, 
  SubmissionProof, 
  VerificationState, 
  ProblemStatus,
  Certificate 
} from '../types';
import { PROBLEMS_DATA } from '../data/problems';

export interface DbProfile {
  id: string;
  full_name: string;
  email: string;
  section?: string | null;
  password?: string | null;
  total_xp: number;
  completed_count: number;
  current_streak: number;
  created_at?: string;
}

export interface DbProblem {
  id: string;
  problem_number: number;
  title: string;
  platform: string;
  problem_number_external?: string | null;
  url: string;
  xp: number;
  display_order: number;
  category: string;
  hint_snippet?: string | null;
}

export interface DbUserProgress {
  id?: string;
  user_id: string;
  problem_id: string;
  status: ProblemStatus;
  xp_earned: number;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbSubmissionProof {
  id?: string;
  user_id: string;
  problem_id: string;
  image_url: string;
  verification_status: VerificationState;
  verification_score?: number | null;
  verification_reason?: string | null;
  ai_result?: any;
  verified_at?: string | null;
  created_at?: string;
}

export interface DbCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  user_name: string;
  completed_at: string;
  verification_url: string;
  download_count?: number;
  first_downloaded_at?: string | null;
  last_downloaded_at?: string | null;
  created_at?: string;
}

class SupabaseService {
  private schemaMissing: boolean = false;
  private schemaMissingListeners: Array<(missing: boolean) => void> = [];

  private isTableMissingError(error: any): boolean {
    if (!error) return false;
    const msg = error.message || '';
    const code = error.code || '';
    return (
      code === '42P01' || // undefined_table
      msg.includes('relation') && msg.includes('does not exist') ||
      msg.includes('table') && msg.includes('not found') ||
      code === 'PGRST204' ||
      code === 'PGRST205'
    );
  }

  isSchemaMissing(): boolean {
    return this.schemaMissing;
  }

  setSchemaMissing(missing: boolean) {
    this.schemaMissing = missing;
    this.schemaMissingListeners.forEach((listener) => {
      try { listener(missing); } catch {}
    });
    if (missing) {
      console.warn('[SupabaseService] Database schema tables missing. Utilizing responsive offline cache fallback.');
    }
  }

  onSchemaMissingChange(callback: (missing: boolean) => void): () => void {
    this.schemaMissingListeners.push(callback);
    return () => {
      this.schemaMissingListeners = this.schemaMissingListeners.filter((l) => l !== callback);
    };
  }

  // ========================================================
  // LOCAL STORAGE FALLBACK HELPERS
  // ========================================================
  private getLocalProfile(userId: string, fullName: string, email: string, section?: string): DbProfile {
    try {
      const stored = localStorage.getItem(`dpquest_profile_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (section && !parsed.section) parsed.section = section;
        return parsed;
      }
    } catch {}

    const profile: DbProfile = {
      id: userId,
      full_name: fullName,
      email: email,
      section: section || null,
      total_xp: 0,
      completed_count: 0,
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
      if (stored) {
        return JSON.parse(stored);
      }
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

  async ensureProfile(
    userId: string, 
    fullName: string, 
    email: string, 
    section?: string,
    password?: string
  ): Promise<DbProfile | null> {
    if (!isSupabaseConfigured() || this.schemaMissing) {
      return this.getLocalProfile(userId, fullName, email, section);
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
          return this.getLocalProfile(userId, fullName, email, section);
        }
        if (fetchErr.code !== 'PGRST116') {
          console.warn('Profile fetch notice:', fetchErr.message);
        }
      }

      if (existing) {
        let needsUpdate = false;
        const updates: any = {};

        if (password && existing.password !== password) {
          updates.password = password;
          existing.password = password;
          needsUpdate = true;
        }

        if (section && existing.section !== section) {
          updates.section = section;
          existing.section = section;
          needsUpdate = true;
        }

        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();
          try {
            await supabase
              .from('profiles')
              .update(updates)
              .eq('id', userId);
          } catch {}
        }

        return existing as DbProfile;
      }

      // 2. Create profile with section & password
      const newProfile: Partial<DbProfile> = {
        id: userId,
        full_name: fullName,
        email: email,
        section: section || null,
        password: password || null,
        total_xp: 0,
        completed_count: 0,
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
          return this.getLocalProfile(userId, fullName, email, section);
        }
        console.warn('Profile creation notice:', insertErr.message);
        return this.getLocalProfile(userId, fullName, email, section);
      }

      return created as DbProfile;
    } catch (e) {
      return this.getLocalProfile(userId, fullName, email, section);
    }
  }

  async updateProfileStats(userId: string, completedCount: number): Promise<void> {
    const totalXp = completedCount * 10;
    if (!isSupabaseConfigured() || this.schemaMissing) {
      const p = this.getLocalProfile(userId, '', '');
      p.total_xp = totalXp;
      p.completed_count = completedCount;
      try {
        localStorage.setItem(`dpquest_profile_${userId}`, JSON.stringify(p));
      } catch {}
      return;
    }

    try {
      await supabase
        .from('profiles')
        .update({
          total_xp: totalXp,
          completed_count: completedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch {}
  }

  async updateProfileXp(userId: string, xpIncrement: number): Promise<number> {
    if (!isSupabaseConfigured() || this.schemaMissing) {
      const p = this.getLocalProfile(userId, '', '');
      p.total_xp += xpIncrement;
      p.completed_count = Math.floor(p.total_xp / 10);
      try {
        localStorage.setItem(`dpquest_profile_${userId}`, JSON.stringify(p));
      } catch {}
      return p.total_xp;
    }

    try {
      const profile = await this.getProfile(userId);
      const newTotal = (profile?.total_xp || 0) + xpIncrement;
      const completedCount = Math.floor(newTotal / 10);

      await supabase
        .from('profiles')
        .update({ 
          total_xp: newTotal, 
          completed_count: completedCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      return newTotal;
    } catch (e) {
      return 0;
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
      // 1. Delete any stale problem records > PROBLEMS_DATA.length (e.g. old 23, 24, 25)
      await supabase
        .from('problems')
        .delete()
        .gt('problem_number', PROBLEMS_DATA.length);

      await supabase
        .from('problems')
        .delete()
        .gt('display_order', PROBLEMS_DATA.length);

      // 2. Reseed / Sync PROBLEMS_DATA so problem_number 1..22 are up to date
      await this.seedProblemsIfEmpty(true);

      const { data: dbProblems, error } = await supabase
        .from('problems')
        .select('*')
        .lte('problem_number', PROBLEMS_DATA.length)
        .order('display_order', { ascending: true });

      if (error || !dbProblems || dbProblems.length === 0) {
        return PROBLEMS_DATA;
      }

      // Map and deduplicate by problem_number (max PROBLEMS_DATA.length)
      const problemMap = new Map<number, Problem>();
      
      PROBLEMS_DATA.forEach((p) => {
        problemMap.set(p.number, p);
      });

      dbProblems.forEach((p: DbProblem) => {
        if (p.problem_number <= PROBLEMS_DATA.length) {
          const codeProblem = PROBLEMS_DATA.find((cp) => cp.number === p.problem_number);
          if (codeProblem) {
            problemMap.set(p.problem_number, {
              id: p.id,
              number: p.problem_number,
              title: codeProblem.title,
              platform: codeProblem.platform,
              problemNumber: codeProblem.problemNumber,
              url: codeProblem.url,
              xp: p.xp || 10,
              order: p.display_order || p.problem_number,
              category: codeProblem.category,
              hintSnippet: codeProblem.hintSnippet
            });
          }
        }
      });

      return Array.from(problemMap.values()).sort((a, b) => a.number - b.number);
    } catch (e) {
      return PROBLEMS_DATA;
    }
  }

  async seedProblemsIfEmpty(forceUpdate = false) {
    if (!isSupabaseConfigured() || this.schemaMissing) return;

    try {
      await supabase
        .from('problems')
        .delete()
        .gt('problem_number', PROBLEMS_DATA.length);

      const { count, error } = await supabase
        .from('problems')
        .select('*', { count: 'exact', head: true });

      if (error && this.isTableMissingError(error)) {
        this.setSchemaMissing(true);
        return;
      }

      if (!forceUpdate && count && count === PROBLEMS_DATA.length) return;

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
  // 3. USER PROGRESS & SEQUENTIAL UNLOCK RECONCILIATION
  // ========================================================
  reconcileSequentialProgress(
    userId: string,
    progressMap: Record<string, UserProgress>,
    sortedProblems: Problem[]
  ): Record<string, UserProgress> {
    const result: Record<string, UserProgress> = { ...progressMap };

    for (let i = 0; i < sortedProblems.length; i++) {
      const currentProb = sortedProblems[i];
      const prevProb = i > 0 ? sortedProblems[i - 1] : null;

      const currentEntry = result[currentProb.id] || {
        userId,
        problemId: currentProb.id,
        status: 'LOCKED',
        xpEarned: 0
      };

      if (currentEntry.status === 'COMPLETED') {
        result[currentProb.id] = currentEntry;
      } else if (i === 0) {
        // First problem is always AVAILABLE
        result[currentProb.id] = {
          ...currentEntry,
          status: 'AVAILABLE'
        };
      } else if (prevProb && result[prevProb.id]?.status === 'COMPLETED') {
        // Preceding problem is COMPLETED -> Unlock this problem!
        result[currentProb.id] = {
          ...currentEntry,
          status: 'AVAILABLE'
        };
      } else {
        // Otherwise locked
        result[currentProb.id] = {
          ...currentEntry,
          status: 'LOCKED'
        };
      }
    }

    this.saveLocalProgress(userId, result);
    return result;
  }

  private async syncProgressToSupabase(
    userId: string,
    reconciledMap: Record<string, UserProgress>,
    existingRows: DbUserProgress[]
  ) {
    if (!isSupabaseConfigured() || this.schemaMissing) return;

    try {
      const existingMap = new Map(existingRows.map((r) => [r.problem_id, r.status]));
      const updatesToMake: Array<{ user_id: string; problem_id: string; status: ProblemStatus; xp_earned: number }> = [];

      Object.values(reconciledMap).forEach((prog) => {
        const existingStatus = existingMap.get(prog.problemId);
        if (!existingStatus || existingStatus !== prog.status) {
          updatesToMake.push({
            user_id: userId,
            problem_id: prog.problemId,
            status: prog.status,
            xp_earned: prog.xpEarned || 0
          });
        }
      });

      if (updatesToMake.length > 0) {
        await supabase
          .from('user_progress')
          .upsert(updatesToMake, { onConflict: 'user_id,problem_id' });
      }
    } catch (err) {
      console.warn('Progress background sync notice:', err);
    }
  }

  async initializeUserProgress(userId: string, problems: Problem[]): Promise<Record<string, UserProgress>> {
    const sortedProblems = [...problems].sort((a, b) => a.number - b.number);

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return this.reconcileSequentialProgress(userId, this.getLocalProgress(userId, sortedProblems), sortedProblems);
    }

    try {
      const { data: existing, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
          return this.reconcileSequentialProgress(userId, this.getLocalProgress(userId, sortedProblems), sortedProblems);
        }
        console.warn('Progress fetch notice:', error.message);
        return this.reconcileSequentialProgress(userId, this.getLocalProgress(userId, sortedProblems), sortedProblems);
      }

      const rawMap: Record<string, UserProgress> = {};
      if (existing) {
        existing.forEach((row: DbUserProgress) => {
          rawMap[row.problem_id] = {
            userId: row.user_id,
            problemId: row.problem_id,
            status: row.status,
            xpEarned: row.xp_earned,
            completedAt: row.completed_at || undefined
          };
        });
      }

      sortedProblems.forEach((p, idx) => {
        if (!rawMap[p.id]) {
          rawMap[p.id] = {
            userId,
            problemId: p.id,
            status: idx === 0 ? 'AVAILABLE' : 'LOCKED',
            xpEarned: 0
          };
        }
      });

      const reconciledMap = this.reconcileSequentialProgress(userId, rawMap, sortedProblems);
      this.syncProgressToSupabase(userId, reconciledMap, existing || []);

      const completedCount = Object.values(reconciledMap).filter((p) => p.status === 'COMPLETED').length;
      await this.updateProfileStats(userId, completedCount);

      return reconciledMap;
    } catch (e) {
      return this.reconcileSequentialProgress(userId, this.getLocalProgress(userId, sortedProblems), sortedProblems);
    }
  }

  async completeProblem(
    userId: string,
    problemId: string,
    allProblems: Problem[],
    currentProgress: Record<string, UserProgress>
  ): Promise<{ success: boolean; nextProblemId?: string; error?: string }> {
    const sortedProblems = [...allProblems].sort((a, b) => a.number - b.number);
    const currentIndex = sortedProblems.findIndex((p) => p.id === problemId);
    let nextProblemId: string | undefined = undefined;
    if (currentIndex !== -1 && currentIndex + 1 < sortedProblems.length) {
      nextProblemId = sortedProblems[currentIndex + 1].id;
    }

    const updatedProgress = { ...currentProgress };
    updatedProgress[problemId] = {
      ...updatedProgress[problemId],
      status: 'COMPLETED',
      xpEarned: 10,
      completedAt: new Date().toISOString()
    };

    if (nextProblemId && updatedProgress[nextProblemId]?.status !== 'COMPLETED') {
      updatedProgress[nextProblemId] = {
        ...updatedProgress[nextProblemId],
        status: 'AVAILABLE'
      };
    }

    const reconciled = this.reconcileSequentialProgress(userId, updatedProgress, sortedProblems);
    this.saveLocalProgress(userId, reconciled);

    const completedCount = Object.values(reconciled).filter((p) => p.status === 'COMPLETED').length;
    await this.updateProfileStats(userId, completedCount);

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return { success: true, nextProblemId };
    }

    try {
      const now = new Date().toISOString();

      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          problem_id: problemId,
          status: 'COMPLETED',
          xp_earned: 10,
          completed_at: now,
          updated_at: now
        }, { onConflict: 'user_id,problem_id' });

      if (nextProblemId) {
        await supabase
          .from('user_progress')
          .upsert({
            user_id: userId,
            problem_id: nextProblemId,
            status: 'AVAILABLE',
            updated_at: now
          }, { onConflict: 'user_id,problem_id' });
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
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Image must be smaller than 5 MB.' };
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const mimeType = file.type || 'image/png';
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return { success: false, error: 'Please upload a PNG, JPEG, or WEBP screenshot.' };
    }

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return { success: true, storagePath: `local://${userId}/${problemId}/${Date.now()}_${fileNameHint}` };
    }

    try {
      const cleanFileName = fileNameHint.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${userId}/${problemId}/${Date.now()}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('submission-proofs')
        .upload(storagePath, file, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.warn('Storage upload notice (falling back to data URL):', error.message);
        return { success: true, storagePath: `local://${userId}/${problemId}/${Date.now()}_${cleanFileName}` };
      }

      return { success: true, storagePath: data?.path || storagePath };
    } catch (e: any) {
      return { success: true, storagePath: `local://${userId}/${problemId}/${Date.now()}_${fileNameHint}` };
    }
  }

  async submitProofPending(
    userId: string,
    problemId: string,
    storagePath: string
  ): Promise<{ success: boolean; proof?: DbSubmissionProof; error?: string }> {
    return this.createSubmissionProof({
      user_id: userId,
      problem_id: problemId,
      image_url: storagePath,
      verification_status: 'PENDING'
    });
  }

  async createSubmissionProof(proof: DbSubmissionProof): Promise<{ success: boolean; proof?: DbSubmissionProof; error?: string }> {
    if (!isSupabaseConfigured() || this.schemaMissing) {
      return { success: true, proof: { ...proof, id: `proof_${Date.now()}` } };
    }

    try {
      const { data, error } = await supabase
        .from('submission_proofs')
        .insert({
          user_id: proof.user_id,
          problem_id: proof.problem_id,
          image_url: proof.image_url,
          verification_status: proof.verification_status || 'PENDING',
          verification_score: proof.verification_score || null,
          verification_reason: proof.verification_reason || null,
          ai_result: proof.ai_result || null
        })
        .select()
        .single();

      if (error) {
        if (this.isTableMissingError(error)) {
          this.setSchemaMissing(true);
          return { success: true, proof: { ...proof, id: `proof_${Date.now()}` } };
        }
        console.warn('Proof insert notice:', error.message);
        return { success: true, proof: { ...proof, id: `proof_${Date.now()}` } };
      }

      return { success: true, proof: data as DbSubmissionProof };
    } catch (e: any) {
      return { success: true, proof: { ...proof, id: `proof_${Date.now()}` } };
    }
  }

  async getLatestSubmissionProof(userId: string, problemId: string): Promise<DbSubmissionProof | null> {
    if (!isSupabaseConfigured() || this.schemaMissing) return null;

    try {
      const { data, error } = await supabase
        .from('submission_proofs')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return (data as DbSubmissionProof) || null;
    } catch {
      return null;
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
        }
        return this.getLocalCertificate(userId);
      }

      return (data as DbCertificate) || this.getLocalCertificate(userId);
    } catch {
      return this.getLocalCertificate(userId);
    }
  }

  async saveCertificate(cert: DbCertificate): Promise<boolean> {
    this.saveLocalCertificate(cert.user_id, cert);

    if (!isSupabaseConfigured() || this.schemaMissing) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('certificates')
        .upsert({
          user_id: cert.user_id,
          certificate_id: cert.certificate_id,
          user_name: cert.user_name,
          completed_at: cert.completed_at,
          verification_url: cert.verification_url,
          download_count: cert.download_count || 0
        }, { onConflict: 'user_id' });

      if (error) {
        console.warn('Certificate save notice:', error.message);
      }
      return true;
    } catch {
      return true;
    }
  }
}

export const supabaseService = new SupabaseService();
