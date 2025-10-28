import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Session, User, AuthError, PostgrestError } from '@supabase/supabase-js';
import { supabase, UserProfile, SUPABASE_STORAGE_KEY, isSupabaseConfigured } from '@/lib/supabase';
import { PROFILE_SCHEMA_VERSION, ProfileDraft } from '@/types/profile';
import SupabaseConfigurationError from '@/components/organisms/SupabaseConfigurationError';
import { Focus } from '@/models/Focus';
import { JobTitle } from '@/models/JobTitle';

// Demo Auth Provider for development without Supabase
const DemoAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hydratedProfile, setHydratedProfile] = useState({
    id: 'demo-user',
    iam: 'demo-user',
    email: 'demo@example.com',
    nickname: 'ATMO Explorer',
    onboarding_completed: true,
    focus: Focus.ProjectExecution,
    job_title: JobTitle.Developer,
    avatar_url: null,
    professional_role: 'Builder',
    bio: 'Demo user for development',
    location: '',
    website: '',
    company: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    aiPreferences: 'detailed',
    communicationStyle: 'detailed',
    focusAreas: [],
    mainPriority: '',
  });
  const [initializing] = useState(false);
  const [profileLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Demo login function that simulates successful authentication
  const demoSignIn = async (email: string, password: string) => {
    console.log('🔐 Demo login attempt:', email);
    
    // Simulate a brief loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a mock session and user
    const mockSession = {
      access_token: 'demo-token',
      refresh_token: 'demo-refresh-token',
      expires_at: Date.now() + 3600000, // 1 hour
      user: {
        id: 'demo-user',
        email: email,
        created_at: new Date().toISOString(),
      }
    };
    
    const mockUser = {
      id: 'demo-user',
      email: email,
      created_at: new Date().toISOString(),
    };
    
    // Create a mock profile that matches the expected structure
    const mockProfile = {
      id: 'demo-user',
      email: email,
      display_name: 'ATMO Explorer',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      onboarding_completed: true,
      onboarding_data: {
        personal: {
          nickname: 'ATMO Explorer',
          preferredName: 'ATMO Explorer',
          bio: 'Demo user for development'
        },
        work: {
          role: 'Builder',
          company: 'ATMO',
          focusAreas: ['Development', 'Design', 'Product Management']
        },
        performance: {
          northStar: 'Build amazing products',
          weeklyCommitment: 'Focus on user experience'
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
    };
    
    setSession(mockSession);
    setUser(mockUser);
    setProfile(mockProfile);
    setHydratedProfile({
      id: 'demo-user',
      iam: 'demo-user',
      email: email,
      nickname: 'ATMO Explorer',
      onboarding_completed: true,
      focus: Focus.ProjectExecution,
      job_title: JobTitle.Developer,
      avatar_url: null,
      professional_role: 'Builder',
      bio: 'Demo user for development',
      location: '',
      website: '',
      company: 'ATMO',
      phone: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      aiPreferences: 'detailed',
      communicationStyle: 'detailed',
      focusAreas: ['Development', 'Design', 'Product Management'],
      mainPriority: 'Build amazing products',
    });
    setLastError(null);
    
    console.log('✅ Demo login successful');
    return {}; // No error
  };

  // Demo signup function
  const demoSignUp = async (email: string, password: string) => {
    console.log('📝 Demo signup attempt:', email);
    
    // Simulate a brief loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo, just redirect to login
    return demoSignIn(email, password);
  };

  // Demo signout function
  const demoSignOut = async () => {
    console.log('🚪 Demo signout');
    setSession(null);
    setUser(null);
    setProfile(null);
    setHydratedProfile(null);
  };

  // Demo profile update function
  const demoUpdateProfile = async (updates: any) => {
    console.log('👤 Demo profile update:', updates);
    setHydratedProfile(prev => ({ ...prev, ...updates }));
    return {}; // No error
  };

  // Demo onboarding completion function
  const demoCompleteOnboarding = async (data: any) => {
    console.log('🎯 Demo onboarding completion:', data);
    setHydratedProfile(prev => ({ ...prev, onboarding_completed: true, ...data }));
    return {}; // No error
  };

  const authContextValue = {
    session,
    user,
    profile,
    hydratedProfile,
    initializing,
    profileLoading,
    lastError,
    signUp: demoSignUp,
    signIn: demoSignIn,
    signOut: demoSignOut,
    updateProfile: demoUpdateProfile,
    completeOnboarding: demoCompleteOnboarding,
    requestPasswordReset: async () => ({ error: 'Demo mode - password reset not available' }),
    refreshProfile: async () => {},
    clearError: () => setLastError(null),
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

interface BasicProfileUpdates {
  display_name?: string;
  timezone?: string;
  onboarding_data?: Record<string, unknown> | null;
  avatar_url?: string | null;
}

interface CompleteOnboardingPayload {
  display_name: string;
  timezone?: string;
  onboarding_data?: Record<string, unknown>;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  hydratedProfile: HydratedProfile | null;
  initializing: boolean;
  profileLoading: boolean;
  lastError: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    profilePayload?: { display_name?: string }
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: BasicProfileUpdates) => Promise<{ error?: string }>;
  completeOnboarding: (payload: CompleteOnboardingPayload) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

export interface HydratedProfile {
  id: string;
  email: string;
  display_name: string;
  timezone?: string;
  onboarding_completed: boolean;
  onboarding_data: Record<string, unknown>;
  nickname?: string;
  preferredName?: string;
  job_title?: string;
  focus?: string;
  focusAreas?: string[];
  mainPriority?: string;
  assistantTone?: string;
  workStyle?: string;
  checkInFrequency?: string;
  avatar_url?: string | null;
  company?: string;
  bio?: string;
  // Additional properties for compatibility with useMockAuth
  iam?: string;
  professional_role?: string;
  location?: string;
  website?: string;
  phone?: string;
  aiPreferences?: string;
  communicationStyle?: string;
}

type RawOnboardingData = {
  nickname?: string;
  displayName?: string;
  job_title?: string;
  jobTitle?: string;
  focus?: string;
  primaryFocus?: string;
  assistantTone?: string;
  communicationStyle?: string;
  workStyle?: string;
  aiPreferences?: string;
  checkInFrequency?: string;
  company?: string;
  bio?: string;
  avatar_url?: string;
  avatarUrl?: string;
  warmup?: {
    mentalWeight?: string;
    successIndicator?: string;
  };
  identity?: {
    role?: string;
    company?: string;
    mainProject?: string;
    secondaryProjects?: string;
    dueDate?: string;
    purpose?: string;
  };
  metrics?: {
    kpis?: string[];
    weeklyMicroGoal?: string;
  };
  values?: {
    keywords?: string[];
    inspirations?: string;
  };
  [key: string]: unknown;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const clearSupabaseSessionCache = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SUPABASE_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear Supabase session cache', error);
  }
};

const sanitizeSupabaseSessionCache = () => {
  if (typeof window === 'undefined') return;
  try {
    const stored = window.localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (!stored) return;

    // Supabase expects a JSON object, legacy code may have stored raw strings
    if (stored === 'undefined' || stored === 'null' || stored.trim() === '') {
      clearSupabaseSessionCache();
      return;
    }

    JSON.parse(stored);
  } catch (error) {
    console.warn('Detected corrupted Supabase session cache. Clearing it now.', error);
    clearSupabaseSessionCache();
  }
};

const transformProfile = (profile: UserProfile | null): HydratedProfile | null => {
  if (!profile) return null;
  const data: RawOnboardingData = (profile.onboarding_data ?? {}) as RawOnboardingData;

  const modern = data as Partial<ProfileDraft> & { profileSchemaVersion?: string };

  if (modern.profileSchemaVersion === PROFILE_SCHEMA_VERSION) {
    const personal = modern.personal ?? {};
    const work = modern.work ?? {};
    const performance = modern.performance ?? {};
    const focusAreas = Array.isArray(work.focusAreas)
      ? work.focusAreas.filter((entry) => typeof entry === 'string' && entry.trim())
      : undefined;
    const mainPriority = (performance.northStar || performance.weeklyCommitment)?.trim() || undefined;
    const fallbackName =
      profile.display_name || personal.preferredName || personal.nickname || profile.email;

    return {
      id: profile.id,
      email: profile.email,
      display_name: fallbackName.trim(),
      timezone: profile.timezone,
      onboarding_completed: profile.onboarding_completed,
      onboarding_data: data,
      nickname: personal.nickname ?? personal.preferredName ?? fallbackName,
      preferredName: personal.preferredName ?? personal.nickname ?? fallbackName,
      job_title: work.role,
      focus: work.mainProject,
      focusAreas,
      mainPriority,
      assistantTone: (data.assistantTone as string | undefined) ?? undefined,
      workStyle: (data.workStyle as string | undefined) ?? undefined,
      checkInFrequency: data.checkInFrequency,
      avatar_url: profile.avatar_url,
      company: work.company,
      bio: personal.bio || (data.bio as string | undefined),
      // Additional properties for compatibility
      iam: profile.id,
      professional_role: work.role,
      location: personal.location as string | undefined,
      website: connections.website as string | undefined,
      phone: personal.phone as string | undefined,
      aiPreferences: (data.aiPreferences as string | undefined) ?? undefined,
      communicationStyle: (data.assistantTone as string | undefined) ?? undefined,
    };
  }

  const displayNameCandidate =
    profile.display_name || data.nickname || data.displayName || profile.email;

  const warmup = data.warmup ?? {};
  const identity = data.identity ?? {};
  const metrics = data.metrics ?? {};
  const values = data.values ?? {};

  const derivedFocusAreas = Array.isArray(values?.keywords)
    ? (values?.keywords as string[]).filter((keyword) => keyword && keyword.trim())
    : undefined;

  const primarySignal = typeof warmup?.successIndicator === 'string' ? warmup.successIndicator.trim() : '';
  const secondarySignal =
    typeof metrics?.weeklyMicroGoal === 'string' ? metrics.weeklyMicroGoal.trim() : '';
  const derivedMainPriority = primarySignal || secondarySignal || undefined;

  return {
    id: profile.id,
    email: profile.email,
    display_name: (displayNameCandidate as string).trim() || profile.email,
    timezone: profile.timezone ?? data.timezone,
    onboarding_completed: profile.onboarding_completed,
    onboarding_data: data,
    nickname: data.nickname ?? displayNameCandidate,
    preferredName: data.preferredName ?? data.nickname ?? displayNameCandidate,
    job_title: identity?.role ?? data.job_title ?? data.jobTitle,
    focus: identity?.mainProject ?? data.focus ?? data.primaryFocus,
    focusAreas: derivedFocusAreas,
    mainPriority: derivedMainPriority,
    assistantTone: data.assistantTone ?? data.communicationStyle,
    workStyle: data.workStyle ?? data.aiPreferences,
    checkInFrequency: data.checkInFrequency,
    avatar_url: profile.avatar_url ?? data.avatar_url ?? data.avatarUrl ?? null,
    company: identity?.company ?? data.company,
    bio: data.bio,
    // Additional properties for compatibility
    iam: profile.id,
    professional_role: identity?.role ?? data.job_title ?? data.jobTitle,
    location: data.location as string | undefined,
    website: data.website as string | undefined,
    phone: data.phone as string | undefined,
    aiPreferences: data.workStyle ?? data.aiPreferences,
    communicationStyle: data.assistantTone ?? data.communicationStyle,
  };
};

const mapAuthError = (error: AuthError | PostgrestError | Error): string => {
  const message = error.message || 'Unexpected authentication error';
  if ('code' in error) {
    if (error.code === '23505') return 'Email already registered. Try logging in.';
    if (error.code === '42501') return 'Permission denied. Please contact support.';
  }

  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login')) return 'Invalid email or password.';
  if (normalized.includes('invalid credentials')) return 'Invalid email or password.';
  if (normalized.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (normalized.includes('already registered')) return 'Email already registered. Try logging in.';
  if (normalized.includes('rate limit')) return 'Too many attempts. Please wait a moment.';
  return message;
};

const createFallbackProfile = (targetUser: User | null): UserProfile | null => {
  if (!targetUser) return null;
  const fallbackName = targetUser.email ?? 'ATMO Explorer';
  const now = new Date().toISOString();
  return {
    id: targetUser.id,
    email: targetUser.email ?? 'unknown@user',
    display_name: fallbackName,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    onboarding_completed: false,
    onboarding_data: {},
    created_at: now,
    updated_at: now,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // For development, allow demo mode even without Supabase configuration
  if (!isSupabaseConfigured && import.meta.env.DEV) {
    console.warn('[AuthProvider] Running in demo mode - Supabase features disabled');
    // Return a demo auth provider that works without Supabase
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }
  
  // Check Supabase configuration early and show error if not configured
  if (!isSupabaseConfigured) {
    return <SupabaseConfigurationError />;
  }

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hydratedProfile, setHydratedProfile] = useState<HydratedProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const initialFetchRef = useRef(false);
  const fetchingProfileRef = useRef(false);

  const clearError = useCallback(() => setLastError(null), []);

  const applyProfile = useCallback((incoming: UserProfile | null) => {
    setProfile(incoming);
    setHydratedProfile(transformProfile(incoming));
  }, []);

  const fetchProfile = useCallback(
    async (targetUser: User | null) => {
      if (!targetUser) {
        applyProfile(null);
        return;
      }

      // Prevent multiple simultaneous fetch calls
      if (fetchingProfileRef.current) {
        console.debug('[AuthContext] fetchProfile already in progress, skipping');
        return;
      }

      // Skip loading state if we already have a profile for this user (silent background refresh)
      const hasExistingProfile = profile?.id === targetUser.id;

      fetchingProfileRef.current = true;
      
      // Only show loading spinner on initial fetch, not on background refreshes
      if (!hasExistingProfile) {
        setProfileLoading(true);
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUser.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (!data) {
          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: targetUser.id,
              email: targetUser.email,
              onboarding_completed: false,
            })
            .select('*')
            .single();

          if (insertError) {
            throw insertError;
          }

          applyProfile(inserted);
          return;
        }

        applyProfile(data);
      } catch (error: unknown) {
        console.error('Failed to load profile', error);

        // If 403/permission error, the session is invalid - sign out
        const err = error as any;
        if (err?.code === '42501' || err?.message?.includes('403') || err?.message?.includes('permission')) {
          console.warn('Permission denied fetching profile - clearing session');
          await supabase.auth.signOut();
          applyProfile(null);
          setSession(null);
          setUser(null);
          setProfileLoading(false);
          fetchingProfileRef.current = false;
          return;
        }

        const friendly = mapAuthError(error as AuthError | PostgrestError | Error);
        setLastError(friendly);
        
        // Only create fallback if we don't have an existing profile (keep stale data on error)
        if (!profile) {
          applyProfile(createFallbackProfile(targetUser));
        }
      } finally {
        // Always clean up loading state and fetch guard
        setProfileLoading(false);
        fetchingProfileRef.current = false;
      }
    },
    [applyProfile, profile]
  );

  const refreshProfile = useCallback(async () => {
    await fetchProfile(user);
  }, [fetchProfile, user]);

  useEffect(() => {
    const init = async () => {
      if (initialFetchRef.current) return;
      initialFetchRef.current = true;

      sanitizeSupabaseSessionCache();

      const resolveSession = async (allowRetry: boolean) => {
        try {
          const {
            data: { session: initialSession },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          await fetchProfile(initialSession?.user ?? null);
        } catch (error) {
          if (allowRetry) {
            clearSupabaseSessionCache();
            await resolveSession(false);
            return;
          }

          console.error('Unable to resolve Supabase session', error);
          setLastError(mapAuthError(error as AuthError | PostgrestError | Error));
          setSession(null);
          setUser(null);
          setProfileLoading(false);
          applyProfile(null);
        } finally {
          setInitializing(false);
        }
      };

      await resolveSession(true);
    };

    init();

    let debounceTimer: NodeJS.Timeout | null = null;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        // Debounce to prevent infinite loops
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(async () => {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);

          if (event === 'INITIAL_SESSION') {
            return;
          }

          if (event === 'SIGNED_OUT') {
            clearSupabaseSessionCache();
            applyProfile(null);
            setProfileLoading(false);
            setInitializing(false);
            return;
          }

          try {
            await fetchProfile(nextSession?.user ?? null);
          } catch (error) {
            console.error('Failed to refresh profile after auth change', error);
            setLastError(mapAuthError(error as AuthError | PostgrestError | Error));
          } finally {
            setInitializing(false);
          }
        }, 300); // 300ms debounce
      }
    );

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile, applyProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        clearError();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const friendly = mapAuthError(error);
          setLastError(friendly);
          return { error: friendly };
        }

        setSession(data.session ?? null);
        setUser(data.user ?? null);
        await fetchProfile(data.user ?? null);
        return {};
      } catch (error) {
        const friendly = mapAuthError(error as Error);
        setLastError(friendly);
        return { error: friendly };
      }
    },
    [fetchProfile, clearError]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      profilePayload?: { display_name?: string }
    ) => {
      try {
        clearError();
        const redirectUrl =
          import.meta.env.VITE_SUPABASE_REDIRECT_URL ??
          (typeof window !== 'undefined'
            ? `${window.location.origin}/auth/login?verified=true`
            : undefined);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: profilePayload,
          },
        });

        if (error) {
          const friendly = mapAuthError(error);
          setLastError(friendly);
          return { error: friendly };
        }

        const newUser = data.user ?? null;
        setSession(data.session ?? null);
        setUser(newUser);

        if (newUser && data.session) {
          await fetchProfile(newUser);

          if (profilePayload?.display_name) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                display_name: profilePayload.display_name,
                onboarding_data: {
                  nickname: profilePayload.display_name,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', newUser.id);

            if (updateError) {
              const friendly = mapAuthError(updateError);
              setLastError(friendly);
              return { error: friendly };
            }

            await fetchProfile(newUser);
          }
        }

        const needsConfirmation = !data.session;
        return { needsConfirmation };
      } catch (error) {
        const friendly = mapAuthError(error as Error);
        setLastError(friendly);
        return { error: friendly };
      }
    },
    [fetchProfile, clearError]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    applyProfile(null);
  }, [applyProfile]);

  const mergeOnboardingData = useCallback(
    (incoming: Record<string, unknown>) => {
      const current = (profile?.onboarding_data ?? {}) as Record<string, unknown>;
      const candidate = incoming as { profileSchemaVersion?: unknown };
      if (candidate.profileSchemaVersion === PROFILE_SCHEMA_VERSION) {
        return incoming;
      }
      return { ...current, ...incoming };
    },
    [profile]
  );

  const updateProfile = useCallback(
    async (updates: BasicProfileUpdates) => {
      if (!user) return { error: 'Not authenticated' };

      try {
        const payload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (typeof updates.display_name === 'string') {
          payload.display_name = updates.display_name;
        }
        if (typeof updates.timezone === 'string') {
          payload.timezone = updates.timezone;
        }
        if (updates.onboarding_data) {
          payload.onboarding_data = mergeOnboardingData(updates.onboarding_data);
        }
        if (typeof updates.avatar_url === 'string' || updates.avatar_url === null) {
          payload.avatar_url = updates.avatar_url;
        }

        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', user.id);

        if (error) {
          const friendly = mapAuthError(error);
          setLastError(friendly);
          return { error: friendly };
        }

        await fetchProfile(user);
        return {};
      } catch (error) {
        const friendly = mapAuthError(error as Error);
        setLastError(friendly);
        return { error: friendly };
      }
    },
    [user, fetchProfile, mergeOnboardingData]
  );

  const completeOnboarding = useCallback(
    async ({ display_name, timezone, onboarding_data }: CompleteOnboardingPayload) => {
      if (!user) return { error: 'Not authenticated' };

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name,
            timezone,
            onboarding_data: mergeOnboardingData(onboarding_data ?? {}),
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          const friendly = mapAuthError(error);
          setLastError(friendly);
          return { error: friendly };
        }

        await fetchProfile(user);
        return {};
      } catch (error) {
        const friendly = mapAuthError(error as Error);
        setLastError(friendly);
        return { error: friendly };
      }
    },
    [user, fetchProfile, mergeOnboardingData]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      clearError();
      const redirectTo =
        import.meta.env.VITE_SUPABASE_REDIRECT_URL ??
        (typeof window !== 'undefined'
          ? `${window.location.origin}/auth/login`
          : undefined);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        const friendly = mapAuthError(error);
        setLastError(friendly);
        return { error: friendly };
      }

      return {};
    } catch (error) {
      const friendly = mapAuthError(error as Error);
      setLastError(friendly);
      return { error: friendly };
    }
  }, [clearError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      hydratedProfile,
      initializing,
      profileLoading,
      lastError,
      clearError,
      signIn,
      signUp,
      signOut,
      updateProfile,
      completeOnboarding,
      requestPasswordReset,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      hydratedProfile,
      initializing,
      profileLoading,
      lastError,
      clearError,
      signIn,
      signUp,
      signOut,
      updateProfile,
      completeOnboarding,
      requestPasswordReset,
      refreshProfile,
    ]
  );

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[AuthProvider]', {
        initializing,
        profileLoading,
        session: !!session,
        profile: !!profile,
        hydratedProfile: !!hydratedProfile,
      });
    }
  }, [initializing, profileLoading, session, profile, hydratedProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
};
