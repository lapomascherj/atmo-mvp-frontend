import { OnboardingProgressService } from './onboardingProgressService';
import type { OnboardingMessage } from '@/models/OnboardingProgress';

/**
 * Service for managing intelligent onboarding flow in chat
 * The AI avatar knows what questions to ask and what data is still needed
 */
export class OnboardingFlowService {
  /**
   * Onboarding flow structure with all required data points
   */
  private static readonly ONBOARDING_FLOW = [
    {
      id: 'welcome',
      title: 'Welcome',
      questions: [
        {
          id: 'name',
          question: "Hi! I'm ATMO, your AI assistant. I'm excited to learn about you so I can provide personalized help. What should I call you?",
          field: 'name',
          required: true,
          followUp: "Great to meet you, {name}! Now, how old are you? This helps me understand your life stage and provide age-appropriate suggestions."
        }
      ]
    },
    {
      id: 'personal_basics',
      title: 'Personal Basics',
      questions: [
        {
          id: 'age',
          question: "How old are you? This helps me understand your life stage and provide age-appropriate suggestions.",
          field: 'age',
          required: true,
          followUp: "Perfect! Where are you based? This helps me understand your timezone and local context."
        },
        {
          id: 'location',
          question: "Where are you based? This helps me understand your timezone and local context.",
          field: 'location',
          required: true,
          followUp: "Thanks! Now, tell me a bit about yourself. What makes you unique? What are you passionate about?"
        },
        {
          id: 'bio',
          question: "Tell me a bit about yourself. What makes you unique? What are you passionate about?",
          field: 'bio',
          required: true,
          followUp: "Wonderful! Now let's talk about your work and career."
        }
      ]
    },
    {
      id: 'work_career',
      title: 'Work & Career',
      questions: [
        {
          id: 'job_title',
          question: "What's your current job title or role?",
          field: 'job_title',
          required: true,
          followUp: "Great! What company or organization do you work for?"
        },
        {
          id: 'company',
          question: "What company or organization do you work for?",
          field: 'company',
          required: true,
          followUp: "Excellent! What industry are you in?"
        },
        {
          id: 'industry',
          question: "What industry are you in?",
          field: 'industry',
          required: true,
          followUp: "Perfect! How many years of experience do you have in your field?"
        },
        {
          id: 'experience_level',
          question: "How many years of experience do you have in your field?",
          field: 'experience_level',
          required: true,
          followUp: "Great! Now let's talk about your goals and aspirations."
        }
      ]
    },
    {
      id: 'goals_aspirations',
      title: 'Goals & Aspirations',
      questions: [
        {
          id: 'short_term_goals',
          question: "What are your main goals for the next 3-6 months?",
          field: 'short_term_goals',
          required: true,
          followUp: "Excellent! What about your long-term goals? Where do you see yourself in 2-3 years?"
        },
        {
          id: 'long_term_goals',
          question: "What about your long-term goals? Where do you see yourself in 2-3 years?",
          field: 'long_term_goals',
          required: true,
          followUp: "Great vision! What are your main career goals?"
        },
        {
          id: 'career_goals',
          question: "What are your main career goals?",
          field: 'career_goals',
          required: true,
          followUp: "Perfect! What personal goals are important to you?"
        },
        {
          id: 'personal_goals',
          question: "What personal goals are important to you?",
          field: 'personal_goals',
          required: true,
          followUp: "Wonderful! Now let's talk about your preferences and work style."
        }
      ]
    },
    {
      id: 'preferences_style',
      title: 'Preferences & Style',
      questions: [
        {
          id: 'work_preferences',
          question: "How do you prefer to work? (e.g., independently, in teams, remote, office, etc.)",
          field: 'work_preferences',
          required: true,
          followUp: "Great! What's your preferred communication style?"
        },
        {
          id: 'communication_style',
          question: "What's your preferred communication style? (e.g., direct, detailed, encouraging, etc.)",
          field: 'communication_style',
          required: true,
          followUp: "Perfect! What's your ideal work environment like?"
        },
        {
          id: 'work_environment',
          question: "What's your ideal work environment like?",
          field: 'work_environment',
          required: true,
          followUp: "Excellent! Now let's talk about your habits and routines."
        }
      ]
    },
    {
      id: 'habits_routines',
      title: 'Habits & Routines',
      questions: [
        {
          id: 'daily_routines',
          question: "What does your typical day look like? What are your main routines?",
          field: 'daily_routines',
          required: true,
          followUp: "Great! What about your weekly routines?"
        },
        {
          id: 'weekly_routines',
          question: "What about your weekly routines? How do you structure your week?",
          field: 'weekly_routines',
          required: true,
          followUp: "Perfect! What habits are most important to you?"
        },
        {
          id: 'important_habits',
          question: "What habits are most important to you?",
          field: 'important_habits',
          required: true,
          followUp: "Excellent! Now let's talk about your wellness and health."
        }
      ]
    },
    {
      id: 'wellness_health',
      title: 'Wellness & Health',
      questions: [
        {
          id: 'sleep_pattern',
          question: "How would you describe your sleep pattern?",
          field: 'sleep_pattern',
          required: true,
          followUp: "Good to know! What about your exercise routine?"
        },
        {
          id: 'exercise_routine',
          question: "What about your exercise routine? How do you stay active?",
          field: 'exercise_routine',
          required: true,
          followUp: "Great! How do you manage stress?"
        },
        {
          id: 'stress_management',
          question: "How do you manage stress? What helps you relax?",
          field: 'stress_management',
          required: true,
          followUp: "Perfect! What are your wellness goals?"
        },
        {
          id: 'wellness_goals',
          question: "What are your wellness goals?",
          field: 'wellness_goals',
          required: true,
          followUp: "Excellent! Now let's talk about your learning and development."
        }
      ]
    },
    {
      id: 'learning_development',
      title: 'Learning & Development',
      questions: [
        {
          id: 'current_learning',
          question: "What are you currently learning or studying?",
          field: 'current_learning',
          required: true,
          followUp: "Great! What skills would you like to develop?"
        },
        {
          id: 'skills_to_develop',
          question: "What skills would you like to develop?",
          field: 'skills_to_develop',
          required: true,
          followUp: "Perfect! What learning resources do you prefer?"
        },
        {
          id: 'learning_resources',
          question: "What learning resources do you prefer? (e.g., books, courses, videos, etc.)",
          field: 'learning_resources',
          required: true,
          followUp: "Excellent! What's your learning style?"
        },
        {
          id: 'learning_style',
          question: "What's your learning style? (e.g., visual, hands-on, theoretical, etc.)",
          field: 'learning_style',
          required: true,
          followUp: "Perfect! Now let's talk about your current projects and work."
        }
      ]
    },
    {
      id: 'projects_work',
      title: 'Projects & Work',
      questions: [
        {
          id: 'current_projects',
          question: "What projects are you currently working on?",
          field: 'current_projects',
          required: true,
          followUp: "Great! What's your work environment like?"
        },
        {
          id: 'work_environment_details',
          question: "What's your work environment like?",
          field: 'work_environment_details',
          required: true,
          followUp: "Perfect! How do you prefer to collaborate with others?"
        },
        {
          id: 'collaboration_style',
          question: "How do you prefer to collaborate with others?",
          field: 'collaboration_style',
          required: true,
          followUp: "Excellent! Now let's talk about your personal interests."
        }
      ]
    },
    {
      id: 'personal_interests',
      title: 'Personal Interests',
      questions: [
        {
          id: 'hobbies',
          question: "What are your hobbies and interests?",
          field: 'hobbies',
          required: true,
          followUp: "Great! What values are most important to you?"
        },
        {
          id: 'values',
          question: "What values are most important to you?",
          field: 'values',
          required: true,
          followUp: "Perfect! What's your personal mission or purpose?"
        },
        {
          id: 'personal_mission',
          question: "What's your personal mission or purpose? What drives you?",
          field: 'personal_mission',
          required: true,
          followUp: "Wonderful! Now let's review everything together."
        }
      ]
    },
    {
      id: 'final_review',
      title: 'Final Review',
      questions: [
        {
          id: 'review',
          question: "Let's review your profile. Is there anything you'd like to add or change?",
          field: 'review',
          required: false,
          followUp: "Perfect! Your onboarding is now complete. Welcome to ATMO!"
        }
      ]
    }
  ];

