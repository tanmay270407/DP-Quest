import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  CheckCircle2, 
  Award, 
  User as UserIcon,
  Lock
} from 'lucide-react';
import { useQuest } from '../../context/QuestContext';
import { useAuth } from '../../context/AuthContext';
import { ViewType } from '../../types';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  locked?: boolean;
}

export const Sidebar: React.FC = () => {
  const { currentView, navigateTo, totalXp, completedCount, isQuestComplete } = useQuest();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'problems',
      label: 'Problems',
      icon: <Code2 className="w-4 h-4" />
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <CheckCircle2 className="w-4 h-4" />
    },
    {
      id: 'certificate',
      label: 'Certificate',
      icon: isQuestComplete ? <Award className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 opacity-60" />,
      locked: !isQuestComplete
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon className="w-4 h-4" />
    }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen p-5 neu-bg border-r border-white/40 shrink-0 select-none">
      {/* Brand Header */}
      <div 
        onClick={() => navigateTo('landing')}
        className="flex items-center gap-3 px-3 py-3 mb-8 cursor-pointer rounded-2xl neu-raised-sm group transition-transform active:scale-[0.98]"
        title="Back to Landing Page"
      >
        <div className="w-9 h-9 rounded-xl neu-btn-primary flex items-center justify-center font-bold tracking-tight text-white text-sm shadow-sm">
          DP
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-gray-900 leading-none">
            DP Quest
          </div>
          <div className="text-[11px] text-gray-500 font-medium tracking-tight mt-1">
            25 Dynamic Problems
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2.5">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === 'problems' && currentView === 'problem-detail');
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'neu-pressed text-gray-900 font-bold'
                  : 'text-gray-600 hover:text-gray-900 neu-raised-sm hover:neu-raised'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-gray-900' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.id === 'certificate' && isQuestComplete && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 neu-accent-dot" />
              )}
              {item.id === 'problems' && (
                <span className="text-[10px] font-mono text-gray-400">
                  {completedCount}/25
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Neumorphic Card: XP & Quest Status */}
      <div className="mt-auto pt-6">
        <div className="p-4 rounded-2xl neu-inset text-center space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Quest Experience
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-gray-800">
            {totalXp} <span className="text-xs font-sans text-gray-500">XP</span>
          </div>
          <div className="text-[11px] text-gray-500 font-medium">
            {completedCount} of 25 completed
          </div>
        </div>
      </div>
    </aside>
  );
};
