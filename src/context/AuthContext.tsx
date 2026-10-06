import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabaseService } from '../services/supabaseService';
import { DbProfile } from '../types';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  section?: string;
  totalXp: number;
  currentStreak: number;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  signUp: (name: string, email: string, section: string, pass: string, confirmPass: string) => Promise<{ success: boolean; message?: string; email?: string; error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  clearError: () => void;
  updateProfileName: (newName: string) => Promise<boolean>;
  updateProfileDetails: (newName: string, newSection?: string) => Promise<boolean>;
}

const LOCAL_FALLBACK_USER_KEY = 'dp_quest_mock_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();
  const isSigningUpRef = useRef<boolean>(false);

  // Helper to load or create profile for authenticated user
  const loadProfile = async (authId: string, email: string, defaultName: string = 'Quest Explorer', defaultSection?: string, password?: string) => {
    try {
      const profile = await supabaseService.ensureProfile(authId, defaultName, email, defaultSection, password);
      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email || email,
          fullName: profile.full_name || defaultName,
          section: profile.section || defaultSection || undefined,
          totalXp: profile.total_xp || 0,
          currentStreak: profile.current_streak || 1
        });
      } else {
        setUser({
          id: authId,
          email: email,
          fullName: defaultName,
          section: defaultSection || undefined,
          totalXp: 0,
          currentStreak: 1
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setUser({
        id: authId,
        email: email,
        fullName: defaultName,
        section: defaultSection || undefined,
        totalXp: 0,
        currentStreak: 1
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setIsLoading(true);

      if (isConfigured) {
        try {
          const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Session error:', sessionError);
          }

          if (initialSession && initialSession.user) {
            setSession(initialSession);
            const userMetaName = initialSession.user.user_metadata?.full_name || initialSession.user.email?.split('@')[0] || 'User';
            const userMetaSection = initialSession.user.user_metadata?.section;
            await loadProfile(initialSession.user.id, initialSession.user.email || '', userMetaName, userMetaSection);
          } else {
            setSession(null);
            setUser(null);
          }
        } catch (e) {
          console.error('Auth initialization failed:', e);
          setSession(null);
          setUser(null);
        }
      } else {
        // Fallback local mock session support when VITE_SUPABASE_URL isn't set yet
        try {
          const savedMock = localStorage.getItem(LOCAL_FALLBACK_USER_KEY);
          if (savedMock) {
            const parsed = JSON.parse(savedMock);
            setUser(parsed);
          }
        } catch {
          // ignore
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    initAuth();

    // Setup listener
    if (isConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        if (isSigningUpRef.current) {
          // Ignore automatic sign-in event triggered during sign up
          return;
        }
        setSession(newSession);

        if (newSession && newSession.user) {
          const name = newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'User';
          const section = newSession.user.user_metadata?.section;
          await loadProfile(newSession.user.id, newSession.user.email || '', name, section);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isConfigured]);

  const clearError = () => setError(null);

  const signUp = async (name: string, email: string, section: string, pass: string, confirmPass: string) => {
    setError(null);

    // Validation
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSection = section.trim();

    if (!cleanName) {
      const msg = 'Please enter your full name.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (!cleanSection) {
      const msg = 'Please enter your class or section.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (pass.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (pass !== confirmPass) {
      const msg = 'Passwords do not match.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (isConfigured) {
      try {
        isSigningUpRef.current = true;

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: cleanName,
              section: cleanSection
            }
          }
        });

        if (signUpErr) {
          isSigningUpRef.current = false;
          let userMsg = 'Unable to sign up. Please try again.';
          if (signUpErr.message.includes('already registered')) {
            userMsg = 'This email is already registered. Please sign in instead.';
          } else if (signUpErr.message.includes('password')) {
            userMsg = 'Please choose a stronger password.';
          } else {
            userMsg = signUpErr.message;
          }
          setError(userMsg);
          return { success: false, error: userMsg };
        }

        if (data.user) {
          await supabaseService.ensureProfile(data.user.id, cleanName, cleanEmail, cleanSection, pass);
        }

        // Determine if email confirmation is required
        const requiresEmailConfirmation = !data.session;
        const successMessage = requiresEmailConfirmation
          ? 'Account created. Please verify your email, then sign in.'
          : 'Account created successfully. Please sign in to continue.';

        // Sign user out immediately so they are NOT auto-logged in
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        isSigningUpRef.current = false;

        return { 
          success: true, 
          message: successMessage,
          email: cleanEmail 
        };
      } catch (err: any) {
        isSigningUpRef.current = false;
        const msg = err?.message || 'Something went wrong. Please check your connection and try again.';
        setError(msg);
        return { success: false, error: msg };
      }
    } else {
      // Mock signup for preview
      const registeredUsers = JSON.parse(localStorage.getItem('dpquest_demo_registered') || '{}');
      registeredUsers[cleanEmail.toLowerCase()] = {
        fullName: cleanName,
        password: pass
      };
      localStorage.setItem('dpquest_demo_registered', JSON.stringify(registeredUsers));

      // Do NOT set active user!
      setUser(null);
      setSession(null);
      localStorage.removeItem(LOCAL_FALLBACK_USER_KEY);

      return { 
        success: true, 
        message: 'Account created successfully. Please sign in to continue.',
        email: cleanEmail 
      };
    }
  };

  const signIn = async (email: string, pass: string) => {
    setError(null);
    const cleanEmail = email.trim();

    if (!cleanEmail || !pass) {
      const msg = 'Please provide both email and password.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (isConfigured) {
      try {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass
        });

        if (signInErr) {
          let userMsg = 'Invalid email or password.';
          if (signInErr.message.includes('Invalid login credentials')) {
            userMsg = 'Invalid email or password. Please verify your credentials.';
          } else if (signInErr.message.includes('Email not confirmed')) {
            userMsg = 'Please verify your email address before signing in.';
          }
          setError(userMsg);
          return { success: false, error: userMsg };
        }

        if (data.user) {
          const name = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
          await loadProfile(data.user.id, cleanEmail, name, pass);
          return { success: true };
        }

        return { success: true };
      } catch (err) {
        const msg = 'Unable to sign in. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      }
    } else {
      // Mock login for preview
      const registeredUsers = JSON.parse(localStorage.getItem('dpquest_demo_registered') || '{}');
      const registered = registeredUsers[cleanEmail.toLowerCase()];

      if (registered && registered.password !== pass) {
        const msg = 'Invalid email or password. Please verify your credentials.';
        setError(msg);
        return { success: false, error: msg };
      }

      const mockUser: AuthUser = {
        id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        fullName: registered?.fullName || cleanEmail.split('@')[0] || 'User',
        totalXp: 0,
        currentStreak: 1
      };
      setUser(mockUser);
      localStorage.setItem(LOCAL_FALLBACK_USER_KEY, JSON.stringify(mockUser));
      return { success: true };
    }
  };

  const signOut = async () => {
    setError(null);
    if (isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    localStorage.removeItem(LOCAL_FALLBACK_USER_KEY);
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (isConfigured) {
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin
        });

        if (resetErr) {
          const msg = 'Unable to send reset instructions. Please verify your email.';
          setError(msg);
          return { success: false, error: msg };
        }

        return { success: true, message: 'Password reset link sent to your email.' };
      } catch (err) {
        const msg = 'Failed to request password reset. Please try again.';
        setError(msg);
        return { success: false, error: msg };
      }
    } else {
      return { success: true, message: 'Password reset instructions simulated for preview mode.' };
    }
  };

  const updateProfileDetails = async (newName: string, newSection?: string): Promise<boolean> => {
    const cleanName = newName.trim();
    const cleanSection = newSection?.trim() || '';
    if (!cleanName || !user) return false;

    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            full_name: cleanName, 
            section: cleanSection || null,
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id);

        if (!error) {
          // Sync auth user metadata so session reloads retain the updated details
          await supabase.auth.updateUser({
            data: { full_name: cleanName, section: cleanSection }
          }).catch(() => {});

          setUser((prev) => prev ? { ...prev, fullName: cleanName, section: cleanSection || undefined } : null);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    } else {
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, fullName: cleanName, section: cleanSection || undefined };
        localStorage.setItem(LOCAL_FALLBACK_USER_KEY, JSON.stringify(updated));
        return updated;
      });
      return true;
    }
  };

  const updateProfileName = async (newName: string): Promise<boolean> => {
    return updateProfileDetails(newName, user?.section);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        error,
        isConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        clearError,
        updateProfileName,
        updateProfileDetails
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
