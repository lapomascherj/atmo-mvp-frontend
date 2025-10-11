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
  UserInsight,
} from '@/services/supabaseDataService';
import {
  sendChatMessage,
  getChatHistory,
  type ChatMessage,
  type ChatResponse,
} from '@/services/claudeChatService';

const buildKnowledgeItems = (projects: Project[]): KnowledgeItem[] =>
  projects.flatMap((project) => project.items ?? []);

const buildGoals = (projects: Project[]): Goal[] =>
  projects.flatMap((project) => project.goals ?? []);

const buildTasks = (projects: Project[]): Task[] =>
  buildGoals(projects).flatMap((goal) => goal.tasks ?? []);

const buildMilestones = (projects: Project[]): Milestone[] =>
  projects.flatMap((project) => project.milestones ?? []);

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
  sendChatMessage: (message: string) => Promise<ChatResponse>;
  getChatHistory: (limit?: number) => Promise<ChatMessage[]>;
}

export const usePersonasStore = create<PersonasStoreState>((set, get) => {
  const synchronizeWorkspace = async (ownerId: string) => {
    const profile = get().profileSnapshot;
    const integrations = get().integrations;
    const { projects, knowledgeItems, insights } = await fetchWorkspaceGraph(ownerId);
    const persona = mapProfileToPersona(profile, projects, knowledgeItems, integrations);

    set({
      projects,
      knowledgeItems,
      insights,
      currentPersona: persona,
      loading: false,
      error: null,
    });
  };

  const ensureProfile = (): LegacyUserProfile => {
    const profile = get().profileSnapshot;
    if (!profile) {
      throw new Error('No profile available for the current user');
    }
    return profile;
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
      set((state) => ({
        profileSnapshot: profile,
        currentPersona: mapProfileToPersona(profile, state.projects, state.knowledgeItems, state.integrations),
      }));
    },

    fetchPersonaByIam: async (_pb, _iam, forceRefresh = false) => {
      try {
        const profile = ensureProfile();
        if (!forceRefresh && get().currentPersona) {
          return get().currentPersona;
        }

        set({ loading: true, error: null });
        await synchronizeWorkspace(profile.id);
        return get().currentPersona;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load workspace';
        set({ loading: false, error: message });
        return null;
      }
    },

    createPersona: async () => {
      console.warn('createPersona is deprecated when using Supabase-backed profiles.');
      return get().currentPersona;
    },

    updatePersona: async (_pb, _id, data) => {
      set((state) => ({
        currentPersona: state.currentPersona ? { ...state.currentPersona, ...data } : null,
      }));
      return true;
    },

    clearPersona: () => {
      set({ currentPersona: null, projects: [], knowledgeItems: [], insights: [] });
    },

    getProjects: () => get().projects,

    addProject: async (_pb, project) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await createProjectInSupabase(profile.id, project);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add project';
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
        set({ loading: true, error: null });
        await deleteProjectInSupabase(profile.id, projectId);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove project';
        set({ loading: false, error: message });
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
        set({ loading: true, error: null });
        await deleteGoalInSupabase(profile.id, goalId);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove goal';
        set({ loading: false, error: message });
        return false;
      }
    },

    getTasks: () => buildTasks(get().projects),

    addTask: async (_pb, goalId, task) => {
      try {
        const profile = ensureProfile();
        const project = get().projects.find((proj) => (proj.goals ?? []).some((goal) => goal.id === goalId));
        const projectId = project?.id;
        set({ loading: true, error: null });
        await createTaskInSupabase(profile.id, { ...task, goalId, projectId });
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
        set({ loading: true, error: null });
        await updateTaskInSupabase(profile.id, taskId, updates);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update task';
        set({ loading: false, error: message });
        return false;
      }
    },

    removeTask: async (_pb, taskId) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });
        await deleteTaskInSupabase(profile.id, taskId);
        await synchronizeWorkspace(profile.id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove task';
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

    sendChatMessage: async (message: string) => {
      try {
        const profile = ensureProfile();
        set({ loading: true, error: null });

        const response = await sendChatMessage(message);

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
  };
});

export default usePersonasStore;
