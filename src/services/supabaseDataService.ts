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
  insight_type: string | null;
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
  insightType?: string;
  actionLabel?: string;
  actionUrl?: string;
  relevance?: number;
  projectId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

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
  knowledgeItems: KnowledgeItem[]
): Project => ({
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
  goals,
  items: knowledgeItems,
  milestones,
});

const mapInsightRow = (row: UserInsightRow): UserInsight => ({
  id: row.id,
  title: row.title,
  summary: row.summary ?? undefined,
  category: row.category ?? undefined,
  insightType: row.insight_type ?? undefined,
  actionLabel: row.action_label ?? undefined,
  actionUrl: row.action_url ?? undefined,
  relevance: row.relevance ?? undefined,
  projectId: row.project_id ?? undefined,
  metadata: row.metadata ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normaliseError = (error: PostgrestError | Error | null | undefined): Error | null => {
  if (!error) return null;
  if (error instanceof Error) return error;
  return new Error(error.message ?? 'Unknown Supabase error');
};

export const fetchWorkspaceGraph = async (ownerId: string): Promise<WorkspaceGraph> => {
  const [projectsRes, goalsRes, tasksRes, milestonesRes, knowledgeRes, knowledgeLinksRes, insightsRes] =
    await Promise.all([
      supabase.from<ProjectRow>('projects').select('*').eq('owner_id', ownerId).order('created_at', { ascending: true }),
      supabase.from<GoalRow>('project_goals').select('*').eq('owner_id', ownerId),
      supabase.from<TaskRow>('project_tasks').select('*').eq('owner_id', ownerId),
      supabase.from<MilestoneRow>('project_milestones').select('*').eq('owner_id', ownerId),
      supabase.from<KnowledgeItemRow>('knowledge_items').select('*').eq('owner_id', ownerId),
      supabase.from<ProjectKnowledgeLinkRow>('project_knowledge_items').select('*').eq('owner_id', ownerId),
      supabase.from<UserInsightRow>('user_insights').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
    ]);

  const firstError =
    normaliseError(projectsRes.error) ||
    normaliseError(goalsRes.error) ||
    normaliseError(tasksRes.error) ||
    normaliseError(milestonesRes.error) ||
    normaliseError(knowledgeRes.error) ||
    normaliseError(knowledgeLinksRes.error) ||
    normaliseError(insightsRes.error);

  if (firstError) {
    throw firstError;
  }

  const tasksByGoal = new Map<string, Task[]>();
  tasksRes.data?.forEach((row) => {
    const goalId = row.goal_id;
    if (!goalId) return;
    const mapped = mapTaskRow(row);
    const existing = tasksByGoal.get(goalId) ?? [];
    existing.push(mapped);
    tasksByGoal.set(goalId, existing);
  });

  const goalsByProject = new Map<string, Goal[]>();
  goalsRes.data?.forEach((row) => {
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
      knowledgeLinksByProject.get(row.id) ?? []
    )
  );

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

  return mapProjectRow(data, [], [], []);
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

  return mapProjectRow(data, [], [], []);
};

export const deleteProject = async (ownerId: string, projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
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
  const { error } = await supabase
    .from('project_goals')
    .delete()
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
