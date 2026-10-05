-- ========================================================
-- DP QUEST DATABASE SCHEMA & RLS SETUP
-- Master Dynamic Programming, One Problem at a Time.
-- ========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  password TEXT,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure password column exists if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. PROBLEMS TABLE
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  problem_number_external TEXT,
  url TEXT NOT NULL,
  xp INTEGER DEFAULT 10,
  display_order INTEGER UNIQUE NOT NULL,
  category TEXT DEFAULT '1D DP',
  hint_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED', 'AVAILABLE', 'VERIFYING', 'COMPLETED')),
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_problem_unique UNIQUE (user_id, problem_id)
);

-- 4. SUBMISSION PROOFS TABLE
CREATE TABLE IF NOT EXISTS public.submission_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFYING', 'VERIFIED', 'REVIEW_REQUIRED', 'FAILED')),
  verification_score NUMERIC DEFAULT 0,
  verification_reason TEXT,
  ai_result JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VERIFICATION ATTEMPTS TABLE (AUDIT LOG)
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_proof_id UUID REFERENCES public.submission_proofs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT DEFAULT 'gemini-3.8-flash',
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL UNIQUE,
  user_name TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  verification_url TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  first_downloaded_at TIMESTAMPTZ,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created in an earlier schema iteration
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS first_downloaded_at TIMESTAMPTZ;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMPTZ;

-- 7. CERTIFICATE DOWNLOADS AUDIT LOG TABLE (EVERY DOWNLOAD EVENT)
CREATE TABLE IF NOT EXISTS public.certificate_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  certificate_public_id TEXT NOT NULL,
  download_number INTEGER DEFAULT 1,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_test BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist on certificate_downloads
ALTER TABLE public.certificate_downloads ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.certificate_downloads ADD COLUMN IF NOT EXISTS download_number INTEGER DEFAULT 1;

-- INDEXES FOR PERFORMANCE AND ANALYTICS
CREATE INDEX IF NOT EXISTS idx_certificate_downloads_cert_id ON public.certificate_downloads(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_downloads_user_id ON public.certificate_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_certificate_downloads_downloaded_at ON public.certificate_downloads(downloaded_at);

-- ========================================================
-- SUMMARY VIEW: WHO DOWNLOADED CERTIFICATE & HOW MANY TIMES
-- ========================================================
CREATE OR REPLACE VIEW public.certificate_download_summary AS
SELECT 
  c.user_id,
  c.user_name,
  p.email,
  c.certificate_id AS certificate_public_id,
  COUNT(cd.id) AS total_downloads,
  MIN(cd.downloaded_at) AS first_downloaded_at,
  MAX(cd.downloaded_at) AS last_downloaded_at,
  c.completed_at
FROM public.certificates c
LEFT JOIN public.profiles p ON p.id = c.user_id
LEFT JOIN public.certificate_downloads cd ON cd.certificate_public_id = c.certificate_id AND cd.is_test = false
GROUP BY c.user_id, c.user_name, p.email, c.certificate_id, c.completed_at;

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_downloads ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read, insert, and update their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Problems: Anyone authenticated can read problems
DROP POLICY IF EXISTS "Problems are readable by all authenticated users" ON public.problems;
CREATE POLICY "Problems are readable by all authenticated users" ON public.problems
  FOR SELECT TO authenticated USING (true);

-- Also allow public select if needed
DROP POLICY IF EXISTS "Problems are publicly readable" ON public.problems;
CREATE POLICY "Problems are publicly readable" ON public.problems
  FOR SELECT TO anon USING (true);

-- User Progress: Users can only read and manage their own progress
DROP POLICY IF EXISTS "Users can read own progress" ON public.user_progress;
CREATE POLICY "Users can read own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Submission Proofs: Users can only read and insert their own proofs
DROP POLICY IF EXISTS "Users can read own submission proofs" ON public.submission_proofs;
CREATE POLICY "Users can read own submission proofs" ON public.submission_proofs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own submission proofs" ON public.submission_proofs;
CREATE POLICY "Users can insert own submission proofs" ON public.submission_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verification Attempts: Users can only read their own verification audit log
DROP POLICY IF EXISTS "Users can read own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can read own verification attempts" ON public.verification_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Certificates: Anyone can read certificates for public verification by ID; users can insert their own certificate
DROP POLICY IF EXISTS "Anyone can read certificate for verification" ON public.certificates;
CREATE POLICY "Anyone can read certificate for verification" ON public.certificates
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own certificate" ON public.certificates;
CREATE POLICY "Users can insert own certificate" ON public.certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own certificate" ON public.certificates;
CREATE POLICY "Users can update own certificate" ON public.certificates
  FOR UPDATE USING (auth.uid() = user_id);

-- Certificate Downloads: Anyone can insert download audit events; users can read their own downloads
DROP POLICY IF EXISTS "Anyone can record certificate download" ON public.certificate_downloads;
CREATE POLICY "Anyone can record certificate download" ON public.certificate_downloads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own certificate downloads" ON public.certificate_downloads;
CREATE POLICY "Users can read own certificate downloads" ON public.certificate_downloads
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'anon');

-- ========================================================
-- SEED DATA: 22 DYNAMIC PROGRAMMING PROBLEMS
-- ========================================================

