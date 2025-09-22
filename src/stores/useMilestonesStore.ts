import { create } from "zustand";
import { Milestone, MilestoneFormData } from "@/models/Milestone";
import PocketBase, { ClientResponseError } from "pocketbase";
import { useProjectsStore } from "./useProjectsStore";

interface MilestonesStoreState {
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number;

  // Data operations
  fetchMilestones: (
    pb: PocketBase,
    projectId?: string,
    force?: boolean
  ) => Promise<void>;
  addMilestone: (
    pb: PocketBase,
    milestone: MilestoneFormData
  ) => Promise<Milestone | null>;
  updateMilestone: (
    pb: PocketBase,
    id: string,
    milestone: Partial<MilestoneFormData>
  ) => Promise<void>;
  removeMilestone: (pb: PocketBase, id: string) => Promise<void>;

  // Utility functions
  getMilestonesByProject: (projectId: string) => Milestone[];
  getMilestoneById: (id: string) => Milestone | undefined;
  clearMilestones: () => void;
}

// Debounce delay for fetch requests (in milliseconds)
const FETCH_DEBOUNCE_MS = 1000;

// Helper function to handle PocketBase operations with error handling
const withPocketBase = async <T>(
  operation: () => Promise<T>,
  errorMessage: string,
  set: (
    fn: (state: MilestonesStoreState) => Partial<MilestonesStoreState>
  ) => void
): Promise<T | null> => {
  try {
    set((state) => ({ ...state, loading: true, error: null }));
    const result = await operation();
    set((state) => ({ ...state, loading: false }));
    return result;
  } catch (error) {
    // Handle auto-cancellation specifically
    if (error instanceof ClientResponseError && error.status === 0) {
      console.log(
        "Request was auto-cancelled by PocketBase - this is expected"
      );
      set((state) => ({ ...state, loading: false }));
      return null;
    }

    console.error(errorMessage, error);
    set((state) => ({ ...state, error: errorMessage, loading: false }));
    return null;
  }
};

export const useMilestonesStore = create<MilestonesStoreState>((set, get) => ({
  milestones: [],
  loading: false,
  error: null,
  lastFetchTime: 0,

  // Fetch milestones from PocketBase
  fetchMilestones: async (pb, projectId, force = false) => {
    const state = get();
    const now = Date.now();

    // Debounce: Skip if recently fetched (unless forced)
    if (
      !force &&
      state.milestones.length > 0 &&
      now - state.lastFetchTime < FETCH_DEBOUNCE_MS
    ) {
      console.log("Skipping milestones fetch - recently fetched");
      return;
    }

    // Skip if already loading (unless forced)
    if (!force && state.loading) {
      console.log("Skipping milestones fetch - already loading");
      return;
    }

    await withPocketBase(
      async () => {
        set({ lastFetchTime: now });

        try {
          // Fetch all milestones with expanded goals relation
          // PocketBase will automatically filter by authenticated user
          const records = await pb.collection("milestones").getFullList({
            expand: "goals",
            sort: "-created",
          });

          console.log(`✅ MILESTONES: Fetched ${records.length} milestones`);
          set({ milestones: records });
        } catch (error: any) {
          // Handle the case where milestones collection doesn't exist
          if (
            error.status === 404 ||
            error.message?.includes("not found") ||
            error.message?.includes("doesn't exist")
          ) {
            console.log(
              "Milestones collection not found - setting empty array"
            );
            set({ milestones: [] });
            return;
          }
          // Re-throw other errors
          throw error;
        }
      },
      "Failed to fetch milestones",
      set
    );
  },

  // Add milestone to PocketBase
  addMilestone: async (pb, milestone) => {
    return await withPocketBase(
      async () => {
        try {
          const record = await pb
            .collection("milestones")
            .create<Milestone>(milestone);
          set((state) => ({
            milestones: [...state.milestones, record],
          }));
          return record;
        } catch (error: any) {
          // Handle the case where milestones collection doesn't exist
          if (
            error.status === 404 ||
            error.message?.includes("not found") ||
            error.message?.includes("doesn't exist")
          ) {
            console.log(
              "Milestones collection not found - milestone feature not available"
            );
            return null;
          }
          // Re-throw other errors
          throw error;
        }
      },
      "Failed to add milestone",
      set
    );
  },

  // Update milestone in PocketBase
  updateMilestone: async (pb, id, milestone) => {
    await withPocketBase(
      async () => {
        try {
          const record = await pb
            .collection("milestones")
            .update<Milestone>(id, milestone);
          set((state) => ({
            milestones: state.milestones.map((m) => (m.id === id ? record : m)),
          }));
        } catch (error: any) {
          // Handle the case where milestones collection doesn't exist
          if (
            error.status === 404 ||
            error.message?.includes("not found") ||
            error.message?.includes("doesn't exist")
          ) {
            console.log(
              "Milestones collection not found - milestone feature not available"
            );
            return;
          }
          // Re-throw other errors
          throw error;
        }
      },
      "Failed to update milestone",
      set
    );
  },

  // Remove milestone from PocketBase
  removeMilestone: async (pb, id) => {
    await withPocketBase(
      async () => {
        try {
          await pb.collection("milestones").delete(id);
          set((state) => ({
            milestones: state.milestones.filter((m) => m.id !== id),
          }));
        } catch (error: any) {
          // Handle the case where milestones collection doesn't exist
          if (
            error.status === 404 ||
            error.message?.includes("not found") ||
            error.message?.includes("doesn't exist")
          ) {
            console.log(
              "Milestones collection not found - milestone feature not available"
            );
            return;
          }
          // Re-throw other errors
          throw error;
        }
      },
      "Failed to remove milestone",
      set
    );
  },

  // Utility functions
  getMilestonesByProject: (projectId) => {
    // Since milestones might not have direct project_id, we need to get them from projects
    // This is a temporary solution - ideally we should use project.expand.milestones
    const { projects } = useProjectsStore.getState();
    const project = projects.find((p) => p.id === projectId);
    return project?.milestones || project?.expand?.milestones || [];
  },

  getMilestoneById: (id) => {
    return get().milestones.find((milestone) => milestone.id === id);
  },

  clearMilestones: () => set({ milestones: [] }),
}));
