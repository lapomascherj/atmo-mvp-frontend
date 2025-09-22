import { create } from "zustand";
import { Task } from "@/models/Task";
import { getPocketBase } from "@/hooks/useMockPocketBase";
import { usePersonasStore } from "./usePersonasStore";

interface TasksStoreState {
  tasks: Task[];
  form: Task;
  completion: number;
  loading: boolean;
  error: string | null;
  lastFetchTime: number;

  // Data access methods - work with centralized Persona data
  fetchTasks: (token: string, force?: boolean) => Promise<void>;
  getTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  getTasksByGoalId: (goalId: string) => Task[];
  getTasksByProjectId: (projectId: string) => Task[];

  // CRUD operations - delegate to PersonasStore
  createTask: (goalId: string, taskData: Partial<Task>) => Promise<boolean>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;

  // Form state management
  setForm: (form: Task) => void;
  resetForm: () => void;

  // Utility methods
  clearTasks: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  calculateCompletion: () => void;
}

const FETCH_DEBOUNCE_MS = 2000;

export const useTasksStore = create<TasksStoreState>((set, get) => ({
  tasks: [],
  form: {} as Task,
  completion: 0,
  loading: false,
  error: null,
  lastFetchTime: 0,

  // Fetch tasks from centralized Persona data
  fetchTasks: async (token: string, force = false) => {
    const state = get();
    const now = Date.now();

    // Debounce: Skip if recently fetched (unless forced)
    if (
      !force &&
      state.tasks.length > 0 &&
      now - state.lastFetchTime < FETCH_DEBOUNCE_MS
    ) {
      console.debug("⏭️ TASKS STORE: Skipping fetch - recently fetched");
      return;
    }

    // Skip if already loading (unless forced)
    if (!force && state.loading) {
      console.debug("⏭️ TASKS STORE: Skipping fetch - already loading");
      return;
    }

    try {
      set({ loading: true, error: null, lastFetchTime: now });

      // Get tasks from centralized Persona store (no additional fetching)
      const personasStore = usePersonasStore.getState();
      const tasks = personasStore.getTasks();

      console.debug(
        `✅ TASKS STORE: Using ${tasks.length} tasks from PersonasStore`
      );

      set({ tasks, loading: false });

      // Calculate completion percentage
      get().calculateCompletion();
    } catch (error: any) {
      console.error("❌ TASKS STORE: Error getting tasks:", error?.message);
      set({ error: error.message || "Failed to get tasks", loading: false });
    }
  },

  // Get tasks from local state
  getTasks: () => {
    return get().tasks;
  },

  // Get specific task by ID
  getTaskById: (id: string) => {
    const { tasks } = get();
    return tasks.find((task) => task.id === id);
  },

  // Get tasks by goal ID
  getTasksByGoalId: (goalId: string) => {
    const { tasks } = get();
    return tasks.filter((task) => task.goal_id === goalId);
  },

  // Get tasks by project ID
  getTasksByProjectId: (projectId: string) => {
    const { tasks } = get();
    return tasks.filter((task) => task.project_id === projectId);
  },

  // Create new task - delegates to PersonasStore
  createTask: async (goalId: string, taskData: Partial<Task>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.addTask(pb, goalId, taskData);

      if (success) {
        // Update local tasks from refreshed Persona data
        const updatedTasks = personasStore.getTasks();
        set({ tasks: updatedTasks, loading: false });

        // Recalculate completion
        get().calculateCompletion();

        console.log("✅ TASKS STORE: Task created successfully");
        return true;
      } else {
        set({ error: "Failed to create task", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to create task:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({ error: error.message || "Failed to create task", loading: false });
      return false;
    }
  },

  // Update task - delegates to PersonasStore
  updateTask: async (id: string, updates: Partial<Task>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.updateTask(pb, id, updates);

      if (success) {
        // Update local tasks from refreshed Persona data
        const updatedTasks = personasStore.getTasks();
        set({ tasks: updatedTasks, loading: false });

        // Recalculate completion
        get().calculateCompletion();

        console.log("✅ TASKS STORE: Task updated successfully");
        return true;
      } else {
        set({ error: "Failed to update task", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to update task:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({ error: error.message || "Failed to update task", loading: false });
      return false;
    }
  },

  // Delete task - delegates to PersonasStore
  deleteTask: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.removeTask(pb, id);

      if (success) {
        // Update local tasks from refreshed Persona data
        const updatedTasks = personasStore.getTasks();
        set({ tasks: updatedTasks, loading: false });

        // Recalculate completion
        get().calculateCompletion();

        console.log("✅ TASKS STORE: Task deleted successfully");
        return true;
      } else {
        set({ error: "Failed to delete task", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to delete task:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({ error: error.message || "Failed to delete task", loading: false });
      return false;
    }
  },

  // Form state management
  setForm: (form: Task) => {
    set({ form });
  },

  resetForm: () => {
    set({ form: {} as Task });
  },

  // Calculate completion percentage
  calculateCompletion: () => {
    const { tasks } = get();
    if (tasks.length === 0) {
      set({ completion: 0 });
      return;
    }

    const completedTasks = tasks.filter(
      (task) => task.completed || task.status === "completed"
    );
    const completion = Math.round((completedTasks.length / tasks.length) * 100);
    set({ completion });
  },

  // Utility methods
  clearTasks: () => {
    console.log("🧹 TASKS STORE: Clearing tasks data");
    set({
      tasks: [],
      form: {} as Task,
      completion: 0,
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
