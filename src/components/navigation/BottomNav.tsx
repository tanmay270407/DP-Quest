import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  CheckCircle2, 
  Award, 
  User as UserIcon 
} from 'lucide-react';
import { useQuest } from '../../context/QuestContext';
import { ViewType } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentView, navigateTo, isQuestComplete } = useQuest();

  const items: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'problems', label: 'Problems', icon: <Code2 className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'certificate', label: 'Certificate', icon: <Award className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 neu-bg border-t border-white/60 px-3 py-2 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = currentView === item.id || (item.id === 'problems' && currentView === 'problem-detail');
        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'neu-pressed text-gray-900 font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.id === 'certificate' && isQuestComplete && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
