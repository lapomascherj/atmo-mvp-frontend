import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  User, 
  Briefcase, 
  Target, 
  Heart, 
  BookOpen, 
  Coffee, 
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Save,
  Home,
  Brain,
  Sparkles,
  Smile,
  TrendingUp,
  Users,
  Lightbulb,
  Star,
  Settings,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Progress } from '@/components/atoms/Progress';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent } from '@/components/atoms/Card';
import { cn } from '@/utils/utils';

interface OnboardingData {
  // Personal Basics (15%)
  name: string;
  age: string;
  location: string;
  bio: string;
  timezone: string;
  
  // Work & Career (25%)
  jobTitle: string;
  company: string;
  industry: string;
  experienceLevel: string;
  skills: string[];
  workStyle: string;
  communicationStyle: string;
  
  // Goals & Aspirations (35%)
  shortTermGoals: string[];
  longTermGoals: string[];
  careerGoals: string[];
  personalGoals: string[];
  learningGoals: string[];
  priorityGoals: string[];
  
  // Preferences & Style (45%)
  workPreferences: string[];
  learningPreferences: string[];
  communicationPreferences: string[];
  environmentPreferences: string[];
  
  // Habits & Routines (55%)
  dailyRoutines: string[];
  weeklyRoutines: string[];
  habits: string[];
  schedule: string;
  
  // Wellness & Health (65%)
  sleepPattern: string;
  exerciseRoutine: string;
  stressManagement: string;
  energyLevel: number;
  wellnessGoals: string[];
  
  // Learning & Development (75%)
  currentLearning: string[];
  skillsToDevelop: string[];
  learningResources: string[];
  learningStyle: string;
  
  // Projects & Work (85%)
  currentProjects: string[];
  workEnvironment: string;
  projectManagement: string;
  collaborationStyle: string;
  
  // Personal Interests (95%)
  hobbies: string[];
  interests: string[];
  values: string[];
  personalMission: string;
  
  // Emotional Data
  motivations: string[];
  feelings: string[];
  inspirations: string[];
  challenges: string[];
  successes: string[];
}

interface ConversationStep {
  id: string;
  title: string;
  description: string;
  progress: number;
  questions: ConversationQuestion[];
  icon: React.ComponentType<any>;
  color: string;
}

interface ConversationQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'rating' | 'textarea' | 'emoji';
  options?: string[];
  required: boolean;
  followUp?: string;
  emotional?: boolean;
}

