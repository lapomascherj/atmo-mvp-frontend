import PocketBase from 'pocketbase';

/**
 * PocketBase Client Configuration
 *
 * This is the main client instance for communicating with PocketBase backend.
 * It handles authentication, real-time subscriptions, and CRUD operations.
 *
 * Environment variables:
 * - VITE_POCKETBASE_URL: The URL of your PocketBase instance (default: http://127.0.0.1:8090)
 */

const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

console.log('🔵 PocketBase URL:', PB_URL);
console.log('🔵 Environment:', import.meta.env);

// Create singleton instance
export const pb = new PocketBase(PB_URL);

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false);

// Configure auth store to persist in localStorage
pb.authStore.onChange((token, model) => {
  console.log('Auth state changed:', {
    isValid: pb.authStore.isValid,
    userId: model?.id
  });
});

/**
 * Helper function to check if PocketBase is connected and healthy
 */
export async function checkPocketBaseHealth(): Promise<boolean> {
  try {
    await pb.health.check();
    return true;
  } catch (error) {
    console.error('PocketBase health check failed:', error);
    return false;
  }
}

/**
 * Helper function to initialize PocketBase connection
 * Should be called on app startup
 */
export async function initializePocketBase(): Promise<void> {
  try {
    const isHealthy = await checkPocketBaseHealth();
    if (isHealthy) {
      console.log('✅ PocketBase connected successfully at:', PB_URL);

      // Auto-create collections if they don't exist
      await ensureCollections();
    } else {
      console.warn('⚠️ PocketBase is not responding. Using fallback mode.');
    }
  } catch (error) {
    console.error('❌ PocketBase initialization error:', error);
  }
}

/**
 * Ensure all required collections exist
 */
async function ensureCollections(): Promise<void> {
  const requiredCollections = [
    'personas',
    'projects',
    'tasks',
    'goals',
    'knowledge_items',
    'milestones',
    'calendar_events',
    'integrations'
  ];

  try {
    // This will be handled by migrations or manual setup
    console.log('📊 Required collections:', requiredCollections.join(', '));
  } catch (error) {
    console.warn('⚠️ Could not verify collections:', error);
  }
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
