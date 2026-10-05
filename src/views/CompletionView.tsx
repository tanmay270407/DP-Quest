import React from 'react';
import { useQuest } from '../context/QuestContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { Check, Award, ArrowLeft } from 'lucide-react';

export const CompletionView: React.FC = () => {
  const { navigateTo, isQuestComplete, completedCount, totalXp } = useQuest();

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8 md:py-16 text-center pb-20">
      <NeumorphicCard variant="raised" className="p-8 md:p-12 space-y-8">
        {/* Large Minimal Checkmark */}
        <div className="w-20 h-20 rounded-3xl neu-inset mx-auto flex items-center justify-center text-emerald-600">
          <Check className="w-10 h-10 stroke-[3.5]" />
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight uppercase">
            DP QUEST COMPLETE
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Congratulations!
          </p>
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="px-5 py-3 rounded-2xl neu-inset">
            <div className="text-xl font-bold font-mono text-gray-900">
              {completedCount} / 25
            </div>
            <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mt-0.5">
              Problems Solved
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl neu-inset">
            <div className="text-xl font-bold font-mono text-gray-900">
              {totalXp} XP
            </div>
            <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mt-0.5">
              Experience Earned
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <NeumorphicButton
            size="lg"
            variant="primary"
            onClick={() => navigateTo('certificate')}
            icon={<Award className="w-5 h-5" />}
            disabled={!isQuestComplete}
          >
            Get Certificate
          </NeumorphicButton>
        </div>
      </NeumorphicCard>

      <div>
        <button
          onClick={() => navigateTo('dashboard')}
          className="text-xs text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
