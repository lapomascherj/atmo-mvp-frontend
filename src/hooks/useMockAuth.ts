import { Focus } from '@/models/Focus';
import { JobTitle } from '@/models/JobTitle';

// Mock authentication hook for frontend-only demo
export const useMockAuth = () => {
  return {
    user: {
      id: 'demo-user-1',
      nickname: 'Demo User',
      email: 'demo@example.com',
      iam: 'demo-user-iam',
      onboarding_completed: true,
      professional_role: 'Developer',
      bio: 'Frontend demo user',
      focus: Focus.ProjectExecution,
      job_title: JobTitle.Developer,
      avatar_url: null
    },
    casdoorUser: null,
    loading: false,
    error: null,
    token: 'mock-token',
    signUp: () => Promise.resolve(),
    signIn: () => Promise.resolve(),
    signOut: async () => Promise.resolve(),
    handleAuthCallbackResponse: async () => Promise.resolve(),
    updateUserProfile: async () => true,
    isOnboardingCompleted: () => true,
    getManagementUrl: () => '',
    setUser: () => {}
  };
};

export const useAuth = useMockAuth;
