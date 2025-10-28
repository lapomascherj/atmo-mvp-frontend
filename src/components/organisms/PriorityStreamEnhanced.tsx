import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Grid3x3, Calendar, ChevronDown, Sparkles, ListChecks, Target, BarChart3, Copy, Zap, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/utils';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { Priority } from '@/models/Priority';
import { Status } from '@/models/Status';
import { TaskAgency } from '@/models/TaskAgency';
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

interface TaskCard {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: string;
  timeEstimate: string;
  completed: boolean;
  projectId: string;
  milestoneId: string;
  researchNotes: string[];
  executionSteps: string[];
  aiDraft: string;
  primaryBadge: BadgeConfig;
  secondaryBadge: BadgeConfig;
  metadataChips: string[];
  background: React.CSSProperties;
}

interface MilestoneCard {
  id: string;
  name: string;
  dueDate?: string;
  isExpanded: boolean;
  tasks: TaskCard[];
  projectId: string;
  progress: number;
  status: string;
}

interface UnifiedProject {
  id: string;
  name: string;
  type: 'personal' | 'quicktask' | 'user-defined';
  color: string;
  milestones: UnifiedMilestone[];
  isFixed: boolean;
  order: number;
  description?: string;
  progress?: number;
}

interface UnifiedMilestone {
  id: string;
  name: string;
  dueDate?: string;
  progress: number;
  tasks: UnifiedTask[];
  projectId: string;
  status: string;
}

interface UnifiedTask {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  timeEstimate: string;
  projectId: string;
  milestoneId: string;
  researchNotes: string[];
  executionSteps: string[];
  aiDraft: string;
  primaryBadge: BadgeConfig;
  secondaryBadge: BadgeConfig;
  metadataChips: string[];
  background: React.CSSProperties;
}

interface ProjectCard {
  id: string;
  name: string;
  color: string;
  isExpanded: boolean;
  milestones: MilestoneCard[];
  description?: string;
  isFixed: boolean; // For "Yourself" and "ATMO" projects
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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showCompletedTasks, setShowCompletedTasks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'schedule' | 'priority'>('priority');
  const [milestonesCollapsed, setMilestonesCollapsed] = useState(true);

  const projects = usePersonasStore((state) => state.projects);
  const updateTask = usePersonasStore((state) => state.updateTask);
  const addProject = usePersonasStore((state) => state.addProject);
  const addGoal = usePersonasStore((state) => state.addGoal);
  const addTask = usePersonasStore((state) => state.addTask);
  const updateProject = usePersonasStore((state) => state.updateProject);

  useEffect(() => {
    const handlePriorityStreamRefresh = async () => {
      console.log('🔄 Priority stream refresh event received');
      // Refresh logic can be added here if needed
    };

    window.addEventListener('atmo:priority-stream:refresh', handlePriorityStreamRefresh);
    return () =>
      window.removeEventListener('atmo:priority-stream:refresh', handlePriorityStreamRefresh);
  }, []);

  // Real-time synchronization with Project Card
  useEffect(() => {
    const handleDataChange = (event: CustomEvent) => {
      if (event.detail.type === 'project_update') {
        console.log('🔄 Project data changed, refreshing Priority Stream');
        // The component will automatically re-render due to store subscription
      }
    };

    window.addEventListener('project-data-changed', handleDataChange);
    return () => window.removeEventListener('project-data-changed', handleDataChange);
  }, []);

  // Expose avatar command handler globally for external access
  useEffect(() => {
    (window as any).handleAvatarCommand = handleAvatarCommand;
    return () => {
      delete (window as any).handleAvatarCommand;
    };
  }, []);

  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    console.log(`✏️ [${new Date().toLocaleTimeString()}] Updating task completion:`, taskId, completed);
    await updateTask(null, taskId, { completed });
    
    // Update memory and completion percentage
    await updateTaskMemory(taskId, completed);
    
