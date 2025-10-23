import { supabase } from '@/lib/supabase';
import type { Project } from '@/models/Project';
import type { Goal } from '@/models/Goal';
import type { Task } from '@/models/Task';
import type { Milestone } from '@/models/Milestone';
import type { KnowledgeItem } from '@/models/KnowledgeItem';
import { Priority } from '@/models/Priority';
import { Status } from '@/models/Status';
import { TaskAgency } from '@/models/TaskAgency';
import { KnowledgeType } from '@/models/KnowledgeType';
import type { PostgrestError } from '@supabase/supabase-js';

interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  color: string | null;
  progress: number | null;
  active: boolean | null;
  start_date: string | null;
  target_date: string | null;
  time_invested: number | null;
  last_update: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface GoalRow {
  id: string;
  owner_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  target_date: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  owner_id: string;
  project_id: string | null;
  goal_id: string | null;
  name: string;
  description: string | null;
  priority: string | null;
  completed: boolean | null;
  agency: string | null;
  color: string | null;
  estimated_time: number | null;
  due_date: string | null;
  rolled_over_from_date: string | null;
  rollover_count: number | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MilestoneRow {
  id: string;
  owner_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface KnowledgeItemRow {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  occurred_at: string;
  size: string | null;
  duration: string | null;
  source: string | null;
  starred: boolean | null;
  content: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ProjectKnowledgeLinkRow {
  project_id: string;
  knowledge_item_id: string;
  owner_id: string;
  created_at: string;
}

interface UserInsightRow {
  id: string;
  owner_id: string;
  category: string | null;
  insight_type: 'article' | 'opportunity' | 'trend' | 'note' | null;
  source_url: string | null;
  title: string;
  summary: string | null;
  action_label: string | null;
  action_url: string | null;
  relevance: number | null;
  project_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserInsight {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  insightType?: 'article' | 'opportunity' | 'trend' | 'note';
  sourceUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  relevance?: number;
  projectId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update user profile fields with write-through persistence
 * Maps persona fields to onboarding_data structure
 */
export const updateUserProfile = async (
  userId: string,
  updates: {
    nickname?: string;
    bio?: string;
    job_title?: string;
    mainPriority?: string;
    focusAreas?: string[];
    growthTracker?: string;
  }
): Promise<void> => {
  // Fetch current profile to merge with updates
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('onboarding_data')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw normaliseError(fetchError) ?? new Error('Failed to fetch current profile');
  }

  const currentData = (currentProfile?.onboarding_data ?? {}) as Record<string, any>;
  const personal = currentData.personal ?? {};
  const work = currentData.work ?? {};
  const performance = currentData.performance ?? {};

  // Map persona fields to onboarding_data structure
  const updatedData = {
    ...currentData,
    personal: {
      ...personal,
      ...(updates.nickname !== undefined && { nickname: updates.nickname }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
    },
    work: {
      ...work,
      ...(updates.job_title !== undefined && { role: updates.job_title }),
      ...(updates.focusAreas !== undefined && { focusAreas: updates.focusAreas }),
    },
    performance: {
      ...performance,
      ...(updates.mainPriority !== undefined && { northStar: updates.mainPriority }),
    },
  };

  const profileUpdates: any = { onboarding_data: updatedData };
  if (updates.growthTracker !== undefined) {
    profileUpdates.growth_tracker_text = updates.growthTracker;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId);

  if (updateError) {
    throw normaliseError(updateError) ?? new Error('Failed to update user profile');
  }
};

/**
 * Update active streak for user
 * Tracks consecutive days of activity
 */
export const updateActiveStreak = async (userId: string): Promise<void> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('last_activity_date, active_streak_days')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Failed to fetch streak data:', fetchError);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const lastActivityDate = profile?.last_activity_date;
  const currentStreak = profile?.active_streak_days ?? 0;

  let newStreak = currentStreak;

  if (!lastActivityDate) {
    // First activity ever
    newStreak = 1;
  } else {
    const lastDate = new Date(lastActivityDate).toISOString().split('T')[0];
    if (lastDate === today) {
      // Already counted today, no update needed
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      // Consecutive day
      newStreak = currentStreak + 1;
    } else {
      // Streak broken, restart
      newStreak = 1;
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      last_activity_date: today,
      active_streak_days: newStreak
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to update streak:', updateError);
  }
};

/**
 * Toggle Growth Tracker dismissed state
 * Persists UI preference for dismissing the growth tracker message
 */
export const toggleGrowthTrackerDismissed = async (userId: string, dismissed: boolean): Promise<void> => {
  const { error } = await supabase
    .from('user_ui_preferences')
    .upsert({
      user_id: userId,
      growth_tracker_dismissed: dismissed,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Failed to toggle growth tracker:', error);
    throw normaliseError(error) ?? new Error('Failed to update UI preferences');
  }
};

/**
 * Get Growth Tracker dismissed state
 */
export const getGrowthTrackerDismissed = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_ui_preferences')
    .select('growth_tracker_dismissed')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch growth tracker state:', error);
    return false;
  }

  return data?.growth_tracker_dismissed ?? false;
};

/**
 * Detect Focus Area misalignment based on chat history and onboarding data
 * Returns suggested focus areas if misalignment detected
 */
export const detectFocusAreaMisalignment = async (
  userId: string,
  recentMessages: string[],
  currentFocusAreas: string[]
): Promise<{ misaligned: boolean; suggestedAreas: string[] }> => {
  // Extract keywords from recent chat messages
  const messageText = recentMessages.join(' ').toLowerCase();

  // Common focus area keywords
  const keywords = [
    'productivity', 'efficiency', 'automation', 'optimization',
    'health', 'wellness', 'fitness', 'exercise',
    'learning', 'education', 'skill', 'development',
    'career', 'growth', 'promotion', 'leadership',
    'finance', 'budget', 'investment', 'savings',
    'relationships', 'networking', 'communication',
    'creativity', 'design', 'writing', 'content',
    'project', 'planning', 'organization', 'management'
  ];

  // Count keyword frequency
  const keywordCounts: Record<string, number> = {};
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
    const matches = messageText.match(regex);
    if (matches) {
      keywordCounts[keyword] = matches.length;
    }
  });

  // Get top 3 keywords
  const topKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([keyword]) => keyword);

  // Check if current focus areas align with top keywords
  const currentAreasLower = currentFocusAreas.map(a => a.toLowerCase());
  const alignedCount = topKeywords.filter(keyword =>
    currentAreasLower.some(area => area.includes(keyword) || keyword.includes(area))
  ).length;

  // Misalignment if less than 50% overlap and we have enough data
  const misaligned = topKeywords.length >= 2 && alignedCount < (topKeywords.length / 2);

  return {
    misaligned,
    suggestedAreas: misaligned ? topKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)) : []
  };
};

