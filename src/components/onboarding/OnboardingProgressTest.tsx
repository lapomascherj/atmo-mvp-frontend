import React, { useState, useEffect } from 'react';
import { OnboardingProgressService } from '@/services/onboardingProgressService';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';

/**
 * Test component for onboarding progress persistence
 * This component can be used to test the onboarding progress system
 */
export const OnboardingProgressTest: React.FC = () => {
  const { user } = useAuthContext();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadProgress = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const savedProgress = await OnboardingProgressService.loadProgress(user.id);
      setProgress(savedProgress);
      setMessage(savedProgress ? 'Progress loaded successfully' : 'No progress found');
    } catch (error) {
      setMessage(`Error loading progress: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const saveTestProgress = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const testData = {
        current_step: 2,
        completed_steps: [0, 1],
        onboarding_data: { name: 'Test User', age: '25' },
        messages: [
          {
            id: '1',
            type: 'ai' as const,
            content: 'Hello! What is your name?',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'user' as const,
            content: 'My name is Test User',
            timestamp: new Date().toISOString()
          }
        ]
      };

      await OnboardingProgressService.saveProgress(user.id, testData);
      setMessage('Test progress saved successfully');
      await loadProgress(); // Reload to show the saved data
    } catch (error) {
      setMessage(`Error saving progress: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearProgress = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await OnboardingProgressService.completeOnboarding(user.id);
      setMessage('Progress cleared successfully');
      setProgress(null);
    } catch (error) {
      setMessage(`Error clearing progress: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProgress();
    }
  }, [user?.id]);

  if (!user?.id) {
    return (
      <Card className="p-4">
        <CardContent>
          <p>Please log in to test onboarding progress</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">Onboarding Progress Test</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadProgress} disabled={loading}>
              {loading ? 'Loading...' : 'Load Progress'}
            </Button>
            <Button onClick={saveTestProgress} disabled={loading}>
              Save Test Progress
            </Button>
            <Button onClick={clearProgress} disabled={loading}>
              Clear Progress
            </Button>
          </div>

          {message && (
            <div className="p-2 bg-blue-100 text-blue-800 rounded">
              {message}
            </div>
          )}

          {progress && (
            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-semibold mb-2">Current Progress:</h4>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(progress, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
