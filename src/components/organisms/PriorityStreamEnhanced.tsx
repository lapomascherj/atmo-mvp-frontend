import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Grid3x3, Calendar, ChevronDown, Sparkles, ListChecks } from 'lucide-react';
import { cn } from '@/utils/utils';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { Priority } from '@/models/Priority';
import { Checkbox } from '@/components/atoms/Checkbox';
import type { KnowledgeItem } from '@/models/KnowledgeItem';

type BadgeConfig = {
  label: string;
  className: string;
};

interface ProjectDetails {
  description?: string;
  notes?: string;
  tags?: string[];
  priority?: string;
  color?: string;
  knowledgeItems: KnowledgeItem[];
}

interface TaskGoalSummary {
  id: string;
  name: string;
  targetDate?: string;
  priority?: Priority;
  status?: string;
}

interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  project?: string;
  projectId?: string;
  projectColor?: string;
  projectDetails?: ProjectDetails;
  goal?: TaskGoalSummary;
  completed: boolean;
  timeLabel?: string;
  estimatedMinutes?: number;
  created_at?: string;
  updated_at?: string;
  rollover_count?: number;
  archived_at?: string | null;
}

interface PriorityTaskCard extends EnhancedTask {
  projectName: string;
  researchNotes: string[];
  executionSteps: string[];
  aiDraft: string;
  primaryBadge: BadgeConfig;
  secondaryBadge: BadgeConfig;
  metadataChips: string[];
  background: React.CSSProperties;
}

interface TemplateContext {
  task: EnhancedTask;
  projectName: string;
}

interface TaskInsights {
  researchNotes: string[];
  executionSteps: string[];
  aiDraft: string;
}

interface KeywordTemplate {
  pattern: RegExp;
  research: (ctx: TemplateContext) => string[];
  steps: (ctx: TemplateContext) => string[];
  draft?: (ctx: TemplateContext) => string;
}

const STOP_WORDS = new Set([
  'that',
  'with',
  'this',
  'from',
  'project',
  'task',
  'your',
  'into',
  'about',
  'need',
  'have',
  'should',
  'ready',
  'creating',
  'integration',
  'build',
  'make',
  'work',
  'plan'
]);

const TAILWIND_COLOR_MAP: Record<string, string> = {
  'bg-purple-500': '#a855f7',
  'bg-blue-500': '#3b82f6',
  'bg-orange-500': '#f97316',
  'bg-emerald-500': '#10b981',
  'bg-amber-500': '#f59e0b',
  'bg-rose-500': '#f43f5e',
  'bg-red-500': '#ef4444',
  'bg-indigo-500': '#6366f1',
  'bg-sky-500': '#0ea5e9',
  'bg-teal-500': '#14b8a6'
};

const PRIORITY_BADGE_THEME: Record<Priority, BadgeConfig> = {
  [Priority.High]: {
    label: 'Launch Blocker',
    className: 'text-red-200 bg-red-500/15 border border-red-400/30'
  },
  [Priority.Medium]: {
    label: 'Ready to Execute',
    className: 'text-purple-200 bg-purple-500/15 border border-purple-400/30'
  },
  [Priority.Low]: {
    label: 'Context Ready',
    className: 'text-sky-200 bg-sky-500/15 border border-sky-400/30'
  }
};

const READINESS_BADGE_THEME: Record<string, BadgeConfig> = {
  'Ready to Execute': {
    label: 'Ready to Execute',
    className: 'text-emerald-200 bg-emerald-500/15 border border-emerald-400/30'
  },
  'Context Ready': {
    label: 'Context Ready',
    className: 'text-sky-200 bg-sky-500/15 border border-sky-400/30'
  },
  'Draft Prepared': {
    label: 'Draft Prepared',
    className: 'text-amber-200 bg-amber-500/15 border border-amber-400/30'
  },
  'Critical Path': {
    label: 'Critical Path',
    className: 'text-orange-200 bg-orange-500/15 border border-orange-400/30'
  }
};