interface WorkspaceGraph {
  projects: Project[];
  knowledgeItems: KnowledgeItem[];
  insights: UserInsight[];
}

const toPriority = (value: string | null): Priority => {
  if (!value) return Priority.Low;
  if (Object.values(Priority).includes(value as Priority)) {
    return value as Priority;
  }
  switch (value.toLowerCase()) {
    case 'high':
      return Priority.High;
    case 'medium':
      return Priority.Medium;
    default:
      return Priority.Low;
  }
};

const toStatus = (value: string | null): Status => {
  if (!value) return Status.Planned;
  if (Object.values(Status).includes(value as Status)) {
    return value as Status;
  }
  return Status.Planned;
};

const toTaskAgency = (value: string | null): TaskAgency => {
  if (!value) return TaskAgency.Human;
  if (Object.values(TaskAgency).includes(value as TaskAgency)) {
    return value as TaskAgency;
  }
  return TaskAgency.Human;
};

const toKnowledgeType = (value: string | null): KnowledgeType => {
  if (!value) return KnowledgeType.Summary;
  if (Object.values(KnowledgeType).includes(value as KnowledgeType)) {
    return value as KnowledgeType;
  }
  return KnowledgeType.Summary;
};

const mapTaskRow = (row: TaskRow): Task => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  priority: toPriority(row.priority),
  completed: row.completed ?? false,
  agency: toTaskAgency(row.agency),
  color: row.color ?? '#2563eb',
  estimated_time: row.estimated_time ?? undefined,
  goal_id: row.goal_id ?? undefined,
  projectId: row.project_id ?? undefined,
  created_at: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
  rollover_count: row.rollover_count ?? undefined,
  rolled_over_from_date: row.rolled_over_from_date ?? undefined,
  archived_at: row.archived_at ?? undefined,
});

