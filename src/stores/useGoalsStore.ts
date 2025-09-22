import { create } from "zustand";
import { Goal } from "@/models/Goal";
import { getPocketBase } from "@/hooks/useMockPocketBase";
import { usePersonasStore } from "./usePersonasStore";

interface GoalsStoreState {
  goals: Goal[];
  form: Partial<Goal>;
  loading: boolean;
  error: string | null;
  lastFetchTime: number;

  // Data access methods - work with centralized Persona data
  fetchGoals: (token: string, force?: boolean) => Promise<void>;
  getGoals: () => Goal[];
  getGoalById: (id: string) => Goal | undefined;
  getGoalsByProjectId: (projectId: string) => Goal[];

  // CRUD operations - delegate to PersonasStore
  createGoal: (projectId: string, goalData: Partial<Goal>) => Promise<boolean>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;

  // Form state management
  setForm: (form: Partial<Goal>) => void;
  resetForm: () => void;

  // Utility methods
  clearGoals: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const FETCH_DEBOUNCE_MS = 2000;

export const useGoalsStore = create<GoalsStoreState>((set, get) => ({
  goals: [],
  form: {},
  loading: false,
  error: null,
  lastFetchTime: 0,

  // Fetch goals from centralized Persona data
  fetchGoals: async (token: string, force = false) => {
    const state = get();
    const now = Date.now();

    // Debounce: Skip if recently fetched (unless forced)
    if (
      !force &&
      state.goals.length > 0 &&
      now - state.lastFetchTime < FETCH_DEBOUNCE_MS
    ) {
      console.debug("⏭️ GOALS STORE: Skipping fetch - recently fetched");
      return;
    }

    // Skip if already loading (unless forced)
    if (!force && state.loading) {
      console.debug("⏭️ GOALS STORE: Skipping fetch - already loading");
      return;
    }

    try {
      set({ loading: true, error: null, lastFetchTime: now });

      // Get goals from centralized Persona store (no additional fetching)
      const personasStore = usePersonasStore.getState();
      const goals = personasStore.getGoals();

      console.debug(
        `🎯 GOALS STORE: Using ${goals.length} goals from PersonasStore`
      );

      set({ goals, loading: false });
    } catch (error: any) {
      console.error("❌ GOALS STORE: Error getting goals:", error?.message);
      set({ error: error.message || "Failed to get goals", loading: false });
    }
  },

  // Get goals from local state
  getGoals: () => {
    return get().goals;
  },

  // Get specific goal by ID
  getGoalById: (id: string) => {
    const { goals } = get();
    return goals.find((goal) => goal.id === id);
  },

  // Get goals by project ID
  getGoalsByProjectId: (projectId: string) => {
    const { goals } = get();
    return goals.filter((goal) => goal.project_id === projectId);
  },

  // Create new goal - delegates to PersonasStore
  createGoal: async (projectId: string, goalData: Partial<Goal>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.addGoal(pb, projectId, goalData);

      if (success) {
        // Update local goals from refreshed Persona data
        const updatedGoals = personasStore.getGoals();
        set({ goals: updatedGoals, loading: false });

        console.log("✅ GOALS STORE: Goal created successfully");
        return true;
      } else {
        set({ error: "Failed to create goal", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to create goal:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({ error: error.message || "Failed to create goal", loading: false });
      return false;
    }
  },

  // Update goal - delegates to PersonasStore
  updateGoal: async (id: string, updates: Partial<Goal>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.updateGoal(pb, id, updates);

      if (success) {
        // Update local goals from refreshed Persona data
        const updatedGoals = personasStore.getGoals();
        set({ goals: updatedGoals, loading: false });

        console.log("✅ GOALS STORE: Goal updated successfully");
        return true;
      } else {
        set({ error: "Failed to update goal", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to update goal:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({ error: error.message || "Failed to update goal", loading: false });
      return false;
    }
  },

  // Delete goal - delegates to PersonasStore
  deleteGoal: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.removeGoal(pb, id);

      if (success) {
        // Update local goals from refreshed Persona data
        const updatedGoals = personasStore.getGoals();
        set({ goals: updatedGoals, loading: false });

        console.log("✅ GOALS STORE: Goal deleted successfully");
        return true;
      } else {
        set({ error: "Failed to delete goal", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to delete goal:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({ error: error.message || "Failed to delete goal", loading: false });
      return false;
    }
  },

  // Form state management
  setForm: (form: Partial<Goal>) => {
    set({ form });
  },

  resetForm: () => {
    set({ form: {} });
  },

  // Utility methods
  clearGoals: () => {
    console.log("🧹 GOALS STORE: Clearing goals data");
    set({
      goals: [],
      form: {},
      loading: false,
      error: null,
      lastFetchTime: 0,
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));
