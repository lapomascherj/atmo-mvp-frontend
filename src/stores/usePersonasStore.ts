import { create } from "zustand";
import { Persona } from "@/models/Persona";
import PocketBase from "pocketbase";
import { sanitizeForPocketBase } from "@/utils/utils";

// Extended Persona interface with all expanded relations
export interface ExpandedPersona extends Persona {
  expand?: {
    projects?: Array<{
      id: string;
      name: string;
      description?: string;
      status?: string;
      priority?: string;
      color?: string;
      progress?: number;
      timeInvested?: number;
      lastUpdate?: string;
      startDate?: string;
      targetDate?: string;
      tags?: string[];
      notes?: string;
      expand?: {
        goals?: Array<{
          id: string;
          name: string;
          description?: string;
          status?: string;
          priority?: string;
          target_date?: string;
          progress?: number;
          expand?: {
            tasks?: Array<{
              id: string;
              name: string;
              description?: string;
              status?: string;
              priority?: string;
              due_date?: string;
              completed?: boolean;
              progress?: number;
            }>;
          };
        }>;
        milestones?: Array<{
          id: string;
          name: string;
          description?: string;
          target_date?: string;
          completed?: boolean;
          progress?: number;
        }>;
        items?: Array<{
          id: string;
          title: string;
          content?: string;
          type?: string;
          source?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        }>;
      };
    }>;
    items?: Array<{
      id: string;
      title: string;
      content?: string;
      type?: string;
      source?: string;
      tags?: string[];
      created_at?: string;
      updated_at?: string;
    }>;
    integrations?: Array<{
      id: string;
      provider: string;
      status: string;
      credentials?: any;
      settings?: any;
    }>;
  };
}

interface PersonasStoreState {
  // Main centralized data
  currentPersona: ExpandedPersona | null;
  loading: boolean;
  error: string | null;

  // Core CRUD operations for Persona
  fetchPersonaByIam: (
    pb: PocketBase,
    iam: string,
    forceRefresh?: boolean
  ) => Promise<ExpandedPersona | null>;
  createPersona: (
    pb: PocketBase,
    data: Partial<Persona>
  ) => Promise<ExpandedPersona | null>;
  updatePersona: (
    pb: PocketBase,
    id: string,
    data: Partial<Persona>
  ) => Promise<boolean>;
  clearPersona: () => void;

  // JSON operations for nested data - these update the centralized Persona
  // Projects
  getProjects: () => any[];
  addProject: (pb: PocketBase, project: any) => Promise<boolean>;
  updateProject: (
    pb: PocketBase,
    projectId: string,
    updates: any
  ) => Promise<boolean>;
  removeProject: (pb: PocketBase, projectId: string) => Promise<boolean>;

  // Knowledge Items
  getKnowledgeItems: () => any[];
  getAllKnowledgeItems: (pb: PocketBase) => Promise<any[]>;
  addKnowledgeItem: (pb: PocketBase, item: any) => Promise<boolean>;
  updateKnowledgeItem: (
    pb: PocketBase,
    itemId: string,
    updates: any
  ) => Promise<boolean>;
  removeKnowledgeItem: (pb: PocketBase, itemId: string) => Promise<boolean>;

  // Goals (within projects)
  getGoals: () => any[];
  addGoal: (pb: PocketBase, projectId: string, goal: any) => Promise<boolean>;
  updateGoal: (
    pb: PocketBase,
    goalId: string,
    updates: any
  ) => Promise<boolean>;
  removeGoal: (pb: PocketBase, goalId: string) => Promise<boolean>;

  // Tasks (within goals)
  getTasks: () => any[];
  addTask: (pb: PocketBase, goalId: string, task: any) => Promise<boolean>;
  updateTask: (
    pb: PocketBase,
    taskId: string,
    updates: any
  ) => Promise<boolean>;
  removeTask: (pb: PocketBase, taskId: string) => Promise<boolean>;

  // Milestones (within projects)
  getMilestones: () => any[];
  addMilestone: (
    pb: PocketBase,
    projectId: string,
    milestone: any
  ) => Promise<boolean>;
  updateMilestone: (
    pb: PocketBase,
    milestoneId: string,
    updates: any
  ) => Promise<boolean>;
  removeMilestone: (pb: PocketBase, milestoneId: string) => Promise<boolean>;

  // Calendar Events (from knowledge items)
  getCalendarEvents: () => any[];

  // Utility method to refresh all stores after centralized data is loaded
  refreshAllStores: () => void;

  // Knowledge Item-Project associations (for compatibility)
  addKnowledgeItemToProject: (
    pb: PocketBase,
    projectId: string,
    knowledgeItemId: string
  ) => Promise<boolean>;
  removeKnowledgeItemFromProject: (
    pb: PocketBase,
    projectId: string,
    knowledgeItemId: string
  ) => Promise<boolean>;

  // Integrations
  getIntegrations: () => any[];
}

/**
 * Handle PocketBase operations with proper error handling
 */
const withPocketBase = async <T>(
  operation: () => Promise<T>,
  onError?: (error: string) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error: any) {
    // Handle auto-cancellation quietly (this is expected PocketBase behavior)
    if (error?.message?.includes("autocancelled")) {
      console.debug(
        "🔄 PERSONA STORE: Request auto-cancelled (expected behavior)"
      );
      return null;
    }

    console.error("PocketBase operation failed:", {
      message: error?.message || "Unknown error",
      status: error?.status,
      name: error?.name,
    });
    if (onError) {
      onError(error?.message || "Operation failed");
    }
    return null;
  }
};