const mapGoalRow = (row: GoalRow, tasks: Task[]): Goal => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  status: toStatus(row.status),
  priority: toPriority(row.priority),
  targetDate: row.target_date ?? row.created_at,
  completedDate: undefined,
  order: row.order_index ?? 1,
  tasks,
});

const mapMilestoneRow = (row: MilestoneRow): Milestone => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  due_date: row.due_date ?? undefined,
  status: row.status ?? 'active',
  created: row.created_at,
  updated: row.updated_at,
});

const mapKnowledgeRow = (row: KnowledgeItemRow): KnowledgeItem => ({
  id: row.id,
  name: row.name,
  type: toKnowledgeType(row.type),
  date: row.occurred_at,
  size: row.size ?? undefined,
  duration: row.duration ?? undefined,
  source: row.source ?? undefined,
  starred: row.starred ?? undefined,
  content: row.content ?? undefined,
  projects: [],
  tags: row.tags ?? undefined,
  created: row.created_at,
  updated: row.updated_at,
});

const mapProjectRow = (
  row: ProjectRow,
  goals: Goal[],
  milestones: Milestone[],
  knowledgeItems: KnowledgeItem[],
  standaloneTasks: Task[]
): Project => {
  const combinedGoals = [...goals];

  // Add standalone tasks (goal_id = null) to a virtual goal for display only
  // This virtual goal is NOT stored in database - it's only for UI rendering
  if (standaloneTasks.length > 0) {
    combinedGoals.push({
      id: `${row.id}-standalone-virtual`,
      name: 'Standalone Tasks',
      status: Status.Active,
      priority: Priority.Medium,
      targetDate: row.target_date ?? new Date().toISOString(),
      completedDate: undefined,
      description: 'Tasks without a goal assignment',
      order: 999,
      tasks: standaloneTasks,
    });
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status as Status | undefined,
    priority: row.priority ?? undefined,
    color: row.color ?? undefined,
    progress: row.progress ?? undefined,
    active: row.active ?? undefined,
    startDate: row.start_date ?? undefined,
    targetDate: row.target_date ?? undefined,
    timeInvested: row.time_invested ?? undefined,
    lastUpdate: row.last_update ?? undefined,
    tags: row.tags ?? undefined,
    notes: row.notes ?? undefined,
    goals: combinedGoals,
    items: knowledgeItems,
    milestones,
  };
};

