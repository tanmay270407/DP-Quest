import { VerificationState } from '../types';

export interface VerificationRequest {
  problemId: string;
  problemTitle: string;
  platform: string;
  imageUrl?: string;
  storagePath?: string;
  submissionProofId?: string;
  userId: string;
  authToken?: string;
}

export interface VerificationResponse {
  status: VerificationState;
  score: number;
  notes: string;
  verifiedAt: string;
  problemCompleted?: boolean;
  nextProblemId?: string;
  nextProblemNumber?: number;
  totalXp?: number;
  completedCount?: number;
  alreadyCompleted?: boolean;
  success?: boolean;
  error?: string;
}

/**
 * Service abstraction for submission verification.
 * Calls the secure backend server endpoint /api/verify-proof which
 * invokes Gemini 3.8 Flash multimodal with authoritative metadata.
 */
class VerificationService {
  async verifySubmissionProof(req: VerificationRequest): Promise<VerificationResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (req.authToken) {
        headers['Authorization'] = `Bearer ${req.authToken}`;
      }

      const isStorageValid = req.storagePath && !req.storagePath.startsWith('local://');

      const payload: Record<string, any> = {
        problemId: req.problemId,
        submissionProofId: req.submissionProofId,
        storagePath: req.storagePath,
        userId: req.userId
      };