export const usePersonasStore = create<PersonasStoreState>((set, get) => ({
  currentPersona: null,
  loading: false,
  error: null,

  // Fetch persona by Casdoor IAM ID with ALL expanded relations using back-relations
  fetchPersonaByIam: async (
    pb: PocketBase,
    iam: string,
    forceRefresh: boolean = false
  ) => {
    // Prevent concurrent fetches for the same IAM unless force refresh is requested
    const { currentPersona, loading } = get();
    if (loading && !forceRefresh) {
      console.debug("🔄 PERSONA STORE: Fetch already in progress, skipping");
      return currentPersona;
    }

    // If we already have the persona for this IAM, don't refetch unless forced
    if (currentPersona && currentPersona.iam === iam && !forceRefresh) {
      console.debug("✅ PERSONA STORE: Persona already loaded for IAM:", iam);
      return currentPersona;
    }

    // Return mock data immediately for demo
    if (iam === 'demo-user-iam') {
      const mockPersona = {
        id: 'demo-persona-1',
        iam: 'demo-user-iam',
        nickname: 'Demo User',
        onboarding_completed: true,
        expand: {
          projects: [
            {
              id: 'demo-project-1',
              name: 'Sample Project',
              description: 'A demonstration project for the MVP',
              status: 'active',
              priority: 'medium',
              progress: 45,
              startDate: new Date().toISOString(),
              expand: {
                goals: [],
                items: [],
                milestones: []
              }
            }
          ],
          items: [
            {
              id: 'demo-item-1',
              title: 'Welcome to ATMO',
              content: 'This is a sample knowledge item to demonstrate the Digital Brain functionality.',
              type: 'note',
              source: 'manual',
              tags: ['demo', 'welcome'],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          integrations: []
        }
      } as ExpandedPersona;

      set({ currentPersona: mockPersona, loading: false });
      console.log("✅ PERSONA STORE: Loaded mock persona for demo");
      return mockPersona;
    }

    const result = await withPocketBase(
      async () => {
        set({ loading: true, error: null });

        console.debug(
          "🔍 PERSONA STORE: Fetching persona with iam:",
          iam,
          forceRefresh ? "(forced)" : ""
        );

        // Use real PocketBase client
        const { pb } = await import("@/lib/pocketbase");
        const authenticatedPb = pb;

        try {
          console.debug("🔍 PERSONA STORE: Making PocketBase request for personas");

          const existingPersonas = await authenticatedPb
            .collection("personas")
            .getList<ExpandedPersona>(1, 1, {
              filter: `iam = "${iam}"`,
              expand:
                "integrations,items,projects,projects.goals,projects.goals.tasks,projects.milestones,projects.items",
            });

          const persona = existingPersonas.items[0] || null;

          if (persona) {
            console.log("✅ PERSONA STORE: Loaded persona with data:", {
              id: persona.id,
              iam: persona.iam,
              onboardingCompleted: persona.onboarding_completed,
              projects: persona.expand?.projects?.length || 0,
              knowledgeItems: persona.expand?.items?.length || 0,
              integrations: persona.expand?.integrations?.length || 0,
            });

            set({ currentPersona: persona, loading: false });

            // Only refresh other stores once after successful load
            get().refreshAllStores();

            return persona;
          } else {
            console.debug("⚠️ PERSONA STORE: No persona found for iam:", iam);
            set({ currentPersona: null, loading: false, error: null });
            return null;
          }
        } catch (error: any) {
          // Don't log auto-cancellation as errors - this is expected PocketBase behavior
          if (error?.message?.includes?.("autocancelled")) {
            console.debug(
              "🔄 PERSONA STORE: Request auto-cancelled (expected)"
            );
            return null;
          }

          console.error(
            "❌ PERSONA STORE: Error fetching persona:",
            error?.message || error
          );
          throw error;
        }
      },
      (error) => {
        // Don't log auto-cancellation as errors
        if (error?.includes?.("autocancelled")) {
          console.debug("🔄 PERSONA STORE: Request auto-cancelled (expected)");
          return;
        }

        console.error("❌ PERSONA STORE: PocketBase error:", error);
        set({
          error: error || "Failed to fetch persona",
          loading: false,
        });
      }
    );

    return result;
  },

  // Create new persona
  createPersona: async (pb: PocketBase, data: Partial<Persona>) => {
    const result = await withPocketBase(
      async () => {
        set({ loading: true, error: null });

        console.log("🆕 PERSONA STORE: Creating new persona");

        // Sanitize persona data to prevent cyclic references
        const sanitizedData = sanitizeForPocketBase(data);

        const newPersona = await pb
          .collection("personas")
          .create<ExpandedPersona>(sanitizedData, {
            expand:
              "integrations,items,projects,projects.goals,projects.goals.tasks,projects.milestones,projects.items",
          });

        console.log("✅ PERSONA STORE: Created new persona:", newPersona.id);

        set({ currentPersona: newPersona, loading: false });
        return newPersona;
      },
      (error) => set({ error, loading: false })
    );

    return result;
  },

  // Update existing persona
  updatePersona: async (pb: PocketBase, id: string, data: Partial<Persona>) => {
    const result = await withPocketBase(
      async () => {
        set({ loading: true, error: null });

        console.log("🔄 PERSONA STORE: Updating persona:", id);

        // Sanitize persona data to prevent cyclic references
        const sanitizedData = sanitizeForPocketBase(data);

        const updatedPersona = await pb
          .collection("personas")
          .update<ExpandedPersona>(id, sanitizedData, {
            expand:
              "integrations,items,projects,projects.goals,projects.goals.tasks,projects.milestones,projects.items",
          });

        console.log("✅ PERSONA STORE: Updated persona:", id);

        set({ currentPersona: updatedPersona, loading: false });
        return true;
      },
      (error) => set({ error, loading: false })
    );

    return !!result;
  },

  // Clear persona data
  clearPersona: () => {
    console.log("🧹 PERSONA STORE: Clearing persona data");
    set({ currentPersona: null, loading: false, error: null });
  },

  // Force refresh mechanism to prevent stuck states
  forceRefresh: () => {
    console.log("🔄 PERSONA STORE: Force refreshing persona data");
    set({ loading: false, error: null });

    // Try to get user data from localStorage and refetch
    const userData = localStorage.getItem("atmo_user_data");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const pb = new PocketBase(
          import.meta.env.VITE_POCKETBASE_URL || "https://baas.ops.the-atmo.com"
        );
        // Don't await this - let it run in background
        get().fetchPersonaByIam(pb, user.iam);
      } catch (error) {
        console.error("Error in force refresh:", error);
      }
    }
  },

  // JSON operations for Projects
  getProjects: () => {
    const { currentPersona } = get();
    const rawProjects = currentPersona?.expand?.projects || [];

    // Transform expanded PocketBase projects to match Project interface
    const transformedProjects = rawProjects.map((project) => {
      // Handle expanded goals and tasks
      const goals = project.expand?.goals || [];
      const transformedGoals = goals.map((goal) => ({
        ...goal,
        tasks: goal.expand?.tasks || [],
      }));

      return {
        ...project,
        goals: transformedGoals,
        items: project.expand?.items || [],
        milestones: project.expand?.milestones || [],
      };
    });

    return transformedProjects;
  },

  addProject: async (pb: PocketBase, project: any) => {
    const { currentPersona } = get();
    if (!currentPersona) {
      console.error(
        "❌ PERSONA STORE: No current persona found for project creation"
      );
      return false;
    }

    console.log("🚀 PERSONA STORE: Creating project and adding to persona:", {
      personaId: currentPersona.id,
      personaIam: currentPersona.iam,
      projectName: project.name,
    });

    const result = await withPocketBase(async () => {
      // Step 1: Sanitize project data to prevent cyclic references
      console.log("🧹 PERSONA STORE: Sanitizing project data for PocketBase");
      const sanitizedProject = sanitizeForPocketBase(project);

      console.log(
        "📝 PERSONA STORE: Creating project in projects collection with sanitized data:",
        {
          hasName: !!sanitizedProject.name,
          hasDescription: !!sanitizedProject.description,
          goalCount: sanitizedProject.goals?.length || 0,
          itemCount: sanitizedProject.items?.length || 0,
          milestoneCount: sanitizedProject.milestones?.length || 0,
        }
      );

      // Step 2: Create project in PocketBase with sanitized data
      const newProject = await pb
        .collection("projects")
        .create(sanitizedProject);

      console.log("✅ PERSONA STORE: Project created:", {
        projectId: newProject.id,
        projectName: newProject.name,
      });

      // Step 3: Add project ID to persona's projects array using PocketBase + modifier
      console.log(
        "🔗 PERSONA STORE: Adding project to persona's projects array using projects+ modifier"
      );
      await pb.collection("personas").update(currentPersona.id, {
        "projects+": newProject.id,
      });

      console.log(
        "✅ PERSONA STORE: Project added to persona's projects array"
      );

      // Step 4: Refresh the persona to get updated data with the new project
      const refreshedPersona = await get().fetchPersonaByIam(
        pb,
        currentPersona.iam
      );

      console.log(
        "🔄 PERSONA STORE: Refreshed persona after project creation:",
        {
          hasPersona: !!refreshedPersona,
          projectsCount: refreshedPersona?.expand?.projects?.length || 0,
          projects:
            refreshedPersona?.expand?.projects?.map((p) => ({
              id: p.id,
              name: p.name,
            })) || [],
        }
      );

      return refreshedPersona;
    });

    return !!result;
  },

  updateProject: async (pb: PocketBase, projectId: string, updates: any) => {
    const result = await withPocketBase(async () => {
      // Sanitize updates to prevent cyclic references
      const sanitizedUpdates = sanitizeForPocketBase(updates);

      // Update project in PocketBase
      await pb.collection("projects").update(projectId, sanitizedUpdates);

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  removeProject: async (pb: PocketBase, projectId: string) => {
    const result = await withPocketBase(async () => {
      // Delete project from PocketBase
      await pb.collection("projects").delete(projectId);

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  // JSON operations for Knowledge Items
  getKnowledgeItems: () => {
    const { currentPersona } = get();
    // Get knowledge items directly from Persona's items relation
    return currentPersona?.expand?.items || [];
  },

  // NEW: Get ALL knowledge items from PocketBase (for association dialogs)
  getAllKnowledgeItems: async (pb: PocketBase) => {
    const result = await withPocketBase(async () => {
      console.log(
        "🔍 PERSONA STORE: Fetching ALL knowledge items from PocketBase"
      );

      const allItems = await pb.collection("knowledge_items").getFullList({
        sort: "-created",
      });

      console.log("✅ PERSONA STORE: Fetched all knowledge items:", {
        count: allItems.length,
        items: allItems.map((item) => ({
          id: item.id,
          title: item.title || item.name,
          source: item.source,
        })),
      });

      return allItems;
    });

    return result || [];
  },

  addKnowledgeItem: async (pb: PocketBase, item: any) => {
    const { currentPersona } = get();
    if (!currentPersona) return false;

    const result = await withPocketBase(async () => {
      // Step 1: Sanitize knowledge item data to prevent cyclic references
      console.log(
        "🧹 PERSONA STORE: Sanitizing knowledge item data for PocketBase"
      );
      const sanitizedItem = sanitizeForPocketBase(item);

      console.log("📝 PERSONA STORE: Creating knowledge item in collection");
      const newItem = await pb
        .collection("knowledge_items")
        .create(sanitizedItem);

      console.log("✅ PERSONA STORE: Knowledge item created:", {
        itemId: newItem.id,
        itemTitle: newItem.title || newItem.name,
      });

      // Step 2: Add knowledge item ID to persona's items array using PocketBase + modifier
      console.log(
        "🔗 PERSONA STORE: Adding knowledge item to persona's items array using items+ modifier"
      );
      await pb.collection("personas").update(currentPersona.id, {
        "items+": newItem.id,
      });

      console.log(
        "✅ PERSONA STORE: Knowledge item added to persona's items array"
      );

      // Step 3: Refresh the persona to get updated data with the new knowledge item
      return await get().fetchPersonaByIam(pb, currentPersona.iam);
    });

    return !!result;
  },

  updateKnowledgeItem: async (pb: PocketBase, itemId: string, updates: any) => {
    const result = await withPocketBase(async () => {
      // Sanitize updates to prevent cyclic references
      const sanitizedUpdates = sanitizeForPocketBase(updates);

      // Update knowledge item in PocketBase
      await pb.collection("knowledge_items").update(itemId, sanitizedUpdates);

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  removeKnowledgeItem: async (pb: PocketBase, itemId: string) => {
    const result = await withPocketBase(async () => {
      console.log("🗑️ PERSONA STORE: Removing knowledge item:", itemId);

      // Step 1: Get the knowledge item to check if it's a calendar event
      let knowledgeItem;
      try {
        knowledgeItem = await pb.collection("knowledge_items").getOne(itemId);
      } catch (error) {
        console.error("❌ PERSONA STORE: Knowledge item not found:", itemId);
        return false;
      }

      // Step 2: If it's a calendar-related knowledge item, clean up the calendar event
      if (knowledgeItem.source === "calendar" && knowledgeItem.content) {
        console.log(
          "📅 PERSONA STORE: Cleaning up calendar event for knowledge item:",
          itemId
        );

        let eventId = null;

        // Extract event_id from content
        if (typeof knowledgeItem.content === "string") {
          try {
            const contentObj = JSON.parse(knowledgeItem.content);
            eventId = contentObj.event_id;
          } catch (e) {
            console.warn(
              "⚠️ PERSONA STORE: Could not parse knowledge item content:",
              e
            );
          }
        } else if (typeof knowledgeItem.content === "object") {
          eventId = (knowledgeItem.content as any).event_id;
        }

        // Delete the associated calendar event if found
        if (eventId) {
          try {
            await pb.collection("calendar_events").delete(eventId);
            console.log(
              "✅ PERSONA STORE: Deleted associated calendar event:",
              eventId
            );
          } catch (error) {
            console.warn(
              "⚠️ PERSONA STORE: Could not delete calendar event (may not exist):",
              eventId,
              error
            );
          }
        }
      }

      // Step 3: Remove from persona's items array
      const { currentPersona } = get();
      if (currentPersona) {
        await pb.collection("personas").update(currentPersona.id, {
          "items-": itemId,
        });
        console.log(
          "✅ PERSONA STORE: Removed knowledge item from persona's items array:",
          itemId
        );
      }

      // Step 4: Delete the knowledge item from PocketBase
      await pb.collection("knowledge_items").delete(itemId);
      console.log("✅ PERSONA STORE: Deleted knowledge item:", itemId);

      // Step 5: Refresh the persona to get updated data
      if (currentPersona) {
        const refreshedPersona = await get().fetchPersonaByIam(
          pb,
          currentPersona.iam
        );

        // Trigger calendar store refresh if it was a calendar event
        if (knowledgeItem.source === "calendar") {
          console.log(
            "🔄 PERSONA STORE: Refreshing calendar store after calendar event deletion"
          );
          get().refreshAllStores();
        }

        return refreshedPersona;
      }
      return null;
    });

    return !!result;
  },

  // JSON operations for Goals
  getGoals: () => {
    const { currentPersona } = get();
    const projects = currentPersona?.expand?.projects || [];
    const allGoals: any[] = [];

    projects.forEach((project) => {
      const goals = project.expand?.goals || [];
      allGoals.push(
        ...goals.map((goal) => ({ ...goal, project_id: project.id }))
      );
    });

    return allGoals;
  },

  addGoal: async (pb: PocketBase, projectId: string, goal: any) => {
    const result = await withPocketBase(async () => {
      console.log("🚀 PERSONA STORE: Creating goal for project:", projectId);

      // Step 1: Sanitize goal data to prevent cyclic references
      const sanitizedGoal = sanitizeForPocketBase(goal);
      console.log("🧹 PERSONA STORE: Sanitized goal data:", {
        hasName: !!sanitizedGoal.name,
        hasDescription: !!sanitizedGoal.description,
        priority: sanitizedGoal.priority,
        status: sanitizedGoal.status,
      });

      // Step 2: Create goal in PocketBase goals collection
      const newGoal = await pb.collection("goals").create(sanitizedGoal);
      console.log("✅ PERSONA STORE: Goal created:", {
        goalId: newGoal.id,
        goalName: newGoal.name,
      });

      // Step 3: Add goal ID to project's goals array using PocketBase + modifier
      console.log(
        "🔗 PERSONA STORE: Adding goal to project's goals array using goals+ modifier"
      );
      await pb.collection("projects").update(projectId, {
        "goals+": newGoal.id,
      });
      console.log("✅ PERSONA STORE: Goal added to project's goals array");

      // Step 4: Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  updateGoal: async (pb: PocketBase, goalId: string, updates: any) => {
    const result = await withPocketBase(async () => {
      // Sanitize updates to prevent cyclic references
      const sanitizedUpdates = sanitizeForPocketBase(updates);

      // Update goal in PocketBase
      await pb.collection("goals").update(goalId, sanitizedUpdates);

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  removeGoal: async (pb: PocketBase, goalId: string) => {
    const result = await withPocketBase(async () => {
      // Delete goal from PocketBase
      await pb.collection("goals").delete(goalId);

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  // JSON operations for Tasks
  getTasks: () => {
    const { currentPersona } = get();
    const projects = currentPersona?.expand?.projects || [];
    const allTasks: any[] = [];

    projects.forEach((project) => {
      const goals = project.expand?.goals || [];
      goals.forEach((goal) => {
        const tasks = goal.expand?.tasks || [];
        allTasks.push(
          ...tasks.map((task) => ({
            ...task,
            project_id: project.id,
            goal_id: goal.id,
          }))
        );
      });
    });

    return allTasks;
  },

  addTask: async (pb: PocketBase, goalId: string, task: any) => {
    const result = await withPocketBase(async () => {
      console.log("🚀 PERSONA STORE: Creating task for goal:", goalId);

      // Step 1: Sanitize task data to prevent cyclic references
      const sanitizedTask = sanitizeForPocketBase(task);
      console.log("🧹 PERSONA STORE: Sanitized task data:", {
        hasName: !!sanitizedTask.name,
        hasDescription: !!sanitizedTask.description,
        priority: sanitizedTask.priority,
        completed: sanitizedTask.completed,
      });

      // Step 2: Create task in PocketBase tasks collection
      const newTask = await pb.collection("tasks").create(sanitizedTask);
      console.log("✅ PERSONA STORE: Task created:", {
        taskId: newTask.id,
        taskName: newTask.name,
      });

      // Step 3: Create associated calendar event for the task
      console.log(
        "📅 PERSONA STORE: Creating calendar event for task:",
        newTask.name
      );

      // Calculate event timing based on task priority and estimated time
      const now = new Date();
      const startDate = new Date(now);

      // Set start time based on priority (high priority tasks get scheduled sooner)
      if (sanitizedTask.priority === "high") {
        startDate.setHours(startDate.getHours() + 1); // Schedule in 1 hour
      } else if (sanitizedTask.priority === "medium") {
        startDate.setHours(startDate.getHours() + 4); // Schedule in 4 hours
      } else {
        startDate.setDate(startDate.getDate() + 1); // Schedule tomorrow
        startDate.setHours(9, 0, 0, 0); // 9 AM
      }

      // Calculate end time based on estimated time (default to 1 hour)
      const estimatedMinutes = sanitizedTask.estimated_time || 60;
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + estimatedMinutes);

      const calendarEventData = {
        title: `📋 ${sanitizedTask.name}`,
        description:
          sanitizedTask.description || "Task from project management",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        all_day: false,
        location: "",
        attendees: [],
        color:
          sanitizedTask.priority === "high"
            ? "#ef4444"
            : sanitizedTask.priority === "medium"
            ? "#f59e0b"
            : "#3b82f6",
        synced: false,
      };

      // Create calendar event in PocketBase
      const calendarEvent = await pb
        .collection("calendar_events")
        .create(calendarEventData);
      console.log("✅ PERSONA STORE: Calendar event created:", {
        eventId: calendarEvent.id,
        eventTitle: calendarEvent.title,
        startDate: calendarEvent.start_date,
      });

      // Step 4: Create knowledge item for the calendar event (following the data model)
      const knowledgeItemData = {
        name: calendarEvent.title,
        type: "calendar_event",
        content: {
          event_id: calendarEvent.id,
          task_id: newTask.id,
          description: calendarEventData.description,
          start_date: calendarEventData.start_date,
          end_date: calendarEventData.end_date,
        },
        source: "calendar",
        tags: ["task", "calendar", sanitizedTask.priority],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const knowledgeItem = await pb
        .collection("knowledge_items")
        .create(knowledgeItemData);
      console.log(
        "✅ PERSONA STORE: Knowledge item created for calendar event:",
        {
          itemId: knowledgeItem.id,
          itemName: knowledgeItem.name,
        }
      );

      // Step 5: Add knowledge item to persona's items array
      const { currentPersona } = get();
      if (currentPersona) {
        await pb.collection("personas").update(currentPersona.id, {
          "items+": knowledgeItem.id,
        });
        console.log(
          "✅ PERSONA STORE: Knowledge item added to persona's items array"
        );
      }

      // Step 6: Add task ID to goal's tasks array using PocketBase + modifier
      console.log(
        "🔗 PERSONA STORE: Adding task to goal's tasks array using tasks+ modifier"
      );
      await pb.collection("goals").update(goalId, {
        "tasks+": newTask.id,
      });
      console.log("✅ PERSONA STORE: Task added to goal's tasks array");

      // Step 7: Refresh the persona to get updated data with new task and calendar event
      if (currentPersona) {
        const refreshedPersona = await get().fetchPersonaByIam(
          pb,
          currentPersona.iam
        );

        // Trigger calendar store refresh to show the new event
        console.log(
          "🔄 PERSONA STORE: Refreshing calendar store with new event"
        );
        get().refreshAllStores();

        return refreshedPersona;
      }
      return null;
    });

    return !!result;
  },

  updateTask: async (pb: PocketBase, taskId: string, updates: any) => {
    const result = await withPocketBase(async () => {
      console.log(
        "📝 PERSONA STORE: Updating task and associated calendar events:",
        taskId
      );

      // Sanitize updates to prevent cyclic references
      const sanitizedUpdates = sanitizeForPocketBase(updates);

      // Step 1: Update task in PocketBase
      const updatedTask = await pb
        .collection("tasks")
        .update(taskId, sanitizedUpdates);
      console.log("✅ PERSONA STORE: Task updated:", {
        taskId: updatedTask.id,
        taskName: updatedTask.name,
      });

      // Step 2: Update associated calendar events if task details changed
      try {
        const associatedKnowledgeItems = await pb
          .collection("knowledge_items")
          .getFullList({
            filter: `content.task_id = "${taskId}" && source = "calendar"`,
          });

        console.log(
          `📅 PERSONA STORE: Found ${associatedKnowledgeItems.length} calendar-related knowledge items to update`
        );

        for (const item of associatedKnowledgeItems) {
          if (
            item.content &&
            typeof item.content === "object" &&
            (item.content as any).event_id
          ) {
            const eventId = (item.content as any).event_id;

            // Prepare calendar event updates
            const calendarEventUpdates: any = {};

            // Update title if task name changed
            if (sanitizedUpdates.name) {
              calendarEventUpdates.title = `📋 ${sanitizedUpdates.name}`;
            }

            // Update description if task description changed
            if (sanitizedUpdates.description) {
              calendarEventUpdates.description = sanitizedUpdates.description;
            }

            // Update color if priority changed
            if (sanitizedUpdates.priority) {
              calendarEventUpdates.color =
                sanitizedUpdates.priority === "high"
                  ? "#ef4444"
                  : sanitizedUpdates.priority === "medium"
                  ? "#f59e0b"
                  : "#3b82f6";
            }

            // Update timing if estimated_time changed
            if (sanitizedUpdates.estimated_time) {
              try {
                const currentEvent = await pb
                  .collection("calendar_events")
                  .getOne(eventId);
                const startDate = new Date(currentEvent.start_date);
                const newEndDate = new Date(startDate);
                newEndDate.setMinutes(
                  newEndDate.getMinutes() +
                    (sanitizedUpdates.estimated_time || 60)
                );

                calendarEventUpdates.end_date = newEndDate.toISOString();
                calendarEventUpdates.end_time = newEndDate.toISOString();
              } catch (error) {
                console.warn(
                  "⚠️ PERSONA STORE: Could not update calendar event timing:",
                  error
                );
              }
            }

            // Apply updates if there are any
            if (Object.keys(calendarEventUpdates).length > 0) {
              try {
                await pb
                  .collection("calendar_events")
                  .update(eventId, calendarEventUpdates);
                console.log(
                  "✅ PERSONA STORE: Updated calendar event:",
                  eventId
                );

                // Update the knowledge item content as well
                const updatedContent = {
                  ...(item.content as any),
                  description:
                    sanitizedUpdates.description ||
                    (item.content as any).description,
                };

                await pb.collection("knowledge_items").update(item.id, {
                  name: calendarEventUpdates.title || item.name,
                  content: updatedContent,
                  tags: [
                    "task",
                    "calendar",
                    sanitizedUpdates.priority || "medium",
                  ],
                  updated_at: new Date().toISOString(),
                });
                console.log(
                  "✅ PERSONA STORE: Updated knowledge item:",
                  item.id
                );
              } catch (error) {
                console.warn(
                  "⚠️ PERSONA STORE: Could not update calendar event:",
                  eventId,
                  error
                );
              }
            }
          }
        }
      } catch (error) {
        console.warn(
          "⚠️ PERSONA STORE: Error updating calendar events for task:",
          error
        );
      }

      // Step 3: Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        const refreshedPersona = await get().fetchPersonaByIam(
          pb,
          currentPersona.iam
        );

        // Trigger calendar store refresh to show the updated events
        console.log(
          "🔄 PERSONA STORE: Refreshing calendar store after task update"
        );
        get().refreshAllStores();

        return refreshedPersona;
      }
      return null;
    });

    return !!result;
  },

  removeTask: async (pb: PocketBase, taskId: string) => {
    const result = await withPocketBase(async () => {
      console.log(
        "🗑️ PERSONA STORE: Removing task and associated calendar events:",
        taskId
      );

      // Step 1: Find and remove associated knowledge items (calendar events)
      try {
        const associatedKnowledgeItems = await pb
          .collection("knowledge_items")
          .getFullList({
            filter: `content.task_id = "${taskId}" && source = "calendar"`,
          });

        console.log(
          `📅 PERSONA STORE: Found ${associatedKnowledgeItems.length} calendar-related knowledge items to remove`
        );

        for (const item of associatedKnowledgeItems) {
          // Remove from persona's items array first
          const { currentPersona } = get();
          if (currentPersona) {
            await pb.collection("personas").update(currentPersona.id, {
              "items-": item.id,
            });
            console.log(
              "✅ PERSONA STORE: Removed knowledge item from persona's items array:",
              item.id
            );
          }

          // Extract calendar event ID from knowledge item content
          if (
            item.content &&
            typeof item.content === "object" &&
            (item.content as any).event_id
          ) {
            const eventId = (item.content as any).event_id;
            try {
              await pb.collection("calendar_events").delete(eventId);
              console.log("✅ PERSONA STORE: Deleted calendar event:", eventId);
            } catch (error) {
              console.warn(
                "⚠️ PERSONA STORE: Could not delete calendar event (may not exist):",
                eventId
              );
            }
          }

          // Delete the knowledge item
          await pb.collection("knowledge_items").delete(item.id);
          console.log("✅ PERSONA STORE: Deleted knowledge item:", item.id);
        }
      } catch (error) {
        console.warn(
          "⚠️ PERSONA STORE: Error cleaning up calendar events for task:",
          error
        );
      }

      // Step 2: Delete task from PocketBase
      await pb.collection("tasks").delete(taskId);
      console.log("✅ PERSONA STORE: Deleted task:", taskId);

      // Step 3: Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        const refreshedPersona = await get().fetchPersonaByIam(
          pb,
          currentPersona.iam
        );

        // Trigger calendar store refresh to remove the events from UI
        console.log(
          "🔄 PERSONA STORE: Refreshing calendar store after task deletion"
        );
        get().refreshAllStores();

        return refreshedPersona;
      }
      return null;
    });

    return !!result;
  },

  // Milestones (within projects) - using direct relations
  getMilestones: () => {
    const { currentPersona } = get();
    const projects = currentPersona?.expand?.projects || [];
    const allMilestones: any[] = [];

    projects.forEach((project) => {
      const milestones = project.expand?.milestones || [];
      allMilestones.push(
        ...milestones.map((milestone) => ({
          ...milestone,
          project_id: project.id,
        }))
      );
    });

    return allMilestones;
  },

  addMilestone: async (pb: PocketBase, projectId: string, milestone: any) => {
    const result = await withPocketBase(async () => {
      // Step 1: Create milestone in PocketBase milestones collection
      console.log(
        "🚀 PERSONA STORE: Creating milestone for project:",
        projectId
      );
      const sanitizedMilestone = sanitizeForPocketBase(milestone);

      const newMilestone = await pb
        .collection("milestones")
        .create(sanitizedMilestone);
      console.log("✅ PERSONA STORE: Milestone created:", newMilestone.id);

      // Step 2: Add milestone to project's milestones array using PocketBase + modifier
      console.log(
        "🔗 PERSONA STORE: Adding milestone to project's milestones array using milestones+ modifier"
      );
      await pb.collection("projects").update(projectId, {
        "milestones+": newMilestone.id,
      });

      console.log("✅ PERSONA STORE: Milestone added to project successfully");

      // Step 3: Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  updateMilestone: async (
    pb: PocketBase,
    milestoneId: string,
    updates: any
  ) => {
    const result = await withPocketBase(async () => {
      // Sanitize updates to prevent cyclic references
      const sanitizedUpdates = sanitizeForPocketBase(updates);

      // Update milestone in PocketBase
      await pb.collection("milestones").update(milestoneId, sanitizedUpdates);

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  removeMilestone: async (pb: PocketBase, milestoneId: string) => {
    const result = await withPocketBase(async () => {
      // Delete milestone from PocketBase
      await pb.collection("milestones").delete(milestoneId);

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  // Calendar Events (from knowledge items)
  getCalendarEvents: () => {
    const { currentPersona } = get();

    // Get knowledge items directly from Persona's items relation
    const knowledgeItems = currentPersona?.expand?.items || [];

    // Filter for calendar events
    return knowledgeItems.filter((item) => item.source === "calendar");
  },

  // Utility method to refresh all stores after centralized data is loaded
  refreshAllStores: () => {
    console.debug("🔄 PERSONA STORE: Refreshing dependent stores");

    try {
      // Import and update all stores with the centralized data
      import("./useProjectsStore").then(({ useProjectsStore }) => {
        const projects = get().getProjects();
        useProjectsStore.setState({ projects, loading: false });
      });

      import("./useKnowledgeItemsStore").then(({ useKnowledgeItemsStore }) => {
        const knowledgeItems = get().getKnowledgeItems();
        useKnowledgeItemsStore.setState({ knowledgeItems, loading: false });
      });

      import("./useGoalsStore").then(({ useGoalsStore }) => {
        const goals = get().getGoals();
        useGoalsStore.setState({ goals, loading: false });
      });

      import("./useTasksStore").then(({ useTasksStore }) => {
        const tasks = get().getTasks();
        useTasksStore.setState({ tasks, loading: false });
      });

      import("./useMockIntegrationsStore").then(({ useIntegrationsStore }) => {
        const integrations = get().getIntegrations();
        useIntegrationsStore.setState({ integrations, loading: false });
      });

      // TODO: Calendar store integration - temporarily disabled
      // import("./useCalendarStore").then(({ useCalendarStore }) => {
      //   // Calendar events come from knowledge items with source="calendar"
      //   const knowledgeItems = get().getKnowledgeItems();
      //   const calendarEvents = knowledgeItems
      //     .filter((item) => item.source === "calendar")
      //     .map((item) => {
      //       // Extract proper dates from content object
      //       let startDate = new Date();
      //       let endDate = new Date();
      //       let description = "";

      //       if (item.content) {
      //         if (typeof item.content === "object") {
      //           const contentObj = item.content as any;
      //           if (contentObj.start_date)
      //             startDate = new Date(contentObj.start_date);
      //           if (contentObj.end_date)
      //             endDate = new Date(contentObj.end_date);
      //           if (contentObj.description)
      //             description = contentObj.description;
      //         } else if (typeof item.content === "string") {
      //           try {
      //             const contentObj = JSON.parse(item.content);
      //             if (contentObj.start_date)
      //               startDate = new Date(contentObj.start_date);
      //             if (contentObj.end_date)
      //               endDate = new Date(contentObj.end_date);
      //             if (contentObj.description)
      //               description = contentObj.description;
      //           } catch {
      //             // Use fallback dates
      //           }
      //         }
      //       }

      //       return {
      //         id: item.id,
      //         title: item.title || item.name || "Untitled Event", // Handle both title and name
      //         start_date: startDate,
      //         end_date: endDate,
      //         start_time: startDate,
      //         end_time: endDate,
      //         all_day: false,
      //         description:
      //           description ||
      //           (typeof item.content === "string" ? item.content : ""),
      //         location: "",
      //         attendees: [],
      //         synced: false, // These are local events, not synced from external calendar
      //       };
      //     });

      //   console.debug(
      //     `🔄 PERSONA STORE: Setting ${calendarEvents.length} calendar events in CalendarStore`
      //   );

      //   // Get current events from CalendarStore to preserve any that aren't from knowledge items
      //   const currentCalendarStore = useCalendarStore.getState();
      //   const currentEvents = currentCalendarStore.events || [];

      //   // Filter out old knowledge-item-based events and merge with new ones
      //   const nonKnowledgeItemEvents = currentEvents.filter(
      //     (event) => !knowledgeItems.some((item) => item.id === event.id)
      //   );

      //   const mergedEvents = [...nonKnowledgeItemEvents, ...calendarEvents];

      //   console.debug(
      //     `🔄 PERSONA STORE: Merging ${nonKnowledgeItemEvents.length} existing events with ${calendarEvents.length} knowledge item events`
      //   );

      //   useCalendarStore.setState({ events: mergedEvents, loading: false });
      // });

      console.debug("✅ PERSONA STORE: Dependent stores refreshed");
    } catch (error) {
      console.error("❌ PERSONA STORE: Error refreshing stores:", error);
    }
  },

  // Knowledge Item-Project associations (for compatibility)
  addKnowledgeItemToProject: async (
    pb: PocketBase,
    projectId: string,
    knowledgeItemId: string
  ) => {
    const result = await withPocketBase(async () => {
      console.log("🔗 PERSONA STORE: Adding knowledge item to project:", {
        projectId,
        knowledgeItemId,
      });

      // Add knowledge item to the project's items array using PocketBase + modifier
      await pb.collection("projects").update(projectId, {
        "items+": knowledgeItemId,
      });

      console.log(
        "✅ PERSONA STORE: Knowledge item added to project's items array"
      );

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  removeKnowledgeItemFromProject: async (
    pb: PocketBase,
    projectId: string,
    knowledgeItemId: string
  ) => {
    const result = await withPocketBase(async () => {
      console.log("🗑️ PERSONA STORE: Removing knowledge item from project:", {
        projectId,
        knowledgeItemId,
      });

      // Remove knowledge item from the project's items array using PocketBase - modifier
      await pb.collection("projects").update(projectId, {
        "items-": knowledgeItemId,
      });

      console.log(
        "✅ PERSONA STORE: Knowledge item removed from project's items array"
      );

      // Refresh the persona to get updated data
      const { currentPersona } = get();
      if (currentPersona) {
        return await get().fetchPersonaByIam(pb, currentPersona.iam);
      }
      return null;
    });

    return !!result;
  },

  // Integrations
  getIntegrations: () => {
    const { currentPersona } = get();
    const rawIntegrations = currentPersona?.expand?.integrations || [];

    // Transform expanded PocketBase integrations to match Integration interface
    const transformedIntegrations = rawIntegrations.map((integration) => ({
      ...integration,
      // Ensure provider is correctly typed
      provider: integration.provider,
    }));

    return transformedIntegrations;
  },
}));
