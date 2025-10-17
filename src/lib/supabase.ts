import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const throwMissingConfigError = (): never => {
  throw new Error(
    'Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable workspace features.',
  );
};

const createFailingProxy = (): SupabaseClient<any, 'public', any> => {
  const proxyFactory = () =>
    new Proxy(() => throwMissingConfigError(), {
      apply: () => throwMissingConfigError(),
      get: () => proxyFactory(),
    });

  return proxyFactory() as unknown as SupabaseClient<any, 'public', any>;
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Supabase] Environment variables not set. Features depending on Supabase will remain disabled until configuration is provided.',
  );
}

const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'local';

export const SUPABASE_STORAGE_KEY = `sb-${supabaseHostname}-auth-token`;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
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
    })
  : createFailingProxy();

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
