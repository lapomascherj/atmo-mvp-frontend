import { create } from 'zustand';
import { Persona } from '@/models/Persona';
import { Project } from '@/models/Project';
import { Goal } from '@/models/Goal';
import { Task } from '@/models/Task';
import { KnowledgeItem } from '@/models/KnowledgeItem';
import { Integration } from '@/models/Integration';
import { Milestone } from '@/models/Milestone';
import { Focus } from '@/models/Focus';
import { JobTitle } from '@/models/JobTitle';
import { AvatarStyle } from '@/models/AvatarStyle';
import { CommunicationStyle } from '@/models/CommunicationStyle';
import { Priority } from '@/models/Priority';
import { Status } from '@/models/Status';
import type { LegacyUserProfile } from '@/hooks/useMockAuth';
import {
  fetchWorkspaceGraph,
  createProject as createProjectInSupabase,
  updateProject as updateProjectInSupabase,
  deleteProject as deleteProjectInSupabase,
  createGoal as createGoalInSupabase,
  updateGoal as updateGoalInSupabase,
  deleteGoal as deleteGoalInSupabase,
  createTask as createTaskInSupabase,
  updateTask as updateTaskInSupabase,
  deleteTask as deleteTaskInSupabase,
  createMilestone as createMilestoneInSupabase,
  updateMilestone as updateMilestoneInSupabase,
  deleteMilestone as deleteMilestoneInSupabase,
  createKnowledgeItem as createKnowledgeItemInSupabase,
  updateKnowledgeItem as updateKnowledgeItemInSupabase,
  deleteKnowledgeItem as deleteKnowledgeItemInSupabase,
  linkKnowledgeItemToProject,
  unlinkKnowledgeItemFromProject,
  fetchUserInsights,
  updateUserProfile,
  UserInsight,
} from '@/services/supabaseDataService';
import {
  sendChatMessage,
  getChatHistory,
  type ChatMessage,
  type ChatResponse,
} from '@/services/claudeChatService';
import { updateProjectsProgress } from '@/utils/progressCalculator';

const buildKnowledgeItems = (projects: Project[]): KnowledgeItem[] =>
  projects.flatMap((project) => project.items ?? []);

const buildGoals = (projects: Project[]): Goal[] =>
  projects.flatMap((project) => project.goals ?? []);

const buildTasks = (projects: Project[]): Task[] =>
  buildGoals(projects).flatMap((goal) => goal.tasks ?? []);

const buildMilestones = (projects: Project[]): Milestone[] =>
  projects.flatMap((project) => project.milestones ?? []);

type GoalAutomationPayload = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  targetDate?: string | null;
  projectId: string;
  mode?: 'created' | 'updated' | 'deleted';
};

const normaliseGoalStatusForStore = (value?: string | null): Status => {
  if (!value) return Status.InProgress;
  const normalized = value.toLowerCase();
  if (normalized.includes('plan')) return Status.Planned;
  if (normalized.includes('progress') || normalized.includes('active') || normalized.includes('doing')) return Status.InProgress;
  if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('finish')) return Status.Completed;
  return Status.InProgress;
};

const normaliseGoalPriorityForStore = (value?: string | null): Priority => {
  if (!value) return Priority.Medium;
  const normalized = value.toLowerCase();
  if (normalized.includes('high') || normalized.includes('urgent')) return Priority.High;
  if (normalized.includes('low')) return Priority.Low;
  return Priority.Medium;
};

const mapProfileToPersona = (
  profile: LegacyUserProfile | null,
  projects: Project[],
  knowledgeItems: KnowledgeItem[],
  integrations: Integration[]
): Persona => {
  const fallbackName = profile?.nickname?.trim() || profile?.preferredName || 'ATMO Explorer';

  return {
    id: profile?.id ?? 'unknown',
    iam: profile?.iam ?? profile?.id ?? 'unknown',
    nickname: fallbackName,
    avatar_url: profile?.avatar_url ?? '',
    email: profile?.email ?? 'unknown@user',
    job_title: profile?.job_title ?? JobTitle.Other,
    bio: profile?.bio ?? '',
    biggest_challenge: profile?.mainPriority ?? 'Clarify my next win',
    email_notifications: false,
    push_notifications: false,
    onboarding_completed: profile?.onboarding_completed ?? false,
    focus: profile?.focus ?? Focus.ProjectExecution,
    delivery_time: new Date(),
    avatar_style: AvatarStyle.Balanced,
    communication_style:
      (profile?.communicationStyle as CommunicationStyle) ?? CommunicationStyle.Detailed,
    integrations,
    items: knowledgeItems,
    projects,
  };
};

