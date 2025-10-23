import { useMemo, useEffect } from 'react';
import { useAuth as useAuthContext } from '@/hooks/useAuth';
import { Focus } from '@/models/Focus';
import { JobTitle } from '@/models/JobTitle';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { PROFILE_SCHEMA_VERSION } from '@/types/profile';

export interface LegacyUserProfile {
  id: string;
  nickname: string;
  preferredName?: string;
  email: string;
  iam: string;
  onboarding_completed: boolean;
  professional_role?: string;
  bio?: string;
  focus: Focus;
  job_title: JobTitle;
  avatar_url?: string | null;
  location?: string;
  website?: string;
  company?: string;
  phone?: string;
  timezone?: string;
  aiPreferences?: string;
  communicationStyle?: string;
  focusAreas?: string[];
  mainPriority?: string;
}

const defaultProfile: LegacyUserProfile = {
  id: 'demo-user',
  iam: 'demo-user',
  email: 'demo@example.com',
  nickname: 'ATMO Explorer',
  onboarding_completed: false,
  focus: Focus.ProjectExecution,
  job_title: JobTitle.Developer,
  avatar_url: null,
  professional_role: 'Builder',
  bio: '',
  location: '',
  website: '',
  company: '',
  phone: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  aiPreferences: 'detailed',
  communicationStyle: 'detailed',
  focusAreas: [],
  mainPriority: '',
};

const mapRoleToJobTitle = (role: string | undefined): JobTitle => {
  if (!role) return JobTitle.Other;
  const normalized = role.trim().toLowerCase();
  if (normalized.includes('founder') || normalized.includes('ceo')) return JobTitle.Executive;
  if (normalized.includes('manager')) return JobTitle.Manager;
  if (normalized.includes('product')) return JobTitle.Manager;
  if (normalized.includes('designer')) return JobTitle.Creator;
  if (normalized.includes('writer') || normalized.includes('marketer')) return JobTitle.Creator;
  if (normalized.includes('developer') || normalized.includes('engineer')) return JobTitle.Developer;
  if (normalized.includes('student')) return JobTitle.Student;
  return JobTitle.Other;
};