  /**
   * Get the next question based on current progress
   */
  static getNextQuestion(currentStep: number, currentQuestion: number, onboardingData: Record<string, unknown>): {
    question: string;
    field: string;
    isComplete: boolean;
    progress: number;
  } | null {
    const totalSteps = this.ONBOARDING_FLOW.length;
    const totalQuestions = this.ONBOARDING_FLOW.reduce((sum, step) => sum + step.questions.length, 0);
    
    if (currentStep >= totalSteps) {
      return null; // Onboarding complete
    }

    const currentStepData = this.ONBOARDING_FLOW[currentStep];
    if (!currentStepData || currentQuestion >= currentStepData.questions.length) {
      // Move to next step
      const nextStep = currentStep + 1;
      if (nextStep >= totalSteps) {
        return null; // Onboarding complete
      }
      return this.getNextQuestion(nextStep, 0, onboardingData);
    }

    const questionData = currentStepData.questions[currentQuestion];
    const progress = Math.round(((currentStep * 10 + currentQuestion) / totalQuestions) * 100);

    return {
      question: questionData.question,
      field: questionData.field,
      isComplete: false,
      progress
    };
  }

  /**
   * Process user response and determine next action
   */
  static processUserResponse(
    userMessage: string,
    currentStep: number,
    currentQuestion: number,
    onboardingData: Record<string, unknown>
  ): {
    nextQuestion: string | null;
    field: string;
    shouldSave: boolean;
    isComplete: boolean;
    progress: number;
  } {
    const currentStepData = this.ONBOARDING_FLOW[currentStep];
    if (!currentStepData) {
      return {
        nextQuestion: null,
        field: '',
        shouldSave: false,
        isComplete: true,
        progress: 100
      };
    }

    const currentQuestionData = currentStepData.questions[currentQuestion];
    if (!currentQuestionData) {
      return {
        nextQuestion: null,
        field: '',
        shouldSave: false,
        isComplete: true,
        progress: 100
      };
    }

    // Save the user's response
    onboardingData[currentQuestionData.field] = userMessage;

    // Check if there's a follow-up question in the same step
    if (currentQuestion < currentStepData.questions.length - 1) {
      const nextQuestionData = currentStepData.questions[currentQuestion + 1];
      return {
        nextQuestion: nextQuestionData.question,
        field: nextQuestionData.field,
        shouldSave: true,
        isComplete: false,
        progress: Math.round(((currentStep * 10 + currentQuestion + 1) / this.getTotalQuestions()) * 100)
      };
    }

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep >= this.ONBOARDING_FLOW.length) {
      return {
        nextQuestion: null,
        field: '',
        shouldSave: true,
        isComplete: true,
        progress: 100
      };
    }

