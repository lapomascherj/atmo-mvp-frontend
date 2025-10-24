import React from 'react';
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
  Star
} from 'lucide-react';
import { cn } from '@/utils/utils';

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
  
  const progress = user?.onboarding_progress || 0;
  const isPartial = user?.onboarding_partial || false;
  const continueLater = user?.onboarding_continue_later || false;
  
  const handleContinueOnboarding = () => {
    navigate('/onboarding');
  };
  
  // For testing - always show the card
  // if (user?.onboarding_completed) {
  //   return null; // Don't show if onboarding is completed
  // }
  
  // if (!isPartial && !continueLater) {
  //   return null; // Don't show if no partial onboarding
  // }
  
  return (
    <Card className="bg-slate-800/60 border border-white/10 rounded-lg cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={handleContinueOnboarding}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500/20 rounded-md flex items-center justify-center">
              <Brain size={12} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Continue On-Boarding</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-orange-400">{Math.round(progress)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingStatusCard;