interface PersonasStoreState {
  currentPersona: Persona | null;
  loading: boolean;
  error: string | null;
  projects: Project[];
  integrations: Integration[];
  knowledgeItems: KnowledgeItem[];
  insights: UserInsight[];
  profileSnapshot: LegacyUserProfile | null;
  syncWithProfile: (profile: LegacyUserProfile | null) => void;
  fetchPersonaByIam: (_pb: unknown, iam: string, forceRefresh?: boolean) => Promise<Persona | null>;
  createPersona: (_pb: unknown, data: Partial<Persona>) => Promise<Persona | null>;
  updatePersona: (_pb: unknown, id: string, data: Partial<Persona>) => Promise<boolean>;
  clearPersona: () => void;
  getProjects: () => Project[];
  addProject: (_pb: unknown, project: Partial<Project>) => Promise<boolean>;
  updateProject: (_pb: unknown, projectId: string, updates: Partial<Project>) => Promise<boolean>;
  removeProject: (_pb: unknown, projectId: string) => Promise<boolean>;
  getKnowledgeItems: () => KnowledgeItem[];
  getAllKnowledgeItems: (_pb?: unknown) => Promise<KnowledgeItem[]>;
  addKnowledgeItem: (_pb: unknown, item: KnowledgeItem) => Promise<boolean>;
  updateKnowledgeItem: (_pb: unknown, id: string, updates: Partial<KnowledgeItem>) => Promise<boolean>;
  removeKnowledgeItem: (_pb: unknown, id: string) => Promise<boolean>;
  getGoals: () => Goal[];
  addGoal: (_pb: unknown, projectId: string, goal: Goal) => Promise<boolean>;
  updateGoal: (_pb: unknown, goalId: string, updates: Partial<Goal>) => Promise<boolean>;
  removeGoal: (_pb: unknown, goalId: string) => Promise<boolean>;
  getTasks: () => Task[];
  addTask: (_pb: unknown, goalId: string, task: Task) => Promise<boolean>;
  updateTask: (_pb: unknown, taskId: string, updates: Partial<Task>) => Promise<boolean>;
  removeTask: (_pb: unknown, taskId: string) => Promise<boolean>;
  getMilestones: () => Milestone[];
  addMilestone: (_pb: unknown, projectId: string, milestone: Milestone) => Promise<boolean>;
  updateMilestone: (_pb: unknown, milestoneId: string, updates: Partial<Milestone>) => Promise<boolean>;
  removeMilestone: (_pb: unknown, milestoneId: string) => Promise<boolean>;
  getCalendarEvents: () => unknown[];
  refreshAllStores: () => Promise<void>;
  addKnowledgeItemToProject: (_pb: unknown, projectId: string, knowledgeItemId: string) => Promise<boolean>;
  removeKnowledgeItemFromProject: (_pb: unknown, projectId: string, knowledgeItemId: string) => Promise<boolean>;
  getIntegrations: () => Integration[];
  refreshInsights: () => Promise<void>;
  applyGoalAutomation: (payload: GoalAutomationPayload) => void;
  sendChatMessage: (message: string) => Promise<ChatResponse>;
  getChatHistory: (limit?: number) => Promise<ChatMessage[]>;
  debugProjectPersistence: () => Promise<Project[]>;
}

// Fetch debouncing and deduplication state
let lastFetchTimestamp = 0;
let fetchInProgress: Promise<Persona | null> | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let lastDataHash = '';
let lastFetchedUserId = '';

// Minimum time between fetches (in milliseconds) - 5 seconds
const FETCH_COOLDOWN_MS = 5000;

// Simple hash function for data deduplication
const hashData = (data: any): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return Date.now().toString();
  }
};