    const nextStepData = this.ONBOARDING_FLOW[nextStep];
    const nextQuestionData = nextStepData.questions[0];
    
    return {
      nextQuestion: nextQuestionData.question,
      field: nextQuestionData.field,
      shouldSave: true,
      isComplete: false,
      progress: Math.round(((nextStep * 10) / this.getTotalQuestions()) * 100)
    };
  }

  /**
   * Get total number of questions
   */
  private static getTotalQuestions(): number {
    return this.ONBOARDING_FLOW.reduce((sum, step) => sum + step.questions.length, 0);
  }

  /**
   * Get onboarding completion status
   */
  static getCompletionStatus(onboardingData: Record<string, unknown>): {
    isComplete: boolean;
    missingFields: string[];
    progress: number;
  } {
    const requiredFields = this.ONBOARDING_FLOW.flatMap(step => 
      step.questions.filter(q => q.required).map(q => q.field)
    );

    const missingFields = requiredFields.filter(field => !onboardingData[field]);
    const progress = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      progress
    };
  }

  /**
   * Generate intelligent follow-up based on user response
   */
  static generateFollowUp(
    userMessage: string,
    field: string,
    onboardingData: Record<string, unknown>
  ): string {
    // Simple pattern matching for now - can be enhanced with AI
    const lowerMessage = userMessage.toLowerCase();
    
    if (field === 'name') {
      return `Great to meet you, ${userMessage}! Now, how old are you? This helps me understand your life stage and provide age-appropriate suggestions.`;
    }
    
    if (field === 'age') {
      return `Perfect! Where are you based? This helps me understand your timezone and local context.`;
    }
    
    if (field === 'location') {
      return `Thanks! Now, tell me a bit about yourself. What makes you unique? What are you passionate about?`;
    }
    
    if (field === 'bio') {
      return `Wonderful! Now let's talk about your work and career. What's your current job title or role?`;
    }
    
    if (field === 'job_title') {
      return `Great! What company or organization do you work for?`;
    }
    
    if (field === 'company') {
      return `Excellent! What industry are you in?`;
    }
    
    if (field === 'industry') {
      return `Perfect! How many years of experience do you have in your field?`;
    }
    
    if (field === 'experience_level') {
      return `Great! Now let's talk about your goals and aspirations. What are your main goals for the next 3-6 months?`;
    }
    
    // Default follow-up
    return `Thanks for sharing that! Let me ask you about something else.`;
  }
}
