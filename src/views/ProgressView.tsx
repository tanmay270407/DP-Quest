import React from 'react';
import { useQuest } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicProgressBar } from '../components/common/NeumorphicProgressBar';
import { 
  Check, 
  ArrowRight, 
  Lock, 
  Award,
  ChevronRight,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { 
    completedCount, 
    totalXp, 
    problems, 
    userProgress, 
    submissionProofs,
    selectProblem, 
    isQuestComplete, 
    navigateTo,
    isLoadingData,
    nextUnlockedProblem
  } = useQuest();

  if (isLoadingData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-pulse">
        <div className="h-8 w-44 rounded-xl neu-inset" />
        <div className="h-32 rounded-2xl neu-raised" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl neu-raised-sm" />
          ))}
        </div>
      </div>
    );
  }

  const percentage = Math.round((completedCount / 25) * 100);

  // Compute recent attempts list
  const recentAttempts = problems
    .filter((p) => {
      const prog = userProgress[p.id];
      const prf = submissionProofs[p.id];
      return prog?.status === 'COMPLETED' || prog?.status === 'VERIFYING' || prf;
    })
    .map((p) => {
      const prog = userProgress[p.id];
      const prf = submissionProofs[p.id];
      let statusLabel = 'Pending';
      let icon = '⏳';
      let statusColor = 'text-amber-700';

      if (prog?.status === 'COMPLETED' || prf?.verificationStatus === 'VERIFIED') {
        statusLabel = 'Verified';
        icon = '✓';
        statusColor = 'text-emerald-700';
      } else if (prf?.verificationStatus === 'REVIEW_REQUIRED') {
        statusLabel = 'Review Required';
        icon = '⚠';
        statusColor = 'text-amber-800';
      } else if (prf?.verificationStatus === 'FAILED') {
        statusLabel = 'Failed';
        icon = '✕';
        statusColor = 'text-rose-700';
      } else if (prog?.status === 'VERIFYING' || prf?.verificationStatus === 'PENDING') {
        statusLabel = 'Pending';
        icon = '⏳';
        statusColor = 'text-amber-700';
      }

      return {
        problem: p,
        statusLabel,
        icon,
        statusColor,
        date: prf?.createdAt || prog?.completedAt
      };
    })
    .slice(-5)
    .reverse();

  return (
    <div className="max-w-3xl mx-auto space-y-7 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Progress Overview
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Real-time completion tracked in database.
        </p>
      </div>

      {/* Simple Progress Visualization Card */}
      <NeumorphicCard variant="raised" className="p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Problems Completed
            </div>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
              {completedCount} <span className="text-sm font-sans text-gray-400">/ 25</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Total XP
            </div>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
              {totalXp} <span className="text-sm font-sans text-gray-400">XP</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Progress
            </div>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
              {percentage}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <NeumorphicProgressBar
          current={completedCount}
          total={25}
          showLabels={false}
          size="md"
        />

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{25 - completedCount} problems remaining</span>
          {isQuestComplete ? (
            <button
              onClick={() => navigateTo('certificate')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              Certificate Unlocked →
            </button>
          ) : (
            <span>Solve sequentially to earn your certificate</span>
          )}
        </div>
      </NeumorphicCard>

      {/* Recent Attempts (Proof History) */}
      {recentAttempts.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold tracking-wide uppercase text-gray-400 px-1">
            Recent Attempts
          </h2>

          <div className="space-y-2">
            {recentAttempts.map((item) => (
              <div
                key={item.problem.id}
                onClick={() => selectProblem(item.problem.id)}
                className="p-3.5 rounded-xl neu-raised-sm hover:neu-raised cursor-pointer flex items-center justify-between gap-3 text-xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-bold text-sm w-4 text-center shrink-0">
                    {item.icon}
                  </span>
                  <span className="font-semibold text-gray-800 truncate">
                    {item.problem.title}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                    {item.problem.platform}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-semibold font-mono ${item.statusColor}`}>
                    {item.statusLabel}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Roadmap List: Completed, Current, Locked */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold tracking-wide uppercase text-gray-400">
            Roadmap Sequence
          </h2>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-slate-800" />
              Current
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-gray-400" />
              Locked
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {problems.map((prob) => {
            const status = userProgress[prob.id]?.status || 'LOCKED';
            const isCompleted = status === 'COMPLETED';
            const isCurrent = prob.id === nextUnlockedProblem?.id && !isQuestComplete;
            const isAvailable = status === 'AVAILABLE' && !isCurrent;
            const isLocked = status === 'LOCKED';

            return (
              <div
                key={prob.id}
                onClick={() => {
                  if (!isLocked) selectProblem(prob.id);
                }}
                className={`p-3.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'neu-inset-sm bg-emerald-500/5'
                    : isCurrent
                    ? 'neu-raised ring-2 ring-slate-800 cursor-pointer'
                    : isAvailable
                    ? 'neu-raised-sm hover:neu-raised cursor-pointer'
                    : 'neu-inset-sm opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isCompleted
                        ? 'text-emerald-700 bg-emerald-500/20'
                        : isCurrent
                        ? 'bg-slate-900 text-white'
                        : isAvailable
                        ? 'neu-raised-sm text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      prob.number.toString().padStart(2, '0')
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-gray-800 truncate block">
                      {prob.title}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {prob.platform} {prob.problemNumber ? `· #${prob.problemNumber}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {isCompleted && (
                    <span className="text-[10px] font-semibold text-emerald-700 font-mono">
                      ✓ +10 XP
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-slate-900 flex items-center gap-1 font-mono">
                      → Current Problem
                    </span>
                  )}
                  {isAvailable && !isCurrent && (
                    <span className="text-[10px] font-semibold text-gray-600 font-mono">
                      Available
                    </span>
                  )}
                  {isLocked && (
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  )}

                  {!isLocked && (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
