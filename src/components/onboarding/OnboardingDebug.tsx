import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { OnboardingProgressService } from '@/services/onboardingProgressService';
import { PersonalDataOnboardingService } from '@/services/personalDataOnboardingService';

export const OnboardingDebug: React.FC = () => {
  const { user } = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadDebugInfo = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const progress = await OnboardingProgressService.loadProgress(user.id);
      setDebugInfo({
        userId: user.id,
        progress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Debug info load failed:', error);
      setDebugInfo({
        userId: user.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOnboarding = async () => {
    if (!user?.id) return;
    
    try {
      const result = await PersonalDataOnboardingService.initializePersonalDataOnboarding(user.id);
      console.log('Test onboarding result:', result);
    } catch (error) {
      console.error('Test onboarding failed:', error);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, [user?.id]);

  if (!user) {
    return <div className="p-4 text-white">No user logged in</div>;
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-4">Onboarding Debug</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>User ID:</strong> {user.id}</div>
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
      </div>

      {debugInfo && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <pre className="bg-slate-900 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="space-x-2">
        <button
          onClick={loadDebugInfo}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Reload Debug Info
        </button>
        <button
          onClick={testOnboarding}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          Test Onboarding
        </button>
      </div>
    </div>
  );
};