      // Send imageDataUrl only if storagePath is not available in Supabase Storage
      // This keeps the POST body under 1 KB and prevents Vercel 4.5MB body payload rejection
      if (!isStorageValid && req.imageUrl) {
        payload.imageDataUrl = req.imageUrl;
      }

      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.error('Failed to parse JSON response:', jsonErr);
          return {
            status: 'FAILED',
            score: 0,
            notes: "Verification server returned malformed response. Please try again.",
            verifiedAt: new Date().toISOString(),
            error: 'Malformed JSON response from verification server.'
          };
        }
      } else {
        const rawText = await response.text();
        console.warn('Received non-JSON response from /api/verify-proof:', rawText.slice(0, 200));
        return {
          status: 'FAILED',
          score: 0,
          notes: "Verification service temporarily unavailable. Please try again in a moment.",
          verifiedAt: new Date().toISOString(),
          error: `Server returned non-JSON status ${response.status}`
        };
      }

      if (!response.ok) {
        return {
          status: (data.status as VerificationState) || 'FAILED',
          score: 0,
          notes: data.error || "Verification couldn't be completed. Please try again.",
          verifiedAt: new Date().toISOString(),
          error: data.error,
          success: false
        };
      }

      return {
        status: (data.status as VerificationState) || (data.success ? 'VERIFIED' : 'FAILED'),
        score: data.score || 0,
        notes: data.reason || 'Verification process completed.',
        verifiedAt: new Date().toISOString(),
        problemCompleted: data.problemCompleted ?? (data.status === 'COMPLETED' || data.status === 'VERIFIED'),
        nextProblemId: data.next_problem_id || data.nextProblemId,
        nextProblemNumber: data.next_problem_number || data.nextProblemNumber,
        totalXp: data.total_xp ?? data.totalXp,
        completedCount: data.completed_count ?? data.completedCount,
        alreadyCompleted: data.already_completed ?? data.alreadyCompleted,
        success: data.success ?? (data.status === 'VERIFIED' || data.status === 'COMPLETED')
      };
    } catch (err: any) {
      console.error('Network error during AI verification:', err);
      return {
        status: 'FAILED',
        score: 0,
        notes: "Verification couldn't be completed. Please try again.",
        verifiedAt: new Date().toISOString(),
        error: err?.message,
        success: false
      };
    }
  }

  /**
   * Helper to generate sample accepted screenshot SVG
   * for desktop/mobile testing convenience
   */
  generateSampleProofSvg(title: string, platform: string, problemNumber?: string | number): string {
    const numDisplay = problemNumber ? `${problemNumber}. ` : '';

    if (platform === 'LeetCode') {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="850" height="480" viewBox="0 0 850 480">
          <rect width="850" height="480" fill="#1a1a1a"/>
          <rect width="850" height="48" fill="#262626"/>
          <text x="24" y="32" fill="#FFA116" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold">LeetCode</text>
          <text x="140" y="30" fill="#8c8c8c" font-family="system-ui, -apple-system, sans-serif" font-size="13">Problems / ${numDisplay}${title} / Submissions</text>
          
          <rect x="24" y="68" width="802" height="96" rx="8" fill="#222222"/>
          <text x="44" y="108" fill="#2cbb5d" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold">Accepted</text>
          <text x="160" y="108" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold">${numDisplay}${title}</text>
          <text x="44" y="142" fill="#eff2f6" font-family="system-ui, -apple-system, sans-serif" font-size="13">Runtime: 0 ms (Beats 100%) · Memory: 16.2 MB · Passed all test cases</text>
          
          <rect x="24" y="180" width="802" height="274" rx="8" fill="#1e1e1e"/>
          <text x="44" y="215" fill="#38BDF8" font-family="ui-monospace, monospace" font-size="13">// Dynamic Programming Tabulation</text>
          <text x="44" y="240" fill="#A7F3D0" font-family="ui-monospace, monospace" font-size="13">class Solution {</text>
          <text x="44" y="265" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">    public int solve(int n) {</text>
          <text x="44" y="290" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">        int[] dp = new int[n + 1];</text>
          <text x="44" y="315" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">        dp[0] = 0; if (n &gt; 0) dp[1] = 1;</text>
          <text x="44" y="340" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">        for (int i = 2; i &lt;= n; i++) dp[i] = dp[i-1] + dp[i-2];</text>
          <text x="44" y="365" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">        return dp[n];</text>
          <text x="44" y="390" fill="#A7F3D0" font-family="ui-monospace, monospace" font-size="13">    }</text>
          <text x="44" y="415" fill="#A7F3D0" font-family="ui-monospace, monospace" font-size="13">}</text>
        </svg>
      `;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    if (platform === 'CSES') {
      const taskStr = problemNumber ? `Task ${problemNumber}` : 'CSES Task';
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="850" height="480" viewBox="0 0 850 480">
          <rect width="850" height="480" fill="#ffffff"/>
          <rect width="850" height="48" fill="#222222"/>
          <text x="24" y="32" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold">CSES Problem Set</text>
          <text x="220" y="31" fill="#9ca3af" font-family="system-ui, -apple-system, sans-serif" font-size="13">Dynamic Programming</text>
          
          <rect x="24" y="68" width="802" height="96" rx="8" fill="#f9fafb" stroke="#e5e7eb"/>
          <text x="44" y="102" fill="#111827" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold">${title} (${taskStr})</text>
          <rect x="44" y="118" width="220" height="30" rx="4" fill="#d1fae5"/>
          <text x="54" y="138" fill="#065f46" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold">ACCEPTED · 100/100</text>
          
          <rect x="24" y="180" width="802" height="274" rx="8" fill="#1e1e1e"/>
          <text x="44" y="215" fill="#38BDF8" font-family="ui-monospace, monospace" font-size="13">// CSES DP Solution</text>
          <text x="44" y="240" fill="#A7F3D0" font-family="ui-monospace, monospace" font-size="13">#include &lt;bits/stdc++.h&gt;</text>
          <text x="44" y="265" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">using namespace std;</text>
          <text x="44" y="290" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">int main() { cin.tie(0); return 0; }</text>
        </svg>
      `;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    // Default: GeeksforGeeks
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="850" height="480" viewBox="0 0 850 480">
        <rect width="850" height="480" fill="#ffffff"/>
        <rect width="850" height="48" fill="#2f8d46"/>
        <text x="24" y="32" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold">GeeksforGeeks</text>
        <text x="180" y="31" fill="#e2f5e8" font-family="system-ui, -apple-system, sans-serif" font-size="13">Practice &gt; Problems &gt; ${title}</text>
        
        <rect x="24" y="68" width="802" height="96" rx="8" fill="#f8f9fa" stroke="#e9ecef"/>
        <text x="44" y="102" fill="#28a745" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold">Problem Solved Successfully</text>
        <text x="44" y="132" fill="#212529" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="bold">${title}</text>
        <text x="44" y="152" fill="#6c757d" font-family="system-ui, -apple-system, sans-serif" font-size="12">Correct Answer · Total Points: 2/2 · Passed All Test Cases</text>
        
        <rect x="24" y="180" width="802" height="274" rx="8" fill="#1e1e1e"/>
        <text x="44" y="215" fill="#38BDF8" font-family="ui-monospace, monospace" font-size="13">// GeeksforGeeks DP Solution</text>
        <text x="44" y="240" fill="#A7F3D0" font-family="ui-monospace, monospace" font-size="13">class Solution {</text>
        <text x="44" y="265" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">    int solve(int n) {</text>
        <text x="44" y="290" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">        int dp[] = new int[n + 1];</text>
        <text x="44" y="315" fill="#CBD5E1" font-family="ui-monospace, monospace" font-size="13">        return dp[n];</text>
        <text x="44" y="340" fill="#A7F3D0" font-family="ui-monospace, monospace" font-size="13">    }</text>
        <text x="44" y="365" fill="#A7F3D0" font-family="ui-monospace, monospace" font-size="13">}</text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

export const verificationService = new VerificationService();
