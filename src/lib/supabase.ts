import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseHostname = new URL(supabaseUrl).hostname.split('.')[0];

export const SUPABASE_STORAGE_KEY = `sb-${supabaseHostname}-auth-token`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: import.meta.env.DEV,
  },
  global: {
    headers: {
      'X-Client-Info': 'atmo-frontend',
    },
  },
});

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  timezone?: string;
  onboarding_completed: boolean;
  onboarding_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
}
