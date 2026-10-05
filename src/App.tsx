import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuestProvider, useQuest } from './context/QuestContext';
import { Sidebar } from './components/navigation/Sidebar';
import { BottomNav } from './components/navigation/BottomNav';
import { ProofUploadModal } from './components/modals/ProofUploadModal';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { ProblemsView } from './views/ProblemsView';
import { ProblemDetailView } from './views/ProblemDetailView';
import { ProgressView } from './views/ProgressView';
import { CertificateView } from './views/CertificateView';
import { ProfileView } from './views/ProfileView';
import { CompletionView } from './views/CompletionView';
import { AuthView } from './views/AuthView';
import { PublicVerificationView } from './views/PublicVerificationView';
import { supabaseService } from './services/supabaseService';
import { AlertTriangle, Database } from 'lucide-react';

const ProtectedRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { navigateTo } = useQuest();

  if (isLoading) {
    return (
      <div className="min-h-screen neu-bg flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl neu-btn-primary flex items-center justify-center font-bold text-white text-sm animate-pulse">
          DP
        </div>
        <div className="text-xs font-semibold text-gray-500 font-mono tracking-wider">
          Initializing Session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthView
        initialMode="login"
        onSuccess={() => navigateTo('dashboard')}
        onBackToLanding={() => navigateTo('landing')}
      />
    );
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { currentView, navigateTo, completedCount, totalXp } = useQuest();
  const { isAuthenticated, isLoading, isConfigured } = useAuth();
  const [isSchemaMissing, setIsSchemaMissing] = useState(() => supabaseService.isSchemaMissing());

  useEffect(() => {
    return supabaseService.onSchemaMissingChange((missing) => {
      setIsSchemaMissing(missing);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && (currentView === 'login' || currentView === 'signup' || currentView === 'forgot-password')) {
      navigateTo('dashboard');
    }
  }, [isAuthenticated, currentView, navigateTo]);

  // Route listener for public /verify/:certificateId without requiring login
  const [verifyRouteId, setVerifyRouteId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      return decodeURIComponent(path.replace('/verify/', '').trim());
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/verify/')) {
        setVerifyRouteId(decodeURIComponent(path.replace('/verify/', '').trim()));
      } else {
        setVerifyRouteId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Public Certificate Verification Route (Works without login)
  if (verifyRouteId) {
    return (
      <PublicVerificationView
        certificateId={verifyRouteId}
        onGoHome={() => {
          window.history.pushState({}, '', '/');
          setVerifyRouteId(null);
          navigateTo(isAuthenticated ? 'dashboard' : 'landing');
        }}
      />
    );
  }

  // Minimal loading screen while resolving initial session to prevent flashing
  if (isLoading) {
    return (
      <div className="min-h-screen neu-bg flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl neu-btn-primary flex items-center justify-center font-bold text-white text-sm animate-pulse">
          DP
        </div>
        <div className="text-xs font-semibold text-gray-500 font-mono tracking-wider">
          Loading DP Quest...
        </div>
      </div>
    );
  }

  // Public Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingView />
        <ProofUploadModal />
      </>
    );
  }

  // Explicit Auth Views
  if (currentView === 'login' || currentView === 'signup' || currentView === 'forgot-password') {
    if (isAuthenticated) {
      return null;
    }

    return (
      <AuthView
        initialMode={currentView === 'signup' ? 'signup' : 'login'}
        onSuccess={() => navigateTo('dashboard')}
        onBackToLanding={() => navigateTo('landing')}
      />
    );
  }

  // Protected Views
  const renderProtectedView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'problems':
        return <ProblemsView />;
      case 'problem-detail':
        return <ProblemDetailView />;
      case 'progress':
        return <ProgressView />;
      case 'certificate':
        return <CertificateView />;
      case 'profile':
        return <ProfileView />;
      case 'completion':
        return <CompletionView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <ProtectedRouteWrapper>
      <div className="min-h-screen neu-bg flex flex-col md:flex-row text-gray-800">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Subtle notice if Supabase credentials are in preview mode */}
          {!isConfigured && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Supabase preview mode: Set <code className="font-mono font-semibold">VITE_SUPABASE_URL</code> & <code className="font-mono font-semibold">VITE_SUPABASE_ANON_KEY</code> in secrets for cloud persistence.
                </span>
              </div>
            </div>
          )}

          {/* Notice if Supabase is connected but SQL schema has not been executed yet */}
          {isConfigured && isSchemaMissing && (
            <div className="bg-sky-500/10 border-b border-sky-500/20 px-4 py-2.5 text-[11px] text-sky-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>
                  Supabase connected: Run <code className="font-mono font-semibold bg-white/60 px-1 py-0.5 rounded">supabase/schema.sql</code> in your Supabase SQL Editor to provision tables. Operating in session mode in the meantime.
                </span>
              </div>
            </div>
          )}

          {/* Mobile Header */}
          <header className="md:hidden neu-bg border-b border-white/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div 
              onClick={() => navigateTo('landing')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg neu-btn-primary flex items-center justify-center font-bold text-white text-xs">
                DP
              </div>
              <span className="font-bold text-sm tracking-tight text-gray-900">
                DP Quest
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="neu-inset-sm px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-gray-800">
                {totalXp} XP
              </div>
              <div className="neu-inset-sm px-2.5 py-1 rounded-lg text-xs font-mono text-gray-600">
                {completedCount}/22
              </div>
            </div>
          </header>

          {/* Scrollable View Area */}
          <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-5xl w-full mx-auto pb-24 md:pb-12">
            {renderProtectedView()}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />

        {/* Screenshot Verification Modal */}
        <ProofUploadModal />
      </div>
    </ProtectedRouteWrapper>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QuestProvider>
        <AppContent />
      </QuestProvider>
    </AuthProvider>
  );
}
