import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Problem definitions for strict serverless verification
const PROBLEMS_METADATA: Record<string, {
  id: string;
  number: number;
  title: string;
  canonicalTitle: string;
  platform: string;
  problemNumber?: number;
  xp: number;
  category: string;
  conceptSignature: string;
  requiredConstraints: string[];
  acceptedTitleVariants: string[];
  rejectionSignatures: string[];
}> = {
  'dp-1': {
    id: 'dp-01',
    number: 1,
    title: 'Fibonacci Number',
    canonicalTitle: 'Fibonacci Number',
    platform: 'LeetCode',
    problemNumber: 509,
    xp: 10,
    category: 'Basic DP',
    conceptSignature: 'Fibonacci sequence F(n) = F(n-1) + F(n-2)',
    requiredConstraints: ['F(0)=0, F(1)=1', 'LeetCode 509'],
    acceptedTitleVariants: ['Fibonacci Number', '509. Fibonacci Number', 'Fibonacci Number - LeetCode'],
    rejectionSignatures: ['Climbing Stairs', 'Tribonacci', 'Lucas Number']
  },
  'dp-01': {
    id: 'dp-01',
    number: 1,
    title: 'Fibonacci Number',
    canonicalTitle: 'Fibonacci Number',
    platform: 'LeetCode',
    problemNumber: 509,
    xp: 10,
    category: 'Basic DP',
    conceptSignature: 'Fibonacci sequence F(n) = F(n-1) + F(n-2)',
    requiredConstraints: ['F(0)=0, F(1)=1', 'LeetCode 509'],
    acceptedTitleVariants: ['Fibonacci Number', '509. Fibonacci Number', 'Fibonacci Number - LeetCode'],
    rejectionSignatures: ['Climbing Stairs', 'Tribonacci', 'Lucas Number']
  },
  'dp-2': {
    id: 'dp-02',
    number: 2,
    title: 'Climbing Stairs',
    canonicalTitle: 'Climbing Stairs',
    platform: 'LeetCode',
    problemNumber: 70,
    xp: 10,
    category: 'Basic DP',
    conceptSignature: 'Count distinct ways to climb n stairs taking 1 or 2 steps',
    requiredConstraints: ['1 or 2 steps only', 'LeetCode 70'],
    acceptedTitleVariants: ['Climbing Stairs', '70. Climbing Stairs', 'Climbing Stairs - LeetCode'],
    rejectionSignatures: ['Two Sum', 'Min Cost Climbing Stairs', 'Count Ways to Reach Nth Stair Using 1, 2, 3 Steps']
  },
  'dp-02': {
    id: 'dp-02',
    number: 2,
    title: 'Climbing Stairs',
    canonicalTitle: 'Climbing Stairs',
    platform: 'LeetCode',
    problemNumber: 70,
    xp: 10,
    category: 'Basic DP',
    conceptSignature: 'Count distinct ways to climb n stairs taking 1 or 2 steps',
    requiredConstraints: ['1 or 2 steps only', 'LeetCode 70'],
    acceptedTitleVariants: ['Climbing Stairs', '70. Climbing Stairs', 'Climbing Stairs - LeetCode'],
    rejectionSignatures: ['Two Sum', 'Min Cost Climbing Stairs', 'Count Ways to Reach Nth Stair Using 1, 2, 3 Steps']
  },
  'dp-3': {
    id: 'dp-03',
    number: 3,
    title: 'Count Ways with 3 Moves',
    canonicalTitle: 'Count Ways with 3 Moves',
    platform: 'GFG',
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Count ways to reach nth stair using step 1, 2 or 3 (Tribonacci recurrence)',
    requiredConstraints: ['1, 2, or 3 steps allowed', 'dp[n] = dp[n-1] + dp[n-2] + dp[n-3]'],
    acceptedTitleVariants: [
      'Count Ways to Reach Nth Stair Using 1, 2, 3 Steps',
      'Count ways to reach the n’th stair using step 1, 2 or 3',
      'Count ways to reach the nth stair using step 1, 2 or 3',
      'Count Ways to Reach Nth Stair Using 1 2 3 Steps',
      'Count Ways with 3 Moves',
      'Count Ways with 3 Moves - GeeksforGeeks',
      'Count number of hops',
      'Count Number of Hops',
      'Count number of hops - GeeksforGeeks',
      'Count Number of Hops - GeeksforGeeks'
    ],
    rejectionSignatures: [
      'Ways to Reach the n’th Stair (1 or 2 steps only)',
      'Ways to Reach the nth Stair',
      'Climbing Stairs',
      'Fibonacci Number'
    ]
  },
  'dp-03': {
    id: 'dp-03',
    number: 3,
    title: 'Count Ways with 3 Moves',
    canonicalTitle: 'Count Ways with 3 Moves',
    platform: 'GFG',
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Count ways to reach nth stair using step 1, 2 or 3 (Tribonacci recurrence)',
    requiredConstraints: ['1, 2, or 3 steps allowed', 'dp[n] = dp[n-1] + dp[n-2] + dp[n-3]'],
    acceptedTitleVariants: [
      'Count Ways to Reach Nth Stair Using 1, 2, 3 Steps',
      'Count ways to reach the n’th stair using step 1, 2 or 3',
      'Count ways to reach the nth stair using step 1, 2 or 3',
      'Count Ways to Reach Nth Stair Using 1 2 3 Steps',
      'Count Ways with 3 Moves',
      'Count Ways with 3 Moves - GeeksforGeeks',
      'Count number of hops',
      'Count Number of Hops',
      'Count number of hops - GeeksforGeeks',
      'Count Number of Hops - GeeksforGeeks'
    ],
    rejectionSignatures: [
      'Ways to Reach the n’th Stair (1 or 2 steps only)',
      'Ways to Reach the nth Stair',
      'Climbing Stairs',
      'Fibonacci Number'
    ]
  },
  'dp-4': {
    id: 'dp-04',
    number: 4,
    title: 'Frog Jump',
    canonicalTitle: 'Frog Jump',
    platform: 'GFG',
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Geek Jump / Frog Jump min energy with 1 or 2 stone hops',
    requiredConstraints: ['Min energy to reach stair n-1', 'jump +1 or +2'],
    acceptedTitleVariants: ['Frog Jump', 'Geek Jump', 'Geek Jump - GeeksforGeeks', 'Geek Jump GFG'],
    rejectionSignatures: ['Frog Jump II', 'Jump Game', 'Min Cost Climbing Stairs']
  },
  'dp-04': {
    id: 'dp-04',
    number: 4,
    title: 'Frog Jump',
    canonicalTitle: 'Frog Jump',
    platform: 'GFG',
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Geek Jump / Frog Jump min energy with 1 or 2 stone hops',
    requiredConstraints: ['Min energy to reach stair n-1', 'jump +1 or +2'],
    acceptedTitleVariants: ['Frog Jump', 'Geek Jump', 'Geek Jump - GeeksforGeeks', 'Geek Jump GFG'],
    rejectionSignatures: ['Frog Jump II', 'Jump Game', 'Min Cost Climbing Stairs']
  },
  'dp-5': {
    id: 'dp-05',
    number: 5,
    title: 'Min Cost Climbing Stairs',
    canonicalTitle: 'Min Cost Climbing Stairs',
    platform: 'LeetCode',
    problemNumber: 746,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Min cost to climb stairs starting at index 0 or 1 with 1 or 2 step leaps',
    requiredConstraints: ['LeetCode 746', 'cost array minimum sum'],
    acceptedTitleVariants: ['Min Cost Climbing Stairs', '746. Min Cost Climbing Stairs'],
    rejectionSignatures: ['Climbing Stairs', 'House Robber']
  },
  'dp-05': {
    id: 'dp-05',
    number: 5,
    title: 'Min Cost Climbing Stairs',
    canonicalTitle: 'Min Cost Climbing Stairs',
    platform: 'LeetCode',
    problemNumber: 746,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Min cost to climb stairs starting at index 0 or 1 with 1 or 2 step leaps',
    requiredConstraints: ['LeetCode 746', 'cost array minimum sum'],
    acceptedTitleVariants: ['Min Cost Climbing Stairs', '746. Min Cost Climbing Stairs'],
    rejectionSignatures: ['Climbing Stairs', 'House Robber']
  },
  'dp-6': {
    id: 'dp-06',
    number: 6,
    title: 'House Robber',
    canonicalTitle: 'House Robber',
    platform: 'LeetCode',
    problemNumber: 198,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Maximize non-adjacent element sum in 1D array',
    requiredConstraints: ['LeetCode 198', 'No adjacent houses robbed'],
    acceptedTitleVariants: ['House Robber', '198. House Robber'],
    rejectionSignatures: ['House Robber II', 'House Robber III', 'Delete and Earn']
  },
  'dp-06': {
    id: 'dp-06',
    number: 6,
    title: 'House Robber',
    canonicalTitle: 'House Robber',
    platform: 'LeetCode',
    problemNumber: 198,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Maximize non-adjacent element sum in 1D array',
    requiredConstraints: ['LeetCode 198', 'No adjacent houses robbed'],
    acceptedTitleVariants: ['House Robber', '198. House Robber'],
    rejectionSignatures: ['House Robber II', 'House Robber III', 'Delete and Earn']
  },
  'dp-7': {
    id: 'dp-07',
    number: 7,
    title: 'House Robber II',
    canonicalTitle: 'House Robber II',
    platform: 'LeetCode',
    problemNumber: 213,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Circular array non-adjacent max loot optimization',
    requiredConstraints: ['LeetCode 213', 'First and last houses are adjacent (circular)'],
    acceptedTitleVariants: ['House Robber II', '213. House Robber II'],
    rejectionSignatures: ['House Robber', 'House Robber III']
  },
  'dp-07': {
    id: 'dp-07',
    number: 7,
    title: 'House Robber II',
    canonicalTitle: 'House Robber II',
    platform: 'LeetCode',
    problemNumber: 213,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Circular array non-adjacent max loot optimization',
    requiredConstraints: ['LeetCode 213', 'First and last houses are adjacent (circular)'],
    acceptedTitleVariants: ['House Robber II', '213. House Robber II'],
    rejectionSignatures: ['House Robber', 'House Robber III']
  },
  'dp-8': {
    id: 'dp-08',
    number: 8,
    title: 'Delete and Earn',
    canonicalTitle: 'Delete and Earn',
    platform: 'LeetCode',
    problemNumber: 740,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Point maximization deleting val-1 and val+1 transformed into House Robber recurrence',
    requiredConstraints: ['LeetCode 740'],
    acceptedTitleVariants: ['Delete and Earn', '740. Delete and Earn'],
    rejectionSignatures: ['House Robber', 'House Robber II']
  },
  'dp-08': {
    id: 'dp-08',
    number: 8,
    title: 'Delete and Earn',
    canonicalTitle: 'Delete and Earn',
    platform: 'LeetCode',
    problemNumber: 740,
    xp: 10,
    category: '1D DP',
    conceptSignature: 'Point maximization deleting val-1 and val+1 transformed into House Robber recurrence',
    requiredConstraints: ['LeetCode 740'],
    acceptedTitleVariants: ['Delete and Earn', '740. Delete and Earn'],
    rejectionSignatures: ['House Robber', 'House Robber II']
  },
  'dp-9': {
    id: 'dp-09',
    number: 9,
    title: 'Jump Game',
    canonicalTitle: 'Jump Game',
    platform: 'LeetCode',
    problemNumber: 55,
    xp: 10,
    category: 'Optimization',
    conceptSignature: 'Determine if you are able to reach the last index from index 0',
    requiredConstraints: ['LeetCode 55', 'boolean reachability'],
    acceptedTitleVariants: ['Jump Game', '55. Jump Game'],
    rejectionSignatures: ['Jump Game II', 'Jump Game III', 'Frog Jump']
  },
  'dp-09': {
    id: 'dp-09',
    number: 9,
    title: 'Jump Game',
    canonicalTitle: 'Jump Game',
    platform: 'LeetCode',
    problemNumber: 55,
    xp: 10,
    category: 'Optimization',
    conceptSignature: 'Determine if you are able to reach the last index from index 0',
    requiredConstraints: ['LeetCode 55', 'boolean reachability'],
    acceptedTitleVariants: ['Jump Game', '55. Jump Game'],
    rejectionSignatures: ['Jump Game II', 'Jump Game III', 'Frog Jump']
  },
  'dp-10': {
    id: 'dp-10',
    number: 10,
    title: 'Jump Game II',
    canonicalTitle: 'Jump Game II',
    platform: 'LeetCode',
    problemNumber: 45,
    xp: 10,
    category: 'Optimization',
    conceptSignature: 'Find the minimum number of jumps to reach the last index',
    requiredConstraints: ['LeetCode 45', 'min jumps count'],
    acceptedTitleVariants: ['Jump Game II', '45. Jump Game II'],
    rejectionSignatures: ['Jump Game', 'Jump Game III', 'Frog Jump']
  },
  'dp-11': {
    id: 'dp-11',
    number: 11,
    title: 'Ways to Tile a Floor',
    canonicalTitle: 'Ways to Tile a Floor',
    platform: 'GFG',
    xp: 10,
    category: 'Counting DP',
    conceptSignature: 'Tile a 2 x n board using 2 x 1 tiles',
    requiredConstraints: ['2 x N board', '2 x 1 domino tiles'],
    acceptedTitleVariants: ['Ways to Tile a Floor', 'Ways to Tile a Floor - GeeksforGeeks', 'Tile a Floor'],
    rejectionSignatures: ['Domino and Tromino Tiling', 'Brick Tiling']
  },
  'dp-12': {
    id: 'dp-12',
    number: 12,
    title: 'Count Derangements',
    canonicalTitle: 'Count Derangements',
    platform: 'GFG',
    xp: 10,
    category: 'Counting DP',
    conceptSignature: 'Permutations of n items where no item appears in its original position',
    requiredConstraints: ['D(n) = (n-1)*(D(n-1) + D(n-2))'],
    acceptedTitleVariants: [
      'Count Derangements',
      'Count Derangements (Permutation Such That No Element Appears in its Original Position)',
      'Count Derangements - GeeksforGeeks'
    ],
    rejectionSignatures: ['Permutations', 'Counting Inversions']
  },
  'dp-13': {
    id: 'dp-13',
    number: 13,
    title: 'Maximum Subarray',
    canonicalTitle: 'Maximum Subarray',
    platform: 'LeetCode',
    problemNumber: 53,
    xp: 10,
    category: 'Optimization',
    conceptSignature: 'Largest sum contiguous subarray (Kadane’s DP)',
    requiredConstraints: ['LeetCode 53', 'Contiguous subarray max sum'],
    acceptedTitleVariants: ['Maximum Subarray', '53. Maximum Subarray'],
    rejectionSignatures: ['Maximum Product Subarray', 'Maximum Subarray Sum with One Deletion']
  },
  'dp-14': {
    id: 'dp-14',
    number: 14,
    title: 'Decode Ways',
    canonicalTitle: 'Decode Ways',
    platform: 'LeetCode',
    problemNumber: 91,
    xp: 10,
    category: 'Counting DP',
    conceptSignature: 'Count ways to decode a digit string mapped A=1..Z=26',
    requiredConstraints: ['LeetCode 91', 'Valid 1-26 decoding'],
    acceptedTitleVariants: ['Decode Ways', '91. Decode Ways'],
    rejectionSignatures: ['Decode Ways II', 'Word Break']
  },
  'dp-15': {
    id: 'dp-15',
    number: 15,
    title: 'Padovan Sequence',
    canonicalTitle: 'Padovan Sequence',
    platform: 'GFG',
    xp: 10,
    category: 'Basic DP',
    conceptSignature: 'Padovan sequence recurrence P(n) = P(n-2) + P(n-3)',
    requiredConstraints: ['P(0)=P(1)=P(2)=1', 'P(n)=P(n-2)+P(n-3)'],
    acceptedTitleVariants: ['Padovan Sequence', 'Padovan Sequence - GeeksforGeeks'],
    rejectionSignatures: ['Lucas Number', 'Pell Sequence', 'Fibonacci Number']
  },
  'dp-16': {
    id: 'dp-16',
    number: 16,
    title: 'Lucas Number',
    canonicalTitle: 'Lucas Number',
    platform: 'GFG',
    xp: 10,
    category: 'Basic DP',
    conceptSignature: 'Lucas number sequence L(n) = L(n-1) + L(n-2) with L(0)=2, L(1)=1',
    requiredConstraints: ['L(0)=2, L(1)=1', 'L(n)=L(n-1)+L(n-2)'],
    acceptedTitleVariants: ['Lucas Number', 'Lucas Number - GeeksforGeeks'],
    rejectionSignatures: ['Fibonacci Number', 'Padovan Sequence', 'Tribonacci']
  },
  'dp-17': {
    id: 'dp-17',
    number: 17,
    title: "Consecutive 1's Not Allowed",
    canonicalTitle: "Consecutive 1's Not Allowed",
    platform: 'GFG',
    xp: 10,
    category: 'Counting DP',
    conceptSignature: 'Count binary strings of length N without two consecutive 1s',
    requiredConstraints: ['Binary strings of length N', 'No consecutive 1s'],
    acceptedTitleVariants: ["Consecutive 1's Not Allowed", 'Consecutive 1s Not Allowed', "Consecutive 1's not allowed"],
    rejectionSignatures: ['Consecutive 1s in Subarray', 'Max Consecutive Ones']
  },
  'dp-18': {
    id: 'dp-18',
    number: 18,
    title: 'Ways to Express N as Sum of 1, 3, 4',
    canonicalTitle: 'Ways to Express N as Sum of 1, 3, 4',
    platform: 'GFG',
    xp: 10,
    category: 'Counting DP',
    conceptSignature: 'Count ways to express N as sum of 1, 3, 4',
    requiredConstraints: ['Elements {1, 3, 4}', 'dp[n]=dp[n-1]+dp[n-3]+dp[n-4]'],
    acceptedTitleVariants: [
      'Ways to Express N as Sum of 1, 3, 4',
      'Count ways to express N as the sum of 1, 3 and 4',
      'Ways to write n as sum of 1, 3 and 4'
    ],
    rejectionSignatures: ['Count Ways to Reach Nth Stair']
  },
  'dp-19': {
    id: 'dp-19',
    number: 19,
    title: 'Minimum Operations to Obtain N',
    canonicalTitle: 'Minimum Operations to Obtain N',
    platform: 'GFG',
    xp: 10,
    category: 'Optimization',
    conceptSignature: 'Minimum steps to obtain N starting from 1 with *2, *3, +1 (or reduce N to 1 via /2, /3, -1)',
    requiredConstraints: ['Start: 1 (or reduce N to 1)', 'Allowed moves: *2, *3, +1 (or /2, /3, -1)', 'Target: N (or 1)'],
    acceptedTitleVariants: [
      'Minimum Operations to Obtain N',
      'Minimum steps to minimize n as per given condition',
      'Minimum steps to reach 1',
      'Minimum Operations to reach N from 1'
    ],
    rejectionSignatures: [
      'Minimum Operations (start 0)'
    ]
  },
  'dp-20': {
    id: 'dp-20',
    number: 20,
    title: 'Maximize The Cut Segments',
    canonicalTitle: 'Maximize The Cut Segments',
    platform: 'GFG',
    xp: 10,
    category: 'Advanced',
    conceptSignature: 'Maximize number of segments by cutting rod of length N into segments of lengths x, y, z',
    requiredConstraints: ['Rod of length N', 'Allowed piece lengths x, y, z', 'Maximize segment count'],
    acceptedTitleVariants: [
      'Maximize The Cut Segments',
      'Cutted Segments',
      'Maximize Cut Segments',
      'Cutting Rod into Segments'
    ],
    rejectionSignatures: ['Rod Cutting', 'Integer Break']
  },
  'dp-21': {
    id: 'dp-21',
    number: 21,
    title: 'Geek and its Game of Coins',
    canonicalTitle: 'Geek and its Game of Coins',
    platform: 'GFG',
    xp: 10,
    category: 'Advanced',
    conceptSignature: 'Game of Coins: determine if Geek wins picking 1, X, or Y coins optimally from N coins',
    requiredConstraints: ['Moves: 1, X, Y coins', 'Optimal play winning condition'],
    acceptedTitleVariants: [
      'Geek and its Game of Coins',
      'Geek and its Game of Coins - GeeksforGeeks',
      'Game of Coins'
    ],
    rejectionSignatures: ['Coin Change', 'Coin Combinations']
  },
  'dp-22': {
    id: 'dp-22',
    number: 22,
    title: 'Chicks in a Zoo',
    canonicalTitle: 'Chicks in a Zoo',
    platform: 'GFG',
    xp: 10,
    category: 'Advanced',
    conceptSignature: 'Calculate chick population on day N where each chick lays 2 chicks/day and expires after 6 days',
    requiredConstraints: ['N days', '2 new chicks born per adult', '6 day lifespan expiry'],
    acceptedTitleVariants: ['Chicks in a Zoo', 'Chicks in a Zoo - GeeksforGeeks'],
    rejectionSignatures: ['Foxes and Chickens', 'Rabbit Reproduction']
  }
};

