import { useState, useMemo, useCallback } from 'react';
import { useAuth as useAuthContext } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UseRealAuthResult {
  user: ReturnType<typeof useAuthContext>['user'];
  profile: ReturnType<typeof useAuthContext>['hydratedProfile'];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    password: string,
    confirmPassword: string,
    name?: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Record<string, any>) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
}

export const useRealAuth = (): UseRealAuthResult => {
  const auth = useAuthContext();
  const [localError, setLocalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isLoading = auth.initializing || auth.profileLoading || pending;
  const isAuthenticated = !!auth.session;

  const clearError = useCallback(() => {
    setLocalError(null);
    auth.clearError();
  }, [auth]);

  const login = useCallback(
    async (email: string, password: string) => {
      clearError();
      setPending(true);
      const { error } = await auth.signIn(email, password);
      setPending(false);

      if (error) {
        setLocalError(error);
        toast.error('Login failed', { description: error });
        return false;
      }

      toast.success('Welcome back!', {
        description: auth.hydratedProfile?.display_name || email,
      });

      return true;
    },
    [auth, clearError]
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      confirmPassword: string,
      name?: string
    ) => {
      clearError();

      if (password !== confirmPassword) {
        const mismatch = 'Passwords do not match.';
        setLocalError(mismatch);
        toast.error('Signup failed', { description: mismatch });
        return false;
      }

      setPending(true);
      const { error, needsConfirmation } = await auth.signUp(email, password, {
        display_name: name?.trim() || undefined,
      });
      setPending(false);

      if (error) {
        setLocalError(error);
        toast.error('Signup failed', { description: error });
        return false;
      }

      if (needsConfirmation) {
        toast.info('Confirm your email', {
          description: 'Check your inbox to activate your account.',
        });
      } else {
        toast.success('Account created', {
          description: 'Let’s personalise ATMO for you.',
        });
      }

      return true;
    },
    [auth, clearError]
  );

  const logout = useCallback(async () => {
    setPending(true);
    await auth.signOut();
    setPending(false);
    toast.success('Signed out successfully');
  }, [auth]);

  const signOut = logout;

  const updateUserProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      clearError();
      const payload: Parameters<typeof auth.updateProfile>[0] = {};

      if (typeof updates.display_name === 'string' && updates.display_name.trim()) {
        payload.display_name = updates.display_name.trim();
      }

      if (typeof updates.timezone === 'string' && updates.timezone.trim()) {
        payload.timezone = updates.timezone.trim();
      }

      if (typeof updates.avatar_url === 'string' || updates.avatar_url === null) {
        payload.avatar_url = updates.avatar_url as string | null;
      }

      if (updates.onboarding_data && typeof updates.onboarding_data === 'object') {
        payload.onboarding_data = updates.onboarding_data as Record<string, unknown>;
      }

      setPending(true);
      const { error } = await auth.updateProfile(payload);
      setPending(false);

      if (error) {
        setLocalError(error);
        toast.error('Profile update failed', { description: error });
        return false;
      }

      toast.success('Profile saved', {
        description: 'Your ATMO profile has been updated.',
      });
      return true;
    },
    [auth, clearError]
  );

  const checkAuth = useCallback(async () => {
    await auth.refreshProfile();
  }, [auth]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      clearError();
      setPending(true);
      const { error } = await auth.requestPasswordReset(email);
      setPending(false);

      if (error) {
        setLocalError(error);
        toast.error('Reset failed', { description: error });
        return false;
      }

      toast.success('Reset email sent', {
        description: 'Check your inbox for reset instructions.',
      });
      return true;
    },
    [auth, clearError]
  );

  const value = useMemo<UseRealAuthResult>(
    () => ({
      user: auth.user,
      profile: auth.hydratedProfile,
      isAuthenticated,
      isLoading,
      error: localError ?? auth.lastError,
      clearError,
      login,
      signup,
      logout,
      signOut,
      updateUserProfile,
      checkAuth,
      requestPasswordReset,
    }),
    [
      auth.user,
      auth.hydratedProfile,
      auth.lastError,
      isAuthenticated,
      isLoading,
      localError,
      clearError,
      login,
      signup,
      logout,
      signOut,
      updateUserProfile,
      checkAuth,
      requestPasswordReset,
    ]
  );

  return value;
};

export default useRealAuth;
