import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMockAuth } from '@/hooks/useMockAuth';
import LoadingScreen from '@/components/atoms/LoadingScreen.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useMockAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user && !loading) {
      // Log attempts to access protected routes when not authenticated
      console.warn('Authentication required: Unauthorized access attempt to:', location.pathname);
    }
  }, [user, loading, location.pathname]);

  if (loading) {
    console.log('Authentication checking: Loading user data...');
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirect to login page if not authenticated
    console.log('Authentication required: Redirecting to login from:', location.pathname);
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  console.log('Authentication successful: Access granted to:', location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute;