const mapInsightRow = (row: UserInsightRow): UserInsight => {
  // Validate and normalize insight type
  const validTypes: Array<'article' | 'opportunity' | 'trend' | 'note'> = ['article', 'opportunity', 'trend', 'note'];
  const insightType = row.insight_type && validTypes.includes(row.insight_type as any)
    ? row.insight_type
    : 'note';

  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? undefined,
    category: row.category ?? undefined,
    insightType,
    sourceUrl: row.source_url ?? undefined,
    actionLabel: row.action_label ?? undefined,
    actionUrl: row.action_url ?? undefined,
    relevance: row.relevance ?? undefined,
    projectId: row.project_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const normaliseError = (error: PostgrestError | Error | null | undefined): Error | null => {
  if (!error) return null;
  if (error instanceof Error) return error;
  return new Error(error.message ?? 'Unknown Supabase error');
};

export const fetchWorkspaceGraph = async (ownerId: string): Promise<WorkspaceGraph> => {
  console.log(`🗄️ [supabaseDataService.fetchWorkspaceGraph] Fetching for owner:`, ownerId);

  const [projectsRes, goalsRes, tasksRes, milestonesRes, knowledgeRes, knowledgeLinksRes, insightsRes] =
    await Promise.all([
      supabase.from<ProjectRow>('projects').select('*').eq('owner_id', ownerId).or('status.is.null,status.neq.deleted').order('created_at', { ascending: true }),
      supabase.from<GoalRow>('project_goals').select('*').eq('owner_id', ownerId),
      supabase
        .from<TaskRow>('project_tasks')
        .select('*')
        .eq('owner_id', ownerId)
        .is('archived_at', null)
        .or('completed.is.null,completed.is.false')
        .order('updated_at', { ascending: false }),
      supabase.from<MilestoneRow>('project_milestones').select('*').eq('owner_id', ownerId),
      supabase.from<KnowledgeItemRow>('knowledge_items').select('*').eq('owner_id', ownerId),
      supabase.from<ProjectKnowledgeLinkRow>('project_knowledge_items').select('*').eq('owner_id', ownerId),
      supabase.from<UserInsightRow>('user_insights').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
    ]);

  console.log(`   → Database query results:`);
  console.log(`      Projects: ${projectsRes.data?.length || 0}`, projectsRes.error ? `ERROR: ${projectsRes.error.message}` : '');
  console.log(`      Goals: ${goalsRes.data?.length || 0}`, goalsRes.error ? `ERROR: ${goalsRes.error.message}` : '');
  console.log(`      Tasks: ${tasksRes.data?.length || 0}`, tasksRes.error ? `ERROR: ${tasksRes.error.message}` : '');

  if (projectsRes.data && projectsRes.data.length > 0) {
    console.log(`   → Raw projects from DB:`);
    projectsRes.data.forEach((p, i) => {
      console.log(`      ${i+1}. "${p.name}": status=${p.status}, active=${p.active}, id=${p.id}`);
    });
  }

  const firstError =
    normaliseError(projectsRes.error) ||
    normaliseError(goalsRes.error) ||
    normaliseError(tasksRes.error) ||
    normaliseError(milestonesRes.error) ||
    normaliseError(knowledgeRes.error) ||
    normaliseError(knowledgeLinksRes.error) ||
    normaliseError(insightsRes.error);

  if (firstError) {
    console.error(`❌ [supabaseDataService] Database error:`, firstError);
    throw firstError;
  }

  const tasksByGoal = new Map<string, Task[]>();
  const inboxTasksByProject = new Map<string, Task[]>();
  const orphanTasks: Task[] = [];
  tasksRes.data?.forEach((row) => {
    if (row.archived_at) {
      return;
    }
    const mapped = mapTaskRow(row);
    const goalId = row.goal_id;

    if (goalId) {
      const existing = tasksByGoal.get(goalId) ?? [];
      existing.push(mapped);
      tasksByGoal.set(goalId, existing);
      return;
    }

    if (mapped.projectId) {
      const existing = inboxTasksByProject.get(mapped.projectId) ?? [];
      existing.push(mapped);
      inboxTasksByProject.set(mapped.projectId, existing);
      return;
    }

    orphanTasks.push(mapped);
  });

  const goalsByProject = new Map<string, Goal[]>();
  goalsRes.data?.forEach((row) => {
    if (row.status && ['completed', 'deleted'].includes(row.status.toLowerCase())) {
      return;
    }
    const mapped = mapGoalRow(row, tasksByGoal.get(row.id) ?? []);
    const existing = goalsByProject.get(row.project_id) ?? [];
    existing.push(mapped);
    goalsByProject.set(row.project_id, existing);
  });

  const milestonesByProject = new Map<string, Milestone[]>();
  milestonesRes.data?.forEach((row) => {
    const mapped = mapMilestoneRow(row);
    const existing = milestonesByProject.get(row.project_id) ?? [];
    existing.push(mapped);
    milestonesByProject.set(row.project_id, existing);
  });

  const knowledgeById = new Map<string, KnowledgeItem>();
  knowledgeRes.data?.forEach((row) => {
    const mapped = mapKnowledgeRow(row);
    knowledgeById.set(row.id, mapped);
  });

  const knowledgeLinksByProject = new Map<string, KnowledgeItem[]>();
  knowledgeLinksRes.data?.forEach((row) => {
    const item = knowledgeById.get(row.knowledge_item_id);
    if (!item) return;
    const updatedProjects = new Set(item.projects ?? []);
    if (row.project_id) {
      updatedProjects.add(row.project_id);
    }
    item.projects = Array.from(updatedProjects);
    const existing = knowledgeLinksByProject.get(row.project_id) ?? [];
    existing.push(item);
    knowledgeLinksByProject.set(row.project_id, existing);
  });

  const projects = (projectsRes.data ?? []).map((row) =>
    mapProjectRow(
      row,
      goalsByProject.get(row.id) ?? [],
      milestonesByProject.get(row.id) ?? [],
      knowledgeLinksByProject.get(row.id) ?? [],
      inboxTasksByProject.get(row.id) ?? []
    )
  );

  // Note: Removed automatic "Workspace Inbox" project creation
  // Orphaned tasks (if any) should be handled at the goal/project level
  // No more synthetic inbox projects

  const knowledgeItems = Array.from(knowledgeById.values());
  const insights = (insightsRes.data ?? []).map(mapInsightRow);

  return { projects, knowledgeItems, insights };
};

export const createProject = async (ownerId: string, payload: Partial<Project>): Promise<Project> => {
  if (!payload.name) {
    throw new Error('Project name is required');
  }

  const insertPayload = {
    owner_id: ownerId,
    name: payload.name,
    description: payload.description ?? null,
    status: payload.status ?? null,
    priority: payload.priority ?? null,
    color: payload.color ?? null,
    progress: payload.progress ?? null,
    active: payload.active ?? true,
    start_date: payload.startDate ?? null,
    target_date: payload.targetDate ?? null,
    time_invested: payload.timeInvested ?? null,
    last_update: payload.lastUpdate ?? null,
    tags: payload.tags ?? null,
    notes: payload.notes ?? null,
  };

  const { data, error } = await supabase
    .from<ProjectRow>('projects')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to create project');
  }

  return mapProjectRow(data, [], [], [], []);
};