const KEYWORD_TEMPLATES: KeywordTemplate[] = [
  {
    pattern: /(auth|login|oauth|session|password|sso)/i,
    research: ({ projectName }) => [
      'OAuth 2.0 remains the baseline for secure third-party sign-in.',
      `Offer passkey or magic link fallback to reduce ${projectName} onboarding friction.`,
      'Harden refresh token rotation and device session tracking before launch.'
    ],
    steps: ({ projectName }) => [
      `Wire NextAuth providers (Google, GitHub) with ${projectName} environment secrets.`,
      'Implement JWT session strategy with short-lived access tokens and refresh rotation.',
      'Add password reset and device management UI before enabling beta users.',
      'QA desktop and mobile flows in private mode to catch cookie-blocking issues.'
    ],
    draft: () =>
      [
        '// Authentication flow using NextAuth.js',
        "import NextAuth from 'next-auth';",
        "import GoogleProvider from 'next-auth/providers/google';",
        "import GitHubProvider from 'next-auth/providers/github';",
        '',
        'export default NextAuth({',
        '  providers: [',
        '    GoogleProvider({',
        '      clientId: process.env.GOOGLE_CLIENT_ID!,',
        '      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,',
        '    }),',
        '    GitHubProvider({',
        '      clientId: process.env.GITHUB_CLIENT_ID!,',
        '      clientSecret: process.env.GITHUB_CLIENT_SECRET!,',
        '    }),',
        '  ],',
        '  session: { strategy: "jwt", maxAge: 60 * 60 },',
        '  callbacks: {',
        '    async session({ session, token }) {',
        '      session.user.id = token.sub;',
        '      return session;',
        '    },',
        '  },',
        '});'
      ].join('\n')
  },
  {
    pattern: /(stripe|payment|checkout|billing|invoice|payout)/i,
    research: () => [
      'Stripe Connect Express gives the fastest onboarding path for creators.',
      'Webhook automation keeps payout, compliance, and charge status in sync.',
      'Enable multi-currency support (USD/EUR/GBP) to avoid revenue reconciliation issues.'
    ],
    steps: () => [
      'Create Connect onboarding flow and persist account IDs in workspace graph.',
      'Handle payment_intent and payout events via Supabase Edge Function webhooks.',
      'Implement retry logic and Sentry logging before enabling live mode.',
      'Validate settlement schedule with finance to avoid cash flow surprises.'
    ],
    draft: () =>
      [
        'Stripe Connect Implementation:',
        '1. Account Setup: Use Express accounts for faster onboarding.',
        '2. Payment Flow: Charge → Platform Fee → Payout to creator.',
        '3. Webhooks: Handle payment_intent.succeeded, account.updated, payout.paid.',
        '4. Error Handling: Retry failed payouts and capture logs.',
        '5. Currency: Support USD, EUR, GBP with automatic conversion.',
        '6. Testing: Forward Stripe events locally via `stripe listen`.'
      ].join('\n')
  },
  {
    pattern: /\b(ai|context|prompt|embedding|claude|gpt|model|llm)\b/i,
    research: ({ projectName }) => [
      `Blend recent messages + workspace graph so ${projectName} has actionable context.`,
      'Cache embeddings to avoid redundant vector writes and reduce latency.',
      'Guardrail instructions should match persona voice and communication style.'
    ],
    steps: ({ projectName }) => [
      `Design context builder that merges ${projectName} knowledge_items with latest chats.`,
      'Implement chunking + embedding pipeline backed by Supabase Vector store.',
      'Create offline evaluation set to score helpfulness before autopilot activation.',
      'Add tracing (latency + hallucination flags) to monitor production quality.'
    ],
    draft: ({ projectName }) =>
      [
        `// Context builder for ${projectName}`,
        'const context = await buildContext({',
        '  personaId: user.id,',
        "  signals: ['recentMessages', 'knowledgeItems', 'activeGoals'],",
        '  limit: 6,',
        '});',
        '',
        'const completion = await anthropic.messages.create({',
        "  model: 'claude-3-5-sonnet-20241022',",
        '  max_tokens: 600,',
        '  system: renderSystemPrompt(context),',
        '  messages: [{ role: "user", content: userInput }],',
        '});'
      ].join('\n')
  },
  {
    pattern: /(design|layout|ui|ux|prototype|wireframe|responsive)/i,
    research: ({ projectName }) => [
      `${projectName} voice and tone should inform spacing, typography, and microcopy.`,
      'Ensure contrast ratios meet WCAG AA for primary surfaces.',
      'Define mobile breakpoints early—80% of users review tasks on phones first.'
    ],
    steps: () => [
      'Audit current flow and capture primary user journey screens.',
      'Create responsive wireframes covering mobile, tablet, and desktop breakpoints.',
      'Validate interactive states (hover, focus, error) with design tokens.',
      'Run quick usability review with 3 users before locking the layout.'
    ],
    draft: ({ projectName }) =>
      [
        `# ${projectName} interface updates`,
        '',
        'Layout priorities:',
        '- Preserve focus on the primary call-to-action.',
        '- Keep navigation persistent with clear affordances.',
        '- Surface contextual AI suggestions without overwhelming the user.',
        '',
        'Next prototype pass: incorporate real tasks and goals to validate density.'
      ].join('\n')
  },
  {
    pattern: /(campaign|content|marketing|copy|newsletter|launch|social)/i,
    research: () => [
      'Anchor messaging in the customer pain point before introducing the solution.',
      'Repurpose hero narrative across email, landing, and social posts for consistency.',
      'Track conversions per channel to double down on the highest-signal asset.'
    ],
    steps: ({ projectName }) => [
      `Outline the campaign narrative and core promise for ${projectName}.`,
      'Draft hero copy + supporting bullet list tailored to target persona.',
      'Create asset brief for design/video to keep production aligned.',
      'Schedule launch checklist with metrics and responsible owners.'
    ],
    draft: ({ projectName }) =>
      [
        `## ${projectName} launch outline`,
        '',
        'Audience insight → problem framing → high-impact promise.',
        'Key proof points:',
        '- Quantify outcome (time saved, revenue unlocked).',
        '- Include testimonial or social validation.',
        '- Add clear next step with calendar CTA or waitlist.',
        '',
        'Repurpose plan:',
        '1. Long-form landing page',
        '2. Email announcement',
        '3. Social snippets (LinkedIn + Instagram carousel)'
      ].join('\n')
  }
];

