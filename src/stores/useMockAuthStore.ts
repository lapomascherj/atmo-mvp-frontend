import { create } from "zustand";

// Mock auth store for frontend-only demo
interface MockAuthStoreState {
  user: any;
  loading: boolean;
  error: string | null;
  token: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

export const useAuthStore = create<MockAuthStoreState>((set) => ({
  user: {
    id: 'demo-user',
    nickname: 'Demo User',
    email: 'demo@example.com',
    professional_role: 'Developer',
    bio: 'Frontend demo user'
  },
  loading: false,
  error: null,
  token: 'mock-token',
  
  signIn: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    set({ loading: false });
  },
  
  signOut: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ loading: false });
  },
  
  updateProfile: async (data: any) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    set((state) => ({ 
      loading: false, 
      user: { ...state.user, ...data }
    }));
  }
}));
