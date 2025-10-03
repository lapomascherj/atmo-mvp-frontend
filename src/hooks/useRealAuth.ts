import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  verified: boolean;
  created: string;
  updated: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, passwordConfirm: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

export const useRealAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Authenticate with PocketBase
          const authData = await pb.collection('users').authWithPassword(email, password);

          if (authData.record) {
            const user: User = {
              id: authData.record.id,
              email: authData.record.email,
              name: authData.record.name || authData.record.email.split('@')[0],
              avatar: authData.record.avatar,
              verified: authData.record.verified,
              created: authData.record.created,
              updated: authData.record.updated,
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            toast.success('Welcome back!', {
              description: `Logged in as ${user.name || user.email}`,
            });

            return true;
          }

          set({ isLoading: false, error: 'Login failed' });
          return false;
        } catch (error: any) {
          const errorMessage = error?.message || 'Login failed. Please check your credentials.';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null
          });

          toast.error('Login Failed', {
            description: errorMessage,
          });

          return false;
        }
      },

      signup: async (email: string, password: string, passwordConfirm: string, name?: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('Starting signup process...', { email, name });

          // Create user account
          const userData = {
            email,
            password,
            passwordConfirm,
            name: name || email.split('@')[0],
            emailVisibility: true,
          };

          console.log('Creating user with data:', { email, name: userData.name });
          const newUser = await pb.collection('users').create(userData);
          console.log('User created successfully:', newUser.id);

          // Automatically log in after signup
          console.log('Logging in user...');
          const authData = await pb.collection('users').authWithPassword(email, password);
          console.log('Login successful:', authData.record.id);

          if (authData.record && newUser) {
            // Create linked persona record
            try {
              console.log('Creating persona record...');
              const personaData = {
                iam: newUser.id,
                nickname: name || email.split('@')[0],
                email: email,
                onboarding_completed: false,
                email_notifications: false,
                push_notifications: false,
              };
              console.log('Persona data:', personaData);

              const persona = await pb.collection('personas').create(personaData);
              console.log('Persona created successfully:', persona.id);
            } catch (personaError: any) {
              console.error('Failed to create persona:', personaError);
              console.error('Persona error details:', personaError?.data);
              // Continue anyway - persona can be created later
            }

            const user: User = {
              id: authData.record.id,
              email: authData.record.email,
              name: authData.record.name || authData.record.email.split('@')[0],
              avatar: authData.record.avatar,
              verified: authData.record.verified,
              created: authData.record.created,
              updated: authData.record.updated,
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            toast.success('Account Created!', {
              description: 'Welcome to ATMO. Let\'s set up your profile.',
            });

            return true;
          }

          set({ isLoading: false, error: 'Signup failed' });
          return false;
        } catch (error: any) {
          console.error('Signup error:', error);
          console.error('Error details:', error?.data);
          console.error('Error response:', error?.response);

          const errorMessage = error?.data?.message || error?.message || 'Signup failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null
          });

          toast.error('Signup Failed', {
            description: errorMessage,
          });

          return false;
        }
      },

      logout: async () => {
        try {
          // Clear PocketBase auth store
          pb.authStore.clear();

          set({
            user: null,
            isAuthenticated: false,
            error: null
          });

          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
          // Force clear state anyway
          set({
            user: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      checkAuth: async () => {
        try {
          // Check if PocketBase has a valid auth token
          if (pb.authStore.isValid && pb.authStore.model) {
            const user: User = {
              id: pb.authStore.model.id,
              email: pb.authStore.model.email,
              name: pb.authStore.model.name || pb.authStore.model.email.split('@')[0],
              avatar: pb.authStore.model.avatar,
              verified: pb.authStore.model.verified,
              created: pb.authStore.model.created,
              updated: pb.authStore.model.updated,
            };

            set({
              user,
              isAuthenticated: true,
              error: null
            });
          } else {
            set({
              user: null,
              isAuthenticated: false
            });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({
            user: null,
            isAuthenticated: false
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      requestPasswordReset: async (email: string) => {
        try {
          await pb.collection('users').requestPasswordReset(email);

          toast.success('Password Reset Email Sent', {
            description: 'Check your inbox for reset instructions.',
          });

          return true;
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to send reset email.';

          toast.error('Reset Failed', {
            description: errorMessage,
          });

          return false;
        }
      },
    }),
    {
      name: 'atmo-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth check on app load
if (typeof window !== 'undefined') {
  useRealAuth.getState().checkAuth();
}

// Compatibility hook that matches useMockAuth interface
export const useAuth = () => {
  const { user: authUser, isAuthenticated, isLoading, logout } = useRealAuth();
  const [personaData, setPersonaData] = React.useState<any>(null);

  // Load persona data when user changes
  React.useEffect(() => {
    const loadPersona = async () => {
      if (!authUser) {
        setPersonaData(null);
        return;
      }

      try {
        const personas = await pb.collection('personas').getFullList({
          filter: `iam = "${authUser.id}"`
        });

        if (personas.length > 0) {
          setPersonaData(personas[0]);
        }
      } catch (error) {
        console.error('Failed to load persona:', error);
      }
    };

    loadPersona();
  }, [authUser]);

  // Convert to UserProfile format expected by components
  const user = authUser && personaData ? {
    id: authUser.id,
    nickname: personaData.nickname || authUser.name || authUser.email.split('@')[0],
    email: authUser.email,
    iam: authUser.id,
    onboarding_completed: personaData.onboarding_completed || false,
    avatar_url: authUser.avatar,
    bio: personaData.bio,
    job_title: personaData.job_title,
    focus: personaData.focus,
    location: personaData.location,
    website: personaData.website,
    company: personaData.company,
    phone: personaData.phone,
    timezone: personaData.timezone,
    aiPreferences: personaData.aiPreferences,
    communicationStyle: personaData.communicationStyle,
  } : authUser ? {
    id: authUser.id,
    nickname: authUser.name || authUser.email.split('@')[0],
    email: authUser.email,
    iam: authUser.id,
    onboarding_completed: false,
    avatar_url: authUser.avatar,
  } : null;

  return {
    user,
    loading: isLoading,
    error: null,
    signOut: async () => {
      await logout();
      window.location.href = '/auth/login';
    },
    signIn: async () => {
      // Not used in current implementation
      return true;
    },
    updateUserProfile: async (updates: any) => {
      if (!authUser || !personaData) {
        console.error('No user or persona to update');
        return false;
      }

      try {
        // Update persona record with profile data
        await pb.collection('personas').update(personaData.id, {
          nickname: updates.nickname,
          bio: updates.bio,
          job_title: updates.job_title,
          focus: updates.focus,
          location: updates.location,
          website: updates.website,
          company: updates.company,
          phone: updates.phone,
          timezone: updates.timezone,
        });

        // Reload persona data
        const updatedPersonas = await pb.collection('personas').getFullList({
          filter: `iam = "${authUser.id}"`
        });

        if (updatedPersonas.length > 0) {
          setPersonaData(updatedPersonas[0]);
        }

        return true;
      } catch (error) {
        console.error('Failed to update persona:', error);
        return false;
      }
    },
    isAuthenticated,
  };
};