export const usePersonasStore = create<PersonasStoreState>((set, get) => {
  const synchronizeWorkspace = async (ownerId: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔄 [${timestamp}] [PersonasStore.synchronizeWorkspace] Fetching workspace for user:`, ownerId);

    const profile = get().profileSnapshot;
    const integrations = get().integrations;

    // Check if we're in demo mode (no Supabase configuration)
    const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || 
                      import.meta.env.VITE_SUPABASE_URL.includes('placeholder') ||
                      !import.meta.env.VITE_SUPABASE_ANON_KEY ||
                      import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder');

    let rawProjects: any[] = [];
    let knowledgeItems: any[] = [];
    let insights: any[] = [];

    if (isDemoMode) {
      console.log(`   → Demo mode detected, using mock data...`);
      // Use mock data for demo mode
      rawProjects = [
        {
          id: 'demo-project-1',
          name: 'Yourself',
          description: 'Personal development and self-improvement',
          status: 'active',
          priority: 'high',
          color: '#3b82f6',
          progress: 65,
          active: true,
          start_date: new Date().toISOString(),
          target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          time_invested: 120,
          last_update: new Date().toISOString(),
          tags: ['personal', 'development'],
          notes: 'Focus on personal growth and skill development',
          goals: [
            {
              id: 'demo-goal-1',
              name: 'Learn New Skills',
              status: 'Active',
              priority: 'High',
              targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'Master new technologies and improve existing skills',
              order: 1,
              tasks: [
                {
                  id: 'demo-task-1',
                  name: 'Complete React Advanced Course',
                  description: 'Finish the advanced React course on the platform',
                  priority: 'High',
                  completed: true,
                  agency: 'Human',
                  color: '30',
                  estimated_time: 120,
                  created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  rollover_count: 0,
                  archived_at: null
                },
                {
                  id: 'demo-task-2',
                  name: 'Practice TypeScript',
                  description: 'Build a small project using TypeScript',
                  priority: 'Medium',
                  completed: false,
                  agency: 'Human',
                  color: '30',
                  estimated_time: 90,
                  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  rollover_count: 1,
                  archived_at: null
                }
              ]
            }
          ],
          items: [],
          milestones: []
        },
        {
          id: 'demo-project-2',
          name: 'ATMO',
          description: 'ATMO platform development and features',
          status: 'active',
          priority: 'high',
          color: '#10b981',
          progress: 40,
          active: true,
          start_date: new Date().toISOString(),
          target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          time_invested: 200,
          last_update: new Date().toISOString(),
          tags: ['platform', 'development'],
          notes: 'Building the ATMO platform with advanced features',
          goals: [
            {
              id: 'demo-goal-2',
              name: 'Priority Stream Enhancement',
              status: 'Active',
              priority: 'High',
              targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'Implement the new hierarchical Priority Stream design',
              order: 1,
              tasks: [
                {
                  id: 'demo-task-3',
                  name: 'Design Priority Stream UI',
                  description: 'Create the Apple-style design for Priority Stream',
                  priority: 'High',
                  completed: true,
                  agency: 'Human',
                  color: '30',
                  estimated_time: 180,
                  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  rollover_count: 0,
                  archived_at: null
                },
                {
                  id: 'demo-task-4',
                  name: 'Implement Data Synchronization',
                  description: 'Connect Priority Stream with Project Card data',
                  priority: 'High',
                  completed: false,
                  agency: 'Human',
                  color: '30',
                  estimated_time: 240,
                  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                  updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  rollover_count: 0,
                  archived_at: null
                }
              ]
            }
          ],
          items: [],
          milestones: []
        }
      ];
      knowledgeItems = [];
      insights = [];
      console.log(`   → Demo data loaded: ${rawProjects.length} projects`);
    } else {
      console.log(`   → Calling fetchWorkspaceGraph...`);
      const result = await fetchWorkspaceGraph(ownerId);
      rawProjects = result.projects;
      knowledgeItems = result.knowledgeItems;
      insights = result.insights;
      console.log(`   → fetchWorkspaceGraph returned: ${rawProjects.length} projects, ${knowledgeItems.length} knowledge items`);
    }

    // Calculate progress for all projects based on task completion
    const projects = updateProjectsProgress(rawProjects).filter((project) => {
      const totalTasks = (project.goals ?? []).reduce(
        (count, goal) => count + (goal.tasks ?? []).length,
        0
      );
      if (totalTasks > 0) {
        return true;
      }

      const hasMilestones = (project.milestones ?? []).length > 0;
      const hasKnowledge = (project.items ?? []).length > 0;
      const hasDescription = Boolean(project.description && project.description.trim().length > 0);
      const hasNotes = Boolean(project.notes && project.notes.trim().length > 0);

      return hasMilestones || hasKnowledge || hasDescription || hasNotes;
    });
    console.log(`   → Progress calculated for ${projects.length} projects`);

    // Deduplicate: check if data has actually changed
    const newDataHash = hashData({ projects, knowledgeItems, insights });
    console.log(`🧮 [${timestamp}] Hash comparison:`, {
      newHash: newDataHash.substring(0, 20) + '...',
      lastHash: lastDataHash.substring(0, 20) + '...',
      matches: newDataHash === lastDataHash,
      projectsInNewData: projects.length,
      currentProjectsInStore: get().projects.length
    });
    
    if (newDataHash === lastDataHash) {
      console.log(`⏭️ [${timestamp}] Data unchanged (hash match), skipping store update`);
      set({ loading: false });
      return;
    }

    const persona = mapProfileToPersona(profile, projects, knowledgeItems, integrations);

    console.log(`💾 [${timestamp}] Rehydrated ${projects.length} projects, ${knowledgeItems.length} knowledge items from database`);
    console.log(`   → Previous projects count:`, get().projects.length);
    console.log(`   → New projects count:`, projects.length);

    // Debug: Log ALL project details
    if (projects.length > 0) {
      console.log(`   → Projects from database:`);
      projects.forEach((p, i) => {
        console.log(`      ${i+1}. "${p.name}": active=${p.active}, status=${p.status}, id=${p.id}`);
      });
    } else {
      console.log(`   ⚠️ NO PROJECTS RETURNED FROM DATABASE`);
    }

    lastDataHash = newDataHash;
    set({
      projects,
      knowledgeItems,
      insights,
      currentPersona: persona,
      loading: false,
      error: null,
    });

    console.log(`✅ [${timestamp}] Store updated successfully`);
    console.log(`📊 [${timestamp}] Store state summary:`, {
      projectsCount: projects.length,
      projectNames: projects.map(p => `"${p.name}" (status: ${p.status}, active: ${p.active})`),
      knowledgeItemsCount: knowledgeItems.length,
      insightsCount: insights.length
    });
  };

  const ensureProfile = (): LegacyUserProfile => {
    const profile = get().profileSnapshot;
    if (!profile) {
      throw new Error('No profile available for the current user');
    }
    return profile;
  };

  /**
   * Calculate task priority based on deadline proximity rules:
   * - High: Goal/milestone due within 3 days OR project priority is High
   * - Medium: Default for all other cases
   */
  const calculateTaskPriority = (
    task: Partial<Task>,
    goalId: string,
    projectId: string,
    projects: Project[]
  ): Priority => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return Priority.Medium;

    const goal = project.goals?.find((g) => g.id === goalId);

    // Rule 1: Check if goal has a target date within 3 days
    if (goal?.targetDate) {
      const goalDate = new Date(goal.targetDate);
      const now = new Date();
      const daysUntil = Math.ceil((goalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 3 && daysUntil >= 0) {
        return Priority.High;
      }
    }

    // Rule 2: Check if project has milestones due within 3 days
    const upcomingMilestones = project.milestones?.filter((m) => {
      if (!m.due_date || m.status === 'Completed') return false;
      const milestoneDate = new Date(m.due_date);
      const now = new Date();
      const daysUntil = Math.ceil((milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3 && daysUntil >= 0;
    });

    if (upcomingMilestones && upcomingMilestones.length > 0) {
      return Priority.High;
    }

    // Rule 3: Check if project priority is High
    if (project.priority === Priority.High) {
      return Priority.High;
    }

    return Priority.Medium;
  };

  return {
    currentPersona: null,
    loading: false,
    error: null,
    projects: [],
    integrations: [],
    knowledgeItems: [],
    insights: [],
    profileSnapshot: null,

    syncWithProfile: (profile) => {
      const state = get();
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔄 [${timestamp}] [PersonasStore] syncWithProfile`, {
        hasProfile: !!profile,
        profileId: profile?.id,
        currentProjectsCount: state.projects.length,
        currentKnowledgeItemsCount: state.knowledgeItems.length,
      });

      set((state) => ({
        profileSnapshot: profile,
        currentPersona: mapProfileToPersona(profile, state.projects, state.knowledgeItems, state.integrations),
      }));
    },

    fetchPersonaByIam: async (_pb, _iam, forceRefresh = false) => {
      try {
        const profile = ensureProfile();
        const currentTime = Date.now();
        const timeSinceLastFetch = currentTime - lastFetchTimestamp;

        // Return existing data if not forcing refresh and persona exists
        if (!forceRefresh && get().currentPersona && get().currentPersona.iam === profile.id) {
          console.log(`✅ [${new Date().toLocaleTimeString()}] Using cached persona data`);
          return get().currentPersona;
        }

        // Deduplication: if fetch in progress, return existing promise
        if (fetchInProgress) {
          console.log(`⏳ [${new Date().toLocaleTimeString()}] Fetch already in progress, returning existing promise`);
          return fetchInProgress;
        }

        // Cooldown: prevent fetching too frequently (ONLY if not forcing refresh)
        if (!forceRefresh && timeSinceLastFetch < FETCH_COOLDOWN_MS && lastFetchedUserId === profile.id) {
          console.log(`⏭️ [${new Date().toLocaleTimeString()}] Fetch cooldown active (${Math.round(timeSinceLastFetch/1000)}s ago), using cache`);
          return get().currentPersona;
        }

        // Log when cooldown is overridden
        if (forceRefresh && timeSinceLastFetch < FETCH_COOLDOWN_MS) {
          console.log(`🔥 [${new Date().toLocaleTimeString()}] FORCE REFRESH - Overriding cooldown (${Math.round(timeSinceLastFetch/1000)}s ago)`);
        }

        // Start new fetch
        console.log(`🔄 [${new Date().toLocaleTimeString()}] Starting fresh workspace fetch for user:`, profile.id);
        set({ loading: true, error: null });
        lastFetchTimestamp = currentTime;
        lastFetchedUserId = profile.id;

        fetchInProgress = (async () => {
          try {
            await synchronizeWorkspace(profile.id);
            return get().currentPersona;
          } finally {
            fetchInProgress = null;
          }
        })();

        return await fetchInProgress;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load workspace';
        set({ loading: false, error: message });
        fetchInProgress = null;
        lastFetchedUserId = ''; // Reset on error
        return null;
      }
    },

    createPersona: async () => {
      console.warn('createPersona is deprecated when using Supabase-backed profiles.');
      return get().currentPersona;
    },

    updatePersona: async (_pb, _id, data) => {
      try {
        const profile = get().profileSnapshot;
        if (!profile) {
          throw new Error('No profile available for updating persona');
        }

        // Extract fields that need to be persisted to database
        const profileUpdates: {
          nickname?: string;
          bio?: string;
          job_title?: string;
          mainPriority?: string;
        } = {};

        if (data.nickname !== undefined) profileUpdates.nickname = data.nickname;
        if (data.bio !== undefined) profileUpdates.bio = data.bio;
        if (data.job_title !== undefined) profileUpdates.job_title = data.job_title;
        if (data.biggest_challenge !== undefined) profileUpdates.mainPriority = data.biggest_challenge;

        // Write through to database if any profile fields are being updated
        if (Object.keys(profileUpdates).length > 0) {
          await updateUserProfile(profile.id, profileUpdates);
          console.log(`💾 [${new Date().toLocaleTimeString()}] Profile fields persisted to database:`, profileUpdates);
        }

        // Update local state
        set((state) => ({
          currentPersona: state.currentPersona ? { ...state.currentPersona, ...data } : null,
        }));

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update persona';
        console.error(`❌ [${new Date().toLocaleTimeString()}] Persona update failed:`, message);
        set({ error: message });
        return false;
      }
    },

    clearPersona: () => {
      set({ currentPersona: null, projects: [], knowledgeItems: [], insights: [] });
    },

    getProjects: () => get().projects,

    addProject: async (_pb, project) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        
        console.log(`📝 [${new Date().toLocaleTimeString()}] Creating project:`, project);
        const createdProject = await createProjectInSupabase(profile.id, project);
        console.log(`✅ [${new Date().toLocaleTimeString()}] Project created in database:`, {
          id: createdProject.id,
          name: createdProject.name,
          status: createdProject.status,
          active: createdProject.active
        });
        
        console.log(`🔄 [${new Date().toLocaleTimeString()}] Synchronizing workspace after project creation...`);
        await synchronizeWorkspace(profile.id);
        console.log(`✅ [${new Date().toLocaleTimeString()}] Workspace synchronized after project creation`);
        
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add project';
        console.error(`❌ [${new Date().toLocaleTimeString()}] Project creation failed:`, error);
        set({ loading: false, error: message });
        return false;
      }
    },

    updateProject: async (_pb, projectId, updates) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await updateProjectInSupabase(profile.id, projectId, updates);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update project';
        set({ loading: false, error: message });
        return false;
      }
    },

    removeProject: async (_pb, projectId) => {
      try {
        const profile = ensureProfile();

        // Optimistic delete: filter project from state immediately
        const previousProjects = get().projects;
        const filteredProjects = previousProjects.filter(p => p.id !== projectId);

        set({ projects: filteredProjects, error: null });
        console.log(`⚡ [${new Date().toLocaleTimeString()}] Optimistic delete applied for project:`, projectId);

        // API call
        await deleteProjectInSupabase(profile.id, projectId);

        // Success: no need to refetch, optimistic update is already applied
        set({ loading: false });
        return true;
      } catch (error) {
        // Rollback: restore previous state on failure
        const previousProjects = get().projects;
        set({ projects: previousProjects, loading: false, error: error instanceof Error ? error.message : 'Failed to remove project' });
        console.error('Failed to delete project, rolled back:', error);
        return false;
      }
    },

    getKnowledgeItems: () => get().knowledgeItems,

    getAllKnowledgeItems: async () => {
      const profile = get().profileSnapshot;
      if (!profile) {
        return get().knowledgeItems;
      }
      await synchronizeWorkspace(profile.id);
      return get().knowledgeItems;
    },

    addKnowledgeItem: async (_pb, item) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        const created = await createKnowledgeItemInSupabase(profile.id, item);
        const targetProjects = item.projects ?? [];
        await Promise.all(
          targetProjects.map((projectId) =>
            linkKnowledgeItemToProject(profile.id, projectId, created.id)
          )
        );
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add knowledge item';
        set({ loading: false, error: message });
        return false;
      }
    },

    updateKnowledgeItem: async (_pb, id, updates) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        const existing = get().knowledgeItems.find((item) => item.id === id);
        const result = await updateKnowledgeItemInSupabase(profile.id, id, updates);

        const desiredProjects = new Set(updates.projects ?? result.projects ?? existing?.projects ?? []);
        const currentProjects = new Set(existing?.projects ?? []);

        const toRemove: string[] = [];
        currentProjects.forEach((projectId) => {
          if (!desiredProjects.has(projectId)) {
            toRemove.push(projectId);
          }
        });

        const toAdd: string[] = [];
        desiredProjects.forEach((projectId) => {
          if (!currentProjects.has(projectId)) {
            toAdd.push(projectId);
          }
        });

        await Promise.all([
          ...toRemove.map((projectId) => unlinkKnowledgeItemFromProject(profile.id, projectId, id)),
          ...toAdd.map((projectId) => linkKnowledgeItemToProject(profile.id, projectId, id)),
        ]);

        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update knowledge item';
        set({ loading: false, error: message });
        return false;
      }
    },

    removeKnowledgeItem: async (_pb, id) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await deleteKnowledgeItemInSupabase(profile.id, id);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove knowledge item';
        set({ loading: false, error: message });
        return false;
      }
    },

    getGoals: () => buildGoals(get().projects),

    addGoal: async (_pb, projectId, goal) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await createGoalInSupabase(profile.id, projectId, goal);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add goal';
        set({ loading: false, error: message });
        return false;
      }
    },

    updateGoal: async (_pb, goalId, updates) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await updateGoalInSupabase(profile.id, goalId, updates);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update goal';
        set({ loading: false, error: message });
        return false;
      }
    },

    removeGoal: async (_pb, goalId) => {
      try {
        const profile = ensureProfile();

        // Optimistic delete: filter goal from nested project structure immediately
        const previousProjects = get().projects;
        const filteredProjects = previousProjects.map(project => ({
          ...project,
          goals: (project.goals || []).filter(g => g.id !== goalId)
        }));

        set({ projects: filteredProjects, error: null });
        console.log(`⚡ [${new Date().toLocaleTimeString()}] Optimistic delete applied for goal:`, goalId);

        // API call
        await deleteGoalInSupabase(profile.id, goalId);

        // Success: no need to refetch, optimistic update is already applied
        set({ loading: false });
        return true;
      } catch (error) {
        // Rollback: restore previous state on failure
        const previousProjects = get().projects;
        set({ projects: previousProjects, loading: false, error: error instanceof Error ? error.message : 'Failed to remove goal' });
        console.error('Failed to delete goal, rolled back:', error);
        return false;
      }
    },

    getTasks: () => buildTasks(get().projects),

    addTask: async (_pb, goalId, task) => {
      try {
        const profile = ensureProfile();
        const { projects } = get();
        const project = projects.find((proj) => (proj.goals ?? []).some((goal) => goal.id === goalId));
        const projectId = project?.id;

        if (!projectId) {
          throw new Error('Goal not found in any project');
        }

        // Calculate priority based on deadline rules
        const calculatedPriority = calculateTaskPriority(task, goalId, projectId, projects);
        const taskWithPriority = { ...task, priority: calculatedPriority };

        set({ loading: true, error: null });
        await createTaskInSupabase(profile.id, { ...taskWithPriority, goalId, projectId });
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add task';
        set({ loading: false, error: message });
        return false;
      }
    },

    updateTask: async (_pb, taskId, updates) => {
      try {
        const profile = ensureProfile();

        // Optimistic update: update UI immediately
        const previousState = get().projects;
        const updatedProjects = previousState.map(project => ({
          ...project,
          goals: (project.goals ?? []).map(goal => ({
            ...goal,
            tasks: (goal.tasks ?? []).map(task =>
              task.id === taskId ? { ...task, ...updates } : task
            )
          }))
        }));

        set({ projects: updatedProjects });
        console.log(`⚡ [${new Date().toLocaleTimeString()}] Optimistic update applied for task:`, taskId);

        // API call
        await updateTaskInSupabase(profile.id, taskId, updates);

        // Rehydrate from database to ensure consistency
        await synchronizeWorkspace(profile.id);
        console.log(`✅ [${new Date().toLocaleTimeString()}] Task update confirmed from database:`, taskId);

        return true;
      } catch (error) {
        // Rollback: revert to previous state
        const message = error instanceof Error ? error.message : 'Failed to update task';
        console.error(`❌ [${new Date().toLocaleTimeString()}] Task update failed, rolling back:`, taskId, message);

        // Fetch fresh data from database to restore correct state
        const profile = get().profileSnapshot;
        if (profile) {
          await synchronizeWorkspace(profile.id);
        }

        set({ loading: false, error: message });
        return false;
      }
    },

    removeTask: async (_pb, taskId) => {
      try {
        const profile = ensureProfile();

        // Optimistic update: remove from UI immediately
        const previousState = get().projects;
        const updatedProjects = previousState.map(project => ({
          ...project,
          goals: (project.goals ?? []).map(goal => ({
            ...goal,
            tasks: (goal.tasks ?? []).filter(task => task.id !== taskId)
          }))
        }));

        set({ projects: updatedProjects });
        console.log(`⚡ [${new Date().toLocaleTimeString()}] Optimistic deletion applied for task:`, taskId);

        // API call
        await deleteTaskInSupabase(profile.id, taskId);

        // Rehydrate from database to ensure consistency
        await synchronizeWorkspace(profile.id);
        console.log(`✅ [${new Date().toLocaleTimeString()}] Task deletion confirmed from database:`, taskId);

        return true;
      } catch (error) {
        // Rollback: revert to previous state
        const message = error instanceof Error ? error.message : 'Failed to remove task';
        console.error(`❌ [${new Date().toLocaleTimeString()}] Task deletion failed, rolling back:`, taskId, message);

        // Fetch fresh data from database to restore correct state
        const profile = get().profileSnapshot;
        if (profile) {
          await synchronizeWorkspace(profile.id);
        }

        set({ loading: false, error: message });
        return false;
      }
    },

    getMilestones: () => buildMilestones(get().projects),

    addMilestone: async (_pb, projectId, milestone) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await createMilestoneInSupabase(profile.id, projectId, milestone);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add milestone';
        set({ loading: false, error: message });
        return false;
      }
    },

    updateMilestone: async (_pb, milestoneId, updates) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await updateMilestoneInSupabase(profile.id, milestoneId, updates);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update milestone';
        set({ loading: false, error: message });
        return false;
      }
    },

    removeMilestone: async (_pb, milestoneId) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await deleteMilestoneInSupabase(profile.id, milestoneId);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove milestone';
        set({ loading: false, error: message });
        return false;
      }
    },

    getCalendarEvents: () => [] as unknown[],

    refreshAllStores: async () => {
      const profile = get().profileSnapshot;
      if (!profile) return;
      set({ loading: true, error: null });
      try {
        await synchronizeWorkspace(profile.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh workspace';
        set({ loading: false, error: message });
      }
    },

    addKnowledgeItemToProject: async (_pb, projectId, knowledgeItemId) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await linkKnowledgeItemToProject(profile.id, projectId, knowledgeItemId);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to link knowledge item';
        set({ loading: false, error: message });
        return false;
      }
    },

    removeKnowledgeItemFromProject: async (_pb, projectId, knowledgeItemId) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await unlinkKnowledgeItemFromProject(profile.id, projectId, knowledgeItemId);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to unlink knowledge item';
        set({ loading: false, error: message });
        return false;
      }
    },

    getIntegrations: () => get().integrations,

    refreshInsights: async () => {
      try {
        const profile = ensureProfile();
        const insights = await fetchUserInsights(profile.id);
        set({ insights });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh insights';
        set({ error: message });
      }
    },

    applyGoalAutomation: (payload) => {
      if (!payload.projectId || !payload.id) {
        return;
      }

      set((state) => {
        const projects = state.projects ?? [];
        const projectIndex = projects.findIndex((project) => project.id === payload.projectId);
        if (projectIndex === -1) {
          return state;
        }

        const project = projects[projectIndex];
        const existingGoals = project.goals ?? [];
        const statusValue = normaliseGoalStatusForStore(payload.status);
        const priorityValue = normaliseGoalPriorityForStore(payload.priority);
        const shouldHide = statusValue === Status.Completed || payload.status?.toLowerCase() === 'deleted' || payload.mode === 'deleted';

        const existingIndex = existingGoals.findIndex((goal) => goal.id === payload.id);
        const baseGoal = existingIndex > -1 ? existingGoals[existingIndex] : undefined;

        let nextGoals = existingGoals;
        let changed = false;

        if (shouldHide) {
          if (existingIndex === -1) {
            return state;
          }
          nextGoals = existingGoals.filter((goal) => goal.id !== payload.id);
          changed = true;
        } else {
          const nextGoal: Goal = {
            id: payload.id,
            name: payload.name || baseGoal?.name || 'Untitled Goal',
            description: (payload.description ?? baseGoal?.description) || undefined,
            status: statusValue,
            priority: priorityValue,
            targetDate: payload.targetDate ?? baseGoal?.targetDate ?? '',
            completedDate: statusValue === Status.Completed ? baseGoal?.completedDate ?? new Date().toISOString() : undefined,
            order: baseGoal?.order ?? existingGoals.length + 1,
            tasks: baseGoal?.tasks ?? [],
          };

          if (existingIndex === -1) {
            nextGoals = [...existingGoals, nextGoal];
            changed = true;
          } else {
            const currentGoal = existingGoals[existingIndex];
            if (
              currentGoal.name === nextGoal.name &&
              currentGoal.status === nextGoal.status &&
              currentGoal.priority === nextGoal.priority &&
              currentGoal.description === nextGoal.description &&
              currentGoal.targetDate === nextGoal.targetDate
            ) {
              return state;
            }

            nextGoals = [...existingGoals];
            nextGoals[existingIndex] = nextGoal;
            changed = true;
          }
        }

        if (!changed) {
          return state;
        }

        const updatedProjects = [...projects];
        updatedProjects[projectIndex] = {
          ...project,
          goals: nextGoals,
        };

        const updatedPersona = state.currentPersona
          ? { ...state.currentPersona, projects: updatedProjects }
          : state.currentPersona;

        return {
          projects: updatedProjects,
          currentPersona: updatedPersona,
        };
      });
    },

    sendChatMessage: async (message: string) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });

        const response = await sendChatMessage(message);

        const { applyGoalAutomation } = get();
        if (Array.isArray(response.entitiesCreated)) {
          response.entitiesCreated.forEach((entity) => {
            if (entity.type === 'goal' && entity.projectId && entity.id) {
              applyGoalAutomation({
                id: entity.id,
                name: entity.name,
                description: entity.description ?? undefined,
                status: entity.status ?? undefined,
                priority: entity.priority ?? undefined,
                targetDate: entity.targetDate ?? null,
                projectId: entity.projectId,
                mode: entity.mode,
              });
            }
          });
        }

        // Auto-refresh workspace to pull in any new entities created by chat
        await synchronizeWorkspace(profile.id);

        set({ loading: false });
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Chat failed';
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    getChatHistory: async (limit?: number) => {
      try {
        return await getChatHistory(limit);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load chat history';
        set({ error: errorMessage });
        return [];
      }
    },
    
    // Debug function to test project persistence
    debugProjectPersistence: async () => {
      try {
        const profile = ensureProfile();
        console.log('🔍 DEBUG: Testing project persistence for user:', profile.id);
        
        // Force clear cache to ensure fresh data
        const originalHash = lastDataHash;
        lastDataHash = '';
        
        console.log('🔍 DEBUG: Calling fetchWorkspaceGraph directly...');
        const { projects } = await fetchWorkspaceGraph(profile.id);
        
        console.log('🔍 DEBUG: Raw projects from database:', projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          active: p.active,
          created_at: (p as any).created_at
        })));
        
        // Restore original hash
        lastDataHash = originalHash;
        
        return projects;
      } catch (error) {
        console.error('🔍 DEBUG: Error testing persistence:', error);
        return [];
      }
    },
  };
});

// Make debug function globally available for testing
if (typeof window !== 'undefined') {
  (window as any).debugProjectPersistence = () => {
    return usePersonasStore.getState().debugProjectPersistence();
  };
}

export default usePersonasStore;
