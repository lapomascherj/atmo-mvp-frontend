import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Heart, 
  TrendingUp, 
  Zap,
  MessageCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/utils/utils';

interface AIQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'rating' | 'textarea';
  options?: string[];
  followUp?: string;
  emotional?: boolean;
  category: 'personal' | 'work' | 'goals' | 'wellness' | 'learning' | 'interests';
  priority: 'high' | 'medium' | 'low';
  insights?: string[];
}

interface AIDrivenQuestionsProps {
  userResponses: Record<string, any>;
  onQuestionGenerated: (question: AIQuestion) => void;
  onResponseReceived: (questionId: string, response: any) => void;
  className?: string;
}

export const AIDrivenQuestions: React.FC<AIDrivenQuestionsProps> = ({
  userResponses,
  onQuestionGenerated,
  onResponseReceived,
  className
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<AIQuestion[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  
  // AI Question Generation Logic
  const generateQuestion = (responses: Record<string, any>): AIQuestion => {
    const responseKeys = Object.keys(resesponses);
    const lastResponse = responseKeys[responseKeys.length - 1];
    const lastValue = responses[lastResponse];
    
    // Analyze patterns and generate contextual questions
    if (lastResponse === 'jobTitle' && lastValue) {
      return {
        id: 'work_environment',
        text: `Since you're a ${lastValue}, what kind of work environment helps you be most productive?`,
        type: 'select',
        options: ['Remote', 'Office', 'Hybrid', 'Co-working', 'Home office', 'Flexible'],
        category: 'work',
        priority: 'high',
        insights: ['Work environment preferences', 'Productivity optimization']
      };
    }
    
    if (lastResponse === 'experienceLevel' && lastValue === 'Entry Level') {
      return {
        id: 'mentorship_interest',
        text: 'As someone starting their career, would you be interested in mentorship opportunities?',
        type: 'select',
        options: ['Yes, actively seeking', 'Yes, if available', 'Maybe later', 'Not interested'],
        category: 'learning',
        priority: 'high',
        insights: ['Career development', 'Learning preferences']
      };
    }
    
    if (lastResponse === 'goals' && lastValue && lastValue.length > 0) {
      return {
        id: 'goal_obstacles',
        text: 'What do you think might be the biggest obstacles to achieving these goals?',
        type: 'multiselect',
        options: ['Time management', 'Lack of skills', 'Resources', 'Motivation', 'Support system', 'Health', 'Financial'],
        category: 'goals',
        priority: 'high',
        emotional: true,
        insights: ['Goal achievement strategies', 'Support needs']
      };
    }
    
    if (lastResponse === 'stressManagement' && lastValue) {
      return {
        id: 'stress_triggers',
        text: 'What typically triggers stress for you? Understanding this helps me provide better support.',
        type: 'multiselect',
        options: ['Work deadlines', 'Social situations', 'Health concerns', 'Financial pressure', 'Relationships', 'Uncertainty', 'Perfectionism'],
        category: 'wellness',
        priority: 'medium',
        emotional: true,
        insights: ['Stress management', 'Wellness optimization']
      };
    }
    
    if (lastResponse === 'hobbies' && lastValue && lastValue.length > 0) {
      return {
        id: 'hobby_development',
        text: 'Which of your hobbies would you like to develop further or turn into something more?',
        type: 'select',
        options: lastValue.concat(['None', 'Something new']),
        category: 'interests',
        priority: 'medium',
        insights: ['Personal development', 'Life balance']
      };
    }
    
    // Default question based on completion level
    const completionLevel = Object.keys(responses).length;
    
    if (completionLevel < 5) {
      return {
        id: 'work_life_balance',
        text: 'How do you currently balance work and personal life?',
        type: 'select',
        options: ['Struggling', 'Managing okay', 'Good balance', 'Excellent balance', 'Work-focused', 'Life-focused'],
        category: 'personal',
        priority: 'high',
        insights: ['Work-life balance', 'Time management']
      };
    }
    
    if (completionLevel < 10) {
      return {
        id: 'learning_style',
        text: 'When you learn something new, what helps you retain it best?',
        type: 'multiselect',
        options: ['Hands-on practice', 'Reading', 'Videos', 'Teaching others', 'Discussion', 'Repetition', 'Real-world application'],
        category: 'learning',
        priority: 'medium',
        insights: ['Learning optimization', 'Skill development']
      };
    }
    
    // Deep dive questions
    return {
      id: 'personal_values',
      text: 'What values are most important to you in life? This helps me understand what drives you.',
      type: 'multiselect',
      options: ['Family', 'Career success', 'Health', 'Learning', 'Creativity', 'Service to others', 'Adventure', 'Security', 'Freedom', 'Recognition'],
      category: 'personal',
      priority: 'high',
      emotional: true,
      insights: ['Core values', 'Decision-making framework']
    };
  };
  
  // Generate insights from responses
  const generateInsights = (responses: Record<string, any>): string[] => {
    const insights: string[] = [];
    
    // Analyze work preferences
    if (responses.workStyle && responses.experienceLevel) {
      insights.push(`You're a ${responses.experienceLevel.toLowerCase()} professional who prefers ${responses.workStyle.toLowerCase()} work`);
    }
    
    // Analyze goals
    if (responses.goals && responses.goals.length > 0) {
      insights.push(`You have ${responses.goals.length} active goals across different areas`);
    }
    
    // Analyze wellness
    if (responses.stressManagement && responses.stressManagement.length > 0) {
      insights.push(`You use ${responses.stressManagement.length} different stress management strategies`);
    }
    
    // Analyze learning
    if (responses.currentLearning && responses.currentLearning.length > 0) {
      insights.push(`You're actively learning ${responses.currentLearning.length} different topics`);
    }
    
    return insights;
  };
  
  // Generate next question when responses change
  useEffect(() => {
    if (Object.keys(userResponses).length > 0) {
      setIsGenerating(true);
      
      // Simulate AI processing time
      setTimeout(() => {
        const newQuestion = generateQuestion(userResponses);
        const newInsights = generateInsights(userResponses);
        
        setCurrentQuestion(newQuestion);
        setInsights(newInsights);
        setQuestionHistory(prev => [...prev, newQuestion]);
        onQuestionGenerated(newQuestion);
        
        setIsGenerating(false);
      }, 1500);
    }
  }, [userResponses]);
  
  const handleResponse = (response: any) => {
    if (currentQuestion) {
      onResponseReceived(currentQuestion.id, response);
      setCurrentQuestion(null);
    }
  };
  
  const getCategoryIcon = (category: string) => {
    const icons = {
      personal: Heart,
      work: Target,
      goals: TrendingUp,
      wellness: Heart,
      learning: Brain,
      interests: Sparkles
    };
    return icons[category as keyof typeof icons] || MessageCircle;
  };
  
  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'purple',
      work: 'blue',
      goals: 'orange',
      wellness: 'red',
      learning: 'yellow',
      interests: 'pink'
    };
    return colors[category as keyof typeof colors] || 'blue';
  };
  
  if (!currentQuestion && !isGenerating) return null;
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-blue-400" />
              <span className="text-white font-medium">AI Insights</span>
            </div>
            <div className="space-y-1">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-white/70">
                  <Lightbulb size={12} className="text-yellow-400" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Current Question */}
      {currentQuestion && (
        <Card className="border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-lg bg-${getCategoryColor(currentQuestion.category)}-400/20 flex items-center justify-center`}>
                {React.createElement(getCategoryIcon(currentQuestion.category), {
                  size: 16,
                  className: `text-${getCategoryColor(currentQuestion.category)}-400`
                })}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">AI Question</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      currentQuestion.priority === 'high' ? "bg-red-400/20 text-red-300" :
                      currentQuestion.priority === 'medium' ? "bg-yellow-400/20 text-yellow-300" :
                      "bg-green-400/20 text-green-300"
                    )}
                  >
                    {currentQuestion.priority} priority
                  </Badge>
                </div>
                {currentQuestion.insights && (
                  <p className="text-xs text-white/70">
                    {currentQuestion.insights.join(' • ')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-white leading-relaxed">{currentQuestion.text}</p>
              
              {currentQuestion.emotional && (
                <div className="flex items-center gap-2 text-pink-400 text-sm">
                  <Heart size={14} />
                  <span>Personal insight question</span>
                </div>
              )}
              
              {/* Question Input */}
              <div className="space-y-2">
                {currentQuestion.type === 'select' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleResponse(option)}
                        className="w-full p-3 text-left rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                
                {currentQuestion.type === 'multiselect' && (
                  <div className="space-y-2">
                    <p className="text-sm text-white/70">Select all that apply:</p>
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleResponse(option)}
                        className="w-full p-3 text-left rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                
                {currentQuestion.type === 'rating' && (
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleResponse(rating)}
                        className="w-12 h-12 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors flex items-center justify-center"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Generating Question */}
      {isGenerating && (
        <Card className="border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">AI is thinking...</p>
                <p className="text-sm text-white/70">Generating personalized question</p>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIDrivenQuestions;