const mapProfile = (
  hydratedProfile: ReturnType<typeof useAuthContext>['hydratedProfile'] | null
): LegacyUserProfile | null => {
  if (!hydratedProfile) return null;
  const data = (hydratedProfile.onboarding_data ?? {}) as Record<string, unknown>;
  const schemaVersion = (data as { profileSchemaVersion?: unknown }).profileSchemaVersion;

  if (schemaVersion === PROFILE_SCHEMA_VERSION) {
    const personal = (data.personal as Record<string, unknown>) ?? {};
    const work = (data.work as Record<string, unknown>) ?? {};
    const performance = (data.performance as Record<string, unknown>) ?? {};
    const connections = (data.connections as Record<string, unknown>) ?? {};

    const nickname = typeof personal.nickname === 'string' && personal.nickname.trim()
      ? personal.nickname.trim()
      : hydratedProfile.display_name || hydratedProfile.email.split('@')[0];

    const preferredName = typeof personal.preferredName === 'string' && personal.preferredName.trim()
      ? personal.preferredName.trim()
      : nickname;

    const role = typeof work.role === 'string' ? work.role : undefined;
    const focusAreas = Array.isArray(work.focusAreas)
      ? work.focusAreas.filter((item) => typeof item === 'string' && item.trim()).map((item) => (item as string).trim())
      : [];

    return {
      id: hydratedProfile.id,
      iam: hydratedProfile.id,
      email: hydratedProfile.email,
      nickname,
      preferredName,
      onboarding_completed: hydratedProfile.onboarding_completed,
      professional_role: role,
      bio: typeof personal.bio === 'string' ? personal.bio : undefined,
      focus: defaultProfile.focus,
      job_title: mapRoleToJobTitle(role),
      avatar_url: hydratedProfile.avatar_url,
      location: hydratedProfile.onboarding_data?.location as string | undefined,
      website: typeof connections.website === 'string' ? connections.website : undefined,
      company: typeof work.company === 'string' ? work.company : undefined,
      phone: hydratedProfile.onboarding_data?.phone as string | undefined,
      timezone: hydratedProfile.timezone || defaultProfile.timezone,
      aiPreferences: hydratedProfile.onboarding_data?.aiPreferences as string | undefined,
      communicationStyle: hydratedProfile.onboarding_data?.assistantTone as string | undefined,
      focusAreas,
      mainPriority: typeof performance.northStar === 'string' ? performance.northStar : undefined,
    };
  }

  const identity = data.identity as
    | {
        role?: string;
        company?: string;
        mainProject?: string;
        secondaryProjects?: string;
        dueDate?: string;
        purpose?: string;
      }
    | undefined;
  const values = data.values as
    | {
        keywords?: string[];
        inspirations?: string;
      }
    | undefined;

  const derivedKeywords = Array.isArray(values?.keywords)
    ? values!.keywords!.filter((keyword) => keyword && keyword.trim())
    : [];

  return {
    id: hydratedProfile.id,
    iam: hydratedProfile.id,
    email: hydratedProfile.email,
    nickname:
      (data.nickname as string) ||
      hydratedProfile.display_name ||
      hydratedProfile.email.split('@')[0],
    preferredName: data.preferredName as string,
    onboarding_completed: hydratedProfile.onboarding_completed,
    professional_role: identity?.role || (data.job_title as string) || (data.jobTitle as string),
    bio: data.bio as string | undefined,
    focus: defaultProfile.focus,
    job_title: mapRoleToJobTitle(identity?.role || (data.job_title as string) || undefined),
    avatar_url: hydratedProfile.avatar_url ?? (data.avatar_url as string | null) ?? (data.avatarUrl as string | null) ?? null,
    location: data.location as string | undefined,
    website: data.website as string | undefined,
    company: identity?.company || (data.company as string | undefined),
    phone: data.phone as string | undefined,
    timezone: hydratedProfile.timezone || defaultProfile.timezone,
    aiPreferences: (data.workStyle as string | undefined) || (data.aiPreferences as string | undefined) || defaultProfile.aiPreferences,
    communicationStyle:
      (data.assistantTone as string | undefined) ||
      (data.communicationStyle as string | undefined) ||
      defaultProfile.communicationStyle,
    focusAreas: derivedKeywords,
    mainPriority:
      (data.warmup as { successIndicator?: string } | undefined)?.successIndicator?.trim() ||
      (data.metrics as { weeklyMicroGoal?: string } | undefined)?.weeklyMicroGoal?.trim() ||
      defaultProfile.mainPriority,
  };
};

export const useMockAuth = () => {
  const auth = useAuthContext();

  const userProfile = useMemo(() => {
    const mapped = mapProfile(auth.hydratedProfile);
    return mapped || (auth.session ? defaultProfile : null);
  }, [auth.session, auth.hydratedProfile]);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔄 [${timestamp}] [useMockAuth] syncWithProfile called`, {
      hasProfile: !!userProfile,
      profileId: userProfile?.id,
    });
    usePersonasStore.getState().syncWithProfile(userProfile);

    // Force workspace fetch when user profile becomes available
    if (userProfile?.id) {
      console.log(`📥 [${timestamp}] [useMockAuth] Triggering workspace fetch for user:`, userProfile.id);
      usePersonasStore.getState().fetchPersonaByIam(null, userProfile.id, false);
    }
  }, [userProfile]);

  return {
    user: userProfile,
    loading: auth.initializing || auth.profileLoading,
    error: auth.lastError,
    token: auth.session?.access_token ?? null,
    signUp: auth.signUp,
    signIn: auth.signIn,
    signOut: auth.signOut,
    updateUserProfile: auth.updateProfile,
    completeOnboarding: auth.completeOnboarding,
    isOnboardingCompleted: () => auth.hydratedProfile?.onboarding_completed ?? false,
    getManagementUrl: () => '',
    setUser: () => undefined,
    handleAuthCallbackResponse: async () => undefined,
  };
};

export default useMockAuth;