export const updateProject = async (
  ownerId: string,
  projectId: string,
  updates: Partial<Project>
): Promise<Project> => {
  const updatePayload = {
    name: updates.name ?? undefined,
    description: updates.description ?? undefined,
    status: updates.status ?? undefined,
    priority: updates.priority ?? undefined,
    color: updates.color ?? undefined,
    progress: updates.progress ?? undefined,
    active: updates.active ?? undefined,
    start_date: updates.startDate ?? undefined,
    target_date: updates.targetDate ?? undefined,
    time_invested: updates.timeInvested ?? undefined,
    last_update: updates.lastUpdate ?? undefined,
    tags: updates.tags ?? undefined,
    notes: updates.notes ?? undefined,
  };

  const { data, error } = await supabase
    .from<ProjectRow>('projects')
    .update(updatePayload)
    .eq('id', projectId)
    .eq('owner_id', ownerId)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to update project');
  }

  return mapProjectRow(data, [], [], [], []);
};

export const deleteProject = async (ownerId: string, projectId: string): Promise<void> => {
  // Soft delete: mark as deleted instead of hard delete for consistency with chat function
  const { error } = await supabase
    .from('projects')
    .update({ status: 'deleted', active: false })
    .eq('id', projectId)
    .eq('owner_id', ownerId);

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to delete project');
  }
};

export const createGoal = async (
  ownerId: string,
  projectId: string,
  payload: Partial<Goal>
): Promise<Goal> => {
  if (!payload.name) {
    throw new Error('Goal name is required');
  }

  const insertPayload = {
    owner_id: ownerId,
    project_id: projectId,
    name: payload.name,
    description: payload.description ?? null,
    status: payload.status ?? null,
    priority: payload.priority ?? null,
    target_date: payload.targetDate ?? null,
    order_index: payload.order ?? null,
  };

  const { data, error } = await supabase
    .from<GoalRow>('project_goals')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to create goal');
  }

  return mapGoalRow(data, []);
};

export const updateGoal = async (
  ownerId: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<Goal> => {
  const updatePayload = {
    name: updates.name ?? undefined,
    description: updates.description ?? undefined,
    status: updates.status ?? undefined,
    priority: updates.priority ?? undefined,
    target_date: updates.targetDate ?? undefined,
    order_index: updates.order ?? undefined,
  };

  const { data, error } = await supabase
    .from<GoalRow>('project_goals')
    .update(updatePayload)
    .eq('id', goalId)
    .eq('owner_id', ownerId)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to update goal');
  }

  return mapGoalRow(data, []);
};

