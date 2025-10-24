import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Brain,
  User,
  Briefcase,
  Target,
  Heart,
  BookOpen,
  Star,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Progress } from '@/components/atoms/Progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { cn } from '@/utils/utils';

interface OnboardingProgress {
  stepIndex: number;
  questionIndex: number;
  progress: number;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  lastUpdated: string;
}

interface OnboardingIntegrationProps {
  onStartOnboarding: () => void;
  onContinueOnboarding: () => void;
  onCompleteOnboarding: () => void;
  className?: string;
}

export const OnboardingIntegration: React.FC<OnboardingIntegrationProps> = ({
  onStartOnboarding,
  onContinueOnboarding,
  onCompleteOnboarding,
  className
}) => {
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [showOnboardingCard, setShowOnboardingCard] = useState(false);
  
  // Check for saved onboarding progress
  useEffect(() => {
    const savedProgress = localStorage.getItem('atmo_onboarding_progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        const daysSinceUpdate = (Date.now() - new Date(progress.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate < 7) { // Show if updated within last 7 days
          setOnboardingProgress({
            stepIndex: progress.stepIndex,
            questionIndex: progress.questionIndex,
            progress: progress.progress || 0,
            currentStep: progress.currentStep || 'Welcome',
            completedSteps: progress.completedSteps || [],
            totalSteps: 10,
            lastUpdated: progress.timestamp
          });
          setShowOnboardingCard(true);
        }
      } catch (error) {
        console.error('Failed to parse onboarding progress:', error);
      }
    }
  }, []);
  
  const getStepIcon = (stepIndex: number) => {
    const icons = [
      MessageCircle, User, Briefcase, Target, Heart, 
      BookOpen, Star, Sparkles, TrendingUp, CheckCircle
    ];
    return icons[stepIndex] || MessageCircle;
  };
  
  const getStepColor = (stepIndex: number) => {
    const colors = [
      'blue', 'purple', 'green', 'orange', 'red',
      'yellow', 'pink', 'indigo', 'cyan', 'green'
    ];
    return colors[stepIndex] || 'blue';
  };
  
  const getStepTitle = (stepIndex: number) => {
    const titles = [
      'Welcome & Introduction',
      'Personal Basics',
      'Work & Career',
      'Goals & Aspirations',
      'Preferences & Style',
      'Habits & Routines',
      'Wellness & Health',
      'Learning & Development',
      'Projects & Work',
      'Personal Interests'
    ];
    return titles[stepIndex] || 'Onboarding';
  };
  
  const handleContinueOnboarding = () => {
    onContinueOnboarding();
    setShowOnboardingCard(false);
  };
  
  const handleStartOnboarding = () => {
    onStartOnboarding();
    setShowOnboardingCard(false);
  };
  
  const handleCompleteOnboarding = () => {
    localStorage.removeItem('atmo_onboarding_progress');
    setOnboardingProgress(null);
    setShowOnboardingCard(false);
    onCompleteOnboarding();
  };
  
  if (!showOnboardingCard) return null;
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Onboarding Progress Card */}
      <Card className="border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Complete Your Profile</CardTitle>
                <p className="text-white/70 text-sm">
                  {onboardingProgress ? 'Continue where you left off' : 'Get personalized AI assistance'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-400/20 text-blue-300">
              {onboardingProgress ? `${onboardingProgress.progress}%` : 'New'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Profile Completion</span>
              <span className="text-sm text-white/70">
                {onboardingProgress ? `${onboardingProgress.progress}%` : '0%'}
              </span>
            </div>
            <Progress 
              value={onboardingProgress?.progress || 0} 
              className="h-2"
            />
          </div>
          
          {/* Current Step */}
          {onboardingProgress && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className={`w-8 h-8 rounded-lg bg-${getStepColor(onboardingProgress.stepIndex)}-400/20 flex items-center justify-center`}>
                {React.createElement(getStepIcon(onboardingProgress.stepIndex), {
                  size: 16,
                  className: `text-${getStepColor(onboardingProgress.stepIndex)}-400`
                })}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {getStepTitle(onboardingProgress.stepIndex)}
                </p>
                <p className="text-white/70 text-xs">
                  Last updated: {new Date(onboardingProgress.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          
          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="text-white text-sm font-medium">Complete your profile to unlock:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-yellow-400" />
                <span>Personalized AI responses</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={12} className="text-orange-400" />
                <span>Goal tracking & insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart size={12} className="text-red-400" />
                <span>Wellness recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-green-400" />
                <span>Productivity optimization</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            {onboardingProgress ? (
              <Button 
                onClick={handleContinueOnboarding}
                className="flex-1 bg-blue-400 hover:bg-blue-500 text-white"
              >
                <ArrowRight size={16} className="mr-2" />
                Continue Onboarding
              </Button>
            ) : (
              <Button 
                onClick={handleStartOnboarding}
                className="flex-1 bg-blue-400 hover:bg-blue-500 text-white"
              >
                <MessageCircle size={16} className="mr-2" />
                Start Onboarding
              </Button>
            )}
            
            <Button 
              variant="ghost"
              onClick={() => setShowOnboardingCard(false)}
              className="text-white/70 hover:text-white"
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingIntegration;
