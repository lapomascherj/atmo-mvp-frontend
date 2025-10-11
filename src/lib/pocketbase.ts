export const pb = null as any;

export async function checkPocketBaseHealth(): Promise<boolean> {
  console.warn('PocketBase health check called in Supabase-only mode.');
  return false;
}

export async function initializePocketBase(): Promise<void> {
  console.warn('initializePocketBase invoked, but PocketBase is disabled.');
}

/**
 * Type-safe collection names
 */
export const Collections = {
  PERSONAS: 'personas',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  GOALS: 'goals',
  KNOWLEDGE_ITEMS: 'knowledge_items',
  INTEGRATIONS: 'integrations',
  INTERACTIONS: 'interactions',
  MILESTONES: 'milestones',
  USER_SKILLS: 'user_skills',
  TOPICS_OF_INTEREST: 'topics_of_interest',
  WELLNESS_TASKS: 'wellness_tasks',
} as const;

export type CollectionName = typeof Collections[keyof typeof Collections];

export default pb;
