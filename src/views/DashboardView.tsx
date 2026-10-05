import React from 'react';
import { useQuest } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicProgressBar } from '../components/common/NeumorphicProgressBar';
import { 
  Flame, 
  Sparkles, 
  Check, 
  Lock 
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { 
    completedCount, 
    totalXp, 
    problems, 
    userProgress, 
    nextUnlockedProblem, 
    selectProblem, 
    navigateTo,
    isQuestComplete,
    isLoadingData
  } = useQuest();

  // Next problem to solve: either the next available or the first one if all done or none
  const currentTargetProblem = nextUnlockedProblem || problems[problems.length - 1];

  if (isLoadingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl neu-inset" />
          <div className="h-4 w-72 rounded-lg neu-inset" />
        </div>
        <div className="h-36 rounded-2xl neu-raised" />
        <div className="h-48 rounded-2xl neu-raised" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {user?.fullName || 'Explorer'} 👋
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Continue your sequence and master dynamic programming patterns.
          </p>
        </div>

        {/* Minimal status chips / counters */}
        <div className="flex items-center gap-3">
          <div className="neu-inset px-3.5 py-2 rounded-xl flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-gray-700">
              {user?.currentStreak || 1} days streak
            </span>
          </div>

          <div className="neu-inset px-3.5 py-2 rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-semibold font-mono text-gray-800">
              {totalXp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <NeumorphicCard variant="raised" className="p-6 md:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Quest Completion
            </div>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
              {completedCount} <span className="text-sm font-sans text-gray-400">/ 22</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Total XP Earned
            </div>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
              {totalXp} <span className="text-sm font-sans text-gray-400">/ 220</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <NeumorphicProgressBar 
          current={completedCount} 
          total={22} 
          showLabels={false} 
          size="md" 
        />

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>{22 - completedCount} problems remaining</span>
          <span className="font-semibold text-gray-700">
            {Math.round((completedCount / 22) * 100)}% Complete
          </span>
        </div>
      </NeumorphicCard>

      {/* Compact 22-Problem Progress Indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-wide uppercase text-gray-500">
            Roadmap Overview (22 Problems)
          </h2>
          <button 
            onClick={() => navigateTo('problems')}
            className="text-xs text-gray-500 hover:text-gray-900 font-medium"
          >
            View Full List →
          </button>
        </div>

        <NeumorphicCard variant="raised-sm" className="p-4 md:p-5">
          <div className="grid grid-cols-5 sm:grid-cols-11 md:grid-cols-22 gap-2">
            {problems.map((prob) => {
              const status = userProgress[prob.id]?.status || 'LOCKED';
              const isCompleted = status === 'COMPLETED';
              const isAvailable = status === 'AVAILABLE';
              const isCurrent = prob.id === currentTargetProblem.id && !isQuestComplete;

              return (
                <button
                  key={prob.id}
                  onClick={() => selectProblem(prob.id)}
                  disabled={status === 'LOCKED'}
                  title={`${prob.number}. ${prob.title} (${status})`}
                  className={`relative flex flex-col items-center justify-center h-12 rounded-xl text-xs font-mono font-medium transition-all ${
                    isCompleted
                      ? 'neu-pressed text-emerald-700 bg-emerald-500/10 font-bold'
                      : isCurrent
                      ? 'neu-raised font-bold text-gray-900 ring-2 ring-slate-800'
                      : isAvailable
                      ? 'neu-raised-interactive text-gray-800'
                      : 'neu-inset-sm text-gray-400 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[11px] leading-none">
                    {prob.number.toString().padStart(2, '0')}
                  </span>
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-emerald-600 mt-1 stroke-[3]" />
                  ) : status === 'LOCKED' ? (
                    <Lock className="w-2.5 h-2.5 text-gray-400 mt-1 opacity-70" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-4 pt-3 border-t border-gray-300/40 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              Completed ({completedCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
              Available ({problems.filter(p => userProgress[p.id]?.status === 'AVAILABLE').length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
              Locked ({problems.filter(p => userProgress[p.id]?.status === 'LOCKED').length})
            </span>
          </div>
        </NeumorphicCard>
      </div>
    </div>
  );
};
