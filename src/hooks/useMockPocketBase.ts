// Mock PocketBase hook for frontend-only demo
const mockPocketBase = () => {
  return {
    collection: () => ({
      getFullList: async () => [],
      getOne: async () => ({}),
      create: async (data: any) => ({ id: 'mock-id', ...data }),
      update: async (id: string, data: any) => ({ id, ...data }),
      delete: async () => true
    }),
    authStore: {
      isValid: true,
      token: 'mock-token',
      model: { id: 'demo-user' }
    }
  };
};

export const useMockPocketBase = mockPocketBase;
export const usePocketBase = mockPocketBase;
export const getPocketBase = mockPocketBase;
export const getAuthenticatedPocketBase = async () => mockPocketBase();