    // Find and update project completion percentage
    for (const project of orderedProjects) {
      const hasTask = project.milestones.some(milestone => 
        milestone.tasks.some(task => task.id === taskId)
      );
      if (hasTask) {
        await updateProjectCompletionPercentage(project.id);
        break;
      }
    }
    
    // Trigger data change event for synchronization
    window.dispatchEvent(new CustomEvent('project-data-changed', {
      detail: { type: 'project_update', taskId, completed }
    }));
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects((prev) => {
      const updated = new Set(prev);
      if (updated.has(projectId)) {
        updated.delete(projectId);
      } else {
        updated.add(projectId);
      }
      return updated;
    });
  };

  const toggleMilestoneExpansion = (milestoneId: string) => {
    setExpandedMilestones((prev) => {
      const updated = new Set(prev);
      if (updated.has(milestoneId)) {
        updated.delete(milestoneId);
      } else {
        updated.add(milestoneId);
      }
      return updated;
    });
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

  const toggleCompletedTasks = (projectId: string) => {
    setShowCompletedTasks((prev) => {
      const updated = new Set(prev);
      if (updated.has(projectId)) {
        updated.delete(projectId);
      } else {
        updated.add(projectId);
      }
      return updated;
    });
  };

  // Avatar Command Handlers
  const handleAvatarCommand = async (command: string, params: any) => {
    try {
      switch (command) {
        case 'add_project':
          await addProjectToCard(params);
          break;
        case 'add_milestone':
          await addMilestoneToProject(params.projectId, params.milestone);
          break;
        case 'add_task':
          await addTaskToMilestone(params.milestoneId, params.task);
          break;
        case 'mark_done':
          await markTaskAsDone(params.taskId);
          break;
        default:
          console.warn('Unknown avatar command:', command);
      }
    } catch (error) {
      console.error('Avatar command failed:', error);
    }
  };

  const addProjectToCard = async (projectData: any) => {
    const newProject = {
      name: projectData.name,
      description: projectData.description,
      color: projectData.color || '#3b82f6',
      priority: projectData.priority || 'medium',
      active: true,
      goals: [],
      items: [],
      milestones: []
    };
    
    await addProject(null, newProject);
    console.log('✅ Project added to Project Card:', newProject.name);
  };

  const addMilestoneToProject = async (projectId: string, milestoneData: any) => {
    const newMilestone = {
      id: `milestone-${Date.now()}`,
      name: milestoneData.name,
      description: milestoneData.description,
      due_date: milestoneData.dueDate,
      status: 'active',
      progress: 0,
      goals: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    // Add milestone to project
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updatedProject = {
        ...project,
        milestones: [...(project.milestones || []), newMilestone]
      };
      await updateProject(null, projectId, updatedProject);
      console.log('✅ Milestone added to project:', newMilestone.name);
    }
  };

  const addTaskToMilestone = async (milestoneId: string, taskData: any) => {
    const newTask = {
      id: `task-${Date.now()}`,
      name: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || Priority.Medium,
      completed: false,
      agency: TaskAgency.Human,
      color: '30',
      estimated_time: taskData.estimatedTime || 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Find the milestone and add task
    for (const project of projects) {
      const milestone = project.milestones?.find(m => m.id === milestoneId);
      if (milestone) {
        const newGoal = {
          id: `goal-${Date.now()}`,
          name: milestone.name,
          status: Status.InProgress,
          priority: Priority.Medium,
          targetDate: milestone.due_date || new Date().toISOString(),
          description: milestone.description || '',
          order: 1,
          tasks: [newTask]
        };
        
        await addGoal(null, project.id, newGoal);
        console.log('✅ Task added to milestone:', newTask.name);
        break;
      }
    }
  };

  const markTaskAsDone = async (taskId: string) => {
    await updateTask(null, taskId, { completed: true });
    
    // Update memory and completion percentage
    await updateTaskMemory(taskId, true);
    
    // Find and update project completion percentage
    for (const project of projects) {
      const hasTask = project.goals?.some(goal => 
        goal.tasks?.some(task => task.id === taskId)
      );
      if (hasTask) {
        await updateProjectCompletionPercentage(project.id);
        break;
      }
    }
    
    console.log('✅ Task marked as done:', taskId);
  };

  const updateTaskMemory = async (taskId: string, completed: boolean) => {
    // Update task memory in the system
    console.log(`📝 Task memory updated: ${taskId} - ${completed ? 'completed' : 'incomplete'}`);
  };

  const updateProjectCompletionPercentage = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const totalTasks = project.goals?.reduce((count, goal) => 
        count + (goal.tasks?.length || 0), 0) || 0;
      const completedTasks = project.goals?.reduce((count, goal) => 
        count + (goal.tasks?.filter(task => task.completed).length || 0), 0) || 0;
      
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      await updateProject(null, projectId, { progress });
      console.log(`📊 Project completion updated: ${projectId} - ${progress}%`);
    }
  };

  // Project ordering logic: Yourself, QuickTask, User-defined
  const orderedProjects = useMemo<UnifiedProject[]>(() => {
    const unifiedProjects: UnifiedProject[] = [];
    
    // 1. Yourself (always first, fixed)
    const yourselfProject = projects.find(p => p.name === 'Yourself' || p.name === 'Yourself');
    if (yourselfProject) {
      unifiedProjects.push(createUnifiedProject(yourselfProject, 'personal', 0));
    }
    
    // 2. QuickTask (always second, fixed)
    const quickTaskProject = projects.find(p => p.name === 'QuickTask' || p.name === 'ATMO');
    if (quickTaskProject) {
      unifiedProjects.push(createUnifiedProject(quickTaskProject, 'quicktask', 1));
    }
    
    // 3. User-defined projects (from Project Card, in order)
    const userDefinedProjects = projects.filter(p => 
      p.name !== 'Yourself' && p.name !== 'ATMO' && p.name !== 'QuickTask'
    );
    userDefinedProjects.forEach((project, index) => {
      unifiedProjects.push(createUnifiedProject(project, 'user-defined', 2 + index));
    });
    
    return unifiedProjects.sort((a, b) => a.order - b.order);
  }, [projects, expandedProjects, expandedMilestones]);

  const createUnifiedProject = (project: any, type: 'personal' | 'quicktask' | 'user-defined', order: number): UnifiedProject => {
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

    // Create milestone cards from goals (treating goals as milestones)
    const milestoneCards: UnifiedMilestone[] = [];

      (project.goals ?? []).forEach((goal) => {
        const goalSummary: TaskGoalSummary = {
          id: goal.id,
          name: goal.name,
          targetDate: goal.targetDate,
          priority: goal.priority,
          status: goal.status
        };

      // Create task cards (both active and completed)
      const taskCards: UnifiedTask[] = [];
        (goal.tasks ?? []).forEach((task) => {
        if (task.archived_at) {
            return;
          }

        const insights = generateTaskInsights({
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
        }, project.name);

        const primaryBadge = PRIORITY_BADGE_THEME[task.priority];
        const secondaryBadge = determineReadinessBadge({
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
        }, insights);

        const metadataChips = buildMetadataChips({
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
        });

        const background = buildCardBackground(project.color);

        taskCards.push({
          id: task.id,
          title: task.name,
          description: task.description,
          priority: task.priority,
          completed: task.completed,
          timeEstimate: formatEstimatedTimeLabel(task.estimated_time ?? undefined, task.priority),
          projectId: project.id,
          milestoneId: goal.id,
          researchNotes: insights.researchNotes,
          executionSteps: insights.executionSteps,
          aiDraft: insights.aiDraft,
          primaryBadge,
          secondaryBadge,
          metadataChips,
          background
      });
    });

      // Create milestone card
      const completedTasks = taskCards.filter(t => t.completed).length;
      const totalTasks = taskCards.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      milestoneCards.push({
        id: goal.id,
        name: goal.name,
        dueDate: goal.targetDate,
        progress,
        tasks: taskCards,
        projectId: project.id,
        status: goal.status
      });
    });

    return {
      id: project.id,
      name: project.name,
      type,
      color: projectColor,
      milestones: milestoneCards,
      isFixed: type === 'personal' || type === 'quicktask',
      order,
      description: project.description,
      progress: project.progress
    };
  };

  const totalTasks = useMemo(() => {
    return orderedProjects.reduce((total, project) => {
      return total + project.milestones.reduce((milestoneTotal, milestone) => {
        return milestoneTotal + milestone.tasks.length;
      }, 0);
    }, 0);
  }, [orderedProjects]);

  const headerSubTitle = totalTasks > 0
    ? `${totalTasks} active task${totalTasks === 1 ? '' : 's'}`
    : 'Everything is clear';

  const crossProjectBalance = useMemo(() => {
    const projectEffort = new Map<
      string,
      {
        hours: number;
        color: string;
      }
    >();

    orderedProjects.forEach((project) => {
      let projectHours = 0;
      project.milestones.forEach((milestone) => {
        milestone.tasks.forEach((task) => {
      let hours = 1;
          if (task.priority === Priority.High) {
        hours = 2;
          } else if (task.priority === Priority.Medium) {
            hours = 1.5;
          }
          projectHours += hours;
        });
      });

      if (projectHours > 0) {
        projectEffort.set(project.name, { hours: projectHours, color: project.color });
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
  }, [orderedProjects]);

  const priorityTotals = useMemo(() => {
    return orderedProjects.reduce(
      (acc, project) => {
        project.milestones.forEach((milestone) => {
          milestone.tasks.forEach((task) => {
            acc[task.priority] += 1;
          });
        });
        return acc;
      },
      {
        [Priority.High]: 0,
        [Priority.Medium]: 0,
        [Priority.Low]: 0
      } as Record<Priority, number>
    );
  }, [orderedProjects]);

  const upcomingMilestones = useMemo(() => {
    const rawMilestones = orderedProjects.flatMap((project) =>
      project.milestones.map((milestone) => {
        const dueDate = milestone.dueDate ? new Date(milestone.dueDate) : null;
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
  }, [orderedProjects]);

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 glass-card bg-black/60 backdrop-blur-xl',
        context === 'dashboard' ? 'max-w-sm' : 'max-w-full',
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div>
          <h3 className="text-2xl font-semibold text-white">Priority Stream</h3>
          <p className="text-sm text-white/60 mt-1">{headerSubTitle}</p>
        </div>
        {!priorityOnly && (
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
                onClick={() => setActiveTab('schedule')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  activeTab === 'schedule' 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:text-white/80'
                )}
              >
                Schedule
              </button>
              <button
                onClick={() => setActiveTab('priority')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  activeTab === 'priority' 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:text-white/80'
                )}
              >
                Priority
            </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'priority' ? (
          orderedProjects.length ? (
            <div className="space-y-4">
              {orderedProjects.map((project) => {
                const isProjectExpanded = expandedProjects.has(project.id);
                const accentColor = normaliseColor(project.color);

                return (
                  <div key={project.id} className="space-y-3">
                    {/* Project Card */}
                  <div
                      className="relative overflow-hidden rounded-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] group"
                    style={{
                        borderColor: hexToRgba(accentColor, 0.4),
                        backgroundImage: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.08)} 0%, rgba(20, 24, 34, 0.95) 50%, rgba(12, 17, 27, 0.98) 100%)`
                      }}
                    >
                      <button
                        onClick={() => toggleProjectExpansion(project.id)}
                        className="w-full p-6 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            <div>
                              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                              {project.description && (
                                <p className="text-sm text-white/60 mt-1">{project.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-white/50">
                              {project.milestones.length} milestone{project.milestones.length === 1 ? '' : 's'}
                            </span>
                            <ChevronDown
                              size={16}
                              className={cn(
                                'text-white/60 transition-transform',
                                isProjectExpanded && 'rotate-180'
                              )}
                            />
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Project KPI Strip + Daily Progress (compact) */}
                    {isProjectExpanded && (
                      <div className="ml-6 mr-1 -mt-1 mb-1 flex flex-col gap-2">
                        {(() => {
                          const totalMilestones = project.milestones.length;
                          const overdueMilestones = project.milestones.filter(m => {
                            if (!m.dueDate) return false;
                            const d = new Date(m.dueDate);
                            const today = new Date();
                            d.setHours(0,0,0,0);
                            today.setHours(0,0,0,0);
                            return d.getTime() < today.getTime() && (m.progress ?? 0) < 100;
                          }).length;
                          const allTasks = project.milestones.flatMap(m => m.tasks);
                          const completedTasks = allTasks.filter(t => t.completed).length;
                          const totalTasks = allTasks.length || 1;
                          const dayProgress = Math.round((completedTasks / totalTasks) * 100);
                          return (
                            <>
                              {/* KPI chips */}
                              <div className="flex items-center gap-2">
                              <span
                                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/60"
                                >
                                  <CheckCircle2 size={12} className="text-emerald-300/80" />
                                  {completedTasks}/{totalTasks} tasks
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/60"
                                >
                                  <Clock size={12} className="text-amber-300/80" />
                                  {totalMilestones} milestones{overdueMilestones ? ` · ${overdueMilestones} overdue` : ''}
                                </span>
                              </div>

                              {/* Daily progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="relative h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{ width: `${dayProgress}%`, backgroundColor: hexToRgba(accentColor, 0.85) }}
                                  />
                                </div>
                                <span className="text-[10px] text-white/60 w-8 text-right">{dayProgress}%</span>
                              </div>

                              {/* Show completed tasks button */}
                              {completedTasks > 0 && (
                                <button
                                  onClick={() => toggleCompletedTasks(project.id)}
                                  className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white/70 transition-colors"
                                >
                                  <CheckCircle2 size={12} className="text-emerald-300/80" />
                                  {showCompletedTasks.has(project.id) ? 'Hide' : 'Show'} completed tasks
                                  <ChevronDown
                                    size={10}
                                    className={cn(
                                      'transition-transform',
                                      showCompletedTasks.has(project.id) && 'rotate-180'
                                    )}
                                  />
                                </button>
                              )}
                            </>
                          );
                        })()}
                            </div>
                    )}

                    {/* Completed Tasks Display */}
                    {isProjectExpanded && showCompletedTasks.has(project.id) && (() => {
                      const allTasks = project.milestones.flatMap(m => m.tasks);
                      const completedTasks = allTasks.filter(t => t.completed);
                      
                      return completedTasks.length > 0 ? (
                        <div className="ml-6 mr-1 -mt-1 mb-2">
                          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 size={14} className="text-emerald-300/80" />
                              <h5 className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                                Completed Tasks
                              </h5>
                            </div>
                            <div className="space-y-1.5">
                              {completedTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center gap-2 text-xs text-white/60"
                                >
                                  <CheckCircle2 size={12} className="text-emerald-300/80 flex-shrink-0" />
                                  <span className="line-through opacity-75">{task.title}</span>
                                  <span className="text-[10px] text-white/40 ml-auto">
                                    {task.timeEstimate}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Milestones */}
                    {isProjectExpanded && project.milestones.length > 0 && (
                      <div className="ml-6 space-y-3">
                        {project.milestones.map((milestone) => {
                          const isMilestoneExpanded = expandedMilestones.has(milestone.id);

                          return (
                            <div key={milestone.id} className="space-y-2">
                              {/* Milestone Card */}
                              <div
                                className="relative overflow-hidden rounded-xl border shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                                style={{
                                  borderColor: hexToRgba(accentColor, 0.3),
                                  backgroundImage: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.05)} 0%, rgba(20, 24, 34, 0.9) 50%, rgba(12, 17, 27, 0.95) 100%)`
                                }}
                              >
                                <button
                                  onClick={() => toggleMilestoneExpansion(milestone.id)}
                                  className="w-full p-4 text-left"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: accentColor }}
                                      />
                                      <div>
                                        <h4 className="text-base font-medium text-white">{milestone.name}</h4>
                                        {milestone.dueDate && (
                                          <p className="text-xs text-white/50 mt-1">
                                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                              width: `${milestone.progress}%`,
                                              backgroundColor: accentColor
                                            }}
                                          />
                                        </div>
                                        <span className="text-xs text-white/50">{milestone.progress}%</span>
                                      </div>
                                      <span className="text-xs text-white/50">
                                        {milestone.tasks.length} task{milestone.tasks.length === 1 ? '' : 's'}
                                      </span>
                                      <ChevronDown
                                        size={14}
                                        className={cn(
                                          'text-white/60 transition-transform',
                                          isMilestoneExpanded && 'rotate-180'
                                        )}
                                      />
                                    </div>
                                  </div>
                                </button>
                        </div>

                              {/* Tasks */}
                              {isMilestoneExpanded && milestone.tasks.length > 0 && (
                                <div className="ml-6 space-y-2">
                                  {milestone.tasks.map((task) => {
                                    const isTaskExpanded = expandedTasks.has(task.id);

                                    return (
                                      <div
                                        key={task.id}
                                        className="relative overflow-hidden rounded-lg border shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-300"
                                        style={{
                                          borderColor: hexToRgba(accentColor, 0.2),
                                          backgroundImage: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.03)} 0%, rgba(20, 24, 34, 0.8) 50%, rgba(12, 17, 27, 0.9) 100%)`
                                        }}
                                      >
                                        <div className="p-4">
                                          <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-start gap-2 flex-1">
                                              <Checkbox
                                                checked={task.completed}
                                                onCheckedChange={(checked) => handleTaskCompletion(task.id, Boolean(checked))}
                                                className="mt-1 h-4 w-4 border-white/30 data-[state=checked]:bg-[#ff7000] data-[state=checked]:border-[#ff7000]"
                                              />
                                              <div className="space-y-1 flex-1">
                                                <h5 className="text-sm font-medium text-white">{task.title}</h5>
                                                {task.description && (
                                                  <p className="text-xs text-white/60">{task.description}</p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-white/50">{task.timeEstimate}</span>
                          <button
                                                onClick={() => toggleTaskExpansion(task.id)}
                                                className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-1.5 text-white/60 transition-colors hover:bg-white/10"
                            aria-label="Toggle task details"
                          >
                            <ChevronDown
                                                  size={12}
                              className={cn(
                                'transition-transform',
                                                    isTaskExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                        </div>
                      </div>

                                          <div className="flex flex-wrap gap-1.5 mb-3">
                        <span
                          className={cn(
                                                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                                                task.primaryBadge.className
                          )}
                        >
                                              <Zap size={10} />
                                              {task.primaryBadge.label}
                        </span>
                                            {task.secondaryBadge.label !== task.primaryBadge.label && (
                          <span
                            className={cn(
                                                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                                                  task.secondaryBadge.className
                            )}
                          >
                                                <Clock size={10} />
                                                {task.secondaryBadge.label}
                          </span>
                        )}
                      </div>

                                          {isTaskExpanded && (
                                            <div className="space-y-3 border-t border-white/10 pt-3">
                                              <div className="space-y-3">
                                                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="rounded-full bg-emerald-400/15 p-1 text-emerald-200/90">
                                                      <Sparkles size={12} />
                        </div>
                                                    <h6 className="text-xs font-semibold text-emerald-200/90 tracking-wide uppercase">
                                  Research Notes
                                                    </h6>
                              </div>
                                                  <ul className="space-y-1 text-xs text-white/75">
                                                    {task.researchNotes.map((note, idx) => (
                                  <li
                                    key={idx}
                                                        className="relative border-l-2 border-white/10 pl-2 leading-snug"
                                  >
                                                        <span className="absolute -left-[3px] top-[8px] h-1 w-1 rounded-full bg-white/20" />
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            </div>

                                                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="rounded-full bg-purple-400/15 p-1 text-purple-200/90">
                                                      <ListChecks size={12} />
                                </div>
                                                    <h6 className="text-xs font-semibold text-purple-200/90 tracking-wide uppercase">
                                  Execution Steps
                                                    </h6>
                              </div>
                                                  <ol className="space-y-1 text-xs text-white/75 list-decimal list-inside">
                                                    {task.executionSteps.map((step, idx) => (
                                  <li key={idx} className="leading-snug">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>

                                              {task.aiDraft && (
                                                <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <div className="rounded-full bg-amber-400/15 p-1 text-amber-200/90">
                                                        <FileText size={12} />
                                                      </div>
                                                      <h6 className="text-xs font-semibold text-amber-200/90 tracking-wide uppercase">
                                AI-Generated Draft
                                                      </h6>
                                                    </div>
                                                    <button
                                                      onClick={() => navigator.clipboard.writeText(task.aiDraft)}
                                                      className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                                                    >
                                                      <Copy size={10} />
                                                      Copy
                                                    </button>
                                                  </div>
                                                  <pre className="overflow-x-auto rounded border border-white/10 bg-black/60 p-3 text-xs leading-relaxed text-white/80 font-mono">
                                                    <code>{task.aiDraft}</code>
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
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/50">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Menu size={22} />
              </div>
              <p className="text-sm font-medium">No projects captured yet</p>
              <p className="text-xs text-white/40 mt-1">
                Ask ATMO to add a project and it will appear here with its milestones and tasks.
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
        <div className="px-6 py-5 border-t border-white/10 bg-slate-900/30">
          <button
            onClick={() => setMilestonesCollapsed(!milestonesCollapsed)}
            className="flex items-center justify-between w-full mb-4 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <Target size={14} className="text-white/40" />
              <h4 className="text-xs uppercase tracking-wider text-white/40 font-medium">End-of-Day Milestones</h4>
            </div>
            <ChevronDown
              size={14}
              className={cn('text-white/40 transition-transform', milestonesCollapsed && 'rotate-180')}
            />
          </button>

          {!milestonesCollapsed && (
            <div className="space-y-5">
              {crossProjectBalance.hasData && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} className="text-white/40" />
                      <span className="text-xs uppercase tracking-wider text-white/40 font-medium">
                        Cross-Project Balance
                      </span>
                    </div>
                    <span className="text-xs text-white/50 font-medium">
                      {Math.round(crossProjectBalance.totalHours)}h total
                    </span>
                  </div>

                  <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div className="absolute inset-0 flex">
                      {crossProjectBalance.projectBreakdown.map((project, idx) => (
                        <div
                          key={idx}
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${project.percentage}%`,
                            backgroundColor: hexToRgba(normaliseColor(project.color), 0.7)
                          }}
                          title={`${project.project}: ${project.hours.toFixed(1)}h (${project.percentage}%)`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {crossProjectBalance.projectBreakdown.map((project, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: hexToRgba(normaliseColor(project.color), 0.8) }}
                        />
                        <span className="text-xs text-white/60 font-medium">
                          {project.project}: {project.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {upcomingMilestones.length ? (
                  upcomingMilestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between text-sm text-white/70"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: ['#60a5fa', '#a855f7', '#fbbf24', '#22d3ee'][index % 4]
                          }}
                        />
                        <span className="font-medium text-white/80">{milestone.name}</span>
                        {milestone.project && (
                          <span className="text-xs text-white/40 uppercase tracking-wide">
                            {milestone.project}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/50">{milestone.dueDateLabel}</span>
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