export const deleteGoal = async (ownerId: string, goalId: string): Promise<void> => {
  // Soft delete: mark as deleted instead of hard delete for consistency with chat function
  const { error } = await supabase
    .from('project_goals')
    .update({ status: 'deleted' })
    .eq('id', goalId)
    .eq('owner_id', ownerId);

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to delete goal');
  }
};

export const createTask = async (
  ownerId: string,
  payload: Partial<Task> & { projectId?: string; goalId?: string }
): Promise<Task> => {
  if (!payload.name) {
    throw new Error('Task name is required');
  }

  const insertPayload = {
    owner_id: ownerId,
    project_id: payload.projectId ?? null,
    goal_id: payload.goal_id ?? payload.goalId ?? null,
    name: payload.name,
    description: payload.description ?? null,
    priority: payload.priority ?? null,
    completed: payload.completed ?? null,
    agency: payload.agency ?? null,
    color: payload.color ?? null,
    estimated_time: payload.estimated_time ?? null,
    due_date: null,
  };

  const { data, error } = await supabase
    .from<TaskRow>('project_tasks')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to create task');
  }

  return mapTaskRow(data);
};

export const updateTask = async (
  ownerId: string,
  taskId: string,
  updates: Partial<Task>
): Promise<Task> => {
  const updatePayload = {
    name: updates.name ?? undefined,
    description: updates.description ?? undefined,
    priority: updates.priority ?? undefined,
    completed: updates.completed ?? undefined,
    agency: updates.agency ?? undefined,
    color: updates.color ?? undefined,
    estimated_time: updates.estimated_time ?? undefined,
  };

  const { data, error } = await supabase
    .from<TaskRow>('project_tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .eq('owner_id', ownerId)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to update task');
  }

  return mapTaskRow(data);
};

export const deleteTask = async (ownerId: string, taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId)
    .eq('owner_id', ownerId);

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to delete task');
  }
};

export const createMilestone = async (
  ownerId: string,
  projectId: string,
  payload: Partial<Milestone>
): Promise<Milestone> => {
  if (!payload.name) {
    throw new Error('Milestone name is required');
  }

  const insertPayload = {
    owner_id: ownerId,
    project_id: projectId,
    name: payload.name,
    description: payload.description ?? null,
    status: payload.status ?? null,
    due_date: payload.due_date ?? null,
  };

  const { data, error } = await supabase
    .from<MilestoneRow>('project_milestones')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to create milestone');
  }

  return mapMilestoneRow(data);
};

export const updateMilestone = async (
  ownerId: string,
  milestoneId: string,
  updates: Partial<Milestone>
): Promise<Milestone> => {
  const updatePayload = {
    name: updates.name ?? undefined,
    description: updates.description ?? undefined,
    status: updates.status ?? undefined,
    due_date: updates.due_date ?? undefined,
  };

  const { data, error } = await supabase
    .from<MilestoneRow>('project_milestones')
    .update(updatePayload)
    .eq('id', milestoneId)
    .eq('owner_id', ownerId)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to update milestone');
  }

  return mapMilestoneRow(data);
};

export const deleteMilestone = async (ownerId: string, milestoneId: string): Promise<void> => {
  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', milestoneId)
    .eq('owner_id', ownerId);

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to delete milestone');
  }
};

export const createKnowledgeItem = async (
  ownerId: string,
  payload: Partial<KnowledgeItem>
): Promise<KnowledgeItem> => {
  if (!payload.name) {
    throw new Error('Knowledge item name is required');
  }

  const insertPayload = {
    owner_id: ownerId,
    name: payload.name,
    type: payload.type ?? KnowledgeType.Summary,
    occurred_at: payload.date ?? new Date().toISOString(),
    size: payload.size ?? null,
    duration: payload.duration ?? null,
    source: payload.source ?? null,
    starred: payload.starred ?? null,
    content: payload.content ?? null,
    tags: payload.tags ?? null,
  };

  const { data, error } = await supabase
    .from<KnowledgeItemRow>('knowledge_items')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to create knowledge item');
  }

  return mapKnowledgeRow(data);
};

