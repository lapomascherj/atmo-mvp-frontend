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
      bio: 'Frontend demo user'
    },
    casdoorUser: null,
    loading: false,
    error: null,
    token: 'mock-token',
    signUp: () => {},
    signIn: () => {},
    signOut: async () => {},
    handleAuthCallbackResponse: async () => {},
    updateUserProfile: async () => true,
    isOnboardingCompleted: () => true,
    getManagementUrl: () => '',
    setUser: () => {}
  };
};

export const useAuth = useMockAuth;
