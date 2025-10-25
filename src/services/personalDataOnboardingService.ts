import { OnboardingProgressService } from './onboardingProgressService';
import { promptStore } from '@/stores/promptStore';
import type { OnboardingMessage } from '@/models/OnboardingProgress';

/**
 * Service for onboarding that systematically fills the Personal Data Card
 * Maps directly to PersonalDataCard components and ensures all data is saved
 */
export class PersonalDataOnboardingService {
  
  /**
   * Personal Data Card structure mapping
   * Each section corresponds to a section in PersonalDataCard.tsx
   */
  private static readonly PERSONAL_DATA_SECTIONS = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: 'User',
      fields: [
        { id: 'name', question: "Hi! I'm ATMO, your AI assistant. What should I call you?", required: true, followUp: "Great to meet you, {name}! How old are you?" },
        { id: 'age', question: "How old are you? This helps me understand your life stage.", required: true, followUp: "Perfect! Where are you based?" },
        { id: 'location', question: "Where are you based? This helps me understand your timezone and local context.", required: true, followUp: "Thanks! What languages do you speak?" },
        { id: 'languages', question: "What languages do you speak? (e.g., English, Spanish, French)", required: false, followUp: "Great! Tell me about your education background." },
        { id: 'education', question: "What's your educational background? (e.g., Bachelor's in Computer Science)", required: false, followUp: "Which university did you attend?" },
        { id: 'university', question: "Which university did you attend?", required: false, followUp: "What year did you graduate?" },
        { id: 'graduationYear', question: "What year did you graduate?", required: false, followUp: "Now let me learn about your work experience." },
        { id: 'bio', question: "Tell me a bit about yourself. What makes you unique? What are you passionate about?", required: true, followUp: "Wonderful! Now let's talk about your work." }
      ]
    },
    {
      id: 'work',
      title: 'Work Details',
      icon: 'Briefcase',
      fields: [
        { id: 'jobTitle', question: "What's your current job title or role?", required: true, followUp: "Great! What company do you work for?" },
        { id: 'company', question: "What company or organization do you work for?", required: true, followUp: "What industry are you in?" },
        { id: 'industry', question: "What industry are you in?", required: true, followUp: "How many years of experience do you have?" },
        { id: 'experienceLevel', question: "How many years of experience do you have in your field?", required: true, followUp: "What are your main skills?" },
        { id: 'skills', question: "What are your main skills? (e.g., JavaScript, Python, Project Management)", required: true, followUp: "Do you have any certifications?" },
        { id: 'certifications', question: "Do you have any professional certifications?", required: false, followUp: "How many hours do you typically work per week?" },
        { id: 'workHours', question: "How many hours do you typically work per week?", required: false, followUp: "How do you prefer to work?" },
        { id: 'workStyle', question: "How do you prefer to work? (e.g., remote, office, hybrid, independently, in teams)", required: true, followUp: "What's your communication style?" },
        { id: 'communicationStyle', question: "What's your preferred communication style? (e.g., direct, detailed, encouraging)", required: true, followUp: "How do you prefer to collaborate?" },
        { id: 'collaborationPreferences', question: "How do you prefer to collaborate with others?", required: true, followUp: "Now let's talk about your goals and aspirations." }
      ]
    },
    {
      id: 'goals',
      title: 'Goals & Aspirations',
      icon: 'Target',
      fields: [
        { id: 'careerGoals', question: "What are your main career goals? Where do you want to be in 5 years?", required: true, followUp: "What about your personal goals?" },
        { id: 'personalGoals', question: "What are your personal goals? What do you want to achieve in life?", required: true, followUp: "What learning goals do you have?" },
        { id: 'learningGoals', question: "What do you want to learn or improve? What skills do you want to develop?", required: true, followUp: "What about your financial goals?" },
        { id: 'financialGoals', question: "What are your financial goals? (e.g., salary targets, savings goals)", required: false, followUp: "What are your life goals?" },
        { id: 'lifeGoals', question: "What are your life goals? What do you want to accomplish?", required: true, followUp: "What are your short-term goals (next 3-6 months)?" },
        { id: 'shortTermGoals', question: "What are your short-term goals for the next 3-6 months?", required: true, followUp: "What are your long-term goals (2-3 years)?" },
        { id: 'longTermGoals', question: "What are your long-term goals for the next 2-3 years?", required: true, followUp: "Which goals are most important to you?" },
        { id: 'priorityGoals', question: "Which of your goals are most important to you right now?", required: true, followUp: "Now let's talk about your preferences and work style." }
      ]
    },
    {
      id: 'preferences',
      title: 'Preferences & Settings',
      icon: 'Settings',
      fields: [
        { id: 'workPreferences', question: "What are your work preferences? (e.g., morning person, flexible hours, specific tools)", required: true, followUp: "What's your ideal work environment?" },
        { id: 'workEnvironment', question: "What's your ideal work environment? (e.g., quiet office, open space, home office)", required: true, followUp: "How do you prefer to communicate?" },
        { id: 'communicationPreferences', question: "How do you prefer to communicate? (e.g., email, Slack, video calls, in-person)", required: true, followUp: "What are your learning preferences?" },
        { id: 'learningPreferences', question: "How do you prefer to learn? (e.g., hands-on, reading, videos, courses)", required: true, followUp: "What are your productivity preferences?" },
        { id: 'productivityPreferences', question: "What helps you stay productive? (e.g., specific tools, routines, environment)", required: true, followUp: "What are your wellness preferences?" },
        { id: 'wellnessPreferences', question: "What are your wellness preferences? (e.g., exercise, meditation, work-life balance)", required: true, followUp: "Now let's talk about your habits and routines." }
      ]
    },
    {
      id: 'habits',
      title: 'Habits & Routines',
      icon: 'Clock',
      fields: [
        { id: 'dailyRoutines', question: "What does your typical day look like? What are your main routines?", required: true, followUp: "What about your weekly routines?" },
        { id: 'weeklyRoutines', question: "What are your weekly routines? How do you structure your week?", required: true, followUp: "What habits are most important to you?" },
        { id: 'importantHabits', question: "What habits are most important to you? (e.g., exercise, reading, meditation)", required: true, followUp: "What are your sleep habits?" },
        { id: 'sleepHabits', question: "How would you describe your sleep pattern? (e.g., early bird, night owl, regular schedule)", required: true, followUp: "What about your exercise routine?" },
        { id: 'exerciseRoutine', question: "What's your exercise routine? How do you stay active?", required: true, followUp: "How do you manage stress?" },
        { id: 'stressManagement', question: "How do you manage stress? What helps you relax?", required: true, followUp: "What are your wellness goals?" },
        { id: 'wellnessGoals', question: "What are your wellness goals? (e.g., fitness, mental health, work-life balance)", required: true, followUp: "Now let's talk about your interests and passions." }
      ]
    },
    {
      id: 'interests',
      title: 'Interests & Passions',
      icon: 'Heart',
      fields: [
        { id: 'hobbies', question: "What are your hobbies and interests? What do you enjoy doing in your free time?", required: true, followUp: "What are your passions?" },
        { id: 'passions', question: "What are you passionate about? What drives you?", required: true, followUp: "What values are most important to you?" },
        { id: 'values', question: "What values are most important to you? (e.g., honesty, creativity, family, success)", required: true, followUp: "What's your personal mission?" },
        { id: 'personalMission', question: "What's your personal mission or purpose? What do you want to contribute to the world?", required: true, followUp: "What are your doubts and insecurities?" },
        { id: 'doubts', question: "What are your main doubts and insecurities? What challenges do you face?", required: true, followUp: "What are your current projects?" },
        { id: 'currentProjects', question: "What projects are you currently working on? (personal or professional)", required: true, followUp: "What are your learning interests?" },
        { id: 'learningInterests', question: "What are you currently learning or studying? What interests you?", required: true, followUp: "Perfect! Let me summarize what I've learned about you." }
      ]
    }
  ];

  /**
   * Initialize onboarding in chat
   */
  static async initializePersonalDataOnboarding(userId: string): Promise<boolean> {
    try {
      console.log('🎯 Initializing Personal Data Card onboarding');
      
      // Load existing progress
      const savedProgress = await OnboardingProgressService.loadProgress(userId);
      
      if (savedProgress && savedProgress.messages.length > 0) {
        console.log('📋 Resuming Personal Data Card onboarding');
        return this.resumePersonalDataOnboarding(userId, savedProgress);
      } else {
        console.log('🆕 Starting fresh Personal Data Card onboarding');
        return this.startFreshPersonalDataOnboarding();
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Personal Data Card onboarding:', error);
      return false;
    }
  }

  /**
   * Start fresh Personal Data Card onboarding
   */
  private static startFreshPersonalDataOnboarding(): boolean {
    try {
      console.log('🆕 Starting fresh Personal Data Card onboarding');
      
      // Clear any existing conversation
      promptStore.getState().clearPrompt();
      promptStore.getState().setConversationStarted(true);
      
      // Get the first question from Personal Data Card structure
      const firstQuestion = this.PERSONAL_DATA_SECTIONS[0].fields[0];
      promptStore.getState().addAvatarMessage(firstQuestion.question);
      
      console.log('✅ Fresh Personal Data Card onboarding started');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to start fresh Personal Data Card onboarding:', error);
      return false;
    }
  }

  /**
   * Resume Personal Data Card onboarding
   */
  private static resumePersonalDataOnboarding(userId: string, savedProgress: any): boolean {
    try {
      console.log('📋 Resuming Personal Data Card onboarding');
      
      // Restore conversation history
      const { setHistory, setConversationStarted } = promptStore.getState();
      const restoredMessages = savedProgress.messages.map((msg: any) => ({
        message: msg.content,
        sender: msg.type,
      }));
      setHistory(restoredMessages);
      setConversationStarted(true);
      
      // Determine next question based on progress
      const nextQuestion = this.getNextQuestionFromProgress(savedProgress);
      if (nextQuestion) {
        promptStore.getState().addAvatarMessage(nextQuestion);
      }
      
      console.log('✅ Personal Data Card onboarding resumed');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to resume Personal Data Card onboarding:', error);
      return false;
    }
  }

  /**
   * Get next question based on current progress
   */
  private static getNextQuestionFromProgress(savedProgress: any): string | null {
    const currentData = savedProgress.onboarding_data || {};
    
    // Find the first missing required field
    for (const section of this.PERSONAL_DATA_SECTIONS) {
      for (const field of section.fields) {
        if (field.required && !currentData[field.id]) {
          return field.question;
        }
      }
    }
    
    return null;
  }

  /**
   * Process user response and determine next question
   */
  static async processPersonalDataResponse(
    userId: string,
    userMessage: string,
    currentData: Record<string, unknown>
  ): Promise<{
    response: string;
    shouldContinue: boolean;
    isComplete: boolean;
    progress: number;
    updatedData: Record<string, unknown>;
  }> {
    try {
      console.log('🤖 Processing Personal Data Card response');
      
      // Determine which field this response is for
      const currentField = this.determineCurrentField(currentData);
      if (!currentField) {
        return {
          response: "I'm not sure which question you're answering. Could you tell me your name?",
          shouldContinue: true,
          isComplete: false,
          progress: 0,
          updatedData: currentData
        };
      }
      
      // Update data with user's response
      const updatedData = { ...currentData };
      updatedData[currentField.id] = userMessage;
      
      // Get next question
      const nextQuestion = this.getNextQuestion(updatedData);
      
      if (nextQuestion) {
        // Calculate progress
        const progress = this.calculateProgress(updatedData);
        
        return {
          response: nextQuestion,
          shouldContinue: true,
          isComplete: false,
          progress,
          updatedData
        };
      } else {
        // Onboarding complete
        return {
          response: this.getCompletionMessage(updatedData),
          shouldContinue: false,
          isComplete: true,
          progress: 100,
          updatedData
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to process Personal Data Card response:', error);
      return {
        response: "I'm having trouble processing your response. Could you tell me your name?",
        shouldContinue: true,
        isComplete: false,
        progress: 0,
        updatedData: currentData
      };
    }
  }

  /**
   * Determine which field the user is currently answering
   */
  private static determineCurrentField(currentData: Record<string, unknown>): any {
    // Find the first missing required field
    for (const section of this.PERSONAL_DATA_SECTIONS) {
      for (const field of section.fields) {
        if (field.required && !currentData[field.id]) {
          return field;
        }
      }
    }
    return null;
  }

  /**
   * Get next question based on current data
   */
  private static getNextQuestion(currentData: Record<string, unknown>): string | null {
    // Find the first missing required field
    for (const section of this.PERSONAL_DATA_SECTIONS) {
      for (const field of section.fields) {
        if (field.required && !currentData[field.id]) {
          return field.question;
        }
      }
    }
    return null;
  }

  /**
   * Calculate completion progress
   */
  private static calculateProgress(currentData: Record<string, unknown>): number {
    let totalRequiredFields = 0;
    let completedRequiredFields = 0;
    
    for (const section of this.PERSONAL_DATA_SECTIONS) {
      for (const field of section.fields) {
        if (field.required) {
          totalRequiredFields++;
          if (currentData[field.id]) {
            completedRequiredFields++;
          }
        }
      }
    }
    
    return Math.round((completedRequiredFields / totalRequiredFields) * 100);
  }

  /**
   * Get completion message
   */
  private static getCompletionMessage(currentData: Record<string, unknown>): string {
    const name = currentData.name || 'there';
    const jobTitle = currentData.jobTitle || 'professional';
    const company = currentData.company || 'your company';
    
    return `Perfect! Your Personal Data Card is now complete, ${name}! 🎉

I now have a comprehensive understanding of who you are, your goals, and how you work. This will help me provide you with personalized assistance and insights.

Here's what I learned about you:
• **Personal**: ${name}, ${currentData.age}, based in ${currentData.location}
• **Work**: ${jobTitle} at ${company} in ${currentData.industry}
• **Goals**: ${currentData.careerGoals} (career) and ${currentData.personalGoals} (personal)
• **Skills**: ${currentData.skills}
• **Interests**: ${currentData.hobbies}

Your Personal Data Card is now fully populated and will help me provide you with personalized assistance! What would you like to work on first?`;
  }

  /**
   * Save Personal Data Card progress
   */
  static async savePersonalDataProgress(
    userId: string,
    userMessage: string,
    aiResponse: string,
    updatedData: Record<string, unknown>
  ): Promise<void> {
    try {
      // Get current conversation history
      const currentHistory = promptStore.getState().history;
      
      // Convert to onboarding messages format
      const messages: OnboardingMessage[] = currentHistory.map((entry, index) => ({
        id: `msg_${Date.now()}_${index}`,
        type: entry.sender,
        content: entry.message,
        timestamp: new Date().toISOString()
      }));
      
      // Add current user message
      messages.push({
        id: `msg_${Date.now()}_user`,
        type: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      });
      
      // Add AI response
      messages.push({
        id: `msg_${Date.now()}_ai`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      // Calculate current step and progress
      const progress = this.calculateProgress(updatedData);
      const currentStep = Math.min(Math.floor(progress / 10), 10);
      const completedSteps = Array.from({ length: currentStep }, (_, i) => i);
      
      // Save progress
      await OnboardingProgressService.updateStep(
        userId,
        currentStep,
        completedSteps,
        updatedData,
        messages
      );
      
      console.log('✅ Personal Data Card progress saved');
      console.log(`📊 Progress: ${progress}%`);
      
    } catch (error) {
      console.error('❌ Failed to save Personal Data Card progress:', error);
    }
  }

  /**
   * Complete Personal Data Card onboarding
   */
  static async completePersonalDataOnboarding(userId: string): Promise<void> {
    try {
      await OnboardingProgressService.completeOnboarding(userId);
      console.log('✅ Personal Data Card onboarding completed');
    } catch (error) {
      console.error('❌ Failed to complete Personal Data Card onboarding:', error);
    }
  }
}
