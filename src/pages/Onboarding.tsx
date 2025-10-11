import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, UploadCloud, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MetricItem {
  label: string;
}

interface HabitItem {
  name: string;
  frequency: string;
  focusHours: string;
}

interface FormState {
  consent: {
    agreed: boolean;
  };
  warmup: {
    mentalWeight: string;
    successIndicator: string;
  };
  identity: {
    role: string;
    company: string;
    mainProject: string;
    secondaryProjects: string;
    dueDate: string;
    purpose: string;
  };
  metrics: {
    kpis: MetricItem[];
    weeklyMicroGoal: string;
  };
  habits: {
    items: HabitItem[];
  };
  wellness: {
    averageSleep: string;
    energy: number;
    stress: number;
  };
  values: {
    keywords: [string, string, string];
    inspirations: string;
  };
  connections: {
    linkedinUrl: string;
    shouldConnect: boolean;
  };
  files: {
    uploadName: string;
    uploadData: string;
    uploadType: string;
  };
}

const defaultFormState: FormState = {
  consent: {
    agreed: false,
  },
  warmup: {
    mentalWeight: '',
    successIndicator: '',
  },
  identity: {
    role: '',
    company: '',
    mainProject: '',
    secondaryProjects: '',
    dueDate: '',
    purpose: '',
  },
  metrics: {
    kpis: [{ label: '' }, { label: '' }, { label: '' }],
    weeklyMicroGoal: '',
  },
  habits: {
    items: [{ name: '', frequency: '', focusHours: '' }],
  },
  wellness: {
    averageSleep: '',
    energy: 3,
    stress: 3,
  },
  values: {
    keywords: ['', '', ''],
    inspirations: '',
  },
  connections: {
    linkedinUrl: '',
    shouldConnect: false,
  },
  files: {
    uploadName: '',
    uploadData: '',
    uploadType: '',
  },
};

const stepOrder = [
  'consent',
  'warmup',
  'identity',
  'metrics',
  'habits',
  'wellness',
  'values',
  'connections',
  'files',
  'review',
] as const;

type StepId = (typeof stepOrder)[number];

const stepMeta: Record<StepId, { title: string; description: string }> = {
  consent: {
    title: 'Access & Consent',
    description:
      'ATMO stores your answers securely. You can review and edit everything before saving.',
  },
  warmup: {
    title: 'Warm-up',
    description:
      'Help me understand the mental weight you’re carrying and what success looks like.',
  },
  identity: {
    title: 'Identity & Project Focus',
    description:
      'Share the essentials about your role and the projects we should anchor on.',
  },
  metrics: {
    title: 'Measurable Goals & KPIs',
    description: 'Define 2–3 checkpoints and a weekly micro-goal that signal progress.',
  },
  habits: {
    title: 'Habits & Rhythms',
    description: 'Document the routines and focus windows that keep you moving.',
  },
  wellness: {
    title: 'Wellness Baseline',
    description: 'Capture your current energy so ATMO can nudge supportively.',
  },
  values: {
    title: 'Values & Inspirations',
    description:
      'Highlight the ideas and people that keep you grounded and inspired.',
  },
  connections: {
    title: 'LinkedIn Connection',
    description:
      'Connect to import professional context when available (optional).',
  },
  files: {
    title: 'Supporting Files',
    description: 'Drop a résumé or project deck to give ATMO extra context (optional).',
  },
  review: {
    title: 'Review & Confirm',
    description:
      'Fine-tune every detail. We’ll save once you confirm each section.',
  },
};

