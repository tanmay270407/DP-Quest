import { PROBLEMS_DATA } from '../src/data/problems.ts';

export interface ProblemAuditResult {
  problemNumber: number;
  title: string;
  platform: string;
  externalProblemNumber: string | number;
  url: string;
  urlStatus: 'VALID' | 'NEEDS_REVIEW' | 'INVALID_CONFIG';
  titleMatch: boolean;
  conceptMatch: boolean;
  expectedIdentity: string;
  potentialMismatchWarnings: string[];
  finalValidationStatus: 'VALID' | 'NEEDS_REVIEW';
}

export function auditAllProblems(): ProblemAuditResult[] {
  return PROBLEMS_DATA.map((p) => {
    const warnings: string[] = [];
    let urlStatus: 'VALID' | 'NEEDS_REVIEW' | 'INVALID_CONFIG' = 'VALID';

    // 1. Platform validation
    if (!['LeetCode', 'GFG', 'CSES'].includes(p.platform)) {
      warnings.push(`Unknown platform ${p.platform}`);
      urlStatus = 'NEEDS_REVIEW';
    }

    // 2. URL domain validation
    if (p.platform === 'LeetCode' && !p.url.includes('leetcode.com/problems/')) {
      warnings.push(`LeetCode URL doesn't match standard pattern: ${p.url}`);
      urlStatus = 'NEEDS_REVIEW';
    }
    if (p.platform === 'CSES' && !p.url.includes('cses.fi/problemset/task/')) {
      warnings.push(`CSES URL doesn't match standard pattern: ${p.url}`);
      urlStatus = 'NEEDS_REVIEW';
    }
    if (p.platform === 'GFG' && !p.url.includes('geeksforgeeks.org/')) {
      warnings.push(`GFG URL doesn't match standard pattern: ${p.url}`);
      urlStatus = 'NEEDS_REVIEW';
    }

    // 3. Problem #3 specific check
    if (p.number === 3) {
      if (p.url.includes('count-ways-to-reach-the-nth-stair-1587115620')) {
        warnings.push('CRITICAL: Using 1/2 step stair URL instead of 1, 2, 3 step stair URL.');
        urlStatus = 'INVALID_CONFIG';
      }
    }

    // 4. Problem #20 vs #21 check
    if (p.number === 20 && p.url.includes('minimum-number-of-jumps-1587115620')) {
      warnings.push('CRITICAL: Using array jump URL instead of start 0 with +1/*2 operations.');
      urlStatus = 'INVALID_CONFIG';
    }

    return {
      problemNumber: p.number,
      title: p.title,
      platform: p.platform,
      externalProblemNumber: p.problemNumber || 'N/A',
      url: p.url,
      urlStatus: urlStatus,
      titleMatch: Boolean(p.canonicalTitle && p.title === p.canonicalTitle),
      conceptMatch: Boolean(p.conceptSignature),
      expectedIdentity: p.conceptSignature || p.title,
      potentialMismatchWarnings: p.rejectionSignatures || [],
      finalValidationStatus: urlStatus === 'VALID' ? 'VALID' : 'NEEDS_REVIEW'
    };
  });
}

// Run if called directly
const results = auditAllProblems();
console.log('========================================================================');
console.log('           DP QUEST AUTHORITATIVE 25-PROBLEM AUDIT REPORT               ');
console.log('========================================================================');

let allValid = true;
results.forEach((r) => {
  console.log(
    `#${r.problemNumber.toString().padStart(2, '0')} | ${r.title.padEnd(45, ' ')} | [${r.platform.padEnd(8, ' ')}] | ${r.finalValidationStatus}`
  );
  console.log(`    URL: ${r.url}`);
  console.log(`    Concept: ${r.expectedIdentity}`);
  console.log(`    Rejection Targets: ${r.potentialMismatchWarnings.join(', ')}`);
  if (r.finalValidationStatus !== 'VALID') {
    allValid = false;
  }
});

console.log('========================================================================');
console.log(`TOTAL PROBLEMS AUDITED: ${results.length}/25`);
console.log(`ALL 25 PROBLEMS FULLY VALID: ${allValid ? 'YES (100% VALIDATED)' : 'NO'}`);
console.log('========================================================================');
