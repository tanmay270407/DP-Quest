import React, { useState } from 'react';
import { useQuest } from '../context/QuestContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { DPCategory, ProblemStatus } from '../types';
import { 
  Check, 
  Lock, 
  ChevronRight, 
  Filter, 
  ExternalLink,
  Code
} from 'lucide-react';

type FilterStatus = 'ALL' | 'COMPLETED' | 'REMAINING';

const CATEGORIES: ('ALL' | DPCategory)[] = [
  'ALL',
  'Basic DP',
  '1D DP',
  'Counting DP',
  'Optimization',
  'Advanced'
];

export const ProblemsView: React.FC = () => {
  const { problems, userProgress, selectProblem, isLoadingData } = useQuest();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DPCategory>('ALL');

  if (isLoadingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-7 pb-16 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-xl neu-inset" />
          <div className="h-4 w-60 rounded-lg neu-inset" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl neu-raised" />
          ))}
        </div>
      </div>
    );
  }

  // Filter problems
  const filteredProblems = problems.filter((prob) => {
    const status = userProgress[prob.id]?.status || 'LOCKED';

    // Status filter
    if (statusFilter === 'COMPLETED' && status !== 'COMPLETED') return false;
    if (statusFilter === 'REMAINING' && status === 'COMPLETED') return false;

    // Category filter
    if (categoryFilter !== 'ALL' && prob.category !== categoryFilter) return false;

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Problems
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            25 sequential dynamic programming challenges.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-inset">
          {(['ALL', 'COMPLETED', 'REMAINING'] as FilterStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'neu-raised-sm text-gray-900 font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'COMPLETED' ? 'Completed' : 'Remaining'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills (Subtle neumorphic selection) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              categoryFilter === cat
                ? 'neu-pressed text-gray-900 font-bold'
                : 'neu-raised-sm text-gray-600 hover:text-gray-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Problems List */}
      <div className="space-y-3">
        {filteredProblems.length === 0 ? (
          <NeumorphicCard variant="inset" className="p-8 text-center text-xs text-gray-500">
            No problems match your current filter.
          </NeumorphicCard>
        ) : (
          filteredProblems.map((prob) => {
            const status: ProblemStatus = userProgress[prob.id]?.status || 'LOCKED';
            const isCompleted = status === 'COMPLETED';
            const isAvailable = status === 'AVAILABLE';
            const isLocked = status === 'LOCKED';

            return (
              <div
                key={prob.id}
                onClick={() => {
                  if (!isLocked) {
                    selectProblem(prob.id);
                  }
                }}
                className={`group rounded-2xl p-4 md:p-5 transition-all flex items-center justify-between gap-4 ${
                  isLocked
                    ? 'neu-inset-sm opacity-60 cursor-not-allowed'
                    : 'neu-raised-interactive cursor-pointer hover:neu-raised'
                }`}
              >
                {/* Left details: Number + Title + Platform */}
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isCompleted
                        ? 'neu-pressed text-emerald-700 bg-emerald-500/10'
                        : isAvailable
                        ? 'neu-raised text-gray-900 font-extrabold'
                        : 'neu-inset-sm text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    ) : (
                      prob.number.toString().padStart(2, '0')
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                      <span>{prob.platform} {prob.problemNumber ? `· ${prob.problemNumber}` : ''}</span>
                      <span>·</span>
                      <span className="text-gray-400">{prob.category}</span>
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-gray-900 tracking-tight truncate">
                      {prob.title}
                    </h3>
                  </div>
                </div>

                {/* Right details: XP + Status */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-600">
                      +{prob.xp} XP
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                      {status}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl neu-inset-sm flex items-center justify-center text-gray-400 group-hover:text-gray-700 transition-colors">
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
