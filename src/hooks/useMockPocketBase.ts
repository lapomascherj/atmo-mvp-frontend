// Mock PocketBase hook for frontend-only demo
const mockPocketBase = () => {
  // Mock data storage
  const mockData = {
    personas: [{
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
    }],
    projects: [],
    knowledge_items: [],
    goals: [],
    tasks: [],
    milestones: [],
    calendar_events: [],
    integrations: []
  };

  return {
    collection: (name: string) => ({
      getFullList: async (options: any = {}) => {
        console.log(`Mock PocketBase: getFullList for ${name}`);
        return mockData[name as keyof typeof mockData] || [];
      },
      getList: async (page: number, perPage: number, options: any = {}) => {
        console.log(`Mock PocketBase: getList for ${name}, page ${page}`);
        const items = mockData[name as keyof typeof mockData] || [];
        return {
          items: items.slice(0, perPage),
          totalItems: items.length,
          totalPages: Math.ceil(items.length / perPage)
        };
      },
      getOne: async (id: string, options: any = {}) => {
        console.log(`Mock PocketBase: getOne for ${name}, id: ${id}`);
        const items = mockData[name as keyof typeof mockData] || [];
        return items.find((item: any) => item.id === id) || { id };
      },
      create: async (data: any) => {
        console.log(`Mock PocketBase: create for ${name}`, data);
        const newItem = { id: `mock-${Date.now()}`, ...data };
        const items = mockData[name as keyof typeof mockData] as any[];
        items.push(newItem);
        return newItem;
      },
      update: async (id: string, data: any) => {
        console.log(`Mock PocketBase: update for ${name}, id: ${id}`, data);
        return { id, ...data };
      },
      delete: async (id: string) => {
        console.log(`Mock PocketBase: delete for ${name}, id: ${id}`);
        return true;
      }
    }),
    authStore: {
      isValid: true,
      token: 'mock-token',
      model: { id: 'demo-user', iam: 'demo-user-iam' }
    }
  };
};

export const useMockPocketBase = mockPocketBase;
export const usePocketBase = mockPocketBase;
export const getPocketBase = mockPocketBase;
export const getAuthenticatedPocketBase = async () => mockPocketBase();
