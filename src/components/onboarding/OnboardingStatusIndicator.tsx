import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Progress } from '@/components/atoms/Progress';
import { Badge } from '@/components/atoms/Badge';
import { 
  Clock, 
  Save, 
  CheckCircle,
  Brain,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { OnboardingProgressService } from '@/services/onboardingProgressService';
import { OnboardingAgent } from '@/services/onboardingAgent';
import { promptStore } from '@/stores/promptStore';
import { useChatSessionsStore } from '@/stores/chatSessionsStore';

interface OnboardingStatusIndicatorProps {
  userId: string;
  onContinueLater: () => void;
  onComplete: () => void;
}

export const OnboardingStatusIndicator: React.FC<OnboardingStatusIndicatorProps> = ({
  userId,
  onContinueLater,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { startNewChatSession } = useChatSessionsStore();

  // Load progress data
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await OnboardingProgressService.loadProgress(userId);
        if (savedProgress) {
          const progressPercentage = OnboardingProgressService.calculateProgress(
            savedProgress.current_step,
            13 // Total number of onboarding questions
          );
          setProgress(progressPercentage);
          setCurrentStep(savedProgress.current_step);
          
          // Check if completed
          if (OnboardingProgressService.isCompleted(savedProgress.current_step, 13)) {
            setIsCompleted(true);
            onComplete();
          }
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      }
    };

    loadProgress();
  }, [userId, onComplete]);

  // Update progress when conversation changes
  useEffect(() => {
    const updateProgress = async () => {
      try {
        const savedProgress = await OnboardingProgressService.loadProgress(userId);
        if (savedProgress) {
          const progressPercentage = OnboardingProgressService.calculateProgress(
            savedProgress.current_step,
            13
          );
          setProgress(progressPercentage);
          setCurrentStep(savedProgress.current_step);
          
          // Check if completed
          if (OnboardingProgressService.isCompleted(savedProgress.current_step, 13)) {
            setIsCompleted(true);
            onComplete();
          }
        }
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    };

    // Update progress every 5 seconds to reduce unnecessary calls
    const interval = setInterval(updateProgress, 5000);
    return () => clearInterval(interval);
  }, [userId, onComplete]);

  const handleContinueLater = async () => {
    setIsSaving(true);
    
    try {
      console.log('💾 Saving onboarding progress for later...');
      
      // Get current conversation history
      const currentHistory = promptStore.getState().history;
      
      // Save current progress using OnboardingAgent
      const savedProgress = await OnboardingProgressService.loadProgress(userId);
      if (savedProgress) {
        // Use OnboardingAgent to save progress with all data extraction
        await OnboardingAgent.saveCurrentProgress(userId);
        
        // Update the progress with current conversation
        await OnboardingProgressService.updateStep(
          userId,
          savedProgress.current_step,
          savedProgress.completed_steps,
          savedProgress.onboarding_data,
          currentHistory.map((entry, index) => ({
            id: `msg_${Date.now()}_${index}`,
            type: entry.sender,
            content: entry.message,
            timestamp: new Date().toISOString()
          }))
        );
        
        console.log('✅ Onboarding progress saved for later');
        console.log('📊 Personal Data Card will be updated with collected data');
        
        // Create a new chat conversation
        try {
          console.log('🔄 Creating new chat conversation...');
          await startNewChatSession();
          console.log('✅ New chat conversation created');
        } catch (error) {
          console.error('❌ Failed to create new chat conversation:', error);
        }
        
        // Call the callback to close onboarding and remove the card
        onContinueLater();
      }
    } catch (error) {
      console.error('❌ Failed to save onboarding progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isCompleted) {
    return null; // Don't show if completed
  }

  return (
    <Card className="fixed bottom-20 left-16 w-48 bg-slate-800/95 border border-orange-500/20 rounded-lg shadow-lg backdrop-blur-sm z-50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500/20 rounded-sm flex items-center justify-center">
              <Brain size={10} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">On-Boarding</h3>
              <p className="text-xs text-white/60">{progress}%</p>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-2">
          <Progress value={progress} className="h-1.5 bg-white/10">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </Progress>
        </div>
        
        {/* Continue Later Button */}
        <Button
          onClick={handleContinueLater}
          disabled={isSaving}
          size="sm"
          className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs h-7"
        >
          {isSaving ? (
            <>
              <Loader2 size={10} className="mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={10} className="mr-1" />
              Continue Later
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default OnboardingStatusIndicator;
