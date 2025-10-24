import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Smile, 
  Frown, 
  Meh, 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  Target,
  Zap,
  Star,
  MessageCircle,
  Brain,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Progress } from '@/components/atoms/Progress';
import { cn } from '@/utils/utils';

interface EmotionalData {
  currentMood: string;
  energyLevel: number;
  stressLevel: number;
  motivation: number;
  satisfaction: number;
  feelings: string[];
  motivations: string[];
  challenges: string[];
  successes: string[];
  inspirations: string[];
  values: string[];
  personalMission: string;
  lifePhilosophy: string;
  emotionalTriggers: string[];
  copingStrategies: string[];
  supportNeeds: string[];
}

interface EmotionalDataCollectionProps {
  onDataCollected: (data: EmotionalData) => void;
  onSkip: () => void;
  className?: string;
}

export const EmotionalDataCollection: React.FC<EmotionalDataCollectionProps> = ({
  onDataCollected,
  onSkip,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [emotionalData, setEmotionalData] = useState<EmotionalData>({
    currentMood: '',
    energyLevel: 3,
    stressLevel: 3,
    motivation: 3,
    satisfaction: 3,
    feelings: [],
    motivations: [],
    challenges: [],
    successes: [],
    inspirations: [],
    values: [],
    personalMission: '',
    lifePhilosophy: '',
    emotionalTriggers: [],
    copingStrategies: [],
    supportNeeds: []
  });
  
  const emotionalSteps = [
    {
      id: 'mood_check',
      title: 'How are you feeling right now?',
      description: 'Let\'s start with your current emotional state',
      icon: Heart,
      color: 'red',
      questions: [
        {
          id: 'currentMood',
          text: 'What\'s your current mood?',
          type: 'select',
          options: ['Excited', 'Content', 'Neutral', 'Stressed', 'Overwhelmed', 'Motivated', 'Tired', 'Anxious'],
          emotional: true
        },
        {
          id: 'energyLevel',
          text: 'How would you rate your energy level?',
          type: 'rating',
          emotional: true
        },
        {
          id: 'stressLevel',
          text: 'How stressed do you feel?',
          type: 'rating',
          emotional: true
        }
      ]
    },
    {
      id: 'motivations',
      title: 'What motivates you?',
      description: 'Understanding your driving forces',
      icon: Target,
      color: 'orange',
      questions: [
        {
          id: 'motivations',
          text: 'What motivates you most in life?',
          type: 'multiselect',
          options: ['Achievement', 'Recognition', 'Learning', 'Helping others', 'Creativity', 'Security', 'Adventure', 'Family', 'Career growth', 'Personal growth'],
          emotional: true
        },
        {
          id: 'motivation',
          text: 'How motivated do you feel right now?',
          type: 'rating',
          emotional: true
        }
      ]
    },
    {
      id: 'feelings',
      title: 'Your emotional landscape',
      description: 'Exploring your feelings and emotions',
      icon: Smile,
      color: 'yellow',
      questions: [
        {
          id: 'feelings',
          text: 'What emotions do you experience most often?',
          type: 'multiselect',
          options: ['Joy', 'Excitement', 'Contentment', 'Anxiety', 'Frustration', 'Pride', 'Gratitude', 'Worry', 'Hope', 'Determination'],
          emotional: true
        },
        {
          id: 'satisfaction',
          text: 'How satisfied are you with your current life?',
          type: 'rating',
          emotional: true
        }
      ]
    },
    {
      id: 'challenges',
      title: 'Your challenges',
      description: 'Understanding what you\'re working through',
      icon: TrendingDown,
      color: 'red',
      questions: [
        {
          id: 'challenges',
          text: 'What are your biggest challenges right now?',
          type: 'multiselect',
          options: ['Time management', 'Work-life balance', 'Health', 'Relationships', 'Career', 'Financial', 'Learning', 'Motivation', 'Stress', 'Self-doubt'],
          emotional: true
        },
        {
          id: 'emotionalTriggers',
          text: 'What situations trigger strong emotions for you?',
          type: 'multiselect',
          options: ['Criticism', 'Deadlines', 'Conflict', 'Uncertainty', 'Failure', 'Success', 'Social situations', 'Change', 'Perfectionism', 'Comparison'],
          emotional: true
        }
      ]
    },
    {
      id: 'successes',
      title: 'Your successes',
      description: 'Celebrating what you\'ve achieved',
      icon: Star,
      color: 'green',
      questions: [
        {
          id: 'successes',
          text: 'What are you most proud of recently?',
          type: 'multiselect',
          options: ['Work achievement', 'Personal growth', 'Health improvement', 'Relationship', 'Learning', 'Creative project', 'Helping others', 'Overcoming challenge'],
          emotional: true
        }
      ]
    },
    {
      id: 'inspirations',
      title: 'What inspires you?',
      description: 'Finding your sources of inspiration',
      icon: Lightbulb,
      color: 'blue',
      questions: [
        {
          id: 'inspirations',
          text: 'What inspires you most?',
          type: 'multiselect',
          options: ['Nature', 'Art', 'Music', 'Books', 'People', 'Travel', 'Learning', 'Creativity', 'Service', 'Achievement'],
          emotional: true
        }
      ]
    },
    {
      id: 'values',
      title: 'Your core values',
      description: 'What matters most to you',
      icon: Heart,
      color: 'purple',
      questions: [
        {
          id: 'values',
          text: 'What values are most important to you?',
          type: 'multiselect',
          options: ['Family', 'Honesty', 'Creativity', 'Learning', 'Service', 'Adventure', 'Security', 'Freedom', 'Growth', 'Connection'],
          emotional: true
        },
        {
          id: 'personalMission',
          text: 'What\'s your personal mission or purpose?',
          type: 'textarea',
          emotional: true
        }
      ]
    },
    {
      id: 'coping',
      title: 'How you cope',
      description: 'Your emotional resilience strategies',
      icon: Zap,
      color: 'indigo',
      questions: [
        {
          id: 'copingStrategies',
          text: 'How do you typically cope with stress or difficult emotions?',
          type: 'multiselect',
          options: ['Exercise', 'Meditation', 'Music', 'Reading', 'Socializing', 'Nature', 'Hobbies', 'Journaling', 'Therapy', 'Breathing'],
          emotional: true
        },
        {
          id: 'supportNeeds',
          text: 'What kind of support do you need when you\'re struggling?',
          type: 'multiselect',
          options: ['Emotional support', 'Practical help', 'Space', 'Encouragement', 'Advice', 'Listening', 'Resources', 'Accountability'],
          emotional: true
        }
      ]
    }
  ];
  
  const currentStepData = emotionalSteps[currentStep];
  const progress = ((currentStep + 1) / emotionalSteps.length) * 100;
  
  const handleAnswer = (questionId: string, answer: any) => {
    setEmotionalData(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  const handleNext = () => {
    if (currentStep < emotionalSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onDataCollected(emotionalData);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const renderQuestion = (question: any) => {
    switch (question.type) {
      case 'select':
        return (
          <div className="space-y-2">
            {question.options?.map((option: string) => (
              <button
                key={option}
                onClick={() => handleAnswer(question.id, option)}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-colors",
                  emotionalData[question.id as keyof EmotionalData] === option
                    ? "border-blue-400 bg-blue-400/10 text-blue-300"
                    : "border-white/20 hover:border-white/40 hover:bg-white/5"
                )}
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
            {question.options?.map((option: string) => (
              <button
                key={option}
                onClick={() => {
                  const currentAnswers = emotionalData[question.id as keyof EmotionalData] as string[] || [];
                  const newAnswers = currentAnswers.includes(option)
                    ? currentAnswers.filter(a => a !== option)
                    : [...currentAnswers, option];
                  handleAnswer(question.id, newAnswers);
                }}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-colors",
                  (emotionalData[question.id as keyof EmotionalData] as string[] || []).includes(option)
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
                onClick={() => handleAnswer(question.id, rating)}
                className={cn(
                  "w-12 h-12 rounded-full border transition-colors flex items-center justify-center",
                  emotionalData[question.id as keyof EmotionalData] === rating
                    ? "border-blue-400 bg-blue-400/10 text-blue-300"
                    : "border-white/20 hover:border-white/40 hover:bg-white/5"
                )}
              >
                {rating}
              </button>
            ))}
          </div>
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder="Tell me more..."
            rows={4}
            className="w-full p-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
            value={emotionalData[question.id as keyof EmotionalData] as string || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Heart size={24} className="text-red-400" />
          <h2 className="text-2xl font-semibold text-white">Emotional Profile</h2>
        </div>
        <p className="text-white/70">
          Understanding your emotions helps me provide better support
        </p>
      </div>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Progress</span>
          <span className="text-sm text-white/70">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Current Step */}
      <Card className="border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${currentStepData.color}-400/20 flex items-center justify-center`}>
              <currentStepData.icon size={20} className={`text-${currentStepData.color}-400`} />
            </div>
            <div>
              <CardTitle className="text-white">{currentStepData.title}</CardTitle>
              <p className="text-white/70 text-sm">{currentStepData.description}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentStepData.questions.map((question, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{question.text}</span>
                {question.emotional && (
                  <Badge variant="secondary" className="bg-pink-400/20 text-pink-300 text-xs">
                    <Heart size={10} className="mr-1" />
                    Emotional
                  </Badge>
                )}
              </div>
              {renderQuestion(question)}
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="text-white/70 hover:text-white"
        >
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-white/70 hover:text-white"
          >
            Skip
          </Button>
          <Button
            onClick={handleNext}
            className="bg-blue-400 hover:bg-blue-500 text-white"
          >
            {currentStep === emotionalSteps.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmotionalDataCollection;