export const updateKnowledgeItem = async (
  ownerId: string,
  itemId: string,
  updates: Partial<KnowledgeItem>
): Promise<KnowledgeItem> => {
  const updatePayload = {
    name: updates.name ?? undefined,
    type: updates.type ?? undefined,
    occurred_at: updates.date ?? undefined,
    size: updates.size ?? undefined,
    duration: updates.duration ?? undefined,
    source: updates.source ?? undefined,
    starred: updates.starred ?? undefined,
    content: updates.content ?? undefined,
    tags: updates.tags ?? undefined,
  };

  const { data, error } = await supabase
    .from<KnowledgeItemRow>('knowledge_items')
    .update(updatePayload)
    .eq('id', itemId)
    .eq('owner_id', ownerId)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to update knowledge item');
  }

  return mapKnowledgeRow(data);
};

export const deleteKnowledgeItem = async (ownerId: string, itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('knowledge_items')
    .delete()
    .eq('id', itemId)
    .eq('owner_id', ownerId);

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to delete knowledge item');
  }
};

export const linkKnowledgeItemToProject = async (
  ownerId: string,
  projectId: string,
  knowledgeItemId: string
): Promise<void> => {
  const { error } = await supabase
    .from('project_knowledge_items')
    .insert({
      owner_id: ownerId,
      project_id: projectId,
      knowledge_item_id: knowledgeItemId,
    });

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to link knowledge item to project');
  }
};

export const unlinkKnowledgeItemFromProject = async (
  ownerId: string,
  projectId: string,
  knowledgeItemId: string
): Promise<void> => {
  const { error } = await supabase
    .from('project_knowledge_items')
    .delete()
    .eq('owner_id', ownerId)
    .eq('project_id', projectId)
    .eq('knowledge_item_id', knowledgeItemId);

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to unlink knowledge item from project');
  }
};

export const fetchUserInsights = async (ownerId: string): Promise<UserInsight[]> => {
  const { data, error } = await supabase
    .from<UserInsightRow>('user_insights')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw normaliseError(error) ?? new Error('Failed to fetch insights');
  }

  return (data ?? []).map(mapInsightRow);
};

// Task Rollover Functions
export interface RolloverSuggestion {
  id: string;
  name: string;
  description: string;
  priority: string;
  created_at: string;
  rollover_count: number;
}

export const getRolloverSuggestions = async (ownerId: string): Promise<RolloverSuggestion[]> => {
  const { data, error } = await supabase.rpc('get_rollover_suggestions', {
    user_id: ownerId
  });

  if (error) {
    console.error('Failed to fetch rollover suggestions:', error);
    return [];
  }

  return data || [];
};

export const rolloverTaskToToday = async (ownerId: string, taskId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('rollover_task_to_today', {
    task_id: taskId,
    user_id: ownerId
  });

  if (error) {
    throw new Error(`Failed to rollover task: ${error.message}`);
  }

  return data; // Returns new task ID
};

export const archiveOldTasks = async (): Promise<void> => {
  const { error } = await supabase.rpc('archive_old_tasks');

  if (error) {
    console.error('Failed to archive old tasks:', error);
    throw new Error(`Failed to archive old tasks: ${error.message}`);
  }
};

export const upsertUserInsight = async (
  ownerId: string,
  insight: Partial<UserInsight> & { title: string }
): Promise<UserInsight> => {
  const payload = {
    id: insight.id ?? undefined,
    owner_id: ownerId,
    category: insight.category ?? null,
    insight_type: insight.insightType ?? null,
    title: insight.title,
    summary: insight.summary ?? null,
    action_label: insight.actionLabel ?? null,
    action_url: insight.actionUrl ?? null,
    relevance: insight.relevance ?? null,
    project_id: insight.projectId ?? null,
    metadata: insight.metadata ?? null,
  };

  const { data, error } = await supabase
    .from<UserInsightRow>('user_insights')
    .upsert(payload, { onConflict: 'id' })
    .eq('owner_id', ownerId)
    .select('*')
    .single();

  if (error || !data) {
    throw normaliseError(error) ?? new Error('Failed to save insight');
  }

  return mapInsightRow(data);
};
