import React from 'react';
import { logTelemetryError } from '@/lib/telemetry';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    logTelemetryError('route_error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h1>
            <p className="text-slate-600 mb-6">
              The application encountered an error. Please refresh the page or try again.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Reset error state instead of reloading page
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full px-4 py-2 bg-[#FF7000] text-white rounded-lg hover:bg-[#E5630A] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  // Clear only auth data, not all localStorage
                  localStorage.removeItem("atmo_auth_token");
                  localStorage.removeItem("atmo_token_data");
                  localStorage.removeItem("atmo_user_data");
                  // Use React Router navigation instead of page reload
                  window.location.href = '/auth/login';
                }}
                className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Clear Auth & Login
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-slate-500">
                  Technical Details
                </summary>
                <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