const formatEstimatedTimeLabel = (minutes?: number, priority?: Priority): string => {
  if (typeof minutes === 'number' && !Number.isNaN(minutes)) {
    if (minutes >= 120) {
      return `~${Math.round(minutes / 60)} hrs`;
    }
    if (minutes >= 75) {
      return '~1.5 hrs';
    }
    if (minutes >= 60) {
      return '~1 hr';
    }
    if (minutes >= 45) {
      return '~45 mins';
    }
    if (minutes >= 30) {
      return '~30 mins';
    }
    return '~15 mins';
  }

  if (priority === Priority.High) return '~2 hrs';
  if (priority === Priority.Medium) return '~3 hrs';
  return '~45 mins';
};

const formatDateShort = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const formatRelativeDate = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const diffMs = date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays > 1) return `Due in ${diffDays} days`;
  if (diffDays === -1) return '1 day overdue';
  return `${Math.abs(diffDays)} days overdue`;
};

const dedupePreserveOrder = (items: string[], limit?: number): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (limit && result.length >= limit) break;
  }

  return result;
};

const splitSentences = (text: string): string[] => {
  return text
    .split(/[\n\.]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

const ensureActionable = (text: string): string => {
  if (!text) return '';
  const cleaned = text.replace(/^[\d\-\•]+\s*/, '').trim();
  const capitalised = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (/^(Review|Create|Implement|Design|Draft|Integrate|Validate|Refine|Deploy|Schedule|Document|Align|Audit)/i.test(capitalised)) {
    return capitalised;
  }
  return `Clarify and execute: ${capitalised}`;
};

const extractKeywords = (text: string): string[] => {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
    )
  );
};

const scoreKnowledgeItem = (item: KnowledgeItem, keywords: string[]): number => {
  if (!keywords.length) return 0;
  const haystack = `${item.name ?? ''} ${(item.content ?? '')} ${(item.tags ?? []).join(' ')}`.toLowerCase();
  return keywords.reduce((score, keyword) => (haystack.includes(keyword) ? score + 1 : score), 0);
};

const summarizeKnowledgeItem = (item: KnowledgeItem): string => {
  if (item.content) {
    const sentence = splitSentences(item.content)[0];
    if (sentence) {
      return sentence.length > 140 ? `${sentence.slice(0, 137)}…` : sentence;
    }
  }
  return item.name || 'Reference material available in workspace knowledge.';
};

const extractKnowledgeNotes = (task: EnhancedTask, context: TemplateContext): string[] => {
  const knowledge = task.projectDetails?.knowledgeItems ?? [];
  if (!knowledge.length) return [];

  const keywords = extractKeywords(`${task.title} ${task.description ?? ''} ${context.projectName}`);
  const scored = knowledge
    .map((item) => ({
      item,
      score: scoreKnowledgeItem(item, keywords),
      updated: item.updated ?? item.created ?? ''
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.updated).getTime() - new Date(a.updated).getTime();
    });

  const relevant = scored.filter(({ score }) => score > 0).slice(0, 3);
  const selected = relevant.length > 0 ? relevant : scored.slice(0, 2);

  return selected.map(({ item }) => summarizeKnowledgeItem(item));
};

