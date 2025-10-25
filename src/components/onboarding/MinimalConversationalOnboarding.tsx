import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FolderOpen,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Progress } from '@/components/atoms/Progress';
import { Card, CardContent } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/utils/utils';
import { OnboardingProgressService } from '@/services/onboardingProgressService';
import type { OnboardingMessage } from '@/models/OnboardingProgress';

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

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
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

export const MinimalConversationalOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeOnboarding, user } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({} as OnboardingData);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
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
  }, [messages]);
  
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
  
  // Initialize with welcome message or restore progress
  useEffect(() => {
    const initializeOnboarding = async () => {
      const isContinue = new URLSearchParams(location.search).get('continue') === 'true';
      const isResume = new URLSearchParams(location.search).get('resume') === 'true';
      const stepParam = new URLSearchParams(location.search).get('step');
      
      console.log('🔄 MinimalConversationalOnboarding mounted, checking for saved progress...');
      console.log('🔗 URL parameters:', { isContinue, isResume, stepParam });
      
      if (!user?.id) {
        console.log('❌ No authenticated user, starting fresh');
        if (currentQuestion) {
          addMessage('ai', currentQuestion.text);
        }
        return;
      }
      
      try {
        // Try to load progress from Supabase
        const savedProgress = await OnboardingProgressService.loadProgress(user.id);
        
        if (savedProgress) {
          console.log('✅ Found saved progress in Supabase:', savedProgress);
          
          // Restore all state
          setOnboardingData(savedProgress.onboarding_data || {});
          setCurrentStepIndex(savedProgress.current_step || 0);
          setCurrentQuestionIndex(0); // Start from first question of the step
          
          // Restore messages
          if (savedProgress.messages && savedProgress.messages.length > 0) {
            const restoredMessages = savedProgress.messages.map(msg => ({
              id: msg.id,
              type: msg.type,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              isTyping: msg.isTyping
            }));
            setMessages(restoredMessages);
          }
          
          console.log('✅ Progress restored successfully from Supabase');
          return; // Don't add welcome message if we restored progress
        }
        
        // Fallback to localStorage for backward compatibility
        const localProgress = localStorage.getItem('atmo_onboarding_progress');
        if (localProgress) {
          try {
            const progressData = JSON.parse(localProgress);
            console.log('🔄 Restoring from localStorage:', progressData);
            
            if (progressData.data && Object.keys(progressData.data).length > 0) {
              setOnboardingData(progressData.data);
              setCurrentStepIndex(progressData.stepIndex || 0);
              setCurrentQuestionIndex(progressData.questionIndex || 0);
              if (progressData.messages && progressData.messages.length > 0) {
                setMessages(progressData.messages);
              }
              console.log('✅ Progress restored from localStorage');
              return;
            }
          } catch (error) {
            console.error('Failed to restore from localStorage:', error);
          }
        }
        
        // Start from specific step if provided
        if (stepParam) {
          const stepIndex = parseInt(stepParam) - 1; // Convert to 0-based index
          if (stepIndex >= 0 && stepIndex < conversationSteps.length) {
            setCurrentStepIndex(stepIndex);
            setCurrentQuestionIndex(0);
            console.log(`📍 Starting from step ${stepIndex + 1}`);
          }
        }
        
        // Initialize with welcome message if no saved progress
        console.log('🆕 No saved progress, starting fresh onboarding');
        setTimeout(() => {
          if (messages.length === 0 && currentQuestion) {
            addMessage('ai', currentQuestion.text);
          }
        }, 100);
        
      } catch (error) {
        console.error('Failed to initialize onboarding:', error);
        // Fallback to fresh start
        if (currentQuestion) {
          addMessage('ai', currentQuestion.text);
        }
      }
    };
    
    initializeOnboarding();
  }, [location.search, user?.id]); // Add user.id as dependency

  // Additional restoration effect to handle cases where initial restoration fails
  useEffect(() => {
    const savedProgress = localStorage.getItem('atmo_onboarding_progress');
    if (savedProgress && messages.length === 0 && currentStepIndex === 0) {
      try {
        const progressData = JSON.parse(savedProgress);
        if (progressData.data && Object.keys(progressData.data).length > 0) {
          console.log('🔄 Secondary restoration attempt...');
          setOnboardingData(progressData.data);
          setCurrentStepIndex(progressData.stepIndex || 0);
          setCurrentQuestionIndex(progressData.questionIndex || 0);
          if (progressData.messages && progressData.messages.length > 0) {
            setMessages(progressData.messages);
          }
        }
      } catch (error) {
        console.error('Failed secondary restoration:', error);
      }
    }
  }, [messages.length, currentStepIndex]);
  
  // Additional effect to handle restoration after state updates
  useEffect(() => {
    if (currentStepIndex > 0 && messages.length > 0) {
      console.log('🎯 Onboarding state updated:', {
        step: currentStepIndex,
        question: currentQuestionIndex,
        messages: messages.length,
        data: Object.keys(onboardingData).length
      });
    }
  }, [currentStepIndex, currentQuestionIndex, messages.length, Object.keys(onboardingData).length]);

  // Force restoration if we have saved progress but no messages
  useEffect(() => {
    const savedProgress = localStorage.getItem('atmo_onboarding_progress');
    if (savedProgress && messages.length === 0) {
      try {
        const progressData = JSON.parse(savedProgress);
        if (progressData.messages && progressData.messages.length > 0) {
          console.log('🔄 Force restoring messages from saved progress');
          setMessages(progressData.messages);
        }
      } catch (error) {
        console.error('Failed to force restore progress:', error);
      }
    }
  }, [messages.length]);
  
  const addMessage = (type: 'ai' | 'user', content: string, isTyping = false) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isTyping
    };
    setMessages(prev => [...prev, message]);
    
    // Save message to Supabase if user is authenticated
    if (user?.id) {
      const onboardingMessage: OnboardingMessage = {
        id: message.id,
        type: message.type,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        isTyping: message.isTyping
      };
      
      // Save progress asynchronously
      saveProgressToSupabase(onboardingMessage);
    }
  };
  
  const saveProgressToSupabase = async (newMessage?: OnboardingMessage) => {
    if (!user?.id) return;
    
    try {
      const completedSteps = Array.from({ length: currentStepIndex }, (_, i) => i);
      const onboardingMessages: OnboardingMessage[] = messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        isTyping: msg.isTyping
      }));
      
      if (newMessage) {
        onboardingMessages.push(newMessage);
      }
      
      await OnboardingProgressService.updateStep(
        user.id,
        currentStepIndex,
        completedSteps,
        onboardingData,
        onboardingMessages
      );
      
      console.log('✅ Progress saved to Supabase');
    } catch (error) {
      console.error('Failed to save progress to Supabase:', error);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentQuestion) return;
    
    // Add user message
    addMessage('user', inputValue.trim());
    
    // Update data
    const updatedData = {
      ...onboardingData,
      [currentQuestion.id]: inputValue.trim()
    };
    setOnboardingData(updatedData);
    
    // Clear input
    setInputValue('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate AI response delay
    setTimeout(async () => {
      setIsTyping(false);
      
      // Move to next question or step
      if (currentQuestionIndex < currentStep.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        const nextQuestion = currentStep.questions[currentQuestionIndex + 1];
        addMessage('ai', nextQuestion.text);
      } else if (currentStepIndex < conversationSteps.length - 1) {
        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);
        setCurrentQuestionIndex(0);
        const nextStep = conversationSteps[nextStepIndex];
        const nextQuestion = nextStep.questions[0];
        addMessage('ai', nextQuestion.text);
        
        // Save progress after completing a step
        if (user?.id) {
          try {
            const completedSteps = Array.from({ length: nextStepIndex }, (_, i) => i);
            const onboardingMessages: OnboardingMessage[] = messages.map(msg => ({
              id: msg.id,
              type: msg.type,
              content: msg.content,
              timestamp: msg.timestamp.toISOString(),
              isTyping: msg.isTyping
            }));
            
            await OnboardingProgressService.updateStep(
              user.id,
              nextStepIndex,
              completedSteps,
              updatedData,
              onboardingMessages
            );
            
            console.log('✅ Step completed and saved to Supabase');
          } catch (error) {
            console.error('Failed to save step completion:', error);
          }
        }
      } else {
        // Complete onboarding
        handleComplete();
      }
    }, 1000);
  };
  
  const handleComplete = async () => {
    try {
      await completeOnboarding(onboardingData);
      
      // Clear saved progress on completion
      localStorage.removeItem('atmo_onboarding_progress');
      
      // Clear Supabase progress
      if (user?.id) {
        try {
          await OnboardingProgressService.completeOnboarding(user.id);
          console.log('✅ Onboarding progress cleared from Supabase');
        } catch (error) {
          console.error('Failed to clear Supabase progress:', error);
        }
      }
      
      navigate('/app');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };
  
  const handleContinueLater = async () => {
    try {
      // Save current progress to localStorage (for backward compatibility)
      const progressData = {
        data: onboardingData,
        stepIndex: currentStepIndex,
        questionIndex: currentQuestionIndex,
        messages: messages,
        timestamp: new Date().toISOString(),
        isPartialOnboarding: true,
        completionPercentage: progress
      };
      localStorage.setItem('atmo_onboarding_progress', JSON.stringify(progressData));
      
      // Save progress to Supabase
      if (user?.id) {
        try {
          const completedSteps = Array.from({ length: currentStepIndex }, (_, i) => i);
          const onboardingMessages: OnboardingMessage[] = messages.map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            isTyping: msg.isTyping
          }));
          
          await OnboardingProgressService.updateStep(
            user.id,
            currentStepIndex,
            completedSteps,
            onboardingData,
            onboardingMessages
          );
          
          console.log('✅ Progress saved to Supabase for continuation');
        } catch (error) {
          console.error('Failed to save progress to Supabase:', error);
        }
      }
      
      // Save partial data to user profile
      if (Object.keys(onboardingData).length > 0) {
        await completeOnboarding({
          ...onboardingData,
          onboarding_completed: false,
          onboarding_partial: true,
          onboarding_progress: progress,
          onboarding_step: currentStepIndex,
          onboarding_continue_later: true,
          last_updated: new Date().toISOString()
        });
      }
      
      // Show confirmation and redirect
      setShowContinueLater(true);
      setTimeout(() => {
        navigate('/app');
      }, 1500);
    } catch (error) {
      console.error('Failed to save progress:', error);
      // Still redirect even if save fails
      setShowContinueLater(true);
      setTimeout(() => {
        navigate('/app');
      }, 1500);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getStepIcon = (stepIndex: number) => {
    const icons = [
      MessageCircle, User, Briefcase, Target, Settings, 
      Clock, Heart, BookOpen, FolderOpen, Star, CheckCircle
    ];
    return icons[stepIndex] || MessageCircle;
  };
  
  const getStepColor = (stepIndex: number) => {
    const colors = [
      'blue', 'purple', 'green', 'orange', 'indigo',
      'teal', 'red', 'yellow', 'cyan', 'pink', 'green'
    ];
    return colors[stepIndex] || 'blue';
  };
  
  if (showContinueLater) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Progress Saved!</h2>
            <p className="text-gray-600 mb-6">
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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Main Chat Area - Centered */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto">
        {/* Chat Header - Centered */}
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ATMO Onboarding</h1>
          <p className="text-white/70">{currentStep?.title}</p>
        </div>
        
        {/* Messages Area - Centered with floating animation */}
        <div className="flex-1 overflow-y-auto px-8 space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-in slide-in-from-bottom-4 duration-500",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  "max-w-md px-6 py-4 rounded-3xl shadow-lg",
                  message.type === 'user'
                    ? "bg-orange-500 text-white"
                    : "bg-white/10 backdrop-blur-sm text-white border border-white/20"
                )}
              >
                {message.isTyping ? (
                  <div className="flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 max-w-md px-6 py-4 rounded-3xl shadow-lg">
                <div className="flex items-center gap-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input - Fixed at bottom center */}
        <div className="p-8">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                className="flex-1 bg-transparent border-none text-white placeholder-white/60 focus:ring-0 focus:outline-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Card - Separate floating card */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 w-80 max-h-[80vh] overflow-y-auto">
        <Card className="bg-slate-800/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl">
          <CardContent className="p-6 space-y-6">
            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Progress</h3>
                <span className="text-sm text-orange-400 font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-slate-700">
                <div className="h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </Progress>
              
              <div className="text-sm text-white/70">
                Step {currentStepIndex + 1} of {conversationSteps.length}
              </div>
            </div>
            
            {/* Current Focus Card */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-xl bg-${getStepColor(currentStepIndex)}-500/20 flex items-center justify-center`}>
                  {React.createElement(getStepIcon(currentStepIndex), {
                    size: 16,
                    className: `text-${getStepColor(currentStepIndex)}-400`
                  })}
                </div>
                <span className="text-sm font-semibold text-white">Current Focus</span>
              </div>
              <p className="text-sm text-white/90 font-medium">{currentStep?.title}</p>
              <p className="text-xs text-white/60 mt-1">{currentStep?.description}</p>
            </div>
            
            {/* Steps List */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Steps</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {conversationSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-200",
                      index === currentStepIndex
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        : index < currentStepIndex
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-white/5 text-white/60 border border-white/10"
                    )}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center">
                      {index < currentStepIndex ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          index === currentStepIndex ? "bg-orange-400" : "bg-white/40"
                        )} />
                      )}
                    </div>
                    <span className="truncate font-medium">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Continue Later Button */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Continue Later</p>
                  <p className="text-xs text-white/60">Save progress and resume anytime</p>
                </div>
                <Button
                  onClick={handleContinueLater}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <Save size={16} />
                </Button>
              </div>
            </div>
            
            {/* Auto-save indicator */}
            {savedProgress && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle size={14} />
                <span className="font-medium">Auto-saved</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MinimalConversationalOnboarding;
