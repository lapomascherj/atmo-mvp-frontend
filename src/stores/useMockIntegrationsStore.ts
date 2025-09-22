import { create } from "zustand";

// Mock integrations store for frontend-only demo
interface MockIntegrationsStoreState {
  integrations: any[];
  loading: boolean;
  error: string | null;
  fetchIntegrations: () => Promise<void>;
  connectIntegration: (type: string) => Promise<void>;
  disconnectIntegration: (id: string) => Promise<void>;
  hasIntegration: (provider: string) => boolean;
  getIntegrationByProvider: (provider: string) => any;
  initiateOAuthFlow: (provider: string) => Promise<void>;
}

// Mock function for createIntegrationFromForm
export const createIntegrationFromForm = async (data: any) => {
  return { success: true, integration: data };
};

export const useIntegrationsStore = create<MockIntegrationsStoreState>((set) => ({
  integrations: [],
  loading: false,
  error: null,
  
  fetchIntegrations: async () => {
    set({ loading: true });
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ loading: false, integrations: [] });
  },
  
  connectIntegration: async (type: string) => {
    set({ loading: true });
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    set({ loading: false });
  },
  
  disconnectIntegration: async (id: string) => {
    set({ loading: true });
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ loading: false });
  },
  
  hasIntegration: (provider: string) => {
    return false; // Mock: no integrations connected
  },
  
  getIntegrationByProvider: (provider: string) => {
    return null; // Mock: no integrations found
  },
  
  initiateOAuthFlow: async (provider: string) => {
    set({ loading: true });
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    set({ loading: false });
  }
}));