const buildFallbackResearchNotes = (task: EnhancedTask, context: TemplateContext): string[] => {
  const notes: string[] = [];

  if (task.goal?.targetDate) {
    const relative = formatRelativeDate(task.goal.targetDate);
    const date = formatDateShort(task.goal.targetDate);
    notes.push(`Aligned to goal "${task.goal.name}" — target ${date}${relative ? ` (${relative})` : ''}.`);
  }

  if (task.projectDetails?.notes) {
    const summary = splitSentences(task.projectDetails.notes)[0];
    if (summary) {
      notes.push(summary);
    }
  }

  if (task.projectDetails?.tags && task.projectDetails.tags.length > 0) {
    notes.push(`Key themes: ${task.projectDetails.tags.slice(0, 3).join(', ')}.`);
  }

  if (!notes.length) {
    notes.push(`${context.projectName} focus: ${task.title}.`);
  }

  return notes;
};

const buildFallbackExecutionSteps = (task: EnhancedTask, context: TemplateContext): string[] => {
  const baseSteps = splitSentences(task.description ?? '').map(ensureActionable);
  const steps = [...baseSteps];

  if (task.goal?.targetDate) {
    steps.push(`Map deliverables to ${formatRelativeDate(task.goal.targetDate) ?? 'the agreed timeline'}.`);
  }

  if (task.projectDetails?.notes) {
    steps.push('Review project notes to confirm constraints and acceptance criteria.');
  }

  if (!steps.length) {
    steps.push(`Define the exact outcome for "${task.title}" with stakeholders.`);
    steps.push(`Break the work into two focused working blocks for ${context.projectName}.`);
  }

  if (steps.length < 3) {
    steps.push('Schedule a quick sync to validate the done definition and unblock execution.');
  }

  return dedupePreserveOrder(steps, 5);
};

const buildGenericDraft = (
  task: EnhancedTask,
  executionSteps: string[],
  researchNotes: string[],
  context: TemplateContext
): string => {
  const lines: string[] = [
    `# ${context.projectName}: ${task.title}`,
    ''
  ];

  if (task.description) {
    lines.push(`Objective: ${task.description}`);
  } else {
    lines.push(`Objective: Deliver a concrete outcome that moves ${context.projectName} forward.`);
  }

  if (task.goal?.targetDate) {
    lines.push(`Due: ${formatDateShort(task.goal.targetDate)} (${formatRelativeDate(task.goal.targetDate) ?? 'timeline confirmed'})`);
  }

  lines.push('');
  lines.push('Execution Outline:');
  executionSteps.forEach((step, index) => {
    lines.push(`${index + 1}. ${step}`);
  });

  if (researchNotes.length) {
    lines.push('');
    lines.push('Context Notes:');
    researchNotes.forEach((note) => lines.push(`- ${note}`));
  }

  return lines.join('\n');
};

const determineReadinessBadge = (task: EnhancedTask, insights: TaskInsights): BadgeConfig => {
  const strongPlan = insights.executionSteps.length >= 3 && insights.researchNotes.length >= 2;
  const hasDraft = Boolean(insights.aiDraft);

  if (task.priority === Priority.High) {
    if (strongPlan) return READINESS_BADGE_THEME['Ready to Execute'];
    return READINESS_BADGE_THEME['Critical Path'];
  }

  if (strongPlan) {
    return READINESS_BADGE_THEME['Ready to Execute'];
  }

  if (hasDraft) {
    return READINESS_BADGE_THEME['Draft Prepared'];
  }

  return READINESS_BADGE_THEME['Context Ready'];
};

const buildMetadataChips = (task: EnhancedTask): string[] => {
  const chips: string[] = [];

  if (task.goal?.name) {
    chips.push(`Goal: ${task.goal.name}`);
  }

  const relative = formatRelativeDate(task.goal?.targetDate);
  if (relative) {
    chips.push(relative);
  }

  if (task.projectDetails?.priority) {
    const priorityLabel = task.projectDetails.priority.charAt(0).toUpperCase() + task.projectDetails.priority.slice(1);
    chips.push(`${priorityLabel} priority`);
  }

  if (typeof task.rollover_count === 'number' && task.rollover_count > 0) {
    chips.push(`Rolled over ${task.rollover_count}×`);
  }

  return dedupePreserveOrder(chips, 3);
};

const normaliseColor = (color?: string): string => {
  if (!color) return '#3b82f6';
  if (color.startsWith('#')) return color;
  return TAILWIND_COLOR_MAP[color] ?? '#3b82f6';
};

