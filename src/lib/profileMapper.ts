import { UserProfile } from '@/lib/supabase';
import {
  ProfileDraft,
  ProfileDraftSchema,
  PROFILE_SCHEMA_VERSION,
  createDefaultProfileDraft,
  createEmptyHabit,
  createEmptyMetric,
} from '@/types/profile';

const ensureFilledArray = <T>(incoming: T[] | undefined, length: number, factory: () => T): T[] => {
  const actual: T[] = Array.isArray(incoming) ? incoming.filter((item) => item !== undefined && item !== null) : [];
  const copy = [...actual];
  while (copy.length < length) {
    copy.push(factory());
  }
  return copy.slice(0, length);
};

const sanitizeString = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const sanitizeNumberInRange = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(numeric) && numeric >= min && numeric <= max) {
    return Math.round(numeric);
  }
  return fallback;
};

type LegacyOnboardingData = {
  nickname?: string;
  preferredName?: string;
  headline?: string;
  bio?: string;
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
  habits?: {
    items?: Array<{
      name?: string;
      frequency?: string;
      focusHours?: string;
    }>;
  };
  wellness?: {
    averageSleep?: string;
    energy?: number;
    stress?: number;
  };
  values?: {
    keywords?: string[];
    inspirations?: string;
  };
  connections?: {
    linkedinUrl?: string;
    shouldConnect?: boolean;
    website?: string;
    calendly?: string;
  };
  files?: {
    uploadName?: string;
    uploadType?: string;
    uploadData?: string;
  };
  profileSchemaVersion?: string;
  personal?: ProfileDraft['personal'];
  work?: ProfileDraft['work'];
  performance?: ProfileDraft['performance'];
  rituals?: ProfileDraft['rituals'];
  wellness?: ProfileDraft['wellness'];
  connections_new?: ProfileDraft['connections'];
  connections?: ProfileDraft['connections'] | LegacyOnboardingData['connections'];
  documents?: ProfileDraft['documents'];
  meta?: ProfileDraft['meta'];
};

const parseFocusAreas = (keywords: unknown): string[] => {
  if (!Array.isArray(keywords)) return [];
  return keywords
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
};

const splitSecondaryProjects = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const coerceResume = (value: unknown): ProfileDraft['documents']['resume'] => {
  if (!value || typeof value !== 'object') return null;
  const { uploadName, uploadType, uploadData, name, mimeType, dataUrl } = value as Record<string, unknown>;
  const derivedName = sanitizeString(name ?? uploadName);
  const derivedType = sanitizeString(mimeType ?? uploadType);
  const derivedData = sanitizeString(dataUrl ?? uploadData);
  if (!derivedName || !derivedType || !derivedData) return null;
  return {
    name: derivedName,
    mimeType: derivedType,
    dataUrl: derivedData,
  };
};