const conversationSteps: ConversationStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ATMO',
    description: 'Let\'s get to know you better',
    progress: 5,
    icon: MessageCircle,
    color: 'blue',
    questions: [
      {
        id: 'welcome_message',
        text: 'Hi! I\'m ATMO, your AI assistant. I\'m excited to learn about you so I can provide personalized help. What should I call you?',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'personal_basics',
    title: 'Personal Basics',
    description: 'Tell me about yourself',
    progress: 15,
    icon: User,
    color: 'purple',
    questions: [
      {
        id: 'age',
        text: 'How old are you? This helps me understand your life stage and provide age-appropriate suggestions.',
        type: 'text',
        required: true
      },
      {
        id: 'location',
        text: 'Where are you based? This helps me understand your timezone and local context.',
        type: 'text',
        required: true
      },
      {
        id: 'bio',
        text: 'Tell me a bit about yourself. What makes you unique? What are you passionate about?',
        type: 'textarea',
        required: true,
        emotional: true
      }
    ]
  },
  {
    id: 'work_career',
    title: 'Work & Career',
    description: 'Your professional life',
    progress: 25,
    icon: Briefcase,
    color: 'green',
    questions: [
      {
        id: 'jobTitle',
        text: 'What do you do for work? What\'s your job title or role?',
        type: 'text',
        required: true
      },
      {
        id: 'company',
        text: 'What company or organization do you work for?',
        type: 'text',
        required: false
      },
      {
        id: 'experienceLevel',
        text: 'How would you describe your experience level?',
        type: 'select',
        options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Entrepreneur', 'Student'],
        required: true
      },
      {
        id: 'skills',
        text: 'What are your key skills and strengths? (You can add multiple)',
        type: 'multiselect',
        required: true
      },
      {
        id: 'workStyle',
        text: 'How do you prefer to work? Are you more collaborative or independent?',
        type: 'select',
        options: ['Collaborative', 'Independent', 'Mixed', 'Remote', 'In-person', 'Hybrid'],
        required: true
      }
    ]
  },
  {
    id: 'goals_aspirations',
    title: 'Goals & Aspirations',
    description: 'What do you want to achieve?',
    progress: 35,
    icon: Target,
    color: 'orange',
    questions: [
      {
        id: 'shortTermGoals',
        text: 'What are your main goals for the next 3-6 months? What do you want to accomplish?',
        type: 'multiselect',
        required: true,
        emotional: true
      },
      {
        id: 'longTermGoals',
        text: 'Where do you see yourself in 2-3 years? What are your bigger aspirations?',
        type: 'multiselect',
        required: true,
        emotional: true
      },
      {
        id: 'careerGoals',
        text: 'What are your career aspirations? Where do you want to be professionally?',
        type: 'textarea',
        required: true,
        emotional: true
      },
      {
        id: 'personalGoals',
        text: 'What personal goals are important to you? (health, relationships, hobbies, etc.)',
        type: 'multiselect',
        required: true,
        emotional: true
      }
    ]
  },
  {
    id: 'preferences_style',
    title: 'Preferences & Style',
    description: 'How do you like to work and learn?',
    progress: 45,
    icon: Settings,
    color: 'indigo',
    questions: [
      {
        id: 'workPreferences',
        text: 'What kind of work environment do you prefer?',
        type: 'multiselect',
        options: ['Quiet', 'Collaborative', 'Flexible', 'Structured', 'Creative', 'Remote', 'In-person'],
        required: true
      },
      {
        id: 'learningPreferences',
        text: 'How do you prefer to learn new things?',
        type: 'multiselect',
        options: ['Reading', 'Videos', 'Hands-on', 'Mentorship', 'Courses', 'Practice', 'Discussion'],
        required: true
      },
      {
        id: 'communicationPreferences',
        text: 'How do you prefer to communicate?',
        type: 'select',
        options: ['Direct', 'Diplomatic', 'Visual', 'Written', 'Verbal', 'Mixed'],
        required: true
      }
    ]
  },
  {
    id: 'habits_routines',
    title: 'Habits & Routines',
    description: 'Your daily patterns',
    progress: 55,
    icon: Clock,
    color: 'teal',
    questions: [
      {
        id: 'dailyRoutines',
        text: 'What does your typical day look like? What are your main daily routines?',
        type: 'multiselect',
        required: true
      },
      {
        id: 'habits',
        text: 'What habits do you have that help you be productive?',
        type: 'multiselect',
        required: true
      },
      {
        id: 'schedule',
        text: 'When are you most productive during the day?',
        type: 'select',
        options: ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Variable'],
        required: true
      }
    ]
  },
  {
    id: 'wellness_health',
    title: 'Wellness & Health',
    description: 'Your health and wellbeing',
    progress: 65,
    icon: Heart,
    color: 'red',
    questions: [
      {
        id: 'sleepPattern',
        text: 'How would you describe your sleep pattern?',
        type: 'select',
        options: ['Excellent', 'Good', 'Fair', 'Poor', 'Variable'],
        required: true
      },
      {
        id: 'exerciseRoutine',
        text: 'What\'s your exercise routine like?',
        type: 'select',
        options: ['Daily', '3-4 times/week', '1-2 times/week', 'Occasionally', 'None'],
        required: true
      },
      {
        id: 'stressManagement',
        text: 'How do you typically manage stress?',
        type: 'multiselect',
        options: ['Exercise', 'Meditation', 'Music', 'Reading', 'Socializing', 'Nature', 'Hobbies'],
        required: true
      },
      {
        id: 'energyLevel',
        text: 'How would you rate your current energy level?',
        type: 'rating',
        required: true
      }
    ]
  },
  {
    id: 'learning_development',
    title: 'Learning & Development',
    description: 'Your growth and learning',
    progress: 75,
    icon: BookOpen,
    color: 'yellow',
    questions: [
      {
        id: 'currentLearning',
        text: 'What are you currently learning or studying?',
        type: 'multiselect',
        required: true
      },
      {
        id: 'skillsToDevelop',
        text: 'What skills would you like to develop or improve?',
        type: 'multiselect',
        required: true
      },
      {
        id: 'learningStyle',
        text: 'What\'s your preferred learning style?',
        type: 'select',
        options: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing', 'Mixed'],
        required: true
      }
    ]
  },
  {
    id: 'projects_work',
    title: 'Projects & Work',
    description: 'Your current work and projects',
    progress: 85,
    icon: FolderOpen,
    color: 'cyan',
    questions: [
      {
        id: 'currentProjects',
        text: 'What projects are you currently working on?',
        type: 'multiselect',
        required: true
      },
      {
        id: 'workEnvironment',
        text: 'Describe your ideal work environment.',
        type: 'textarea',
        required: true
      },
      {
        id: 'collaborationStyle',
        text: 'How do you prefer to collaborate with others?',
        type: 'select',
        options: ['Lead', 'Support', 'Equal Partner', 'Independent', 'Mixed'],
        required: true
      }
    ]
  },
  {
    id: 'personal_interests',
    title: 'Personal Interests',
    description: 'What makes you tick?',
    progress: 95,
    icon: Star,
    color: 'pink',
    questions: [
      {
        id: 'hobbies',
        text: 'What are your hobbies and interests?',
        type: 'multiselect',
        required: true,
        emotional: true
      },
      {
        id: 'values',
        text: 'What values are most important to you?',
        type: 'multiselect',
        options: ['Family', 'Career', 'Health', 'Learning', 'Creativity', 'Service', 'Adventure', 'Security'],
        required: true,
        emotional: true
      },
      {
        id: 'personalMission',
        text: 'What\'s your personal mission or purpose? What drives you?',
        type: 'textarea',
        required: true,
        emotional: true
      }
    ]
  },
  {
    id: 'final_review',
    title: 'Final Review',
    description: 'Let\'s review everything together',
    progress: 100,
    icon: CheckCircle,
    color: 'green',
    questions: [
      {
        id: 'review',
        text: 'Let\'s review your profile. Is there anything you\'d like to add or change?',
        type: 'textarea',
        required: false
      }
    ]
  }
];

