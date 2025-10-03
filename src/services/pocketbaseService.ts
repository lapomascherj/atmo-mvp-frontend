import { pb, Collections, checkPocketBaseHealth } from '@/lib/pocketbase';
import type { Persona } from '@/models/Persona';
import type { Project } from '@/models/Project';
import type { Task } from '@/models/Task';
import type { Goal } from '@/models/Goal';
import type { KnowledgeItem } from '@/models/KnowledgeItem';

/**
 * PocketBase Service Layer
 *
 * This service provides a clean API for interacting with PocketBase collections.
 * It includes error handling, type safety, and fallback mechanisms.
 *
 * All methods are designed to work seamlessly with the existing Zustand stores.
 */

export class PocketBaseService {
  private isAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if PocketBase is available
   */
  private async checkAvailability(): Promise<void> {
    this.isAvailable = await checkPocketBaseHealth();
  }

  /**
   * Get the current availability status
   */
  public async isServiceAvailable(): Promise<boolean> {
    if (!this.isAvailable) {
      await this.checkAvailability();
    }
    return this.isAvailable;
  }

  // ============================================================
  // PERSONAS
  // ============================================================

  /**
   * Get persona by IAM user ID
   */
  async getPersonaByIam(iamId: string): Promise<Persona | null> {
    try {
      const record = await pb.collection(Collections.PERSONAS).getFirstListItem(
        `iam="${iamId}"`,
        {
          expand: 'projects,knowledge_items,integrations'
        }
      );
      return this.mapPersonaRecord(record);
    } catch (error) {
      console.error('Error fetching persona:', error);
      return null;
    }
  }

  /**
   * Create a new persona
   */
  async createPersona(data: Partial<Persona>): Promise<Persona | null> {
    try {
      const record = await pb.collection(Collections.PERSONAS).create(data);
      return this.mapPersonaRecord(record);
    } catch (error) {
      console.error('Error creating persona:', error);
      return null;
    }
  }

  /**
   * Update an existing persona
   */
  async updatePersona(id: string, data: Partial<Persona>): Promise<Persona | null> {
    try {
      const record = await pb.collection(Collections.PERSONAS).update(id, data);
      return this.mapPersonaRecord(record);
    } catch (error) {
      console.error('Error updating persona:', error);
      return null;
    }
  }

  /**
   * Map PocketBase record to Persona model
   */
  private mapPersonaRecord(record: any): Persona {
    return {
      id: record.id,
      iam: record.iam,
      nickname: record.nickname,
      avatar_url: record.avatar_url || '',
      email: record.email,
      job_title: record.job_title,
      bio: record.bio || '',
      biggest_challenge: record.biggest_challenge || '',
      email_notifications: record.email_notifications ?? true,
      push_notifications: record.push_notifications ?? true,
      onboarding_completed: record.onboarding_completed ?? false,
      focus: record.focus,
      delivery_time: record.delivery_time ? new Date(record.delivery_time) : new Date(),
      avatar_style: record.avatar_style,
      communication_style: record.communication_style,
      integrations: record.expand?.integrations || [],
      items: record.expand?.knowledge_items || [],
      projects: record.expand?.projects || []
    };
  }

  // ============================================================
  // PROJECTS
  // ============================================================

