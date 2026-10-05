import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
    return false;
  }
  try {
    new URL(supabaseUrl);
    return true;
  } catch {
    return false;
  }
};

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  });
}

// Export client instance or dummy client for fallback resilience
export const supabase = clientInstance || createClient(
  'https://placeholder-project.supabase.co',
  'placeholder-anon-key-prevent-crash',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
