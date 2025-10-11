import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { useForm, FormProvider, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LayoutDashboard,
  User,
  Briefcase,
  Target,
  ListChecks,
  Heart,
  Link as LinkIcon,
  FileText,
  Loader2,
  Camera,
  Trash2,
  LogOut,
  Clock,
  Compass,
  Sparkles,
} from 'lucide-react';
import useRealAuth from '@/hooks/useRealAuth';
import { useToast } from '@/hooks/useToast';
import { useGlobalStore } from '@/stores/globalStore';
import { Button } from '@/components/atoms/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Switch } from '@/components/atoms/Switch';
import {
  useProfileStore,
  selectProfileDraft,
  selectProfileTab,
  selectProfileDirty,
  selectProfileSaving,
  ProfileTabId,
} from '@/stores/profileStore';
import { ProfileDraft, ProfileDraftSchema, PROFILE_SCHEMA_VERSION, createEmptyHabit } from '@/types/profile';
import { mapProfileToDraft, mapDraftToOnboardingPayload } from '@/lib/profileMapper';
import { cn } from '@/utils/utils';

const TAB_CONFIG: Array<{
  id: ProfileTabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}> = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Snapshot of your workspace profile at a glance.',
  },
  {
    id: 'personal',
    label: 'Identity',
    icon: User,
    description: 'Names, headline, and how ATMO should greet you.',
  },
  {
    id: 'work',
    label: 'Work System',
    icon: Briefcase,
    description: 'Roles, projects, and where you need leverage.',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Target,
    description: 'North star outcomes and the metrics you track.',
  },
  {
    id: 'rituals',
    label: 'Rituals',
    icon: ListChecks,
    description: 'Operating cadence and the habits that keep you sharp.',
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: Heart,
    description: 'Energy signals so ATMO can pace support responsibly.',
  },
  {
    id: 'connections',
    label: 'Connections',
    icon: LinkIcon,
    description: 'Integrations and enrichment preferences.',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    description: 'Reference files that help ATMO brief faster.',
  },
];

const SummaryLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-wide text-white/40">{label}</span>
    <span className="text-sm text-white/90">{value}</span>
  </div>
);

