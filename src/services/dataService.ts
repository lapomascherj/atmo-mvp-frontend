/**
 * Data Service Layer
 *
 * This service provides a unified API that can use either:
 * 1. PocketBase (when available and enabled)
 * 2. Mock data (as fallback or when explicitly disabled)
 *
 * The switch is controlled by the VITE_USE_POCKETBASE environment variable.
 * This ensures zero breaking changes to existing code.
 */

import { pocketbaseService } from './pocketbaseService';
import type { Persona } from '@/models/Persona';
import type { Project } from '@/models/Project';
import type { Task } from '@/models/Task';
import type { Goal } from '@/models/Goal';
import type { KnowledgeItem } from '@/models/KnowledgeItem';

const USE_POCKETBASE = import.meta.env.VITE_USE_POCKETBASE === 'true';

class DataService {
  private usePocketBase: boolean = USE_POCKETBASE;
  private pocketBaseAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.usePocketBase) {
      this.pocketBaseAvailable = await pocketbaseService.isServiceAvailable();
      if (this.pocketBaseAvailable) {
        console.log('✅ DataService: Using PocketBase backend');
      } else {
        console.warn('⚠️ DataService: PocketBase unavailable, falling back to mock data');
      }
    } else {
      console.log('📋 DataService: Using mock data (PocketBase disabled via config)');
    }
  }

  /**
   * Check if we're using PocketBase
   */
  isUsingPocketBase(): boolean {
    return this.usePocketBase && this.pocketBaseAvailable;
  }

  /**
   * Enable/disable PocketBase at runtime
   */
  setPocketBaseEnabled(enabled: boolean) {
    this.usePocketBase = enabled;
    this.initialize();
  }

  // ============================================================
  // PERSONAS
  // ============================================================

  async getPersonaByIam(iamId: string): Promise<Persona | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.getPersonaByIam(iamId);
    }
    // Mock implementation - return null to trigger mock data in stores
    return null;
  }

  async createPersona(data: Partial<Persona>): Promise<Persona | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.createPersona(data);
    }
    // Mock implementation
    console.log('Mock: Would create persona', data);
    return null;
  }

  async updatePersona(id: string, data: Partial<Persona>): Promise<Persona | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.updatePersona(id, data);
    }
    // Mock implementation
    console.log('Mock: Would update persona', id, data);
    return null;
  }

  // ============================================================
  // PROJECTS
  // ============================================================

  async getProjects(personaId: string): Promise<Project[]> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.getProjects(personaId);
    }
    // Mock implementation - return empty to trigger mock data in stores
    return [];
  }

  async getProject(id: string): Promise<Project | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.getProject(id);
    }
    return null;
  }

  async createProject(data: Partial<Project> & { persona: string }): Promise<Project | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.createProject(data);
    }
    console.log('Mock: Would create project', data);
    return null;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.updateProject(id, data);
    }
    console.log('Mock: Would update project', id, data);
    return null;
  }

  async deleteProject(id: string): Promise<boolean> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.deleteProject(id);
    }
    console.log('Mock: Would delete project', id);
    return true;
  }

  // ============================================================
  // TASKS
  // ============================================================

  async getTasks(personaId: string, projectId?: string): Promise<Task[]> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.getTasks(personaId, projectId);
    }
    return [];
  }

  async createTask(data: Partial<Task> & { persona: string }): Promise<Task | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.createTask(data);
    }
    console.log('Mock: Would create task', data);
    return null;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.updateTask(id, data);
    }
    console.log('Mock: Would update task', id, data);
    return null;
  }

  async deleteTask(id: string): Promise<boolean> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.deleteTask(id);
    }
    console.log('Mock: Would delete task', id);
    return true;
  }

  // ============================================================
  // GOALS
  // ============================================================

  async getGoals(personaId: string, projectId?: string): Promise<Goal[]> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.getGoals(personaId, projectId);
    }
    return [];
  }

  async createGoal(data: Partial<Goal> & { persona: string }): Promise<Goal | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.createGoal(data);
    }
    console.log('Mock: Would create goal', data);
    return null;
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.updateGoal(id, data);
    }
    console.log('Mock: Would update goal', id, data);
    return null;
  }

  async deleteGoal(id: string): Promise<boolean> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.deleteGoal(id);
    }
    console.log('Mock: Would delete goal', id);
    return true;
  }

  // ============================================================
  // KNOWLEDGE ITEMS
  // ============================================================

  async getKnowledgeItems(personaId: string, projectId?: string): Promise<KnowledgeItem[]> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.getKnowledgeItems(personaId, projectId);
    }
    return [];
  }

  async createKnowledgeItem(data: Partial<KnowledgeItem> & { persona: string }): Promise<KnowledgeItem | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.createKnowledgeItem(data);
    }
    console.log('Mock: Would create knowledge item', data);
    return null;
  }

  async updateKnowledgeItem(id: string, data: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.updateKnowledgeItem(id, data);
    }
    console.log('Mock: Would update knowledge item', id, data);
    return null;
  }

  async deleteKnowledgeItem(id: string): Promise<boolean> {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.deleteKnowledgeItem(id);
    }
    console.log('Mock: Would delete knowledge item', id);
    return true;
  }

  // ============================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================

  subscribeToCollection(
    collection: string,
    callback: (data: any) => void,
    filter?: string
  ): () => void {
    if (this.isUsingPocketBase()) {
      return pocketbaseService.subscribeToCollection(collection, callback, filter);
    }
    // Mock implementation - return no-op unsubscribe function
    return () => {};
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;
