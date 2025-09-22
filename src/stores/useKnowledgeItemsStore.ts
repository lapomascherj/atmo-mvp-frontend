import { create } from "zustand";
import { KnowledgeItem } from "@/models/KnowledgeItem";
import { KnowledgeType } from "@/models/KnowledgeType";
import PocketBase from "pocketbase";
import { usePersonasStore } from "./usePersonasStore";
import { getPocketBase } from "@/hooks/useMockPocketBase";

interface KnowledgeItemsStoreState {
  knowledgeItems: KnowledgeItem[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number;

  // Data access methods - work with centralized Persona data
  fetchKnowledgeItems: (pb: any, force?: boolean) => Promise<void>;
  getKnowledgeItems: () => KnowledgeItem[];
  getKnowledgeItemById: (id: string) => KnowledgeItem | undefined;
  getKnowledgeItemsByType: (type: string) => KnowledgeItem[];
  getKnowledgeItemsBySource: (source: string) => KnowledgeItem[];
  getItemsByProject: (projectId: string) => KnowledgeItem[];

  // CRUD operations - delegate to PersonasStore
  createKnowledgeItem: (itemData: Partial<KnowledgeItem>) => Promise<boolean>;
  updateKnowledgeItem: (
    id: string,
    updates: Partial<KnowledgeItem>
  ) => Promise<boolean>;
  deleteKnowledgeItem: (id: string) => Promise<boolean>;

  // Utility methods
  clearAllData: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const FETCH_DEBOUNCE_MS = 2000;

export const useKnowledgeItemsStore = create<KnowledgeItemsStoreState>(
  (set, get) => ({
    knowledgeItems: [],
    loading: false,
    error: null,
    lastFetchTime: 0,

    // Fetch knowledge items from centralized Persona data
    fetchKnowledgeItems: async (pb: any, force = false) => {
      const state = get();
      const now = Date.now();

      // Debounce: Skip if recently fetched (unless forced)
      if (
        !force &&
        state.knowledgeItems.length > 0 &&
        now - state.lastFetchTime < FETCH_DEBOUNCE_MS
      ) {
        console.debug(
          "⏭️ KNOWLEDGE ITEMS STORE: Skipping fetch - recently fetched"
        );
        return;
      }

      // Skip if already loading (unless forced)
      if (!force && state.loading) {
        console.debug(
          "⏭️ KNOWLEDGE ITEMS STORE: Skipping fetch - already loading"
        );
        return;
      }

      try {
        set({ loading: true, error: null, lastFetchTime: now });

        // Get knowledge items from centralized Persona store (no additional fetching)
        const personasStore = usePersonasStore.getState();
        const knowledgeItems = personasStore.getKnowledgeItems();

        console.debug(
          `📚 KNOWLEDGE ITEMS STORE: Using ${knowledgeItems.length} items from PersonasStore`
        );

        set({ knowledgeItems, loading: false });
      } catch (error: any) {
        console.error(
          "❌ KNOWLEDGE ITEMS STORE: Error getting knowledge items:",
          error?.message
        );
        set({
          error: error.message || "Failed to get knowledge items",
          loading: false,
        });
      }
    },

    // Get knowledge items from local state
    getKnowledgeItems: () => {
      return get().knowledgeItems;
    },

    // Get specific knowledge item by ID
    getKnowledgeItemById: (id: string) => {
      const { knowledgeItems } = get();
      return knowledgeItems.find((item) => item.id === id);
    },

    // Get knowledge items by type
    getKnowledgeItemsByType: (type: string) => {
      const { knowledgeItems } = get();
      return knowledgeItems.filter((item) => item.type === type);
    },

    // Get knowledge items by source
    getKnowledgeItemsBySource: (source: string) => {
      const { knowledgeItems } = get();
      return knowledgeItems.filter((item) => item.source === source);
    },

    // Get knowledge items by project ID (knowledge items have a projects array field)
    getItemsByProject: (projectId: string) => {
      const { knowledgeItems } = get();
      return knowledgeItems.filter((item) =>
        item.projects?.includes(projectId)
      );
    },

    // Create new knowledge item - delegates to PersonasStore
    createKnowledgeItem: async (itemData: Partial<KnowledgeItem>) => {
      try {
        set({ loading: true, error: null });

        const pb = getPocketBase();
        const personasStore = usePersonasStore.getState();

        // Delegate to centralized Persona store
        const success = await personasStore.addKnowledgeItem(pb, itemData);

        if (success) {
          // Update local knowledge items from refreshed Persona data
          const updatedItems = personasStore.getKnowledgeItems();
          set({ knowledgeItems: updatedItems, loading: false });

          console.log(
            "✅ KNOWLEDGE ITEMS STORE: Knowledge item created successfully"
          );
          return true;
        } else {
          set({ error: "Failed to create knowledge item", loading: false });
          return false;
        }
      } catch (error: any) {
        console.error("Failed to create knowledge item:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        set({
          error: error.message || "Failed to create knowledge item",
          loading: false,
        });
        return false;
      }
    },

    // Update knowledge item - delegates to PersonasStore
    updateKnowledgeItem: async (
      id: string,
      updates: Partial<KnowledgeItem>
    ) => {
      try {
        set({ loading: true, error: null });

        const pb = getPocketBase();
        const personasStore = usePersonasStore.getState();

        // Delegate to centralized Persona store
        const success = await personasStore.updateKnowledgeItem(
          pb,
          id,
          updates
        );

        if (success) {
          // Update local knowledge items from refreshed Persona data
          const updatedItems = personasStore.getKnowledgeItems();
          set({ knowledgeItems: updatedItems, loading: false });

          console.log(
            "✅ KNOWLEDGE ITEMS STORE: Knowledge item updated successfully"
          );
          return true;
        } else {
          set({ error: "Failed to update knowledge item", loading: false });
          return false;
        }
      } catch (error: any) {
        console.error("Failed to update knowledge item:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        set({
          error: error.message || "Failed to update knowledge item",
          loading: false,
        });
        return false;
      }
    },

    // Delete knowledge item - delegates to PersonasStore
    deleteKnowledgeItem: async (id: string) => {
      try {
        set({ loading: true, error: null });

        const pb = getPocketBase();
        const personasStore = usePersonasStore.getState();

        // Delegate to centralized Persona store
        const success = await personasStore.removeKnowledgeItem(pb, id);

        if (success) {
          // Update local knowledge items from refreshed Persona data
          const updatedItems = personasStore.getKnowledgeItems();
          set({ knowledgeItems: updatedItems, loading: false });

          console.log(
            "✅ KNOWLEDGE ITEMS STORE: Knowledge item deleted successfully"
          );
          return true;
        } else {
          set({ error: "Failed to delete knowledge item", loading: false });
          return false;
        }
      } catch (error: any) {
        console.error("Failed to delete knowledge item:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        set({
          error: error.message || "Failed to delete knowledge item",
          loading: false,
        });
        return false;
      }
    },

    // Utility methods
    clearAllData: () => {
      console.log("🧹 KNOWLEDGE ITEMS STORE: Clearing knowledge items data");
      set({
        knowledgeItems: [],
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
  })
);