const reviewTabs = [
  'Profile',
  'Projects',
  'Goals',
  'Habits',
  'Wellness',
  'Values',
  'Connections',
  'Files',
] as const;

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding, hydratedProfile } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeReviewTab, setActiveReviewTab] = useState<(typeof reviewTabs)[number]>(
    reviewTabs[0]
  );

  const currentStep = stepOrder[currentStepIndex];

  const resetErrorForPrefix = (prefix: string) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      Object.keys(next)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => delete next[key]);
      return next;
    });
  };

  const updateWarmup = (field: 'mentalWeight' | 'successIndicator', value: string) => {
    resetErrorForPrefix('warmup');
    setFormState((prev) => ({
      ...prev,
      warmup: { ...prev.warmup, [field]: value },
    }));
  };

  const updateIdentity = (
    field: keyof FormState['identity'],
    value: string
  ) => {
    resetErrorForPrefix('identity');
    setFormState((prev) => ({
      ...prev,
      identity: { ...prev.identity, [field]: value },
    }));
  };

  const updateMetric = (index: number, value: string) => {
    resetErrorForPrefix('metrics');
    setFormState((prev) => {
      const nextKpis = [...prev.metrics.kpis];
      nextKpis[index] = { label: value };
      return {
        ...prev,
        metrics: { ...prev.metrics, kpis: nextKpis },
      };
    });
  };

  const updateHabit = (index: number, field: keyof HabitItem, value: string) => {
    resetErrorForPrefix('habits');
    setFormState((prev) => {
      const nextHabits = [...prev.habits.items];
      nextHabits[index] = { ...nextHabits[index], [field]: value } as HabitItem;
      return {
        ...prev,
        habits: { items: nextHabits },
      };
    });
  };

  const updateValueKeyword = (index: number, value: string) => {
    resetErrorForPrefix('values');
    setFormState((prev) => {
      const nextKeywords = [...prev.values.keywords] as [string, string, string];
      nextKeywords[index] = value;
      return {
        ...prev,
        values: { ...prev.values, keywords: nextKeywords },
      };
    });
  };

  const validateStep = (stepId: StepId): boolean => {
    const errors: Record<string, string> = {};

    switch (stepId) {
      case 'consent': {
        if (!formState.consent.agreed) {
          errors['consent.agreed'] = 'Please confirm you understand how ATMO uses your data.';
        }
        break;
      }
      case 'warmup': {
        if (!formState.warmup.mentalWeight.trim()) {
          errors['warmup.mentalWeight'] = 'Let me know the mental weight you would release.';
        }
        if (!formState.warmup.successIndicator.trim()) {
          errors['warmup.successIndicator'] =
            'Describe what would prove ATMO is helping within 30 days.';
        }
        break;
      }
      case 'identity': {
        const { role, company, mainProject, dueDate, purpose } = formState.identity;
        if (!role.trim()) errors['identity.role'] = 'Role is required.';
        if (!company.trim()) errors['identity.company'] = 'Company is required.';
        if (!mainProject.trim()) errors['identity.mainProject'] = 'Main project is required.';
        if (!dueDate.trim()) errors['identity.dueDate'] = 'Please share a target date.';
        if (!purpose.trim()) errors['identity.purpose'] = 'Tell me the purpose of this project.';
        break;
      }
      case 'metrics': {
        const activeMetrics = formState.metrics.kpis
          .map((item) => item.label.trim())
          .filter(Boolean);
        if (activeMetrics.length < 2) {
          errors['metrics.kpis'] = 'Add at least two measurable indicators.';
        }
        if (!formState.metrics.weeklyMicroGoal.trim()) {
          errors['metrics.weeklyMicroGoal'] = 'Set a weekly micro-goal to stay accountable.';
        }
        break;
      }
      case 'habits': {
        const firstHabit = formState.habits.items[0];
        if (!firstHabit.name.trim()) {
          errors['habits.items.0.name'] = 'Add at least one key habit.';
        }
        if (!firstHabit.frequency.trim()) {
          errors['habits.items.0.frequency'] = 'Frequency helps ATMO support your rhythm.';
        }
        if (!firstHabit.focusHours.trim()) {
          errors['habits.items.0.focusHours'] = 'Specify the focus hours reserved for this habit.';
        }
        break;
      }
      case 'wellness': {
        const { averageSleep, energy, stress } = formState.wellness;
        if (!averageSleep.trim()) {
          errors['wellness.averageSleep'] = 'Share your current average sleep.';
        }
        if (energy < 1 || energy > 5) {
          errors['wellness.energy'] = 'Energy must be between 1 and 5.';
        }
        if (stress < 1 || stress > 5) {
          errors['wellness.stress'] = 'Stress must be between 1 and 5.';
        }
        break;
      }
      case 'values': {
        formState.values.keywords.forEach((keyword, idx) => {
          if (!keyword.trim()) {
            errors[`values.keywords.${idx}`] = 'Add three keywords so I understand your values.';
          }
        });
        if (!formState.values.inspirations.trim()) {
          errors['values.inspirations'] = 'Share at least one person or book that inspires you.';
        }
        break;
      }
      case 'connections':
      case 'files':
      case 'review':
        break;
      default:
        break;
    }

    if (Object.keys(errors).length) {
      setValidationErrors((prev) => ({ ...prev, ...errors }));
      return false;
    }

    resetErrorForPrefix(stepId);
    return true;
  };

  const goToNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStepIndex((prev) => Math.min(prev + 1, stepOrder.length - 1));
  };

  const goToPrevious = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setFormState((prev) => ({
        ...prev,
        files: { uploadName: '', uploadData: '', uploadType: '' },
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormState((prev) => ({
        ...prev,
        files: {
          uploadName: file.name,
          uploadData: result,
          uploadType: file.type,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const canSubmit = useMemo(() => stepOrder[currentStepIndex] === 'review', [currentStepIndex]);

  const buildPayload = () => ({
    consent: {
      agreed: formState.consent.agreed,
      confirmedAt: new Date().toISOString(),
    },
    warmup: {
      mentalWeight: formState.warmup.mentalWeight.trim(),
      successIndicator: formState.warmup.successIndicator.trim(),
    },
    identity: {
      role: formState.identity.role.trim(),
      company: formState.identity.company.trim(),
      mainProject: formState.identity.mainProject.trim(),
      secondaryProjects: formState.identity.secondaryProjects.trim(),
      dueDate: formState.identity.dueDate.trim(),
      purpose: formState.identity.purpose.trim(),
    },
    metrics: {
      kpis: formState.metrics.kpis
        .map((item) => item.label.trim())
        .filter(Boolean),
      weeklyMicroGoal: formState.metrics.weeklyMicroGoal.trim(),
    },
    habits: {
      items: formState.habits.items
        .map((habit) => ({
          name: habit.name.trim(),
          frequency: habit.frequency.trim(),
          focusHours: habit.focusHours.trim(),
        }))
        .filter((habit) => habit.name || habit.frequency || habit.focusHours),
    },
    wellness: {
      averageSleep: formState.wellness.averageSleep.trim(),
      energy: formState.wellness.energy,
      stress: formState.wellness.stress,
    },
    values: {
      keywords: formState.values.keywords.map((keyword) => keyword.trim()),
      inspirations: formState.values.inspirations.trim(),
    },
    connections: {
      linkedinUrl: formState.connections.linkedinUrl.trim(),
      shouldConnect: formState.connections.shouldConnect,
    },
    files: {
      uploadName: formState.files.uploadName,
      uploadType: formState.files.uploadType,
      hasFile: Boolean(formState.files.uploadData),
    },
  });

  const handleSubmit = async () => {
    if (!validateStep('review')) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildPayload();
      const displayName = hydratedProfile?.display_name?.trim() || hydratedProfile?.email || 'ATMO Explorer';
      const timezone = hydratedProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      const onboardingPayload = {
        ...payload,
        files: {
          ...payload.files,
          uploadData: formState.files.uploadData,
        },
      };

      const { error } = await completeOnboarding({
        display_name: displayName,
        timezone,
        onboarding_data: onboardingPayload,
      });

      if (error) {
        setSubmitError(error);
        setIsSubmitting(false);
        return;
      }

      navigate('/app', { replace: true });
    } catch (error) {
      console.error(error);
      setSubmitError('Something went wrong while saving your onboarding. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderError = (key: string) =>
    validationErrors[key] && (
      <p className="text-red-400 text-xs mt-2">{validationErrors[key]}</p>
    );

  const renderWarmupStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          If you could remove one mental weight tomorrow morning, what would it be?
        </label>
        <textarea
          value={formState.warmup.mentalWeight}
          onChange={(event) => updateWarmup('mentalWeight', event.target.value)}
          className="w-full min-h-[100px] px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {renderError('warmup.mentalWeight')}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          What would show me, in 30 days, that I’m really helping you?
        </label>
        <textarea
          value={formState.warmup.successIndicator}
          onChange={(event) => updateWarmup('successIndicator', event.target.value)}
          className="w-full min-h-[100px] px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {renderError('warmup.successIndicator')}
      </div>
    </div>
  );

  const renderIdentityStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Role</label>
          <input
            value={formState.identity.role}
            onChange={(event) => updateIdentity('role', event.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {renderError('identity.role')}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Company</label>
          <input
            value={formState.identity.company}
            onChange={(event) => updateIdentity('company', event.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {renderError('identity.company')}
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">Main project</label>
        <input
          value={formState.identity.mainProject}
          onChange={(event) => updateIdentity('mainProject', event.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {renderError('identity.mainProject')}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          Secondary projects (comma separated)
        </label>
        <input
          value={formState.identity.secondaryProjects}
          onChange={(event) => updateIdentity('secondaryProjects', event.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Due date</label>
          <input
            type="date"
            value={formState.identity.dueDate}
            onChange={(event) => updateIdentity('dueDate', event.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {renderError('identity.dueDate')}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Purpose</label>
          <input
            value={formState.identity.purpose}
            onChange={(event) => updateIdentity('purpose', event.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {renderError('identity.purpose')}
        </div>
      </div>
    </div>
  );

  const renderMetricsStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-white/90">
          Add 2–3 metrics that show we’re moving in the right direction
        </label>
        {formState.metrics.kpis.map((metric, index) => (
          <input
            key={index}
            value={metric.label}
            onChange={(event) => updateMetric(index, event.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder={`Metric ${index + 1}`}
          />
        ))}
        {renderError('metrics.kpis')}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">Weekly micro-goal</label>
        <input
          value={formState.metrics.weeklyMicroGoal}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              metrics: { ...prev.metrics, weeklyMicroGoal: event.target.value },
            }))
          }
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          placeholder="Example: Ship a working prototype by Friday"
        />
        {renderError('metrics.weeklyMicroGoal')}
      </div>
    </div>
  );

  const renderHabitsStep = () => (
    <div className="space-y-6">
      {formState.habits.items.map((habit, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">Habit name</label>
            <input
              value={habit.name}
              onChange={(event) => updateHabit(index, 'name', event.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {index === 0 && renderError('habits.items.0.name')}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">Frequency</label>
            <input
              value={habit.frequency}
              onChange={(event) => updateHabit(index, 'frequency', event.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Daily, Weekly, etc."
            />
            {index === 0 && renderError('habits.items.0.frequency')}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">Focus hours</label>
            <input
              value={habit.focusHours}
              onChange={(event) => updateHabit(index, 'focusHours', event.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g. 08:00–10:00"
            />
            {index === 0 && renderError('habits.items.0.focusHours')}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            setFormState((prev) => ({
              ...prev,
              habits: {
                items: [
                  ...prev.habits.items,
                  { name: '', frequency: '', focusHours: '' },
                ],
              },
            }))
          }
          className="px-3 py-2 rounded-md border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors"
        >
          Add another habit
        </button>
      </div>
    </div>
  );

  const renderWellnessStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">Average sleep (hours)</label>
          <input
            value={formState.wellness.averageSleep}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                wellness: { ...prev.wellness, averageSleep: event.target.value },
              }))
            }
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {renderError('wellness.averageSleep')}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">
            Energy (1–5)
          </label>
          <input
            type="number"
            min={1}
            max={5}
            value={formState.wellness.energy}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                wellness: {
                  ...prev.wellness,
                  energy: Number(event.target.value),
                },
              }))
            }
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {renderError('wellness.energy')}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/90">
            Stress (1–5)
          </label>
          <input
            type="number"
            min={1}
            max={5}
            value={formState.wellness.stress}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                wellness: {
                  ...prev.wellness,
                  stress: Number(event.target.value),
                },
              }))
            }
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          {renderError('wellness.stress')}
        </div>
      </div>
    </div>
  );

  const renderValuesStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          Three keywords that best describe your values
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formState.values.keywords.map((keyword, index) => (
            <input
              key={index}
              value={keyword}
              onChange={(event) => updateValueKeyword(index, event.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder={`Keyword ${index + 1}`}
            />
          ))}
        </div>
        {renderError('values.keywords.0') ||
          renderError('values.keywords.1') ||
          renderError('values.keywords.2')}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          One or two people or books that inspire you
        </label>
        <textarea
          value={formState.values.inspirations}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              values: { ...prev.values, inspirations: event.target.value },
            }))
          }
          className="w-full min-h-[90px] px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {renderError('values.inspirations')}
      </div>
    </div>
  );

  const renderConnectionsStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          LinkedIn profile URL (optional)
        </label>
        <input
          value={formState.connections.linkedinUrl}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              connections: {
                ...prev.connections,
                linkedinUrl: event.target.value,
              },
            }))
          }
          placeholder="https://www.linkedin.com/in/you"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      <label className="inline-flex items-center gap-3 text-white/80 text-sm">
        <input
          type="checkbox"
          checked={formState.connections.shouldConnect}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              connections: {
                ...prev.connections,
                shouldConnect: event.target.checked,
              },
            }))
          }
          className="h-4 w-4 rounded border-white/20 bg-transparent accent-blue-500"
        />
        Allow ATMO to enrich my profile with LinkedIn data when available
      </label>
    </div>
  );

  const renderFilesStep = () => (
    <div className="space-y-6">
      <div className="border border-dashed border-white/20 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <UploadCloud className="text-white/50" size={28} />
          <p className="text-white/80 text-sm">
            Upload a résumé or project deck (PDF, DOCX, PPTX). Optional but helpful.
          </p>
          <label className="px-4 py-2 text-sm font-medium rounded-md border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.pptm,.key,.pages"
              onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
            />
            Choose file
          </label>
          {formState.files.uploadName ? (
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Check size={16} className="text-green-400" />
              <span>{formState.files.uploadName}</span>
              <button
                type="button"
                onClick={() => handleFileChange(null)}
                className="text-white/50 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/40">No file selected</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderConsentStep = () => (
    <div className="space-y-6">
      <p className="text-white/70 text-sm leading-relaxed">
        ATMO keeps your answers private. They’re encrypted, stored only within ATMO, and used
        solely to personalise your experience. You can edit or delete them at any time before or
        after saving.
      </p>
      <label className="inline-flex items-start gap-3 text-white/80 text-sm">
        <input
          type="checkbox"
          checked={formState.consent.agreed}
          onChange={(event) =>
            setFormState((prev) => ({
              ...prev,
              consent: { agreed: event.target.checked },
            }))
          }
          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-blue-500"
        />
        <span>
          I understand that ATMO will store these responses securely and I can review everything
          before it is saved.
        </span>
      </label>
      {renderError('consent.agreed')}
    </div>
  );

  const renderReviewTabContent = (tab: (typeof reviewTabs)[number]) => {
    switch (tab) {
      case 'Profile':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Role</p>
              <input
                value={formState.identity.role}
                onChange={(event) => updateIdentity('role', event.target.value)}
                className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Company</p>
              <input
                value={formState.identity.company}
                onChange={(event) => updateIdentity('company', event.target.value)}
                className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        );
      case 'Projects':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Main project</p>
              <input
                value={formState.identity.mainProject}
                onChange={(event) => updateIdentity('mainProject', event.target.value)}
                className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Secondary projects</p>
              <input
                value={formState.identity.secondaryProjects}
                onChange={(event) => updateIdentity('secondaryProjects', event.target.value)}
                className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Due date</p>
                <input
                  type="date"
                  value={formState.identity.dueDate}
                  onChange={(event) => updateIdentity('dueDate', event.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Purpose</p>
                <input
                  value={formState.identity.purpose}
                  onChange={(event) => updateIdentity('purpose', event.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>
        );
      case 'Goals':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Metrics</p>
              {formState.metrics.kpis.map((metric, index) => (
                <input
                  key={index}
                  value={metric.label}
                  onChange={(event) => updateMetric(index, event.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Weekly micro-goal</p>
              <input
                value={formState.metrics.weeklyMicroGoal}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    metrics: { ...prev.metrics, weeklyMicroGoal: event.target.value },
                  }))
                }
                className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        );
      case 'Habits':
        return (
          <div className="space-y-4">
            {formState.habits.items.map((habit, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={habit.name}
                  onChange={(event) => updateHabit(index, 'name', event.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Habit name"
                />
                <input
                  value={habit.frequency}
                  onChange={(event) => updateHabit(index, 'frequency', event.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Frequency"
                />
                <input
                  value={habit.focusHours}
                  onChange={(event) => updateHabit(index, 'focusHours', event.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Focus hours"
                />
              </div>
            ))}
          </div>
        );
      case 'Wellness':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={formState.wellness.averageSleep}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    wellness: { ...prev.wellness, averageSleep: event.target.value },
                  }))
                }
                className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Avg sleep"
              />
              <input
                type="number"
                min={1}
                max={5}
                value={formState.wellness.energy}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    wellness: { ...prev.wellness, energy: Number(event.target.value) },
                  }))
                }
                className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Energy"
              />
              <input
                type="number"
                min={1}
                max={5}
                value={formState.wellness.stress}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    wellness: { ...prev.wellness, stress: Number(event.target.value) },
                  }))
                }
                className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Stress"
              />
            </div>
          </div>
        );
      case 'Values':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {formState.values.keywords.map((keyword, index) => (
                <input
                  key={index}
                  value={keyword}
                  onChange={(event) => updateValueKeyword(index, event.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={`Keyword ${index + 1}`}
                />
              ))}
            </div>
            <textarea
              value={formState.values.inspirations}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  values: { ...prev.values, inspirations: event.target.value },
                }))
              }
              className="w-full min-h-[80px] px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="People or books that inspire you"
            />
          </div>
        );
      case 'Connections':
        return (
          <div className="space-y-4">
            <input
              value={formState.connections.linkedinUrl}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  connections: {
                    ...prev.connections,
                    linkedinUrl: event.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="LinkedIn URL"
            />
            <label className="inline-flex items-center gap-2 text-white/70 text-sm">
              <input
                type="checkbox"
                checked={formState.connections.shouldConnect}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    connections: {
                      ...prev.connections,
                      shouldConnect: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-blue-500"
              />
              Allow LinkedIn enrichment when available
            </label>
          </div>
        );
      case 'Files':
        return (
          <div className="space-y-4">
            <div className="border border-dashed border-white/20 rounded-lg p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <UploadCloud className="text-white/50" size={24} />
                <p className="text-white/70 text-sm">Current file: {formState.files.uploadName || 'None'}</p>
                <label className="px-3 py-2 rounded border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors cursor-pointer text-sm">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.pptm,.key,.pages"
                    onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                  />
                  Replace file
                </label>
                {formState.files.uploadName && (
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
                    className="text-white/50 hover:text-white text-xs"
                  >
                    Remove file
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'consent':
        return renderConsentStep();
      case 'warmup':
        return renderWarmupStep();
      case 'identity':
        return renderIdentityStep();
      case 'metrics':
        return renderMetricsStep();
      case 'habits':
        return renderHabitsStep();
      case 'wellness':
        return renderWellnessStep();
      case 'values':
        return renderValuesStep();
      case 'connections':
        return renderConnectionsStep();
      case 'files':
        return renderFilesStep();
      case 'review':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {reviewTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveReviewTab(tab)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    activeReviewTab === tab
                      ? 'border-white/40 text-white'
                      : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              {renderReviewTabContent(activeReviewTab)}
            </div>
            {submitError && (
              <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                {submitError}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      <div className="w-full max-w-3xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              {stepMeta[currentStep].title}
            </h1>
            <p className="text-white/60 text-sm">
              {stepMeta[currentStep].description}
            </p>
          </div>
          <div className="text-right text-white/50 text-xs uppercase tracking-wide">
            Step {currentStepIndex + 1} of {stepOrder.length}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-8">
              {renderStepContent()}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={goToPrevious}
                  className={`px-4 py-2 rounded-lg border transition-colors text-sm ${
                    currentStepIndex === 0
                      ? 'border-white/10 text-white/30 cursor-not-allowed'
                      : 'border-white/20 text-white/70 hover:text-white hover:border-white/40'
                  }`}
                  disabled={currentStepIndex === 0 || isSubmitting}
                >
                  Back
                </button>
                {canSubmit ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-[#CC5500] text-white font-medium hover:bg-[#CC5500]/90 transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      'Confirm & Save'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goToNext}
                    className="px-5 py-2 rounded-lg bg-[#CC5500] text-white font-medium hover:bg-[#CC5500]/90 transition-colors"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