export const ConversationalOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding, user } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({} as OnboardingData);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showContinueLater, setShowContinueLater] = useState(false);
  const [savedProgress, setSavedProgress] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentStep = conversationSteps[currentStepIndex];
  const currentQuestion = currentStep?.questions[currentQuestionIndex];
  const progress = currentStep?.progress || 0;
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQuestionIndex, currentStepIndex]);
  
  // Focus input when question changes
  useEffect(() => {
    if (currentQuestion && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentQuestion]);
  
  // Save progress to localStorage
  useEffect(() => {
    if (Object.keys(onboardingData).length > 0) {
      localStorage.setItem('atmo_onboarding_progress', JSON.stringify({
        data: onboardingData,
        stepIndex: currentStepIndex,
        questionIndex: currentQuestionIndex,
        timestamp: new Date().toISOString()
      }));
      setSavedProgress(true);
    }
  }, [onboardingData, currentStepIndex, currentQuestionIndex]);
  
  const handleAnswer = (answer: string | string[]) => {
    if (!currentQuestion) return;
    
    setIsTyping(true);
    
    // Update data
    setOnboardingData(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    
    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      
      // Move to next question or step
      if (currentQuestionIndex < currentStep.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (currentStepIndex < conversationSteps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
      } else {
        // Complete onboarding
        handleComplete();
      }
    }, 1000);
  };
  
  const handleComplete = async () => {
    try {
      await completeOnboarding(onboardingData);
      navigate('/app');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };
  
  const handleContinueLater = () => {
    setShowContinueLater(true);
    navigate('/app');
  };
  
  const handleSkipQuestion = () => {
    if (currentQuestionIndex < currentStep.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentStepIndex < conversationSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  };
  
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case 'text':
        return (
          <Input
            ref={inputRef}
            placeholder="Type your answer..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleAnswer(e.currentTarget.value.trim());
              }
            }}
            className="w-full"
          />
        );
      
      case 'textarea':
        return (
          <TextArea
            placeholder="Tell me more..."
            rows={4}
            className="w-full"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey && e.currentTarget.value.trim()) {
                handleAnswer(e.currentTarget.value.trim());
              }
            }}
          />
        );
      
      case 'select':
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className="w-full p-3 text-left rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/70 mb-3">Select all that apply:</p>
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => {
                  const currentAnswers = onboardingData[currentQuestion.id as keyof OnboardingData] as string[] || [];
                  const newAnswers = currentAnswers.includes(option)
                    ? currentAnswers.filter(a => a !== option)
                    : [...currentAnswers, option];
                  handleAnswer(newAnswers);
                }}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-colors",
                  (onboardingData[currentQuestion.id as keyof OnboardingData] as string[] || []).includes(option)
                    ? "border-blue-400 bg-blue-400/10 text-blue-300"
                    : "border-white/20 hover:border-white/40 hover:bg-white/5"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleAnswer(rating)}
                className="w-12 h-12 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors flex items-center justify-center"
              >
                {rating}
              </button>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  if (showContinueLater) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Progress Saved!</h2>
            <p className="text-white/70 mb-6">
              Your onboarding progress has been saved. You can continue anytime from the main chat.
            </p>
            <Button onClick={() => navigate('/app')} className="w-full">
              Go to ATMO
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">ATMO Onboarding</h1>
            <p className="text-sm text-white/70">{currentStep?.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {savedProgress && (
            <Badge variant="secondary" className="text-xs">
              <Save size={12} className="mr-1" />
              Saved
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContinueLater}
            className="text-white/70 hover:text-white"
          >
            Continue Later
          </Button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">Progress</span>
          <span className="text-sm text-white/70">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step Header */}
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className={`w-10 h-10 rounded-lg bg-${currentStep?.color}-400/20 flex items-center justify-center`}>
                {currentStep?.icon && React.createElement(currentStep.icon, {
                  size: 20,
                  className: `text-${currentStep.color}-400`
                })}
              </div>
            <div>
              <h3 className="text-white font-medium">{currentStep?.title}</h3>
              <p className="text-sm text-white/70">{currentStep?.description}</p>
            </div>
          </div>
          
          {/* Question */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white leading-relaxed">{currentQuestion?.text}</p>
                  {currentQuestion?.emotional && (
                    <div className="flex items-center gap-1 mt-2">
                      <Heart size={14} className="text-pink-400" />
                      <span className="text-xs text-pink-400">Personal insight</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Answer Input */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shrink-0">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  {renderQuestionInput()}
                </div>
              </div>
            </div>
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-white/70">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleSkipQuestion}
              className="text-white/70 hover:text-white"
            >
              Skip
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleContinueLater}
                className="text-white/70 hover:text-white"
              >
                <Home size={16} className="mr-2" />
                Continue Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationalOnboarding;
