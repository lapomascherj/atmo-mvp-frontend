import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const {
    session,
    hydratedProfile,
    initializing,
    profileLoading,
  } = useAuth();
  const location = useLocation();

  const isAuthenticated = !!session;
  const isProfileReady = !isAuthenticated || !!hydratedProfile;
  const isLoading = initializing || profileLoading || (isAuthenticated && !isProfileReady);

  if (import.meta.env.DEV) {
    console.debug('[ProtectedRoute]', {
      path: location.pathname,
      initializing,
      profileLoading,
      isAuthenticated,
      hasProfile: !!hydratedProfile,
    });
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.debug('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Wait for profile to load before making onboarding decisions
  if (isAuthenticated && !hydratedProfile) {
    console.debug('[ProtectedRoute] Waiting for profile to load...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Only redirect to onboarding if we have a profile and it's not completed
  if (isAuthenticated && hydratedProfile && !hydratedProfile.onboarding_completed && location.pathname !== '/onboarding') {
    console.debug('[ProtectedRoute] Redirecting to onboarding - onboarding not completed');
    return <Navigate to="/onboarding" replace />;
  }

  // Only redirect away from onboarding if we have a profile and it IS completed
  if (isAuthenticated && hydratedProfile && hydratedProfile.onboarding_completed && location.pathname === '/onboarding') {
    console.debug('[ProtectedRoute] Redirecting to /app - onboarding already completed');
    return <Navigate to="/app" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
