import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { OnboardingProgressService } from '@/services/onboardingProgressService';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';

/**
 * Diagnostic component to help troubleshoot onboarding issues
 */
export const OnboardingDiagnostic: React.FC = () => {
  const { user } = useAuthContext();
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addDiagnostic = (message: string) => {
    setDiagnostics(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    
    addDiagnostic('🔍 Starting onboarding diagnostics...');
    
    // Check 1: User authentication
    if (!user?.id) {
      addDiagnostic('❌ No authenticated user found');
      setIsRunning(false);
      return;
    }
    addDiagnostic(`✅ User authenticated: ${user.id}`);
    
    // Check 2: Try to load progress
    try {
      addDiagnostic('🔍 Testing progress loading...');
      const progress = await OnboardingProgressService.loadProgress(user.id);
      if (progress) {
        addDiagnostic(`✅ Progress loaded: Step ${progress.current_step}`);
      } else {
        addDiagnostic('📭 No progress found (this is normal for new users)');
      }
    } catch (error) {
      addDiagnostic(`❌ Error loading progress: ${error}`);
    }
    
    // Check 3: Try to save test progress
    try {
      addDiagnostic('🔍 Testing progress saving...');
      await OnboardingProgressService.saveProgress(user.id, {
        current_step: 1,
        completed_steps: [0],
        onboarding_data: { test: 'data' },
        messages: []
      });
      addDiagnostic('✅ Progress saving works');
    } catch (error) {
      addDiagnostic(`❌ Error saving progress: ${error}`);
    }
    
    // Check 4: Check localStorage fallback
    const localProgress = localStorage.getItem('atmo_onboarding_progress');
    if (localProgress) {
      addDiagnostic('📦 Found localStorage progress (fallback available)');
    } else {
      addDiagnostic('📭 No localStorage progress');
    }
    
    addDiagnostic('✅ Diagnostics complete');
    setIsRunning(false);
  };

  return (
    <Card className="p-4">
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">Onboarding Diagnostic Tool</h3>
        
        <div className="space-y-4">
          <Button onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
          
          {diagnostics.length > 0 && (
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
              <h4 className="font-semibold mb-2">Diagnostic Results:</h4>
              <div className="space-y-1 text-sm">
                {diagnostics.map((diagnostic, index) => (
                  <div key={index} className="font-mono">
                    {diagnostic}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p><strong>Common Issues:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Database table not created - run the SQL setup script</li>
              <li>User not authenticated - check login status</li>
              <li>RLS policies not set - check Supabase permissions</li>
              <li>Network issues - check Supabase connection</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
