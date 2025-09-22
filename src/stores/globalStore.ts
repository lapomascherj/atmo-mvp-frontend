import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface GlobalState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  
  // Navigation
  currentPage: string;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      theme: 'dark',
      loading: false,
      currentPage: '/',
      notifications: [],
      
      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setLoading: (loading) => set({ loading }),
      setCurrentPage: (page) => set({ currentPage: page }),
      
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = {
          ...notification,
          id,
          timestamp: new Date(),
        };
        set({ 
          notifications: [...get().notifications, newNotification] 
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },
      
      removeNotification: (id) => {
        set({ 
          notifications: get().notifications.filter(n => n.id !== id) 
        });
      },
      
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'global-store',
    }
  )
);

export default useGlobalStore;