import { useState, useEffect, useCallback } from 'react';
import { Focus } from '@/models/Focus';
import { JobTitle } from '@/models/JobTitle';

interface UserProfile {
  id: string;
  nickname: string;
  preferredName?: string;
  email: string;
  iam: string;
  onboarding_completed: boolean;
  professional_role?: string;
  bio?: string;
  focus: Focus;
  job_title: JobTitle;
  avatar_url?: string | null;
  location?: string;
  website?: string;
  company?: string;
  phone?: string;
  timezone?: string;
  aiPreferences?: string;
  communicationStyle?: string;
}

const STORAGE_KEY = 'atmo_user_profile';

const defaultUser: UserProfile = {
  id: 'demo-user-1',
  nickname: 'Demo User',
  email: 'demo@example.com',
  iam: 'demo-user-iam',
  onboarding_completed: true,
  professional_role: 'Developer',
  bio: 'Frontend demo user with ATMO',
  focus: Focus.ProjectExecution,
  job_title: JobTitle.Developer,
  avatar_url: null,
  location: 'San Francisco, CA',
  website: '',
  company: 'ATMO Inc.',
  phone: '',
  timezone: 'GMT-8 (Pacific Time)',
  aiPreferences: 'I prefer detailed explanations and enjoy learning about new technologies.',
  communicationStyle: 'detailed'
};

// Mock authentication hook with localStorage persistence
export const useMockAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } else {
        // Set default user and save to localStorage
        setUser(defaultUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setUser(defaultUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    }
  }, []);

  // Update user profile with persistence
  const updateUserProfile = useCallback(async (updateData: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!user) throw new Error('No user to update');

      const updatedUser = { ...user, ...updateData };

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

      // Update state
      setUser(updatedUser);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sign out function
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear user data but keep in localStorage for demo purposes
      // In a real app, you'd clear localStorage here
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in function
  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(defaultUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Update specific user field
  const setUserField = useCallback((field: keyof UserProfile, value: any) => {
    if (user) {
      const updatedUser = { ...user, [field]: value };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
  }, [user]);

  return {
    user,
    casdoorUser: null,
    loading,
    error,
    token: 'mock-token',
    signUp: () => Promise.resolve(),
    signIn,
    signOut,
    handleAuthCallbackResponse: async () => Promise.resolve(),
    updateUserProfile,
    isOnboardingCompleted: () => user?.onboarding_completed ?? true,
    getManagementUrl: () => '',
    setUser: setUserField
  };
};

export const useAuth = useMockAuth;
