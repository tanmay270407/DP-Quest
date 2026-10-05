export type Platform = 'LeetCode' | 'GFG' | 'CSES';

export type DPCategory = 
  | 'Basic DP' 
  | '1D DP' 
  | 'Counting DP' 
  | 'Optimization' 
  | 'Advanced';

export type ProblemStatus = 'LOCKED' | 'AVAILABLE' | 'VERIFYING' | 'COMPLETED';

export type VerificationState = 
  | 'IDLE' 
  | 'PENDING'
  | 'UPLOADING' 
  | 'VERIFYING' 
  | 'VERIFIED' 
  | 'REVIEW_REQUIRED' 
  | 'FAILED';

export interface Problem {
  id: string;
  number: number; // 1 to 22
  title: string;
  platform: Platform;
  problemNumber?: number | string;
  url: string;
  xp: number; // 10
  category: DPCategory;
  order: number;
  hintSnippet?: string;
  canonicalTitle?: string;
  conceptSignature?: string;
  requiredConstraints?: string[];
  acceptedTitleVariants?: string[];
  rejectionSignatures?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  streakDays: number;
  joinedAt: string;
}

export interface UserProgress {
  userId: string;
  problemId: string;
  status: ProblemStatus;
  xpEarned: number;
  completedAt?: string;
  proofUrl?: string;
}

export interface SubmissionProof {
  id: string;
  userId: string;
  problemId: string;
  imageUrl: string;
  verificationStatus: VerificationState;
  verificationScore?: number;
  verificationNotes?: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  certificateId: string;
  userName: string;
  completedAt: string;
  totalProblems: number;
  totalXp: number;
  verificationUrl: string;
}

export type ViewType = 
  | 'landing' 
  | 'dashboard' 
  | 'problems' 
  | 'problem-detail' 
  | 'progress' 
  | 'certificate' 
  | 'profile' 
  | 'completion'
  | 'login'
  | 'signup'
  | 'forgot-password';

// Supabase Database Row Types
export interface DbProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  password?: string | null;
  total_xp: number;
  completed_count: number;
  current_streak: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbProblem {
  id: string;
  problem_number: number;
  title: string;
  platform: string;
  problem_number_external: string | null;
  url: string;
  xp: number;
  display_order: number;
  category: string;
  hint_snippet: string | null;
  created_at?: string;
}

export interface DbUserProgress {
  id: string;
  user_id: string;
  problem_id: string;
  status: ProblemStatus;
  xp_earned: number;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbSubmissionProof {
  id: string;
  user_id: string;
  problem_id: string;
  image_url: string;
  verification_status: string;
  verification_score: number | null;
  created_at?: string;
}

export interface DbCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  user_name?: string;
  completed_at: string;
  verification_url: string;
  created_at?: string;
}
