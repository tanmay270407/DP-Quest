import React from 'react';
import { useQuest } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicProgressBar } from '../components/common/NeumorphicProgressBar';
import { 
  Flame, 
  Sparkles 
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { 
    completedCount, 
    totalXp, 
    isLoadingData
  } = useQuest();

  if (isLoadingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl neu-inset" />
          <div className="h-4 w-72 rounded-lg neu-inset" />
        </div>
        <div className="h-36 rounded-2xl neu-raised" />
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
              {user?.currentStreak ?? 0} days streak
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
    </div>
  );
};
