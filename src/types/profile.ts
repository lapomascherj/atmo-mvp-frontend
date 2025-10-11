import { z } from 'zod';

export const PROFILE_SCHEMA_VERSION = '2025-01-15';

const HabitItemSchema = z.object({
  name: z.string().trim().max(120).default(''),
  cadence: z.string().trim().max(80).default(''),
  focus: z.string().trim().max(80).default(''),
});

const MetricSchema = z.object({
  label: z.string().trim().max(80),
  currentValue: z.string().trim().max(40).default(''),
});

const ResumeSchema = z
  .object({
    name: z.string().trim(),
    mimeType: z.string().trim(),
    dataUrl: z.string().trim(),
  })
  .nullable();

export const ProfileDraftSchema = z.object({
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
  account: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().trim().min(1),
    timezone: z.string().trim().min(1),
    avatarUrl: z.string().url().nullable(),
  }),
  personal: z.object({
    preferredName: z.string().trim().min(1),
    nickname: z.string().trim().min(1),
    headline: z.string().trim().max(160),
    bio: z.string().trim().max(1200),
  }),
  work: z.object({
    role: z.string().trim().max(120),
    company: z.string().trim().max(120),
    mainProject: z.string().trim().max(160),
    secondaryProjects: z.array(z.string().trim().max(160)).length(2),
    supportNeeds: z.string().trim().max(240),
    focusAreas: z.array(z.string().trim().max(40)).length(3),
  }),
  performance: z.object({
    northStar: z.string().trim().max(200),
    weeklyCommitment: z.string().trim().max(200),
    metrics: z.array(MetricSchema).length(3),
  }),
  rituals: z.object({
    habits: z.array(HabitItemSchema).min(1).max(6),
    operatingHours: z.string().trim().max(60),
    meetingCadence: z.string().trim().max(80),
  }),
  wellness: z.object({
    sleepHours: z.string().trim().max(20),
    energyLevel: z.number().int().min(1).max(5),
    stressLevel: z.number().int().min(1).max(5),
    recoveryPlan: z.string().trim().max(240),
  }),
  connections: z.object({
    linkedin: z.string().trim().url().or(z.literal('')).default(''),
    calendly: z.string().trim().url().or(z.literal('')).default(''),
    website: z.string().trim().url().or(z.literal('')).default(''),
    autoEnrich: z.boolean().default(false),
  }),
  documents: z.object({
    resume: ResumeSchema,
  }),
  meta: z.object({
    lastSyncedAt: z.string().datetime(),
  }),
});

export type ProfileDraft = z.infer<typeof ProfileDraftSchema>;
export type ProfileHabit = z.infer<typeof HabitItemSchema>;
export type ProfileMetric = z.infer<typeof MetricSchema>;

export const createEmptyHabit = (): ProfileHabit => ({
  name: '',
  cadence: '',
  focus: '',
});

export const createEmptyMetric = (): ProfileMetric => ({
  label: '',
  currentValue: '',
});

export const DEFAULT_PROFILE_FOCUS = ['Impact', 'Execution', 'Learning'] as const;

export const createDefaultProfileDraft = (payload: {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
}): ProfileDraft => ({
  schemaVersion: PROFILE_SCHEMA_VERSION,
  account: {
    id: payload.id,
    email: payload.email,
    displayName: payload.displayName,
    timezone: payload.timezone,
    avatarUrl: null,
  },
  personal: {
    preferredName: payload.displayName,
    nickname: payload.displayName,
    headline: '',
    bio: '',
  },
  work: {
    role: 'Contributor',
    company: 'Independent',
    mainProject: '',
    secondaryProjects: ['', ''],
    supportNeeds: '',
    focusAreas: [...DEFAULT_PROFILE_FOCUS],
  },
  performance: {
    northStar: '',
    weeklyCommitment: '',
    metrics: [createEmptyMetric(), createEmptyMetric(), createEmptyMetric()],
  },
  rituals: {
    habits: [createEmptyHabit()],
    operatingHours: '',
    meetingCadence: '',
  },
  wellness: {
    sleepHours: '7',
    energyLevel: 3,
    stressLevel: 3,
    recoveryPlan: '',
  },
  connections: {
    linkedin: '',
    calendly: '',
    website: '',
    autoEnrich: false,
  },
  documents: {
    resume: null,
  },
  meta: {
    lastSyncedAt: new Date().toISOString(),
  },
});
