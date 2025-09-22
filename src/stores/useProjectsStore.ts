import { create } from "zustand";
import { Project } from "@/models/Project";
import { usePersonasStore } from "./usePersonasStore";
import PocketBase from "pocketbase";
import { getPocketBase } from "@/hooks/useMockPocketBase";

interface ProjectsStoreState {
  projects: Project[];
  form: Partial<Project>;
  loading: boolean;
  error: string | null;

  // Data access methods - work with centralized Persona data
  fetchProjects: (token: string, force?: boolean) => Promise<void>;
  getProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;

  // CRUD operations - delegate to PersonasStore
  createProject: (projectData: Partial<Project>) => Promise<boolean>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;

  // Form state management
  setForm: (form: Partial<Project>) => void;
  resetForm: () => void;

  // Utility methods
  clearProjects: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Legacy methods for Knowledge Item association (for compatibility)
  addKnowledgeItemToProject: (
    pb: any,
    projectId: string,
    knowledgeItemId: string
  ) => Promise<boolean>;
  removeKnowledgeItemFromProject: (
    pb: any,
    projectId: string,
    knowledgeItemId: string
  ) => Promise<boolean>;
  removeProject: (id: string) => Promise<boolean>;
}

export const useProjectsStore = create<ProjectsStoreState>((set, get) => ({
  projects: [],
  form: {},
  loading: false,
  error: null,

  // Fetch projects from centralized Persona data
  fetchProjects: async (token: string, force = false) => {
    try {
      set({ loading: true, error: null });

      // For demo, return mock projects immediately
      if (token === 'demo-user-iam') {
        const mockProjects = [
          {
            id: 'demo-project-1',
            name: 'Sample Project',
            description: 'A demonstration project for the MVP',
            status: 'active',
            priority: 'medium',
            progress: 45,
            startDate: new Date().toISOString(),
            goals: [],
            items: [],
            milestones: []
          }
        ];

        set({ projects: mockProjects, loading: false });
        console.log("✅ PROJECTS STORE: Loaded mock projects for demo");
        return;
      }

      // Ensure PersonasStore is loaded first
      const personasStore = usePersonasStore.getState();

      // Get projects from centralized Persona store
      const projects = personasStore.getProjects();

      console.debug(
        `📦 PROJECTS STORE: Using ${projects.length} projects from PersonasStore`
      );

      set({ projects, loading: false });
    } catch (error: any) {
      console.error(
        "❌ PROJECTS STORE: Error getting projects:",
        error?.message
      );
      set({
        error: error.message || "Failed to get projects",
        loading: false,
      });
    }
  },

  // Get projects from local state
  getProjects: () => {
    return get().projects;
  },

  // Get specific project by ID
  getProjectById: (id: string) => {
    const { projects } = get();
    return projects.find((project) => project.id === id);
  },

  // Create new project - delegates to PersonasStore
  createProject: async (projectData: Partial<Project>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.addProject(pb, projectData);

      if (success) {
        // Update local projects from refreshed Persona data
        const updatedProjects = personasStore.getProjects();
        set({ projects: updatedProjects, loading: false });

        console.log("✅ PROJECTS STORE: Project created successfully");
        return true;
      } else {
        set({ error: "Failed to create project", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to create project:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to create project",
        loading: false,
      });
      return false;
    }
  },

  // Update project - delegates to PersonasStore
  updateProject: async (id: string, updates: Partial<Project>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.updateProject(pb, id, updates);

      if (success) {
        // Update local projects from refreshed Persona data
        const updatedProjects = personasStore.getProjects();
        set({ projects: updatedProjects, loading: false });

        console.log("✅ PROJECTS STORE: Project updated successfully");
        return true;
      } else {
        set({ error: "Failed to update project", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to update project:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to update project",
        loading: false,
      });
      return false;
    }
  },

  // Delete project - delegates to PersonasStore
  deleteProject: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.removeProject(pb, id);

      if (success) {
        // Update local projects from refreshed Persona data
        const updatedProjects = personasStore.getProjects();
        set({ projects: updatedProjects, loading: false });

        console.log("✅ PROJECTS STORE: Project deleted successfully");
        return true;
      } else {
        set({ error: "Failed to delete project", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to delete project:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to delete project",
        loading: false,
      });
      return false;
    }
  },

  // Form state management
  setForm: (form: Partial<Project>) => {
    set({ form });
  },

  resetForm: () => {
    set({ form: {} });
  },

  // Utility methods
  clearProjects: () => {
    console.log("🧹 PROJECTS STORE: Clearing projects data");
    set({ projects: [], loading: false, error: null, form: {} });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  // Legacy methods for Knowledge Item association (for compatibility)
  addKnowledgeItemToProject: async (
    pb: any,
    projectId: string,
    knowledgeItemId: string
  ) => {
    try {
      set({ loading: true, error: null });
      const personasStore = usePersonasStore.getState();
      const success = await personasStore.addKnowledgeItemToProject(
        pb,
        projectId,
        knowledgeItemId
      );
      if (success) {
        const updatedProjects = personasStore.getProjects();
        set({ projects: updatedProjects, loading: false });
        console.log(
          "✅ PROJECTS STORE: Knowledge item added to project successfully"
        );
        return true;
      } else {
        set({
          error: "Failed to add knowledge item to project",
          loading: false,
        });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to add knowledge item to project:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to add knowledge item to project",
        loading: false,
      });
      return false;
    }
  },

  removeKnowledgeItemFromProject: async (
    pb: any,
    projectId: string,
    knowledgeItemId: string
  ) => {
    try {
      set({ loading: true, error: null });
      const personasStore = usePersonasStore.getState();
      const success = await personasStore.removeKnowledgeItemFromProject(
        pb,
        projectId,
        knowledgeItemId
      );
      if (success) {
        const updatedProjects = personasStore.getProjects();
        set({ projects: updatedProjects, loading: false });
        console.log(
          "✅ PROJECTS STORE: Knowledge item removed from project successfully"
        );
        return true;
      } else {
        set({
          error: "Failed to remove knowledge item from project",
          loading: false,
        });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to remove knowledge item from project:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to remove knowledge item from project",
        loading: false,
      });
      return false;
    }
  },

  removeProject: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const personasStore = usePersonasStore.getState();
      const success = await personasStore.removeProject(getPocketBase(), id);
      if (success) {
        const updatedProjects = personasStore.getProjects();
        set({ projects: updatedProjects, loading: false });
        console.log("✅ PROJECTS STORE: Project removed successfully");
        return true;
      } else {
        set({ error: "Failed to remove project", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to remove project:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to remove project",
        loading: false,
      });
      return false;
    }
  },
}));
