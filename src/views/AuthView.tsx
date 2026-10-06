import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onSuccess,
  onBackToLanding
}) => {
  const { signIn, signUp, resetPassword, error, clearError, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleTabChange = (newMode: 'login' | 'signup') => {
    clearError();
    setSuccessNotice(null);
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const res = await signUp(name, email, section, password, confirmPassword);
        if (res.success) {
          // Switch to Sign In mode - DO NOT automatically log in or redirect to dashboard
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setName('');
          setSection('');
          if (res.email) {
            setEmail(res.email);
          }
          setSuccessNotice(res.message || 'Account created successfully. Please sign in to continue.');
        }
      } else if (mode === 'login') {
        const res = await signIn(email, password);
        if (res.success) {
          onSuccess();
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(email);
        if (res.success) {
          setSuccessNotice(res.message || 'Check your email for the reset instructions.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen neu-bg flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-slate-300">
      {/* Back Link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center px-1">
        <button
          onClick={onBackToLanding}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to DP Quest
        </button>

        {!isConfigured && (
          <span className="text-[10px] font-mono text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">
            Preview Mode
          </span>
        )}
      </div>

      <NeumorphicCard variant="raised" className="w-full max-w-md p-7 sm:p-9 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl neu-btn-primary mx-auto flex items-center justify-center font-bold text-white text-sm shadow-sm">
            DP
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {mode === 'login' && 'Sign in to DP Quest'}
            {mode === 'signup' && 'Create your Account'}
            {mode === 'forgot' && 'Reset your Password'}
          </h1>
          <p className="text-xs text-gray-500">
            {mode === 'login' && 'Continue your Dynamic Programming progress.'}
            {mode === 'signup' && 'Track all 22 DP problems and earn your certificate.'}
            {mode === 'forgot' && "Enter your email to receive recovery instructions."}
          </p>
        </div>

        {/* Tab switcher (Login / Signup) */}
        {mode !== 'forgot' && (
          <div className="flex p-1 rounded-2xl neu-inset">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'login'
                  ? 'neu-raised-sm text-gray-900 font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'neu-raised-sm text-gray-900 font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Status Banners */}
        {error && (
          <div className="p-3.5 rounded-xl neu-inset text-xs text-rose-700 font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-xl neu-inset text-xs text-emerald-700 font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl neu-inset-sm text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-[#EBECF0]"
                  />
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
                  Class / Section
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 41, 42"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl neu-inset-sm text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-[#EBECF0]"
                  />
                  <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl neu-inset-sm text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-[#EBECF0]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setSuccessNotice(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-gray-500 hover:text-gray-900 font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl neu-inset-sm text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-[#EBECF0]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl neu-inset-sm text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-[#EBECF0]"
                />
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <NeumorphicButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full"
              icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting
                ? 'Processing...'
                : mode === 'signup'
                ? 'Create Account'
                : mode === 'login'
                ? 'Sign In'
                : 'Send Reset Link'}
            </NeumorphicButton>
          </div>
        </form>

        {mode === 'forgot' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                clearError();
                setSuccessNotice(null);
                setMode('login');
              }}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </NeumorphicCard>

      {/* Clean helper footer */}
      <div className="mt-8 text-center text-[11px] text-gray-400 font-mono">
        Secured by Supabase Authentication · Session Persistence Enabled
      </div>
    </div>
  );
};
