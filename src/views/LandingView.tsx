import React from 'react';
import { useQuest } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { ArrowRight, Code2, LogIn, LayoutDashboard } from 'lucide-react';

export const LandingView: React.FC = () => {
  const { navigateTo } = useQuest();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen neu-bg flex flex-col justify-between p-6 md:p-12 selection:bg-slate-300">
      {/* Top minimal header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl neu-btn-primary flex items-center justify-center font-bold text-white text-xs tracking-wider shadow-sm">
            DP
          </div>
          <span className="font-bold text-sm tracking-tight text-gray-900">
            DP Quest
          </span>
        </div>

        {isAuthenticated ? (
          <NeumorphicButton
            size="sm"
            variant="secondary"
            onClick={() => navigateTo('dashboard')}
            icon={<LayoutDashboard className="w-3.5 h-3.5 text-gray-500" />}
          >
            Dashboard
          </NeumorphicButton>
        ) : (
          <NeumorphicButton
            size="sm"
            variant="secondary"
            onClick={() => navigateTo('login')}
            icon={<LogIn className="w-3.5 h-3.5 text-gray-500" />}
          >
            Sign In
          </NeumorphicButton>
        )}
      </header>

      {/* Main hero - clean, minimal, zero paragraph clutter */}
      <main className="max-w-2xl mx-auto w-full text-center my-auto py-12 space-y-10">
        <div className="space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full neu-inset text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Curated 22-Problem Roadmap
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            DP QUEST
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 font-medium tracking-tight">
            Master Dynamic Programming,
            <br />
            One Problem at a Time.
          </p>
        </div>

        {/* 4 Core Pillars */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-gray-600">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            22 Problems
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            XP System
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            AI Verification
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            Certificate
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <NeumorphicButton
            size="lg"
            variant="primary"
            onClick={() => navigateTo(isAuthenticated ? 'dashboard' : 'signup')}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {isAuthenticated ? 'Continue Quest' : 'Start Quest'}
          </NeumorphicButton>

          <NeumorphicButton
            size="lg"
            variant="secondary"
            onClick={() => navigateTo(isAuthenticated ? 'problems' : 'login')}
            icon={<Code2 className="w-4 h-4 text-gray-500" />}
            className="w-full sm:w-auto"
          >
            View Problems
          </NeumorphicButton>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-[11px] text-gray-400 py-4 font-mono">
        DP Quest · Sequential Problem Tracker · 22 Curated Challenges
      </footer>
    </div>
  );
};