const hexToRgba = (hex: string, alpha: number): string => {
  let normalized = hex.trim();
  if (!normalized.startsWith('#')) {
    return `rgba(59, 130, 246, ${alpha})`;
  }

  normalized = normalized.slice(1);
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (normalized.length !== 6) {
    return `rgba(59, 130, 246, ${alpha})`;
  }

  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildCardBackground = (color?: string): React.CSSProperties => {
  const base = normaliseColor(color);
  return {
    background: `linear-gradient(140deg, rgba(20, 24, 34, 0.85) 0%, ${hexToRgba(base, 0.32)} 100%)`,
    borderColor: hexToRgba(base, 0.45)
  };
};

const generateTaskInsights = (task: EnhancedTask, projectName: string): TaskInsights => {
  const context: TemplateContext = { task, projectName };
  const rawText = `${task.title} ${task.description ?? ''} ${projectName}`;
  const template = KEYWORD_TEMPLATES.find((candidate) => candidate.pattern.test(rawText));

  const knowledgeNotes = extractKnowledgeNotes(task, context);
  const templateNotes = template ? template.research(context) : [];
  const fallbackNotes = buildFallbackResearchNotes(task, context);
  const researchNotes = dedupePreserveOrder([...knowledgeNotes, ...templateNotes, ...fallbackNotes], 3);

  const templateSteps = template ? template.steps(context) : [];
  const fallbackSteps = buildFallbackExecutionSteps(task, context);
  const executionSteps = dedupePreserveOrder([...templateSteps, ...fallbackSteps], 5);

  const aiDraft =
    template?.draft?.(context) ??
    buildGenericDraft(task, executionSteps, researchNotes, context);

  return { researchNotes, executionSteps, aiDraft };
};

interface PriorityStreamProps {
  compact?: boolean;
  className?: string;
  priorityOnly?: boolean;
  context?: 'dashboard' | 'digital-brain';
}

export const PriorityStreamEnhanced: React.FC<PriorityStreamProps> = ({
  className,
  priorityOnly,
  context = 'digital-brain'
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'schedule' | 'priority'>('priority');
  const [milestonesCollapsed, setMilestonesCollapsed] = useState(true);

  const projects = usePersonasStore((state) => state.projects);
  const updateTask = usePersonasStore((state) => state.updateTask);
  const synchronizeWorkspace = usePersonasStore((state) => state.synchronizeWorkspace);

  useEffect(() => {
    const handlePriorityStreamRefresh = async () => {
      console.log('🔄 Priority stream refresh event received');
      try {
        const profile = usePersonasStore.getState().currentPersona;
        if (profile) {
          await synchronizeWorkspace(profile.id);
          console.log('✅ Priority stream data refreshed');
        }
      } catch (error) {
        console.error('❌ Failed to refresh priority stream data:', error);
      }
    };

    window.addEventListener('atmo:priority-stream:refresh', handlePriorityStreamRefresh);
    return () =>
      window.removeEventListener('atmo:priority-stream:refresh', handlePriorityStreamRefresh);
  }, [synchronizeWorkspace]);

  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    console.log(`✏️ [${new Date().toLocaleTimeString()}] Updating task completion:`, taskId, completed);
    await updateTask(null, taskId, { completed });
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const updated = new Set(prev);
      if (updated.has(taskId)) {
        updated.delete(taskId);
      } else {
        updated.add(taskId);
      }
      return updated;
    });
  };

  const outstandingTasks = useMemo<EnhancedTask[]>(() => {
    const taskMap = new Map<string, EnhancedTask>();

    projects.forEach((project) => {
      const projectColor = normaliseColor(project.color);
      const knowledgeItems = project.items ?? [];
      const projectDetails: ProjectDetails = {
        description: project.description,
        notes: project.notes,
        tags: project.tags,
        priority: typeof project.priority === 'string' ? project.priority : undefined,
        color: project.color,
        knowledgeItems
      };

      (project.goals ?? []).forEach((goal) => {
        const goalSummary: TaskGoalSummary = {
          id: goal.id,
          name: goal.name,
          targetDate: goal.targetDate,
          priority: goal.priority,
          status: goal.status
        };

        (goal.tasks ?? []).forEach((task) => {
          if (task.completed || task.archived_at) {
            return;
          }

          const candidate: EnhancedTask = {
            id: task.id,
            title: task.name,
            description: task.description,
            priority: task.priority,
            project: project.name,
            projectId: project.id,
            projectColor,
            projectDetails,
            goal: goalSummary,
            completed: task.completed,
            estimatedMinutes: typeof task.estimated_time === 'number' ? task.estimated_time : undefined,
            timeLabel: formatEstimatedTimeLabel(task.estimated_time ?? undefined, task.priority),
            created_at: task.created_at,
            updated_at: task.updated_at,
            rollover_count: task.rollover_count,
            archived_at: task.archived_at ?? null
          };

          const existing = taskMap.get(task.id);
          if (!existing) {
            taskMap.set(task.id, candidate);
            return;
          }

          const existingTimestamp = new Date(existing.updated_at ?? existing.created_at ?? 0).getTime();
          const candidateTimestamp = new Date(candidate.updated_at ?? candidate.created_at ?? 0).getTime();
          if (candidateTimestamp >= existingTimestamp) {
            taskMap.set(task.id, candidate);
          }
        });
      });
    });

    return Array.from(taskMap.values());
  }, [projects]);

  const priorityWeight: Record<Priority, number> = {
    [Priority.High]: 0,
    [Priority.Medium]: 1,
    [Priority.Low]: 2
  };

  const sortedTasks = useMemo(() => {
    return [...outstandingTasks].sort((a, b) => {
      const weightDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (weightDiff !== 0) return weightDiff;

      const dateA = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const dateB = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return a.title.localeCompare(b.title);
    });
  }, [outstandingTasks, priorityWeight]);

  const tasksToShow = useMemo(() => {
    const limit = context === 'dashboard' ? 8 : 6;
    return sortedTasks.slice(0, limit);
  }, [sortedTasks, context]);

  const priorityTotals = useMemo(() => {
    return sortedTasks.reduce(
      (acc, task) => {
        acc[task.priority] += 1;
        return acc;
      },
      {
        [Priority.High]: 0,
        [Priority.Medium]: 0,
        [Priority.Low]: 0
      } as Record<Priority, number>
    );
  }, [sortedTasks]);

  const crossProjectBalance = useMemo(() => {
    const projectEffort = new Map<
      string,
      {
        hours: number;
        color: string;
      }
    >();

    sortedTasks.forEach((task) => {
      const projectName = task.project ?? 'Uncategorized';
      const projectColor = task.projectDetails?.color ?? '#3b82f6';
      let hours = 1;

      if (typeof task.estimatedMinutes === 'number') {
        hours = Math.max(0.5, task.estimatedMinutes / 60);
      } else if (task.priority === Priority.High) {
        hours = 2;
      }

      const existing = projectEffort.get(projectName);
      if (existing) {
        existing.hours += hours;
      } else {
        projectEffort.set(projectName, { hours, color: projectColor });
      }
    });

    const totalHours = Array.from(projectEffort.values()).reduce((sum, { hours }) => sum + hours, 0);
    if (totalHours === 0) {
      return { projectBreakdown: [], totalHours: 0, hasData: false };
    }

    const projectBreakdown = Array.from(projectEffort.entries()).map(([project, { hours, color }]) => ({
      project,
      hours,
      color,
      percentage: Math.round((hours / totalHours) * 100)
    }));

    const currentSum = projectBreakdown.reduce((sum, { percentage }) => sum + percentage, 0);
    if (currentSum !== 100 && projectBreakdown.length > 0) {
      projectBreakdown[0].percentage += 100 - currentSum;
    }

    return { projectBreakdown, totalHours, hasData: true };
  }, [sortedTasks]);

  const upcomingMilestones = useMemo(() => {
    const rawMilestones = projects.flatMap((project) =>
      (project.milestones ?? []).map((milestone) => {
        const dueDate = milestone.due_date ? new Date(milestone.due_date) : null;
        const isValidDate = dueDate && !Number.isNaN(dueDate.getTime());
        return {
          id: milestone.id,
          name: milestone.name,
          dueDateLabel: isValidDate
            ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : 'No date',
          project: project.name,
          order: isValidDate ? dueDate.getTime() : Number.POSITIVE_INFINITY
        };
      })
    );

    return rawMilestones
      .filter((milestone) => milestone.name.trim())
      .sort((a, b) => a.order - b.order)
      .slice(0, 4)
      .map(({ order: _order, ...rest }) => rest);
  }, [projects]);

  const headerSubTitle = sortedTasks.length
    ? `${sortedTasks.length} active task${sortedTasks.length === 1 ? '' : 's'}`
    : 'Everything is clear';

  const priorityCards = useMemo<PriorityTaskCard[]>(() => {
    return tasksToShow.map((task) => {
      const projectName = task.project ?? 'YourSelf';
      const insights = generateTaskInsights(task, projectName);
      const primaryBadge = PRIORITY_BADGE_THEME[task.priority];
      const secondaryBadge = determineReadinessBadge(task, insights);
      const metadataChips = buildMetadataChips(task);
      const background = buildCardBackground(task.projectDetails?.color);

      return {
        ...task,
        projectName,
        researchNotes: insights.researchNotes,
        executionSteps: insights.executionSteps,
        aiDraft: insights.aiDraft,
        primaryBadge,
        secondaryBadge,
        metadataChips,
        background
      };
    });
  }, [tasksToShow]);

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 glass-card bg-black/60 backdrop-blur-xl',
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-white">Priority Stream</h3>
          <p className="text-xs text-white/40 mt-0.5">{headerSubTitle}</p>
        </div>
        {!priorityOnly && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Menu size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Grid3x3 size={16} />
              </button>
            </div>
            <button
              onClick={() => setActiveTab(activeTab === 'schedule' ? 'priority' : 'schedule')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 transition-colors flex items-center gap-1.5"
            >
              <Calendar size={12} />
              {activeTab === 'schedule' ? 'Schedule' : 'Priority'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'priority' ? (
          priorityCards.length ? (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid gap-5 md:grid-cols-2 auto-rows-fr'
                  : 'flex flex-col gap-5'
              )}
            >
              {priorityCards.map((card) => {
                const isExpanded = expandedTasks.has(card.id);
                const accentColor = normaliseColor(card.projectDetails?.color);

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden rounded-3xl border shadow-[0_18px_40px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-[2px]"
                    style={{
                      borderColor: hexToRgba(accentColor, 0.65),
                      backgroundImage: `linear-gradient(145deg, ${hexToRgba(accentColor, 0.18)} 0%, rgba(12, 17, 27, 0.9) 50%, rgba(5, 8, 16, 0.95) 100%)`
                    }}
                  >
                    <div className="p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={card.completed}
                            onCheckedChange={(checked) => handleTaskCompletion(card.id, Boolean(checked))}
                            className="mt-1 h-4 w-4 border-white/30 data-[state=checked]:bg-[#ff7000] data-[state=checked]:border-[#ff7000]"
                          />

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/55">
                              <span
                                className="inline-flex h-2 w-2 rounded-full"
                                style={{ backgroundColor: accentColor }}
                              />
                              <span>{card.projectName}</span>
                              {card.goal?.name && (
                                <span className="text-white/35 tracking-[0.2em] normal-case">
                                  ↳ {card.goal.name}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-xl font-semibold leading-tight text-white">{card.title}</h4>
                              {card.description && (
                                <p className="text-sm text-white/70 leading-relaxed">
                                  {card.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-4">
                          <span className="text-xs text-white/45">{card.timeLabel}</span>
                          <button
                            onClick={() => toggleTaskExpansion(card.id)}
                            className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10"
                            aria-label="Toggle task details"
                          >
                            <ChevronDown
                              size={14}
                              className={cn(
                                'transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="ml-7 flex flex-wrap gap-2">
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide',
                            card.primaryBadge.className
                          )}
                        >
                          {card.primaryBadge.label}
                        </span>
                        {card.secondaryBadge.label !== card.primaryBadge.label && (
                          <span
                            className={cn(
                              'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide',
                              card.secondaryBadge.className
                            )}
                          >
                            {card.secondaryBadge.label}
                          </span>
                        )}
                      </div>

                      {card.metadataChips.length > 0 && (
                        <div className="ml-7 flex flex-wrap gap-2">
                          {card.metadataChips.map((chip, index) => (
                            <span
                              key={index}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-white/55"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}

                      {isExpanded && (
                        <div className="space-y-5 border-t border-white/10 pt-5">
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                              <div className="flex items-center gap-2">
                                <div className="rounded-full bg-emerald-400/15 p-2 text-emerald-200/90">
                                  <Sparkles size={16} />
                                </div>
                                <h5 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
                                  Research Notes
                                </h5>
                              </div>
                              <ul className="mt-3 space-y-2 text-sm text-white/75">
                                {card.researchNotes.map((note, idx) => (
                                  <li
                                    key={idx}
                                    className="relative border-l-2 border-white/10 pl-3 leading-snug"
                                  >
                                    <span className="absolute -left-[5px] top-[10px] h-2 w-2 rounded-full bg-white/20" />
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                              <div className="flex items-center gap-2">
                                <div className="rounded-full bg-purple-400/15 p-2 text-purple-200/90">
                                  <ListChecks size={16} />
                                </div>
                                <h5 className="text-sm font-semibold text-white/80 tracking-wide uppercase">
                                  Execution Steps
                                </h5>
                              </div>
                              <ol className="mt-3 space-y-2 text-sm text-white/75 list-decimal list-inside">
                                {card.executionSteps.map((step, idx) => (
                                  <li key={idx} className="leading-snug">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>

                          {card.aiDraft && (
                            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                              <h5 className="text-sm font-semibold uppercase tracking-wide text-white/65">
                                AI-Generated Draft
                              </h5>
                              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-4 text-xs leading-relaxed text-white/80">
                                <code>{card.aiDraft}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/50">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Menu size={22} />
              </div>
              <p className="text-sm font-medium">No high priorities captured yet</p>
              <p className="text-xs text-white/40 mt-1">
                Ask ATMO to add a concrete task and it will land here with the full brief.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Today's Allocation</h4>
              {crossProjectBalance.hasData ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                    <span>Cross-project effort</span>
                    <span>{Math.round(crossProjectBalance.totalHours)}h scheduled</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="absolute inset-0 flex">
                      {crossProjectBalance.projectBreakdown.map((project, idx) => (
                        <div
                          key={idx}
                          className="h-full"
                          style={{
                            width: `${project.percentage}%`,
                            backgroundColor: hexToRgba(normaliseColor(project.color), 0.65)
                          }}
                          title={`${project.project}: ${project.hours.toFixed(1)}h (${project.percentage}%)`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/50">
                    {crossProjectBalance.projectBreakdown.map((project, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: hexToRgba(normaliseColor(project.color), 0.8) }}
                        />
                        {project.project}: {project.percentage}%
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/50">No work blocks booked yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Priority Mix</h4>
              <div className="flex gap-3">
                <div className="flex flex-col items-start">
                  <span className="text-lg font-semibold text-white">{priorityTotals[Priority.High]}</span>
                  <span className="text-xs text-white/50">Launch blockers</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-semibold text-white">{priorityTotals[Priority.Medium]}</span>
                  <span className="text-xs text-white/50">Execute next</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-semibold text-white">{priorityTotals[Priority.Low]}</span>
                  <span className="text-xs text-white/50">Context ready</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Upcoming Milestones</h4>
              {upcomingMilestones.length ? (
                <div className="space-y-3 text-sm text-white/70">
                  {upcomingMilestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: ['#60a5fa66', '#a855f766', '#fbbf2466', '#22d3ee66'][idx % 4]
                          }}
                        />
                        <span>{milestone.name}</span>
                        <span className="text-xs uppercase tracking-wide text-white/40">
                          {milestone.project}
                        </span>
                      </div>
                      <span className="text-xs text-white/50">{milestone.dueDateLabel}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50">No milestones on the calendar yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'priority' && (
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50">
          <button
            onClick={() => setMilestonesCollapsed(!milestonesCollapsed)}
            className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <h4 className="text-xs uppercase tracking-wide text-white/40">End-of-Day Milestones</h4>
            </div>
            <ChevronDown
              size={14}
              className={cn('text-white/40 transition-transform', milestonesCollapsed && 'rotate-180')}
            />
          </button>

          {!milestonesCollapsed && (
            <div className="space-y-4">
              {crossProjectBalance.hasData ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/40" />
                      <span className="text-xs uppercase tracking-wide text-white/40">
                        Cross-Project Balance
                      </span>
                    </div>
                    <span className="text-xs text-white/50">
                      {Math.round(crossProjectBalance.totalHours)}h total
                    </span>
                  </div>

                  <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className="absolute inset-0 flex">
                      {crossProjectBalance.projectBreakdown.map((project, idx) => (
                        <div
                          key={idx}
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${project.percentage}%`,
                            backgroundColor: hexToRgba(normaliseColor(project.color), 0.65)
                          }}
                          title={`${project.project}: ${project.hours.toFixed(1)}h (${project.percentage}%)`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {crossProjectBalance.projectBreakdown.map((project, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: hexToRgba(normaliseColor(project.color), 0.8) }}
                        />
                        <span className="text-[10px] text-white/60">
                          {project.project}: {project.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/30">No active work scheduled for today.</div>
              )}

              <div className="space-y-3">
                {upcomingMilestones.length ? (
                  upcomingMilestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between text-xs text-white/70"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: ['rgb(96 165 250 / 0.4)', 'rgb(167 139 250 / 0.4)', 'rgb(251 191 36 / 0.4)', 'rgb(45 212 191 / 0.4)'][index % 4]
                          }}
                        />
                        <span className="font-medium text-white/80">{milestone.name}</span>
                        {milestone.project && (
                          <span className="text-[10px] text-white/40 uppercase tracking-wide">
                            {milestone.project}
                          </span>
                        )}
                      </div>
                      <span className="text-white/50">{milestone.dueDateLabel}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/30">No upcoming milestones captured yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriorityStreamEnhanced;