const OverviewPanel: React.FC<{ values: ProfileDraft }> = ({ values }) => {
  const primaryHabit = values.rituals.habits.find((habit) => habit.name.trim()) ?? values.rituals.habits[0];
  const focusAreas = values.work.focusAreas.filter((entry) => entry.trim());
  const secondaryProjects = values.work.secondaryProjects.filter((entry) => entry.trim());
  const metrics = values.performance.metrics.filter((metric) => metric.label.trim());

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-white/40">Current identity</p>
            <h3 className="text-lg font-semibold text-white">{values.account.displayName}</h3>
            <p className="text-sm text-white/60">
              {[values.work.role || 'Role not set', values.work.company || 'Organisation not set']
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/70">
            <SummaryLine
              label="North star"
              value={values.performance.northStar || 'Define the outcome you are chasing.'}
            />
            <SummaryLine
              label="Weekly commitment"
              value={values.performance.weeklyCommitment || 'Capture the move you promise to make this week.'}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-white/80">
            <Briefcase size={16} />
            <span className="text-sm font-medium">Projects in focus</span>
          </div>
          <div className="space-y-2">
            <SummaryLine
              label="Primary"
              value={values.work.mainProject || 'Outline your headline initiative.'}
            />
            <SummaryLine
              label="Supporting"
              value={secondaryProjects.join(' · ') || 'Document the supporting tracks if relevant.'}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-white/80">
            <Sparkles size={16} />
            <span className="text-sm font-medium">Focus areas</span>
          </div>
          {focusAreas.length ? (
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80"
                >
                  {area}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">
              List the themes where ATMO should surface context without prompting.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-white/80">
            <ListChecks size={16} />
            <span className="text-sm font-medium">Operating rhythm</span>
          </div>
          <div className="space-y-2">
            <SummaryLine
              label="Primary habit"
              value={
                primaryHabit?.name
                  ? `${primaryHabit.name} • ${primaryHabit.cadence || 'Cadence not set'}`
                  : 'Document at least one ritual so ATMO can reinforce it.'
              }
            />
            <SummaryLine
              label="Preferred hours"
              value={values.rituals.operatingHours || 'Tell ATMO when you are typically available.'}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-white/80">
            <Heart size={16} />
            <span className="text-sm font-medium">Wellness signals</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-white/80">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Sleep</p>
              <p className="text-lg font-semibold">{values.wellness.sleepHours || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Energy</p>
              <p className="text-lg font-semibold">{values.wellness.energyLevel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Stress</p>
              <p className="text-lg font-semibold">{values.wellness.stressLevel}</p>
            </div>
          </div>
          <p className="text-sm text-white/50">
            {values.wellness.recoveryPlan || 'Capture what restores you so ATMO can pace momentum wisely.'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
        <div className="flex items-center gap-2 text-white/80">
          <Target size={16} />
          <span className="text-sm font-medium">Headline metrics</span>
        </div>
        {metrics.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-white/40">{metric.label}</p>
                <p className="text-base font-semibold text-white mt-1">
                  {metric.currentValue || 'Tracking'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">
            List the three numbers that prove progress so the Digital Brain can surface the right alerts.
          </p>
        )}
      </div>
    </div>
  );
};

const PersonalForm: React.FC = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileDraft>();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Display name"
          {...register('account.displayName')}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Preferred name"
          {...register('personal.preferredName')}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Nickname"
          helperText="Used in quick replies and the navigation footer."
          {...register('personal.nickname')}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Headline"
          placeholder="What are you optimising for right now?"
          {...register('personal.headline')}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <TextArea
        label="Bio / Mission"
        placeholder="Give ATMO a concise mission statement to keep every surface aligned."
        rows={5}
        {...register('personal.bio')}
        className="bg-white/5 border-white/10 text-white"
      />
      {errors.personal && (
        <p className="text-sm text-red-400">Check the personal section for validation feedback.</p>
      )}
    </div>
  );
};

const WorkForm: React.FC = () => {
  const { register, watch } = useFormContext<ProfileDraft>();
  const focusAreas = watch('work.focusAreas') ?? [];
  const secondaryProjects = watch('work.secondaryProjects') ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Role"
          placeholder="e.g. Founder, Product Lead"
          {...register('work.role')}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Company or Team"
          placeholder="Where do you operate?"
          {...register('work.company')}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <Input
        label="Primary initiative"
        placeholder="What is the main project ATMO should prioritise?"
        {...register('work.mainProject')}
        className="bg-white/5 border-white/10 text-white"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {secondaryProjects.map((_, index) => (
          <Input
            key={`secondary-${index}`}
            label={`Supporting initiative ${index + 1}`}
            placeholder="Optional but useful context"
            {...register(`work.secondaryProjects.${index}` as const)}
            className="bg-white/5 border-white/10 text-white"
          />
        ))}
      </div>
      <TextArea
        label="Where you need leverage"
        placeholder="Explain the blockers or responsibilities where ATMO should lean in."
        rows={4}
        {...register('work.supportNeeds')}
        className="bg-white/5 border-white/10 text-white"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {focusAreas.map((_, index) => (
          <Input
            key={`focus-${index}`}
            label={`Focus area ${index + 1}`}
            placeholder="Theme ATMO should monitor"
            {...register(`work.focusAreas.${index}` as const)}
            className="bg-white/5 border-white/10 text-white"
          />
        ))}
      </div>
    </div>
  );
};

const PerformanceForm: React.FC = () => {
  const { register, control } = useFormContext<ProfileDraft>();
  const { fields } = useFieldArray({ name: 'performance.metrics', control });

  return (
    <div className="space-y-6">
      <Input
        label="North star outcome"
        placeholder="Describe the outcome that defines success for you."
        {...register('performance.northStar')}
        className="bg-white/5 border-white/10 text-white"
      />
      <Input
        label="Weekly commitment"
        placeholder="What will you move forward each week?"
        {...register('performance.weeklyCommitment')}
        className="bg-white/5 border-white/10 text-white"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Input
              label={`Metric ${index + 1}`}
              placeholder="Metric name"
              {...register(`performance.metrics.${index}.label` as const)}
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              label="Current signal"
              placeholder="Optional current value"
              {...register(`performance.metrics.${index}.currentValue` as const)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const RitualsForm: React.FC = () => {
  const { control, register } = useFormContext<ProfileDraft>();
  const { fields, append, remove } = useFieldArray({ name: 'rituals.habits', control });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/80">Habit {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-red-400"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Habit"
                placeholder="What do you commit to?"
                {...register(`rituals.habits.${index}.name` as const)}
                className="bg-white/10 border-white/20 text-white"
              />
              <Input
                label="Cadence"
                placeholder="How often?"
                {...register(`rituals.habits.${index}.cadence` as const)}
                className="bg-white/10 border-white/20 text-white"
              />
              <Input
                label="Focus"
                placeholder="What does it support?"
                {...register(`rituals.habits.${index}.focus` as const)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        ))}
        {fields.length < 6 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-dashed border-white/20 text-white/70"
            onClick={() => append(createEmptyHabit())}
          >
            Add habit
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Operating hours"
          placeholder="Your preferred working window"
          {...register('rituals.operatingHours')}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Meeting cadence"
          placeholder="How often should ATMO regroup?"
          {...register('rituals.meetingCadence')}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
    </div>
  );
};

const WellnessForm: React.FC = () => {
  const { register } = useFormContext<ProfileDraft>();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Sleep (hours)"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 7"
          {...register('wellness.sleepHours')}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Energy level"
          type="number"
          min={1}
          max={5}
          {...register('wellness.energyLevel', { valueAsNumber: true })}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Stress level"
          type="number"
          min={1}
          max={5}
          {...register('wellness.stressLevel', { valueAsNumber: true })}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <TextArea
        label="Recovery plan"
        placeholder="What helps you reset when momentum dips?"
        rows={4}
        {...register('wellness.recoveryPlan')}
        className="bg-white/5 border-white/10 text-white"
      />
    </div>
  );
};

const ConnectionsForm: React.FC = () => {
  const { register, setValue, watch } = useFormContext<ProfileDraft>();
  const autoEnrich = watch('connections.autoEnrich') ?? false;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="LinkedIn"
          placeholder="https://linkedin.com/in/you"
          {...register('connections.linkedin')}
          className="bg-white/5 border-white/10 text-white"
        />
        <Input
          label="Calendly or scheduling link"
          placeholder="https://calendly.com/you"
          {...register('connections.calendly')}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <Input
        label="Website"
        placeholder="https://your-domain.com"
        {...register('connections.website')}
        className="bg-white/5 border-white/10 text-white"
      />
      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-sm font-medium text-white/80">Auto-enrich from LinkedIn</p>
          <p className="text-xs text-white/50">
            Allow ATMO to refresh your role and company information when new data is available.
          </p>
        </div>
        <Switch
          checked={autoEnrich}
          onCheckedChange={(checked) => setValue('connections.autoEnrich', checked, { shouldDirty: true })}
        />
      </label>
    </div>
  );
};

const DocumentsForm: React.FC<{ onFileSelect: (file: File | null) => void; currentFileName?: string }>
  = ({ onFileSelect, currentFileName }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { setValue } = useFormContext<ProfileDraft>();

  const handleRemove = () => {
    setValue('documents.resume', null, { shouldDirty: true });
    onFileSelect(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
        <p className="text-sm text-white/70">Attach a résumé, deck, or briefing doc for fast onboarding.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 text-white/80"
            onClick={() => inputRef.current?.click()}
          >
            Upload document
          </Button>
          {currentFileName && (
            <Button type="button" variant="ghost" className="text-white/60" onClick={handleRemove}>
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.key,.pages"
          className="hidden"
          onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
        />
        <p className="mt-4 text-xs text-white/50">
          {currentFileName || 'No document stored yet.'}
        </p>
      </div>
    </div>
  );
};

const Tabs = TabsPrimitive.Root;
const TabsList = TabsPrimitive.List;
const TabsTrigger = TabsPrimitive.Trigger;
const TabsContent = TabsPrimitive.Content;

const Profile: React.FC = () => {
  const { profile, updateUserProfile, signOut, isLoading } = useRealAuth();
  const { toast } = useToast();
  const { timeFormat, setTimeFormat } = useGlobalStore();

  const initialize = useProfileStore((state) => state.initialize);
  const setDraft = useProfileStore((state) => state.setDraft);
  const setTab = useProfileStore((state) => state.setTab);
  const commitDraft = useProfileStore((state) => state.commitDraft);
  const setSaving = useProfileStore((state) => state.setSaving);
  const draft = useProfileStore(selectProfileDraft);
  const currentTab = useProfileStore(selectProfileTab);
  const isDirty = useProfileStore(selectProfileDirty);
  const saving = useProfileStore(selectProfileSaving);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ProfileDraft>({
    resolver: zodResolver(ProfileDraftSchema),
    mode: 'onChange',
    defaultValues: draft ?? undefined,
  });

  const { handleSubmit, reset, watch: formWatch, setValue } = form;
  const timezoneValue = formWatch('account.timezone');

  const profileId = profile?.id;
  const profileUpdatedAt = profile?.updated_at;

  useEffect(() => {
    console.log('[Profile] useEffect triggered:', { profileId, hasProfile: !!profile, profileUpdatedAt });

    if (!profileId) {
      console.warn('[Profile] No profileId available');
      return;
    }

    if (!profile) {
      console.warn('[Profile] No profile data, creating default draft');
      // Create a default draft when profile is missing
      const defaultDraft = createDefaultProfileDraft({
        id: profileId,
        email: 'user@example.com',
        displayName: 'ATMO User',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      initialize(defaultDraft);
      reset(defaultDraft);
      setAvatarPreview(null);
      return;
    }

    console.log('[Profile] Mapping profile to draft');
    const nextDraft = mapProfileToDraft(profile);
    initialize(nextDraft);
    reset(nextDraft);
    setAvatarPreview(nextDraft.account.avatarUrl);
  }, [profileId, profileUpdatedAt, profile, initialize, reset]);

  useEffect(() => {
    const subscription = formWatch((value) => {
      const parsed = ProfileDraftSchema.safeParse({
        schemaVersion: PROFILE_SCHEMA_VERSION,
        ...value,
      });
      if (parsed.success) {
        setDraft(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [formWatch, setDraft]);

  const handleAvatarChange = (file: File | null) => {
    if (!file) {
      setAvatarPreview(null);
      setValue('account.avatarUrl', null, { shouldDirty: true });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Unsupported file', description: 'Please choose an image file.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Keep avatars below 5 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      setValue('account.avatarUrl', dataUrl, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  const handleResumeChange = (file: File | null) => {
    if (!file) {
      setValue('documents.resume', null, { shouldDirty: true });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Documents must be 10 MB or smaller.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue(
        'documents.resume',
        {
          name: file.name,
          mimeType: file.type,
          dataUrl: reader.result as string,
        },
        { shouldDirty: true }
      );
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const payload = mapDraftToOnboardingPayload(values);
      const success = await updateUserProfile({
        display_name: values.account.displayName,
        timezone: values.account.timezone,
        onboarding_data: payload,
        avatar_url: values.account.avatarUrl,
      });

      if (success) {
        commitDraft();
        toast({ title: 'Profile updated', description: 'Changes are now live across ATMO.' });
      }
    } finally {
      setSaving(false);
    }
  });

  const summaryValues = useMemo(() => draft ?? form.getValues(), [draft, form]);

  // Add console logging for debugging
  React.useEffect(() => {
    console.log('[Profile] Debug:', { isLoading, hasProfile: !!profile, hasDraft: !!draft });
  }, [isLoading, profile, draft]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/60 mx-auto mb-2" />
          <p className="text-sm text-white/40">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <p className="text-white/60 mb-4">Unable to load profile data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-16">
        <div className="mx-auto max-w-6xl px-6 pt-10">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-white/15 bg-white/5">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={draft.account.displayName} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-lg text-white/80">
                    {draft.account.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-white">Profile</h1>
                <p className="text-sm text-white/60">
                  Keep ATMO synced with who you are, how you work, and what you are optimising for.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-white/80"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera size={16} className="mr-2" /> Update avatar
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-white/60"
                  onClick={() => handleAvatarChange(null)}
                >
                  <Trash2 size={16} className="mr-2" /> Remove
                </Button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
              />
              <Button
                onClick={onSubmit}
                disabled={!isDirty || saving}
                className="bg-[#CC5500] hover:bg-[#CC5500]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
                <SummaryLine label="Email" value={draft.account.email} />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock size={14} />
                    <span className="text-sm">Timezone</span>
                  </div>
                  <Input
                    value={timezoneValue ?? ''}
                    onChange={(event) => setValue('account.timezone', event.target.value, { shouldDirty: true })}
                    className="h-9 w-40 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70">
                    <Compass size={14} />
                    <span className="text-sm">Clock format</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/70"
                    onClick={() => setTimeFormat(timeFormat === '24h' ? '12h' : '24h')}
                  >
                    {timeFormat === '24h' ? '24-hour' : '12-hour'}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6 space-y-3">
                <p className="text-sm font-medium text-white/80">Session</p>
                <p className="text-xs text-white/50">
                  Signed in as {draft.account.email}. Sign out to switch workspaces.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                  onClick={signOut}
                >
                  <LogOut size={16} className="mr-2" /> Sign out
                </Button>
              </div>
            </aside>

            <section className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm flex flex-col max-h-[calc(100vh-200px)]">
              <Tabs value={currentTab} onValueChange={(value) => setTab(value as ProfileTabId)} className="flex flex-col h-full">
                <TabsList className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-5 py-3 flex-shrink-0">
                  {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
                        currentTab === id
                          ? 'bg-white/20 text-white shadow-inner shadow-white/15'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <Icon size={16} />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {TAB_CONFIG.map(({ id, description }) => (
                  <TabsContent key={id} value={id} className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6">
                      <p className="text-sm text-white/50">{description}</p>
                    </div>
                    {id === 'overview' && <OverviewPanel values={summaryValues} />}
                    {id === 'personal' && <PersonalForm />}
                    {id === 'work' && <WorkForm />}
                    {id === 'performance' && <PerformanceForm />}
                    {id === 'rituals' && <RitualsForm />}
                    {id === 'wellness' && <WellnessForm />}
                    {id === 'connections' && <ConnectionsForm />}
                    {id === 'documents' && (
                      <DocumentsForm
                        onFileSelect={handleResumeChange}
                        currentFileName={summaryValues.documents.resume?.name}
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default Profile;