  /**
   * Get all projects for a persona
   */
  async getProjects(personaId: string): Promise<Project[]> {
    try {
      const records = await pb.collection(Collections.PROJECTS).getFullList({
        filter: `persona="${personaId}"`,
        sort: '-created',
        expand: 'tasks,goals,knowledge_items'
      });
      return records.map(r => this.mapProjectRecord(r));
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      const record = await pb.collection(Collections.PROJECTS).getOne(id, {
        expand: 'tasks,goals,knowledge_items'
      });
      return this.mapProjectRecord(record);
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }

  /**
   * Create a new project
   */
  async createProject(data: Partial<Project> & { persona: string }): Promise<Project | null> {
    try {
      const record = await pb.collection(Collections.PROJECTS).create(data);
      return this.mapProjectRecord(record);
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: Partial<Project>): Promise<Project | null> {
    try {
      const record = await pb.collection(Collections.PROJECTS).update(id, data);
      return this.mapProjectRecord(record);
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      await pb.collection(Collections.PROJECTS).delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  /**
   * Map PocketBase record to Project model
   */
  private mapProjectRecord(record: any): Project {
    return {
      id: record.id,
      name: record.name,
      description: record.description || '',
      category: record.category,
      status: record.status,
      priority: record.priority,
      start_date: record.start_date ? new Date(record.start_date) : undefined,
      target_date: record.target_date ? new Date(record.target_date) : undefined,
      color: record.color,
      active: record.active ?? true,
      tasks: record.expand?.tasks || [],
      goals: record.expand?.goals || [],
      items: record.expand?.knowledge_items || []
    };
  }

  // ============================================================
  // TASKS
  // ============================================================

  /**
   * Get all tasks for a persona
   */
  async getTasks(personaId: string, projectId?: string): Promise<Task[]> {
    try {
      let filter = `persona="${personaId}"`;
      if (projectId) {
        filter += ` && project="${projectId}"`;
      }

      const records = await pb.collection(Collections.TASKS).getFullList({
        filter,
        sort: '-created'
      });
      return records.map(r => this.mapTaskRecord(r));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  /**
   * Create a new task
   */
  async createTask(data: Partial<Task> & { persona: string }): Promise<Task | null> {
    try {
      const record = await pb.collection(Collections.TASKS).create(data);
      return this.mapTaskRecord(record);
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    try {
      const record = await pb.collection(Collections.TASKS).update(id, data);
      return this.mapTaskRecord(record);
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      await pb.collection(Collections.TASKS).delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  /**
   * Map PocketBase record to Task model
   */
  private mapTaskRecord(record: any): Task {
    return {
      id: record.id,
      project_id: record.project || undefined,
      title: record.title,
      description: record.description || '',
      priority: record.priority,
      status: record.status,
      completed: record.completed ?? false,
      due_date: record.due_date ? new Date(record.due_date) : undefined,
      estimated_duration: record.estimated_duration,
      actual_duration: record.actual_duration,
      tags: record.tags || []
    };
  }

  // ============================================================
  // GOALS
  // ============================================================

  /**
   * Get all goals for a persona
   */
  async getGoals(personaId: string, projectId?: string): Promise<Goal[]> {
    try {
      let filter = `persona="${personaId}"`;
      if (projectId) {
        filter += ` && project="${projectId}"`;
      }

      const records = await pb.collection(Collections.GOALS).getFullList({
        filter,
        sort: '-created'
      });
      return records.map(r => this.mapGoalRecord(r));
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(data: Partial<Goal> & { persona: string }): Promise<Goal | null> {
    try {
      const record = await pb.collection(Collections.GOALS).create(data);
      return this.mapGoalRecord(record);
    } catch (error) {
      console.error('Error creating goal:', error);
      return null;
    }
  }

  /**
   * Update an existing goal
   */
  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal | null> {
    try {
      const record = await pb.collection(Collections.GOALS).update(id, data);
      return this.mapGoalRecord(record);
    } catch (error) {
      console.error('Error updating goal:', error);
      return null;
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(id: string): Promise<boolean> {
    try {
      await pb.collection(Collections.GOALS).delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  }

  /**
   * Map PocketBase record to Goal model
   */
  private mapGoalRecord(record: any): Goal {
    return {
      id: record.id,
      project_id: record.project || undefined,
      title: record.title,
      description: record.description || '',
      target_date: record.target_date ? new Date(record.target_date) : undefined,
      progress: record.progress ?? 0,
      status: record.status,
      category: record.category
    };
  }

  // ============================================================
  // KNOWLEDGE ITEMS
  // ============================================================

  /**
   * Get all knowledge items for a persona
   */
  async getKnowledgeItems(personaId: string, projectId?: string): Promise<KnowledgeItem[]> {
    try {
      let filter = `persona="${personaId}"`;
      if (projectId) {
        filter += ` && project="${projectId}"`;
      }

      const records = await pb.collection(Collections.KNOWLEDGE_ITEMS).getFullList({
        filter,
        sort: '-created'
      });
      return records.map(r => this.mapKnowledgeItemRecord(r));
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
      return [];
    }
  }

  /**
   * Create a new knowledge item
   */
  async createKnowledgeItem(data: Partial<KnowledgeItem> & { persona: string }): Promise<KnowledgeItem | null> {
    try {
      const record = await pb.collection(Collections.KNOWLEDGE_ITEMS).create(data);
      return this.mapKnowledgeItemRecord(record);
    } catch (error) {
      console.error('Error creating knowledge item:', error);
      return null;
    }
  }

  /**
   * Update an existing knowledge item
   */
  async updateKnowledgeItem(id: string, data: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    try {
      const record = await pb.collection(Collections.KNOWLEDGE_ITEMS).update(id, data);
      return this.mapKnowledgeItemRecord(record);
    } catch (error) {
      console.error('Error updating knowledge item:', error);
      return null;
    }
  }

  /**
   * Delete a knowledge item
   */
  async deleteKnowledgeItem(id: string): Promise<boolean> {
    try {
      await pb.collection(Collections.KNOWLEDGE_ITEMS).delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      return false;
    }
  }

  /**
   * Map PocketBase record to KnowledgeItem model
   */
  private mapKnowledgeItemRecord(record: any): KnowledgeItem {
    return {
      id: record.id,
      project_id: record.project || undefined,
      title: record.title,
      content: record.content || '',
      type: record.type,
      url: record.url,
      tags: record.tags || [],
      metadata: record.metadata || {}
    };
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

  /**
   * Subscribe to changes in a collection
   */
  subscribeToCollection(
    collection: string,
    callback: (data: any) => void,
    filter?: string
  ): () => void {
    try {
      const unsubscribe = pb.collection(collection).subscribe('*', callback, {
        filter: filter
      });
      return unsubscribe;
    } catch (error) {
      console.error(`Error subscribing to ${collection}:`, error);
      return () => {};
    }
  }
}

// Export singleton instance
export const pocketbaseService = new PocketBaseService();
export default pocketbaseService;
