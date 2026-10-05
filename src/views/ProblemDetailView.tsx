import React, { useState } from 'react';
import { useQuest } from '../context/QuestContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { 
  ArrowLeft, 
  ExternalLink, 
  UploadCloud, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Check
} from 'lucide-react';

export const ProblemDetailView: React.FC = () => {
  const { 
    activeProblem, 
    userProgress, 
    submissionProofs, 
    openProofModal, 
    navigateTo, 
    selectProblem,
    problems 
  } = useQuest();

  // Workflow local states
  const [hasOpenedExternal, setHasOpenedExternal] = useState(false);
  const [showConfirmSolved, setShowConfirmSolved] = useState(false);

  const progress = userProgress[activeProblem.id];
  const proof = submissionProofs[activeProblem.id];

  // Database problem status: 'LOCKED' | 'AVAILABLE' | 'VERIFYING' | 'COMPLETED'
  const status = progress?.status || 'LOCKED';
  const verificationStatus = proof?.verificationStatus;

  const isCompleted = status === 'COMPLETED';
  const isLocked = status === 'LOCKED';
  const isPending = status === 'VERIFYING' || verificationStatus === 'PENDING';
  const isReviewRequired = verificationStatus === 'REVIEW_REQUIRED';
  const isFailed = verificationStatus === 'FAILED';
  const isAvailable = status === 'AVAILABLE';

  // Next problem in sequence
  const nextProblemIndex = problems.findIndex((p) => p.id === activeProblem.id) + 1;
  const nextProblem = nextProblemIndex < problems.length ? problems[nextProblemIndex] : null;

  const handleExternalSolveClick = () => {
    setHasOpenedExternal(true);
  };

  const getPlatformButtonLabel = () => {
    switch (activeProblem.platform) {
      case 'LeetCode':
        return 'Solve on LeetCode ↗';
      case 'GFG':
        return 'Solve on GFG ↗';
      case 'CSES':
        return 'Solve on CSES ↗';
      default:
        return `Solve on ${activeProblem.platform} ↗`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigateTo('problems')}
          className="neu-raised-sm hover:neu-raised px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Problems
        </button>
      </div>

      {/* Main Problem Detail Card */}
      <NeumorphicCard variant="raised" className="p-7 sm:p-10 space-y-8 text-center">
        {/* Number Badge */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl neu-inset font-mono text-lg font-bold text-gray-800">
          {activeProblem.number.toString().padStart(2, '0')}
        </div>

        {/* Title and metadata */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {activeProblem.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-gray-500">
            <span>{activeProblem.platform} {activeProblem.problemNumber ? `· #${activeProblem.problemNumber}` : ''}</span>
            <span>·</span>
            <span>{activeProblem.category}</span>
            <span>·</span>
            <span className="text-emerald-600 font-mono font-bold">+{activeProblem.xp} XP</span>
          </div>

          {/* Status Badge */}
          <div className="pt-2">
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isCompleted
                  ? 'neu-pressed text-emerald-700 bg-emerald-500/10'
                  : isPending
                  ? 'neu-pressed text-amber-700 bg-amber-500/10'
                  : isReviewRequired
                  ? 'neu-pressed text-amber-800 bg-amber-500/20'
                  : isFailed
                  ? 'neu-pressed text-rose-700 bg-rose-500/10'
                  : isAvailable
                  ? 'neu-inset text-slate-800'
                  : 'neu-inset text-gray-400'
              }`}
            >
              Status: {isPending ? 'PENDING' : status}
            </span>
          </div>
        </div>

        {/* Pattern Hint Snippet */}
        {activeProblem.hintSnippet && (
          <div className="p-4 rounded-xl neu-inset text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
            <span className="font-semibold text-gray-700">Pattern Focus: </span>
            {activeProblem.hintSnippet}
          </div>
        )}

        {/* Action States Section */}
        <div className="pt-2 border-t border-gray-300/40 space-y-6">
          {/* STATE 1: LOCKED */}
          {isLocked && (
            <div className="p-5 rounded-2xl neu-inset text-xs text-gray-500 flex items-center justify-center gap-2.5 max-w-md mx-auto">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>🔒 Complete the previous problem first.</span>
            </div>
          )}

          {/* STATE 2: AVAILABLE (Always renders Solve Button & submission/retry workflow) */}
          {isAvailable && (
            <div className="space-y-6 max-w-lg mx-auto">
              {/* Primary External Solve Button (ALWAYS VISIBLE WHEN AVAILABLE) */}
              <div>
                <a
                  href={activeProblem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleExternalSolveClick}
                  className="inline-block"
                >
                  <NeumorphicButton
                    size="lg"
                    variant="primary"
                    icon={<ExternalLink className="w-4 h-4" />}
                  >
                    {getPlatformButtonLabel()}
                  </NeumorphicButton>
                </a>
              </div>

              {/* A. If Verification is in progress */}
              {isPending && (
                <div className="p-6 rounded-2xl neu-inset text-center space-y-2 max-w-md mx-auto">
                  <div className="text-sm font-bold text-amber-800 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>Proof submitted</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Waiting for verification. Your screenshot is being processed.
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-gray-400">
                    Status: PENDING
                  </div>
                </div>
              )}

              {/* B. If Previous Verification FAILED */}
              {isFailed && !isPending && (
                <div className="p-6 rounded-2xl neu-inset text-center space-y-3 max-w-md mx-auto bg-rose-500/5">
                  <div className="text-sm font-bold text-rose-800 flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Verification failed.</span>
                  </div>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    {proof?.verificationNotes || 'The screenshot did not match the expected problem parameters. Please check your submission and upload a new screenshot.'}
                  </p>
                  <div className="pt-1">
                    <NeumorphicButton
                      size="md"
                      variant="secondary"
                      onClick={() => openProofModal(activeProblem.id)}
                      icon={<UploadCloud className="w-4 h-4" />}
                    >
                      Upload New Proof
                    </NeumorphicButton>
                  </div>
                </div>
              )}

              {/* C. If Previous Verification REVIEW_REQUIRED */}
              {isReviewRequired && !isPending && (
                <div className="p-6 rounded-2xl neu-inset text-center space-y-3 max-w-md mx-auto bg-amber-500/5">
                  <div className="text-sm font-bold text-amber-800 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Proof needs review.</span>
                  </div>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    {proof?.verificationNotes || 'The screenshot was ambiguous or cropped. Please provide a clearer screenshot showing the Accepted banner and problem title.'}
                  </p>
                  <div className="pt-1">
                    <NeumorphicButton
                      size="md"
                      variant="secondary"
                      onClick={() => openProofModal(activeProblem.id)}
                      icon={<UploadCloud className="w-4 h-4" />}
                    >
                      Upload New Proof
                    </NeumorphicButton>
                  </div>
                </div>
              )}

              {/* D. Standard Ready-to-Submit Flow when no active failure notice or in initial solving mode */}
              {!isFailed && !isReviewRequired && !isPending && (
                <>
                  {/* External Solving Status & Return Flow */}
                  {hasOpenedExternal && !showConfirmSolved && (
                    <div className="p-5 rounded-2xl neu-inset space-y-3 animate-in fade-in duration-300">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-gray-800">
                          Solving externally
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Return here when you've finished.
                        </div>
                      </div>

                      <NeumorphicButton
                        size="md"
                        variant="secondary"
                        onClick={() => setShowConfirmSolved(true)}
                      >
                        I've Solved It
                      </NeumorphicButton>
                    </div>
                  )}

                  {/* Solved Confirmation Dialog */}
                  {showConfirmSolved && (
                    <div className="p-6 rounded-2xl neu-raised border border-white/60 space-y-4 animate-in zoom-in-95 duration-200">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-gray-900">
                          Ready to submit proof?
                        </h4>
                        <p className="text-xs text-gray-500">
                          Upload a screenshot showing your accepted/correct submission.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-1">
                        <NeumorphicButton
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowConfirmSolved(false)}
                        >
                          Cancel
                        </NeumorphicButton>

                        <NeumorphicButton
                          size="sm"
                          variant="primary"
                          onClick={() => openProofModal(activeProblem.id)}
                          icon={<UploadCloud className="w-3.5 h-3.5" />}
                        >
                          Upload Proof
                        </NeumorphicButton>
                      </div>
                    </div>
                  )}

                  {/* Direct fallback to upload if user already solved previously */}
                  {!hasOpenedExternal && !showConfirmSolved && (
                    <div className="pt-2 flex flex-col items-center gap-3">
                      <NeumorphicButton
                        size="md"
                        variant="secondary"
                        onClick={() => setShowConfirmSolved(true)}
                      >
                        I've Solved It
                      </NeumorphicButton>
                      
                      <button
                        onClick={() => setShowConfirmSolved(true)}
                        className="text-xs text-gray-500 hover:text-gray-900 underline font-medium"
                      >
                        Already solved this problem? Submit Proof
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Latest Proof Compact Section */}
          {proof && (
            <div className="p-4 rounded-xl neu-inset text-xs space-y-1 text-left max-w-md mx-auto">
              <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                Latest Proof
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  Status: {proof.verificationStatus}
                </span>
                <span className="text-gray-400 font-mono text-[10px]">
                  {new Date(proof.createdAt).toLocaleDateString()}
                </span>
              </div>
              {proof.verificationNotes && (
                <p className="text-[11px] text-gray-500 pt-0.5">
                  {proof.verificationNotes}
                </p>
              )}
            </div>
          )}

          {/* STATE 3: COMPLETED / VERIFIED */}
          {isCompleted && (
            <div className="space-y-5 max-w-md mx-auto">
              <div className="p-5 rounded-2xl neu-inset text-center space-y-1.5 bg-emerald-500/5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ✓ Verified
                </div>
                <div className="text-xs text-gray-700 font-semibold font-mono">
                  +10 XP Awarded · Problem Completed
                </div>
                {nextProblem ? (
                  <div className="text-[11px] text-gray-500 pt-1">
                    Next problem unlocked: <strong>#{nextProblem.number} {nextProblem.title}</strong>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-600 font-semibold pt-1">
                    All 22 Problems Solved! Certificate Ready.
                  </div>
                )}
              </div>

              {nextProblem && (
                <NeumorphicButton
                  variant="primary"
                  size="md"
                  onClick={() => selectProblem(nextProblem.id)}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Next Problem
                </NeumorphicButton>
              )}
            </div>
          )}
        </div>
      </NeumorphicCard>
    </div>
  );
};
