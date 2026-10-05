import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Certificate,
  Problem,
  ProblemStatus,
  SubmissionProof,
  User,
  UserProgress,
  VerificationState,
  ViewType
} from '../types';
import { PROBLEMS_DATA } from '../data/problems';
import { verificationService } from '../services/verificationService';
import { supabaseService } from '../services/supabaseService';
import { certificateService } from '../services/certificateService';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface QuestContextType {
  problems: Problem[];
  userProgress: Record<string, UserProgress>;
  submissionProofs: Record<string, SubmissionProof>;
  currentView: ViewType;
  selectedProblemId: string | null;
  activeProblem: Problem;
  nextUnlockedProblem: Problem | null;
  completedCount: number;
  totalXp: number;
  progressPercentage: number;
  isQuestComplete: boolean;
  certificate: Certificate | null;
  isLoadingData: boolean;
  // Actions
  navigateTo: (view: ViewType, problemId?: string) => void;
  selectProblem: (problemId: string) => void;
  submitProof: (
    problemId: string, 
    imageFileOrDataUrl: File | string, 
    previewUrl?: string
  ) => Promise<{ success: boolean; notes: string; status?: VerificationState }>;
  generateCertificate: () => Promise<Certificate | null>;
  resetProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  // Verification modal state
  isProofModalOpen: boolean;
  modalProblemId: string | null;
  openProofModal: (problemId: string) => void;
  closeProofModal: () => void;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const QuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, isAuthenticated } = useAuth();

  const [problems, setProblems] = useState<Problem[]>(PROBLEMS_DATA);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [submissionProofs, setSubmissionProofs] = useState<Record<string, SubmissionProof>>({});
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(PROBLEMS_DATA[0].id);

  // Proof Modal state
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [modalProblemId, setModalProblemId] = useState<string | null>(null);

  // Sync / Load database data when user logs in or changes
  const loadDatabaseData = useCallback(async () => {
    if (!user) {
      setUserProgress({});
      setCertificate(null);
      setSubmissionProofs({});
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);

    try {
      // 1. Fetch 25 problems
      const loadedProblems = await supabaseService.getProblems();
      setProblems(loadedProblems);

      // 2. Initialize or fetch user progress
      const progressMap = await supabaseService.initializeUserProgress(user.id, loadedProblems);
      setUserProgress(progressMap);

      // 3. Fetch certificate if already earned
      const dbCert = await supabaseService.getCertificate(user.id);
      if (dbCert) {
        setCertificate({
          id: dbCert.id,
          userId: dbCert.user_id,
          certificateId: dbCert.certificate_id,
          userName: user.fullName,
          completedAt: new Date(dbCert.completed_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          totalProblems: 25,
          totalXp: 250,
          verificationUrl: dbCert.verification_url
        });
      } else {
        setCertificate(null);
      }
    } catch (err) {
      console.error('Error synchronizing database data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Derived calculations directly from user_progress
  const completedProblems = problems.filter(
    (p) => userProgress[p.id]?.status === 'COMPLETED'
  );
  const completedCount = completedProblems.length;
  // Strict XP rule: exactly 10 XP per unique completed problem, max 250 XP
  const totalXp = completedCount * 10;
  const progressPercentage = Math.round((completedCount / problems.length) * 100);
  const isQuestComplete = completedCount === problems.length && problems.length > 0;

  // Next unlocked problem (the first one that is AVAILABLE)
  const nextUnlockedProblem = problems.find(
    (p) => userProgress[p.id]?.status === 'AVAILABLE'
  ) || null;

  // Active problem object
  const activeProblem =
    problems.find((p) => p.id === selectedProblemId) || problems[0];

  const navigateTo = useCallback((view: ViewType, problemId?: string) => {
    if (problemId) {
      setSelectedProblemId(problemId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectProblem = useCallback((problemId: string) => {
    setSelectedProblemId(problemId);
    setCurrentView('problem-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openProofModal = useCallback((problemId: string) => {
    setModalProblemId(problemId);
    setIsProofModalOpen(true);
  }, []);

  const closeProofModal = useCallback(() => {
    setIsProofModalOpen(false);
    setModalProblemId(null);
  }, []);

  const submitProof = async (
    problemId: string,
    imageFileOrDataUrl: File | string,
    previewUrl?: string
  ): Promise<{ success: boolean; notes: string; status?: VerificationState }> => {
    if (!user) return { success: false, notes: 'User session required.' };

    const problem = problems.find((p) => p.id === problemId);
    if (!problem) return { success: false, notes: 'Problem not found.' };

    const currentProg = userProgress[problemId];
    if (currentProg?.status === 'COMPLETED') {
      return { success: false, notes: 'Problem is already completed. No duplicate submissions permitted.' };
    }
    if (currentProg?.status === 'LOCKED') {
      return { success: false, notes: 'Problem is locked. Complete previous problems first.' };
    }

    // Set UI state to VERIFYING
    setUserProgress((prev) => ({
      ...prev,
      [problemId]: {
        ...prev[problemId],
        status: 'VERIFYING'
      }
    }));

    try {
      // 1. Prepare File / Blob
      let fileToUpload: File | Blob;
      let displayUrl = previewUrl || (typeof imageFileOrDataUrl === 'string' ? imageFileOrDataUrl : '');

      if (typeof imageFileOrDataUrl === 'string') {
        // Data URL to blob conversion if string
        const res = await fetch(imageFileOrDataUrl);
        fileToUpload = await res.blob();
      } else {
        fileToUpload = imageFileOrDataUrl;
      }

      // 2. Upload to Supabase Storage `submission-proofs`
      const uploadRes = await supabaseService.uploadScreenshot(
        user.id,
        problemId,
        fileToUpload
      );

      if (!uploadRes.success || !uploadRes.storagePath) {
        throw new Error(uploadRes.error || 'Failed to upload screenshot to storage.');
      }

      // 3. Create pending record in submission_proofs table
      const proofRes = await supabaseService.submitProofPending(
        user.id,
        problemId,
        uploadRes.storagePath
      );

      if (!proofRes.success) {
        throw new Error(proofRes.error || 'Failed to record submission proof.');
      }

      // 4. Call server-side Gemini Vision verification endpoint
      const verifyRes = await verificationService.verifySubmissionProof({
        problemId: problem.id,
        problemTitle: problem.title,
        platform: problem.platform,
        imageUrl: displayUrl,
        storagePath: uploadRes.storagePath,
        submissionProofId: proofRes.proof?.id,
        userId: user.id,
        authToken: session?.access_token
      });

      const finalStatus = verifyRes.status || 'FAILED';

      // 5. Update local state proof record
      const proofRecord: SubmissionProof = {
        id: proofRes.proof?.id || `prf_${Date.now()}`,
        userId: user.id,
        problemId,
        imageUrl: displayUrl || uploadRes.storagePath,
        verificationStatus: finalStatus,
        verificationScore: verifyRes.score,
        verificationNotes: verifyRes.notes,
        createdAt: new Date().toISOString()
      };

      setSubmissionProofs((prev) => ({
        ...prev,
        [problemId]: proofRecord
      }));

      const isVerified = verifyRes.status === 'VERIFIED' || Boolean(verifyRes.success);

      if (isVerified && verifyRes.success) {
        // Mark COMPLETED in state and unlock next sequential problem
        const nextProbId = verifyRes.nextProblemId;

        setUserProgress((prev) => {
          const nextState = { ...prev };
          nextState[problemId] = {
            userId: user.id,
            problemId,
            status: 'COMPLETED',
            xpEarned: 10,
            completedAt: new Date().toISOString()
          };

          if (nextProbId && nextState[nextProbId]?.status === 'LOCKED') {
            nextState[nextProbId] = {
              ...nextState[nextProbId],
              status: 'AVAILABLE'
            };
          }

          return nextState;
        });

        // Trigger background refresh from Supabase to stay 100% in sync
        await loadDatabaseData();

        return {
          success: true,
          notes: verifyRes.notes || '✓ Verified! +10 XP awarded.',
          status: 'VERIFIED'
        };
      } else {
        // Status is REVIEW_REQUIRED or FAILED: keep problem as AVAILABLE so user can re-submit
        setUserProgress((prev) => ({
          ...prev,
          [problemId]: {
            ...prev[problemId],
            status: 'AVAILABLE'
          }
        }));

        return {
          success: false,
          notes: verifyRes.notes || verifyRes.error || 'Verification was not accepted. Please upload a clear screenshot of your accepted solution.',
          status: verifyRes.status || 'FAILED'
        };
      }
    } catch (err: any) {
      console.error('Proof submission error:', err);
      // Revert back to AVAILABLE on failure so user can try again
      setUserProgress((prev) => ({
        ...prev,
        [problemId]: {
          ...prev[problemId],
          status: 'AVAILABLE'
        }
      }));
      return { success: false, notes: err?.message || 'Upload failed. Please check your image and try again.' };
    }
  };

  const generateCertificate = async (): Promise<Certificate | null> => {
    if (!isQuestComplete || !user) return null;

    if (certificate) return certificate;

    const res = await certificateService.generateCertificate(
      user.id,
      user.fullName,
      session?.access_token
    );

    if (res.success && res.certificate) {
      setCertificate(res.certificate);
      return res.certificate;
    }

    return null;
  };

  const resetProgress = async () => {
    if (!user) return;

    if (isSupabaseConfigured()) {
      try {
        // Delete or reset all records for this user in user_progress & certificates
        await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.id);

        await supabase
          .from('certificates')
          .delete()
          .eq('user_id', user.id);

        await supabase
          .from('profiles')
          .update({ total_xp: 0, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (e) {
        console.error('Reset error:', e);
      }
    }

    // Reinitialize
    await loadDatabaseData();
  };

  return (
    <QuestContext.Provider
      value={{
        problems,
        userProgress,
        submissionProofs,
        currentView,
        selectedProblemId,
        activeProblem,
        nextUnlockedProblem,
        completedCount,
        totalXp,
        progressPercentage,
        isQuestComplete,
        certificate,
        isLoadingData,
        navigateTo,
        selectProblem,
        submitProof,
        generateCertificate,
        resetProgress,
        refreshProgress: loadDatabaseData,
        isProofModalOpen,
        modalProblemId,
        openProofModal,
        closeProofModal
      }}
    >
      {children}
    </QuestContext.Provider>
  );
};

export const useQuest = () => {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error('useQuest must be used within a QuestProvider');
  }
  return context;
};