export const mapProfileToDraft = (profile: UserProfile): ProfileDraft => {
  const displayName = sanitizeString(profile.display_name ?? profile.email ?? 'ATMO Explorer', 'ATMO Explorer');
  const timezone = sanitizeString(
    profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const baseDraft = createDefaultProfileDraft({
    id: profile.id,
    email: profile.email,
    displayName,
    timezone,
  });
  baseDraft.account.avatarUrl = profile.avatar_url ?? null;
  const updatedAt =
    (typeof profile.updated_at === 'string' && profile.updated_at.trim())
      ? profile.updated_at
      : (typeof profile.created_at === 'string' && profile.created_at.trim())
        ? profile.created_at
        : profile.id;
  baseDraft.meta.lastSyncedAt = updatedAt;

  const data = (profile.onboarding_data ?? {}) as LegacyOnboardingData;

  if (data.profileSchemaVersion === PROFILE_SCHEMA_VERSION) {
    try {
      const parsed = ProfileDraftSchema.parse({
        schemaVersion: PROFILE_SCHEMA_VERSION,
        account: {
          ...baseDraft.account,
          avatarUrl: profile.avatar_url ?? baseDraft.account.avatarUrl,
        },
        personal: {
          ...baseDraft.personal,
          ...(data.personal ?? {}),
        },
        work: {
          ...baseDraft.work,
          ...(data.work ?? {}),
        },
        performance: {
          ...baseDraft.performance,
          ...(data.performance ?? {}),
        },
        rituals: {
          ...baseDraft.rituals,
          ...(data.rituals ?? {}),
        },
        wellness: {
          ...baseDraft.wellness,
          ...(data.wellness ?? {}),
        },
        connections: {
          ...baseDraft.connections,
          ...((data.connections as ProfileDraft['connections']) ?? {}),
        },
        documents: {
          ...baseDraft.documents,
          ...(data.documents ?? {}),
        },
        meta: {
          lastSyncedAt: (data.meta?.lastSyncedAt as string) ?? baseDraft.meta.lastSyncedAt,
        },
      });
      return parsed;
    } catch (error) {
      console.warn('Falling back to legacy profile data', error);
    }
  }

  const legacyDraft: ProfileDraft = {
    ...baseDraft,
    personal: {
      preferredName: sanitizeString(data.preferredName ?? data.nickname ?? displayName, displayName),
      nickname: sanitizeString(data.nickname ?? displayName, displayName),
      headline: sanitizeString(data.identity?.purpose ?? data.warmup?.successIndicator ?? baseDraft.personal.headline, baseDraft.personal.headline),
      bio: sanitizeString(data.bio ?? baseDraft.personal.bio, baseDraft.personal.bio),
    },
    work: {
      role: sanitizeString(data.identity?.role ?? baseDraft.work.role, baseDraft.work.role),
      company: sanitizeString(data.identity?.company ?? baseDraft.work.company, baseDraft.work.company),
      mainProject: sanitizeString(data.identity?.mainProject ?? baseDraft.work.mainProject, baseDraft.work.mainProject),
      secondaryProjects: ensureFilledArray(
        splitSecondaryProjects(data.identity?.secondaryProjects),
        2,
        () => ''
      ),
      supportNeeds: sanitizeString(data.warmup?.mentalWeight ?? baseDraft.work.supportNeeds, baseDraft.work.supportNeeds),
      focusAreas: ensureFilledArray(parseFocusAreas(data.values?.keywords), 3, () => ''),
    },
    performance: {
      northStar: sanitizeString(data.warmup?.successIndicator ?? baseDraft.performance.northStar, baseDraft.performance.northStar),
      weeklyCommitment: sanitizeString(
        data.metrics?.weeklyMicroGoal ?? baseDraft.performance.weeklyCommitment,
        baseDraft.performance.weeklyCommitment
      ),
      metrics: ensureFilledArray(
        (data.metrics?.kpis ?? []).map((label) => ({
          label: sanitizeString(label),
          currentValue: '',
        })),
        3,
        createEmptyMetric
      ),
    },
    rituals: {
      habits: ensureFilledArray(
        data.habits?.items?.map((item) => ({
          name: sanitizeString(item?.name),
          cadence: sanitizeString(item?.frequency),
          focus: sanitizeString(item?.focusHours),
        })),
        1,
        createEmptyHabit
      ).slice(0, 6),
      operatingHours: sanitizeString((data as Record<string, unknown>).operatingHours, baseDraft.rituals.operatingHours),
      meetingCadence: sanitizeString((data as Record<string, unknown>).checkInFrequency, baseDraft.rituals.meetingCadence),
    },
    wellness: {
      sleepHours: sanitizeString(data.wellness?.averageSleep ?? baseDraft.wellness.sleepHours, baseDraft.wellness.sleepHours),
      energyLevel: sanitizeNumberInRange(data.wellness?.energy, 1, 5, baseDraft.wellness.energyLevel),
      stressLevel: sanitizeNumberInRange(data.wellness?.stress, 1, 5, baseDraft.wellness.stressLevel),
      recoveryPlan: sanitizeString(data.values?.inspirations ?? baseDraft.wellness.recoveryPlan, baseDraft.wellness.recoveryPlan),
    },
    connections: {
      linkedin: sanitizeString((data.connections as LegacyOnboardingData['connections'])?.linkedinUrl ?? '', ''),
      calendly: sanitizeString((data.connections as LegacyOnboardingData['connections'])?.calendly ?? '', ''),
      website: sanitizeString((data.connections as LegacyOnboardingData['connections'])?.website ?? '', ''),
      autoEnrich: Boolean((data.connections as LegacyOnboardingData['connections'])?.shouldConnect ?? false),
    },
    documents: {
      resume: coerceResume(data.files),
    },
  };

  try {
    return ProfileDraftSchema.parse(legacyDraft);
  } catch (error) {
    console.error('Unable to parse legacy profile data, using defaults', error);
    return baseDraft;
  }
};

type StoredProfilePayload = {
  profileSchemaVersion: string;
  personal: ProfileDraft['personal'];
  work: ProfileDraft['work'];
  performance: ProfileDraft['performance'];
  rituals: ProfileDraft['rituals'];
  wellness: ProfileDraft['wellness'];
  connections: ProfileDraft['connections'];
  documents: ProfileDraft['documents'];
  meta: ProfileDraft['meta'];
};

export const mapDraftToOnboardingPayload = (draft: ProfileDraft): StoredProfilePayload => ({
  profileSchemaVersion: PROFILE_SCHEMA_VERSION,
  personal: draft.personal,
  work: draft.work,
  performance: draft.performance,
  rituals: draft.rituals,
  wellness: draft.wellness,
  connections: draft.connections,
  documents: draft.documents,
  meta: { ...draft.meta, lastSyncedAt: new Date().toISOString() },
});