INSERT INTO public.problems (problem_number, title, platform, problem_number_external, url, xp, display_order, category, hint_snippet)
VALUES
  (1, 'Fibonacci Number', 'LeetCode', '509', 'https://leetcode.com/problems/fibonacci-number/', 10, 1, 'Basic DP', 'F(n) = F(n-1) + F(n-2) with base cases F(0)=0, F(1)=1.'),
  (2, 'Climbing Stairs', 'LeetCode', '70', 'https://leetcode.com/problems/climbing-stairs/', 10, 2, 'Basic DP', 'Each time you can climb 1 or 2 steps. How many distinct ways can you reach step n?'),
  (3, 'Count Ways with 3 Moves', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/count-number-of-hops-1587115620/1', 10, 3, '1D DP', 'Tribonacci state transition: ways(n) = ways(n-1) + ways(n-2) + ways(n-3).'),
  (4, 'Frog Jump', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/geek-jump/1', 10, 4, '1D DP', 'Minimize energy cost: jump either to i+1 or i+2 stone with energy difference |height[i]-height[j]|.'),
  (5, 'Min Cost Climbing Stairs', 'LeetCode', '746', 'https://leetcode.com/problems/min-cost-climbing-stairs/', 10, 5, '1D DP', 'Pay cost[i] to take 1 or 2 steps. Find the minimum cost to reach the top.'),
  (6, 'House Robber', 'LeetCode', '198', 'https://leetcode.com/problems/house-robber/', 10, 6, '1D DP', 'Maximize loot without alerting adjacent security systems: dp[i] = max(dp[i-1], dp[i-2] + nums[i]).'),
  (7, 'House Robber II', 'LeetCode', '213', 'https://leetcode.com/problems/house-robber-ii/', 10, 7, '1D DP', 'Houses arranged in a circle: break into two subproblems [0...n-2] and [1...n-1].'),
  (8, 'Delete and Earn', 'LeetCode', '740', 'https://leetcode.com/problems/delete-and-earn/', 10, 8, '1D DP', 'Transform frequencies into a House Robber variant where picking val deletes val-1 and val+1.'),
  (9, 'Jump Game', 'LeetCode', '55', 'https://leetcode.com/problems/jump-game/', 10, 9, 'Optimization', 'Maintain the maximum reachable index or use reachability dynamic programming.'),
  (10, 'Jump Game II', 'LeetCode', '45', 'https://leetcode.com/problems/jump-game-ii/', 10, 10, 'Optimization', 'Find minimum jumps needed to reach the last index.'),
  (11, 'Ways to Tile a Floor', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/ways-to-tile-a-floor5836/1', 10, 11, 'Counting DP', 'Count distinct ways to tile a 2 x n floor using 2 x 1 tiles (Fibonacci relation).'),
  (12, 'Count Derangements', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/dearrangement-of-balls0918/1', 10, 12, 'Counting DP', 'Permutations where no element appears in original spot: D(n) = (n - 1) * (D(n - 1) + D(n - 2)).'),
  (13, 'Maximum Subarray', 'LeetCode', '53', 'https://leetcode.com/problems/maximum-subarray/', 10, 13, 'Optimization', 'Kadane''s algorithm: dp[i] = max(nums[i], dp[i-1] + nums[i]).'),
  (14, 'Decode Ways', 'LeetCode', '91', 'https://leetcode.com/problems/decode-ways/', 10, 14, 'Counting DP', 'Partitioning digits into valid character codes 1..26 with zero check.'),
  (15, 'Padovan Sequence', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/padovan-sequence2855/1', 10, 15, 'Basic DP', 'P(n) = P(n-2) + P(n-3) with initial terms P(0)=P(1)=P(2)=1.'),
  (16, 'Lucas Number', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/lucas-number4515/1', 10, 16, 'Basic DP', 'L(n) = L(n-1) + L(n-2) with seed values L(0)=2, L(1)=1.'),
  (17, 'Consecutive 1''s Not Allowed', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/consecutive-1s-not-allowed1912/1', 10, 17, 'Counting DP', 'Binary strings of length n without adjacent 1s (Fibonacci based recurrence).'),
  (18, 'Ways to Express N as Sum of 1, 3, 4', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/count-ways-to-express-n-as-the-sum-of-13-and-44024/1', 10, 18, 'Counting DP', 'dp[i] = dp[i-1] + dp[i-3] + dp[i-4] with proper base boundary checks.'),
  (19, 'Minimum Operations to Obtain N', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/find-optimum-operation4504/1', 10, 19, 'Optimization', 'Start at 1: operations are *2, *3 or +1. Find minimum operations to obtain N (or reduce N to 1).'),
  (20, 'Maximize The Cut Segments', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/cutted-segments1642/1', 10, 20, 'Advanced', 'Cut line segment of length n into maximum pieces of length x, y, or z (unbounded knapsack).'),
  (21, 'Geek and its Game of Coins', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/geek-and-its-game-of-coins4043/1', 10, 21, 'Advanced', 'Game theory DP: winning and losing states with moves {1, X, Y}.'),
  (22, 'Chicks in a Zoo', 'GFG', NULL, 'https://www.geeksforgeeks.org/problems/chicks-in-a-zoo1159/1', 10, 22, 'Advanced', 'Chick population reproduction with 6-day expiration cycle.')
ON CONFLICT (display_order) DO UPDATE
SET 
  title = EXCLUDED.title,
  platform = EXCLUDED.platform,
  problem_number_external = EXCLUDED.problem_number_external,
  url = EXCLUDED.url,
  category = EXCLUDED.category,
  hint_snippet = EXCLUDED.hint_snippet;

-- ========================================================
-- 6. STORAGE BUCKET: submission-proofs (PRIVATE)
-- ========================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-proofs',
  'submission-proofs',
  false,
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Storage RLS: Users can only upload and read within their own folder ({user_id}/*)
DROP POLICY IF EXISTS "Users can upload their own proofs" ON storage.objects;
CREATE POLICY "Users can upload their own proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'submission-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own proofs" ON storage.objects;
CREATE POLICY "Users can view their own proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'submission-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