// Also index by number 1..22
for (let i = 1; i <= 22; i++) {
  const padKey = `dp-${i < 10 ? '0' + i : i}`;
  const unpadKey = `dp-${i}`;
  if (PROBLEMS_METADATA[padKey] && !PROBLEMS_METADATA[unpadKey]) {
    PROBLEMS_METADATA[unpadKey] = PROBLEMS_METADATA[padKey];
  }
  if (PROBLEMS_METADATA[padKey] && !PROBLEMS_METADATA[String(i)]) {
    PROBLEMS_METADATA[String(i)] = PROBLEMS_METADATA[padKey];
  }
}

// In-memory concurrency locks to prevent race conditions on parallel requests
const activeVerificationLocks = new Set<string>();

function findProblem(rawId: string) {
  if (!rawId) return null;
  const key = String(rawId).trim().toLowerCase();
  return PROBLEMS_METADATA[key] || null;
}

function sendJson(res: any, statusCode: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(data));
}

function detectMimeType(buffer: Buffer, defaultMime?: string): string {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  if (defaultMime && ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(defaultMime.toLowerCase())) {
    return defaultMime.toLowerCase() === 'image/jpg' ? 'image/jpeg' : defaultMime.toLowerCase();
  }
  return 'image/png';
}

export default async function handler(req: any, res: any) {
  // 1. CORS Preflight & Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed. Use POST.' });
  }

  // 2. Parse JSON Request Body
  let body: any = req.body;
  if (!body) {
    body = await new Promise((resolve) => {
      let raw = '';
      req.on('data', (chunk: any) => { raw += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve({}); }
      });
      req.on('error', () => resolve({}));
    });
  } else if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const {
    problemId,
    imageDataUrl,
    storagePath,
    submissionProofId
  } = body;

  const authHeader = req.headers?.authorization;

  // 3. Supabase Auth Token Extraction & User Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendJson(res, 401, {
      success: false,
      status: 'UNAUTHORIZED',
      reason: 'Authentication required. Missing or invalid Bearer token.',
      error: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const isSupabaseLive = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id'));

  let authenticatedUserId: string | null = null;
  let supabase = isSupabaseLive ? createClient(supabaseUrl!, supabaseKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) : null;

  if (supabase) {
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return sendJson(res, 401, {
        success: false,
        status: 'UNAUTHORIZED',
        reason: 'Invalid or expired session. Please log in again.',
        error: authError?.message || 'Invalid session token'
      });
    }
    authenticatedUserId = userData.user.id;
  }

  if (!authenticatedUserId) {
    return sendJson(res, 401, {
      success: false,
      status: 'UNAUTHORIZED',
      reason: 'Could not verify user identity.',
      error: 'Authentication failed'
    });
  }

  // 4. Resolve Problem (Supports UUID, 'dp-14', or '14')
  let problem = findProblem(problemId);
  let dbProblemUuid: string | null = null;

  if (supabase) {
    // If not found in static metadata (e.g. problemId is a Supabase UUID)
    if (!problem && problemId) {
      try {
        const { data: dbProblem } = await supabase
          .from('problems')
          .select('id, problem_number, title, platform, problem_number_external')
          .eq('id', problemId)
          .maybeSingle();

        if (dbProblem?.problem_number) {
          problem = findProblem(String(dbProblem.problem_number)) || findProblem(`dp-${String(dbProblem.problem_number).padStart(2, '0')}`);
          dbProblemUuid = dbProblem.id;
        }
      } catch (err) {
        console.warn('[VERIFY_PROOF] DB UUID problem lookup notice:', err);
      }
    }

    // If problem was found from static lookup, resolve its DB UUID
    if (problem && !dbProblemUuid) {
      try {
        const { data: dbProblem } = await supabase
          .from('problems')
          .select('id')
          .eq('problem_number', problem.number)
          .maybeSingle();

        if (dbProblem?.id) {
          dbProblemUuid = dbProblem.id;
        }
      } catch (err) {
        console.warn('[VERIFY_PROOF] DB problem number lookup notice:', err);
      }
    }
  }

  if (!problem) {
    return sendJson(res, 400, {
      success: false,
      status: 'REJECTED',
      reason: `Problem ${problemId} not found in curriculum dataset.`,
      error: 'Invalid problemId'
    });
  }

  if (!dbProblemUuid) {
    dbProblemUuid = problem.id;
  }

  // 5. Concurrency Lock
  const lockKey = `${authenticatedUserId}:${problem.id}`;
  if (activeVerificationLocks.has(lockKey)) {
    return sendJson(res, 409, {
      success: false,
      status: 'PROCESSING',
      reason: 'A proof verification is already currently in progress for this problem. Please wait.',
      error: 'CONCURRENT_REQUEST'
    });
  }
  activeVerificationLocks.add(lockKey);

  try {
    // 6. Check Idempotency (Already Completed?)
    if (supabase) {
      try {
        const { data: existingProgress } = await supabase
          .from('user_progress')
          .select('status, xp_earned, completed_at, id')
          .eq('user_id', authenticatedUserId)
          .eq('problem_id', dbProblemUuid)
          .maybeSingle();

        if (existingProgress && existingProgress.status === 'COMPLETED') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', authenticatedUserId)
            .maybeSingle();

          const { count } = await supabase
            .from('user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authenticatedUserId)
            .eq('status', 'COMPLETED');

          return sendJson(res, 200, {
            success: true,
            already_completed: true,
            status: 'COMPLETED',
            verification_status: 'VERIFIED',
            xp_earned: 0,
            total_xp: profile?.total_xp || 0,
            completed_count: count || 0,
            next_problem_number: Math.min(22, problem.number + 1),
            next_problem_id: `dp-${String(Math.min(22, problem.number + 1)).padStart(2, '0')}`,
            problemCompleted: true,
            score: 100,
            reason: 'You have already verified and completed this problem. No additional XP awarded.'
          });
        }
      } catch (err) {
        console.warn('[VERIFY_PROOF] Progress pre-check notice:', err);
      }
    }

    // 7. Retrieve & Validate Proof Image (Supports storagePath OR imageDataUrl)
    let mimeType = 'image/png';
    let base64Data = '';
    const MAX_BYTES = 5 * 1024 * 1024; // Strict 5 MB limit

    const isStorageValid = storagePath && typeof storagePath === 'string' && !storagePath.startsWith('local://');

    if (isStorageValid) {
      // SECURITY CHECK: storagePath MUST start with authenticated user ID folder
      if (!storagePath.startsWith(`${authenticatedUserId}/`)) {
        return sendJson(res, 403, {
          success: false,
          status: 'UNAUTHORIZED',
          reason: 'Access denied: You are not authorized to access this storage path.',
          error: 'UNAUTHORIZED_STORAGE_PATH'
        });
      }

      if (!supabase) {
        return sendJson(res, 500, {
          success: false,
          status: 'REVIEW_REQUIRED',
          reason: 'Storage service is currently unavailable.',
          error: 'STORAGE_UNAVAILABLE'
        });
      }

      const { data: blob, error: downloadErr } = await supabase.storage
        .from('submission-proofs')
        .download(storagePath);

      if (downloadErr || !blob) {
        console.error('[VERIFY_PROOF] Failed to download proof from Supabase Storage:', downloadErr);
        return sendJson(res, 400, {
          success: false,
          status: 'REJECTED',
          reason: 'Could not read the uploaded proof image from storage.',
          error: 'STORAGE_DOWNLOAD_FAILED'
        });
      }

      const arrayBuffer = await blob.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      if (imageBuffer.length > MAX_BYTES) {
        return sendJson(res, 400, {
          success: false,
          status: 'REJECTED',
          reason: `Image size (${(imageBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 5 MB.`,
          error: 'FILE_TOO_LARGE'
        });
      }

      mimeType = detectMimeType(imageBuffer, blob.type);
      base64Data = imageBuffer.toString('base64');

    } else if (imageDataUrl && typeof imageDataUrl === 'string') {
      const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return sendJson(res, 400, {
          success: false,
          status: 'REJECTED',
          reason: 'Invalid image format. Expected a base64 Data URL (e.g. data:image/png;base64,...).',
          error: 'INVALID_IMAGE_FORMAT'
        });
      }

      mimeType = matches[1].toLowerCase();
      base64Data = matches[2];
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        return sendJson(res, 400, {
          success: false,
          status: 'REJECTED',
          reason: `Unsupported image format: ${mimeType}. Please upload a PNG, JPEG, or WEBP screenshot.`,
          error: 'UNSUPPORTED_MIME_TYPE'
        });
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');
      if (imageBuffer.length > MAX_BYTES) {
        return sendJson(res, 400, {
          success: false,
          status: 'REJECTED',
          reason: `Image size (${(imageBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 5 MB.`,
          error: 'FILE_TOO_LARGE'
        });
      }
    } else {
      return sendJson(res, 400, {
        success: false,
        status: 'REJECTED',
        reason: 'Proof image missing. Expected either storagePath or imageDataUrl.',
        error: 'MISSING_PROOF_IMAGE'
      });
    }

    // 8. Gemini Vision Verification
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) {
      console.error('[PROOF_VERIFY] GEMINI_API_KEY missing from environment.');
      return sendJson(res, 503, {
        success: false,
        status: 'REVIEW_REQUIRED',
        problemCompleted: false,
        xp_earned: 0,
        reason: 'AI verification service is temporarily unavailable. GEMINI_API_KEY is not configured on the server.',
        error: 'GEMINI_API_KEY is missing in server environment.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    const prompt = `You are a strict code judge verifying student algorithmic problem submissions.
Evaluate this screenshot against the expected problem:

EXPECTED PROBLEM DETAILS:
- Expected Platform: ${problem.platform}
- Problem Name: ${problem.title} (Canonical: ${problem.canonicalTitle})
- Problem Number: ${problem.problemNumber || 'N/A'}
- Problem Category: ${problem.category}
- Core Recurrence / Signature: ${problem.conceptSignature}
- Required Constraints: ${problem.requiredConstraints.join(', ')}
- Acceptable Title Variants: ${problem.acceptedTitleVariants.join(', ')}
- Rejection Signatures (DO NOT ACCEPT IF FOUND): ${problem.rejectionSignatures.join(', ')}

VERIFICATION CRITERIA:
1. Platform Match: Does the screenshot clearly show ${problem.platform} or a valid IDE/editor?
2. Problem Title Match: Does the title match '${problem.title}' or one of its accepted variants?
3. Success Verdict: Is there an 'Accepted', 'Passed', or '100% Tests Passed' submission status banner visible?
4. Authenticity: Is this a legitimate screenshot of a problem completion?

Respond strictly in JSON according to the schema provided.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        is_valid: { type: Type.BOOLEAN },
        platform_match: { type: Type.BOOLEAN },
        problem_match: { type: Type.BOOLEAN },
        success_status_visible: { type: Type.BOOLEAN },
        confidence: { type: Type.NUMBER },
        screenshot_quality: { type: Type.STRING, enum: ['GOOD', 'UNCLEAR', 'POOR'] },
        manipulation_risk: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
        detected_platform: { type: Type.STRING },
        detected_problem_title: { type: Type.STRING },
        detected_verdict: { type: Type.STRING },
        reason: { type: Type.STRING },
        suspicious: { type: Type.BOOLEAN }
      },
      required: [
        'is_valid',
        'platform_match',
        'problem_match',
        'success_status_visible',
        'confidence',
        'screenshot_quality',
        'manipulation_risk',
        'reason'
      ]
    };

    let geminiResultJson: any = null;
    let geminiError: any = null;
    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview'
    ];

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: responseSchema,
              temperature: 0.1
            }
          });

          if (response.text) {
            geminiResultJson = JSON.parse(response.text);
            break;
          }
        } catch (err: any) {
          geminiError = err;
          console.warn(`[GEMINI_VERIFY] Model ${modelName} (attempt ${attempt + 1}) failed:`, err?.message || err);
          if (attempt === 0 && (err?.status === 503 || err?.status === 429 || err?.message?.includes('503') || err?.message?.includes('demand'))) {
            // Short backoff before retry on high demand
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          break;
        }
      }
      if (geminiResultJson) break;
    }

    if (!geminiResultJson) {
      console.error('[GEMINI_VERIFY] All Gemini vision models failed:', geminiError);
      const isQuota = (
        geminiError?.status === 429 ||
        geminiError?.message?.includes('429') ||
        geminiError?.message?.includes('quota') ||
        geminiError?.message?.includes('RESOURCE_EXHAUSTED')
      );
      const userReason = isQuota
        ? 'AI verification daily quota reached for the free tier. Please try again in a moment or upload another proof.'
        : 'AI verification service is temporarily unavailable. Please try submitting again in a moment.';

      return sendJson(res, 503, {
        success: false,
        status: 'REVIEW_REQUIRED',
        problemCompleted: false,
        xp_earned: 0,
        reason: userReason,
        error: geminiError?.message || 'Gemini API unavailable'
      });
    }

    // 9. Runtime Schema Validation
    const isSchemaValid = (
      typeof geminiResultJson.is_valid === 'boolean' &&
      typeof geminiResultJson.platform_match === 'boolean' &&
      typeof geminiResultJson.problem_match === 'boolean' &&
      typeof geminiResultJson.success_status_visible === 'boolean' &&
      typeof geminiResultJson.confidence === 'number' &&
      geminiResultJson.confidence >= 0 && geminiResultJson.confidence <= 1 &&
      ['GOOD', 'UNCLEAR', 'POOR'].includes(geminiResultJson.screenshot_quality) &&
      ['LOW', 'MEDIUM', 'HIGH'].includes(geminiResultJson.manipulation_risk) &&
      typeof geminiResultJson.reason === 'string'
    );

    if (!isSchemaValid) {
      return sendJson(res, 502, {
        success: false,
        status: 'REVIEW_REQUIRED',
        problemCompleted: false,
        xp_earned: 0,
        reason: 'Received malformed validation response from AI verification engine.',
        error: 'SCHEMA_VALIDATION_FAILED'
      });
    }

    const isValidProof = (
      geminiResultJson.is_valid === true &&
      geminiResultJson.platform_match === true &&
      geminiResultJson.problem_match === true &&
      geminiResultJson.success_status_visible === true &&
      geminiResultJson.manipulation_risk !== 'HIGH' &&
      geminiResultJson.confidence >= 0.70
    );

    // 10. Handle Rejection
    if (!isValidProof) {
      if (supabase && submissionProofId) {
        try {
          await supabase
            .from('submission_proofs')
            .update({
              verification_status: 'FAILED',
              verification_score: Math.round((geminiResultJson.confidence || 0) * 100),
              verification_reason: geminiResultJson.reason || 'Verification criteria not satisfied.',
              ai_result: geminiResultJson
            })
            .eq('id', submissionProofId)
            .eq('user_id', authenticatedUserId);
        } catch (proofUpdateErr) {
          console.warn('[VERIFY_PROOF] Rejection proof update notice:', proofUpdateErr);
        }
      }

      return sendJson(res, 200, {
        success: false,
        status: 'REJECTED',
        verification_status: 'REJECTED',
        problemCompleted: false,
        xp_earned: 0,
        reason: geminiResultJson.reason || 'Verification criteria not satisfied.',
        details: {
          platform_match: geminiResultJson.platform_match,
          problem_match: geminiResultJson.problem_match,
          success_status_visible: geminiResultJson.success_status_visible,
          confidence: geminiResultJson.confidence
        }
      });
    }

    // 11. Handle Verified Completion & Database Persistence
    const xpAwarded = problem.xp || 10;
    let newTotalXp = xpAwarded;
    let completedCount = 1;

    if (supabase) {
      try {
        // Upsert Progress Record in user_progress
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: authenticatedUserId,
            problem_id: dbProblemUuid,
            status: 'COMPLETED',
            xp_earned: xpAwarded,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,problem_id' });

        if (progressError) {
          throw progressError;
        }

        // Update Submission Proof record if provided
        if (submissionProofId) {
          try {
            await supabase
              .from('submission_proofs')
              .update({
                verification_status: 'VERIFIED',
                verification_score: Math.round((geminiResultJson.confidence || 1) * 100),
                verification_reason: geminiResultJson.reason,
                ai_result: geminiResultJson,
                verified_at: new Date().toISOString()
              })
              .eq('id', submissionProofId)
              .eq('user_id', authenticatedUserId);
          } catch (proofErr) {
            console.warn('[VERIFY_PROOF] submission_proofs update notice:', proofErr);
          }
        }

        // Unlock next sequential problem in user_progress if not already completed
        const nextProblemNum = Math.min(22, problem.number + 1);
        if (nextProblemNum <= 22 && nextProblemNum !== problem.number) {
          try {
            const { data: nextDbProb } = await supabase
              .from('problems')
              .select('id')
              .eq('problem_number', nextProblemNum)
              .maybeSingle();

            const nextUuid = nextDbProb?.id || `dp-${String(nextProblemNum).padStart(2, '0')}`;

            const { data: nextProg } = await supabase
              .from('user_progress')
              .select('status')
              .eq('user_id', authenticatedUserId)
              .eq('problem_id', nextUuid)
              .maybeSingle();

            if (!nextProg || nextProg.status !== 'COMPLETED') {
              await supabase
                .from('user_progress')
                .upsert({
                  user_id: authenticatedUserId,
                  problem_id: nextUuid,
                  status: 'AVAILABLE',
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,problem_id' });
            }
          } catch (nextErr) {
            console.warn('[VERIFY_PROOF] Next problem unlock notice:', nextErr);
          }
        }

        // Update Profile XP, completed_count, and current_streak
        const { data: completedRows } = await supabase
          .from('user_progress')
          .select('completed_at, updated_at, created_at')
          .eq('user_id', authenticatedUserId)
          .eq('status', 'COMPLETED');

        completedCount = completedRows?.length || 1;
        newTotalXp = Math.min(220, completedCount * 10);

        // Calculate unique completion days for streak
        const uniqueDates = new Set<string>();
        completedRows?.forEach((r: any) => {
          const ts = r.completed_at || r.updated_at || r.created_at;
          if (ts) {
            try {
              const d = new Date(ts);
              if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                uniqueDates.add(`${year}-${month}-${day}`);
              }
            } catch {}
          }
        });
        const currentStreak = uniqueDates.size;

        await supabase
          .from('profiles')
          .update({
            total_xp: newTotalXp,
            completed_count: completedCount,
            current_streak: currentStreak,
            updated_at: new Date().toISOString()
          })
          .eq('id', authenticatedUserId);
      } catch (dbErr: any) {
        console.error('[VERIFY_PROOF] Database update failed:', dbErr);
        return sendJson(res, 500, {
          success: false,
          status: 'REVIEW_REQUIRED',
          problemCompleted: false,
          xp_earned: 0,
          reason: 'Your proof was verified, but a database error occurred while saving your progress. No XP was awarded.',
          error: dbErr?.message || 'Database write failure'
        });
      }
    }

    const nextNumber = Math.min(22, problem.number + 1);
    const nextId = `dp-${String(nextNumber).padStart(2, '0')}`;

    return sendJson(res, 200, {
      success: true,
      already_completed: false,
      status: 'COMPLETED',
      verification_status: 'VERIFIED',
      xp_earned: xpAwarded,
      total_xp: newTotalXp,
      completed_count: completedCount,
      next_problem_number: nextNumber,
      next_problem_id: nextId,
      problemCompleted: true,
      score: 100,
      reason: geminiResultJson.reason || 'Screenshot verified successfully.'
    });

  } catch (outerErr: any) {
    console.error('[PROOF_VERIFY] Unexpected error:', outerErr);
    return sendJson(res, 500, {
      success: false,
      status: 'REVIEW_REQUIRED',
      problemCompleted: false,
      xp_earned: 0,
      reason: 'An unexpected server error occurred during proof verification.',
      error: outerErr?.message || 'Internal Server Error'
    });
  } finally {
    activeVerificationLocks.delete(lockKey);
  }
}
