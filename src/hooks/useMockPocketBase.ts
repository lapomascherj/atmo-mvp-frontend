// Real PocketBase integration - migrated from mock
import { pb } from '@/lib/pocketbase';

/**
 * Get PocketBase instance
 * This now returns the real PocketBase client instead of mock data
 */
const getPocketBaseInstance = () => {
  console.log('✅ Using Real PocketBase client');
  return pb;
};

// Export all variants to maintain backward compatibility
export const useMockPocketBase = getPocketBaseInstance;
export const usePocketBase = getPocketBaseInstance;
export const getPocketBase = getPocketBaseInstance;
export const getAuthenticatedPocketBase = async () => getPocketBaseInstance();
