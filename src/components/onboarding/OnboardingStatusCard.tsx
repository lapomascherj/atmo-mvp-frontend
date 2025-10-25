import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Progress } from '@/components/atoms/Progress';
import { Badge } from '@/components/atoms/Badge';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Brain,
  Target,
  User,
  Briefcase,
  Heart,
  BookOpen,
  Star,
  Play,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { OnboardingProgressService } from '@/services/onboardingProgressService';
import { useAuthContext } from '@/context/AuthContext';

interface OnboardingStatusCardProps {
  user: any;
  onComplete?: () => void;
}

const onboardingSteps = [
  { id: 'welcome', title: 'Welcome', icon: Brain, color: 'blue' },
  { id: 'personal_basics', title: 'Personal Basics', icon: User, color: 'purple' },
  { id: 'work_career', title: 'Work & Career', icon: Briefcase, color: 'green' },
  { id: 'goals_aspirations', title: 'Goals & Aspirations', icon: Target, color: 'orange' },
  { id: 'preferences_style', title: 'Preferences & Style', icon: Brain, color: 'indigo' },
  { id: 'habits_routines', title: 'Habits & Routines', icon: Clock, color: 'teal' },
  { id: 'wellness_health', title: 'Wellness & Health', icon: Heart, color: 'red' },
  { id: 'learning_development', title: 'Learning & Development', icon: BookOpen, color: 'yellow' },
  { id: 'projects_work', title: 'Projects & Work', icon: Briefcase, color: 'cyan' },
  { id: 'personal_interests', title: 'Personal Interests', icon: Star, color: 'pink' },
  { id: 'final_review', title: 'Final Review', icon: CheckCircle, color: 'green' }
];

export const OnboardingStatusCard: React.FC<OnboardingStatusCardProps> = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [progressData, setProgressData] = useState<{
    progress: number;
    currentStep: number;
    totalSteps: number;
  } | null>(null);
  
  const progress = user?.onboarding_progress || 0;
  const isPartial = user?.onboarding_partial || false;
  const continueLater = user?.onboarding_continue_later || false;
  
  // Load progress data on component mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!authUser?.id) return;
      
      try {
        const savedProgress = await OnboardingProgressService.loadProgress(authUser.id);
        if (savedProgress) {
          const totalSteps = onboardingSteps.length;
          const progressPercentage = OnboardingProgressService.calculateProgress(
            savedProgress.current_step,
            totalSteps
          );
          
          setProgressData({
            progress: progressPercentage,
            currentStep: savedProgress.current_step,
            totalSteps
          });
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      }
    };
    
    loadProgress();
  }, [authUser?.id]);
  
  const handleContinueOnboarding = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsLoading(true);
    
    try {
      console.log('🚀 Continuing onboarding...');
      console.log('👤 Auth user:', authUser);
      
      if (!authUser?.id) {
        console.error('❌ No authenticated user, falling back to regular onboarding');
        navigate('/onboarding?continue=true');
        return;
      }
      
      // Show loading message
      console.log('📊 Resuming your onboarding...');
      
      // Load saved progress
      console.log('🔍 Loading progress for user:', authUser.id);
      const savedProgress = await OnboardingProgressService.loadProgress(authUser.id);
      console.log('📋 Loaded progress:', savedProgress);
      
      if (savedProgress) {
        console.log('✅ Found saved progress:', savedProgress);
        console.log('📍 Navigating to main chat to continue onboarding');
        // Navigate to main chat with onboarding continuation
        navigate('/?onboarding_continue=true');
      } else {
        console.log('❌ No saved progress found, starting fresh');
        // Start from beginning in main chat
        navigate('/?onboarding_start=true');
      }
    } catch (error) {
      console.error('❌ Failed to resume onboarding:', error);
      console.log('🔄 Falling back to regular onboarding');
      // Fallback to regular onboarding
      navigate('/onboarding?continue=true');
    } finally {
      setIsLoading(false);
    }
  };
  
  // For testing - always show the card
  // if (user?.onboarding_completed) {
  //   return null; // Don't show if onboarding is completed
  // }
  
  // if (!isPartial && !continueLater) {
  //   return null; // Don't show if no partial onboarding
  // }
  
  // Use progress data if available, otherwise fall back to user progress
  const displayProgress = progressData?.progress ?? Math.round(progress);
  const isCompleted = progressData ? OnboardingProgressService.isCompleted(progressData.currentStep, progressData.totalSteps) : false;
  
  // Don't show if onboarding is completed
  if (isCompleted) {
    return null;
  }
  
  return (
    <Card className="bg-slate-800/60 border border-white/10 rounded-lg hover:bg-slate-800/80 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Left side - Info */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-orange-500/20 rounded-md flex items-center justify-center">
              <Brain size={12} className="text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-white">Continue On-Boarding</h3>
              <div className="text-xs text-white/60">{displayProgress}% completed</div>
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                <div 
                  className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Right side - Continue Button */}
          <Button
            onClick={handleContinueOnboarding}
            disabled={isLoading}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 h-auto disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={12} className="mr-1 animate-spin" />
            ) : (
              <Play size={12} className="mr-1" />
            )}
            {isLoading ? 'Resuming...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingStatusCard;

