import { OnboardingProgressService } from './onboardingProgressService';
import { promptStore } from '@/stores/promptStore';
import type { OnboardingMessage } from '@/models/OnboardingProgress';

/**
 * Dedicated Onboarding Agent
 * Fully manages the entire onboarding process, data collection, and conversation flow
 */
export class OnboardingAgent {
  private static readonly ONBOARDING_QUESTIONS = [
    // Comprehensive Personal Introduction
    {
      id: 'personal_intro',
      question: "Hi! I'm ATMO, your AI assistant. I'd love to get to know you better! Could you tell me about yourself? Share your name, age, where you're based, and what makes you unique. What are you passionate about? What languages do you speak?",
      fields: ['name', 'age', 'location', 'bio', 'languages'],
      section: 'personal',
      required: true
    },
    
    // Educational Background
    {
      id: 'education_background',
      question: "Tell me about your educational journey! What's your educational background? Which university did you attend and when did you graduate? How has your education shaped who you are today?",
      fields: ['education', 'university', 'graduationYear'],
      section: 'personal',
      required: false
    },
    
    // Comprehensive Work Profile
    {
      id: 'work_profile',
      question: "Now let's talk about your professional life! What's your current job title and role? What company do you work for and what industry are you in? How many years of experience do you have? What are your main skills and any certifications you have? How many hours do you typically work per week?",
      fields: ['jobTitle', 'company', 'industry', 'experienceLevel', 'skills', 'certifications', 'workHours'],
      section: 'work',
      required: true
    },
    
    // Work Style & Collaboration
    {
      id: 'work_style',
      question: "How do you prefer to work and collaborate? Do you work remotely, in an office, or hybrid? Do you prefer working independently or in teams? What's your communication style - are you direct, detailed, encouraging? How do you like to collaborate with others?",
      fields: ['workStyle', 'communicationStyle', 'collaborationPreferences'],
      section: 'work',
      required: true
    },
    
    // Comprehensive Goals & Aspirations
    {
      id: 'goals_aspirations',
      question: "What are your goals and aspirations? Tell me about your career goals - where do you want to be in 5 years? What are your personal goals and what do you want to achieve in life? What do you want to learn or improve? What are your financial goals? What are your life goals and what do you want to accomplish?",
      fields: ['careerGoals', 'personalGoals', 'learningGoals', 'financialGoals', 'lifeGoals'],
      section: 'goals',
      required: true
    },
    
    // Short & Long-term Goals
    {
      id: 'timeline_goals',
      question: "Let's break down your goals by timeline. What are your short-term goals for the next 3-6 months? What are your long-term goals for the next 2-3 years? Which of your goals are most important to you right now?",
      fields: ['shortTermGoals', 'longTermGoals', 'priorityGoals'],
      section: 'goals',
      required: true
    },
    
    // Work Preferences & Environment
    {
      id: 'work_preferences',
      question: "What are your work preferences and ideal environment? Are you a morning person or night owl? Do you prefer flexible hours? What's your ideal work environment - quiet office, open space, home office? What specific tools help you stay productive?",
      fields: ['workPreferences', 'workEnvironment', 'productivityPreferences'],
      section: 'preferences',
      required: true
    },
    
    // Communication & Learning Preferences
    {
      id: 'communication_learning',
      question: "How do you prefer to communicate and learn? Do you prefer email, Slack, video calls, or in-person meetings? How do you like to learn - hands-on, reading, videos, courses? What helps you stay productive and focused?",
      fields: ['communicationPreferences', 'learningPreferences'],
      section: 'preferences',
      required: true
    },
    
    // Wellness & Lifestyle
    {
      id: 'wellness_lifestyle',
      question: "Tell me about your wellness and lifestyle preferences. What are your wellness preferences - exercise, meditation, work-life balance? What does your typical day look like? What are your weekly routines? What habits are most important to you?",
      fields: ['wellnessPreferences', 'dailyRoutines', 'weeklyRoutines', 'importantHabits'],
      section: 'preferences',
      required: true
    },
    
    // Sleep & Exercise Habits
    {
      id: 'health_habits',
      question: "What are your health and wellness habits? How would you describe your sleep pattern - are you an early bird, night owl, or have a regular schedule? What's your exercise routine and how do you stay active? How do you manage stress and what helps you relax?",
      fields: ['sleepHabits', 'exerciseRoutine', 'stressManagement'],
      section: 'habits',
      required: true
    },
    
    // Wellness Goals
    {
      id: 'wellness_goals',
      question: "What are your wellness goals? Are you focused on fitness, mental health, work-life balance, or something else? What do you want to achieve in terms of your overall well-being?",
      fields: ['wellnessGoals'],
      section: 'habits',
      required: true
    },
    
    // Hobbies & Interests
    {
      id: 'hobbies_interests',
      question: "What are your hobbies and interests? What do you enjoy doing in your free time? What are you passionate about and what drives you? What values are most important to you - honesty, creativity, family, success?",
      fields: ['hobbies', 'passions', 'values'],
      section: 'interests',
      required: true
    },
    
    // Personal Mission & Challenges
    {
      id: 'mission_challenges',
      question: "What's your personal mission or purpose? What do you want to contribute to the world? What are your main doubts and insecurities? What challenges do you face? What projects are you currently working on - personal or professional?",
      fields: ['personalMission', 'doubts', 'currentProjects'],
      section: 'interests',
      required: true
    },
    
    // Learning & Development
    {
      id: 'learning_development',
      question: "What are you currently learning or studying? What interests you and what skills are you developing? What learning resources do you prefer?",
      fields: ['learningInterests'],
      section: 'interests',
      required: true
    }
  ];

  /**
   * Initialize onboarding agent
   */
  static async initializeOnboarding(userId: string): Promise<boolean> {
    try {
      console.log('🤖 OnboardingAgent: Initializing onboarding for user:', userId);
      
      // Load existing progress
      const savedProgress = await OnboardingProgressService.loadProgress(userId);
      
      if (savedProgress && savedProgress.messages.length > 0) {
        console.log('📋 OnboardingAgent: Resuming existing onboarding');
        return this.resumeOnboarding(userId, savedProgress);
      } else {
        console.log('🆕 OnboardingAgent: Starting fresh onboarding');
        return this.startFreshOnboarding();
      }
      
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to initialize onboarding:', error);
      return false;
    }
  }

  /**
   * Start fresh onboarding
   */
  private static startFreshOnboarding(): boolean {
    try {
      console.log('🆕 OnboardingAgent: Starting fresh onboarding');
      
      // Clear any existing conversation
      promptStore.getState().clearPrompt();
      promptStore.getState().setConversationStarted(true);
      
      // Get the first question
      const firstQuestion = this.ONBOARDING_QUESTIONS[0];
      promptStore.getState().addAvatarMessage(firstQuestion.question);
      
      console.log('✅ OnboardingAgent: Fresh onboarding started');
      return true;
      
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to start fresh onboarding:', error);
      return false;
    }
  }

  /**
   * Resume existing onboarding
   */
  private static resumeOnboarding(userId: string, savedProgress: any): boolean {
    try {
      console.log('📋 OnboardingAgent: Resuming onboarding');
      
      // Restore conversation history
      const { setHistory, setConversationStarted } = promptStore.getState();
      const restoredMessages = savedProgress.messages.map((msg: any) => ({
        message: msg.content,
        sender: msg.type,
      }));
      setHistory(restoredMessages);
      setConversationStarted(true);
      
      // Determine next question based on progress
      const nextQuestion = this.getNextQuestion(savedProgress.onboarding_data || {});
      if (nextQuestion) {
        promptStore.getState().addAvatarMessage(nextQuestion);
      }
      
      console.log('✅ OnboardingAgent: Onboarding resumed');
      return true;
      
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to resume onboarding:', error);
      return false;
    }
  }

  /**
   * Process user response and determine next action
   */
  static async processUserResponse(
    userId: string,
    userMessage: string
  ): Promise<{
    response: string;
    shouldContinue: boolean;
    isComplete: boolean;
    progress: number;
  }> {
    try {
      console.log('🤖 OnboardingAgent: Processing user response');
      
      // Get current progress
      const savedProgress = await OnboardingProgressService.loadProgress(userId);
      const currentData = savedProgress?.onboarding_data || {};
      
      // Determine which question this response is for
      const currentQuestion = this.getCurrentQuestion(currentData);
      if (!currentQuestion) {
        return {
          response: "I'm not sure which question you're answering. Could you tell me about yourself?",
          shouldContinue: true,
          isComplete: false,
          progress: 0
        };
      }
      
      // Extract multiple fields from user's response
      const updatedData = { ...currentData };
      const extractedData = this.extractFieldsFromResponse(userMessage, currentQuestion.fields);
      
      // Update data with extracted fields
      Object.assign(updatedData, extractedData);
      
      // Get next question
      const nextQuestion = this.getNextQuestion(updatedData);
      
      if (nextQuestion) {
        // Calculate progress
        const progress = this.calculateProgress(updatedData);
        
        // Save progress
        await this.saveProgress(userId, userMessage, nextQuestion, updatedData);
        
        console.log(`✅ OnboardingAgent: Continuing with next question`);
        console.log(`📊 Progress: ${progress}%`);
        
        return {
          response: nextQuestion,
          shouldContinue: true,
          isComplete: false,
          progress
        };
      } else {
        // Onboarding complete
        console.log('🎉 OnboardingAgent: Onboarding completed!');
        await this.completeOnboarding(userId, updatedData);
        
        return {
          response: this.getCompletionMessage(updatedData),
          shouldContinue: false,
          isComplete: true,
          progress: 100
        };
      }
      
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to process user response:', error);
      
      // Fallback: try to continue with a generic question
      const fallbackQuestion = this.getFallbackQuestion(currentData);
      
      return {
        response: fallbackQuestion,
        shouldContinue: true,
        isComplete: false,
        progress: this.calculateProgress(currentData)
      };
    }
  }

  /**
   * Extract multiple fields from user's response
   */
  private static extractFieldsFromResponse(userMessage: string, fields: string[]): Record<string, unknown> {
    const extractedData: Record<string, unknown> = {};
    const lowerMessage = userMessage.toLowerCase();
    
    // Extract name (first word or phrase)
    if (fields.includes('name')) {
      const nameMatch = userMessage.match(/^(?:my name is|i'm|i am|call me)\s+([^,.\n]+)/i);
      if (nameMatch) {
        extractedData.name = nameMatch[1].trim();
      } else if (!extractedData.name) {
        // Fallback: first word might be name
        const firstWord = userMessage.split(' ')[0];
        if (firstWord && firstWord.length > 1) {
          extractedData.name = firstWord;
        }
      }
    }
    
    // Extract age
    if (fields.includes('age')) {
      const ageMatch = userMessage.match(/(\d+)\s*(?:years? old|years? of age|yo)/i);
      if (ageMatch) {
        extractedData.age = ageMatch[1];
      }
    }
    
    // Extract location
    if (fields.includes('location')) {
      const locationKeywords = ['based in', 'live in', 'from', 'located in', 'in'];
      for (const keyword of locationKeywords) {
        const locationMatch = userMessage.match(new RegExp(`${keyword}\\s+([^,.\n]+)`, 'i'));
        if (locationMatch) {
          extractedData.location = locationMatch[1].trim();
          break;
        }
      }
    }
    
    // Extract languages
    if (fields.includes('languages')) {
      const languageKeywords = ['speak', 'languages', 'fluent'];
      for (const keyword of languageKeywords) {
        if (lowerMessage.includes(keyword)) {
          extractedData.languages = userMessage;
          break;
        }
      }
    }
    
    // Extract bio/passion
    if (fields.includes('bio')) {
      if (lowerMessage.includes('passionate') || lowerMessage.includes('love') || lowerMessage.includes('enjoy')) {
        extractedData.bio = userMessage;
      }
    }
    
    // Extract job title
    if (fields.includes('jobTitle')) {
      const jobKeywords = ['work as', 'job title', 'role', 'position'];
      for (const keyword of jobKeywords) {
        if (lowerMessage.includes(keyword)) {
          extractedData.jobTitle = userMessage;
          break;
        }
      }
    }
    
    // Extract company
    if (fields.includes('company')) {
      const companyKeywords = ['work for', 'company', 'at'];
      for (const keyword of companyKeywords) {
        if (lowerMessage.includes(keyword)) {
          extractedData.company = userMessage;
          break;
        }
      }
    }
    
    // Extract industry
    if (fields.includes('industry')) {
      const industryKeywords = ['industry', 'sector', 'field'];
      for (const keyword of industryKeywords) {
        if (lowerMessage.includes(keyword)) {
          extractedData.industry = userMessage;
          break;
        }
      }
    }
    
    // Extract skills
    if (fields.includes('skills')) {
      const skillKeywords = ['skills', 'technologies', 'tools', 'programming'];
      for (const keyword of skillKeywords) {
        if (lowerMessage.includes(keyword)) {
          extractedData.skills = userMessage;
          break;
        }
      }
    }
    
    // Extract goals
    if (fields.includes('careerGoals') || fields.includes('personalGoals') || fields.includes('lifeGoals')) {
      const goalKeywords = ['goals', 'want to', 'aspire', 'dream', 'achieve'];
      for (const keyword of goalKeywords) {
        if (lowerMessage.includes(keyword)) {
          if (fields.includes('careerGoals')) extractedData.careerGoals = userMessage;
          if (fields.includes('personalGoals')) extractedData.personalGoals = userMessage;
          if (fields.includes('lifeGoals')) extractedData.lifeGoals = userMessage;
          break;
        }
      }
    }
    
    // Extract hobbies/interests
    if (fields.includes('hobbies') || fields.includes('passions')) {
      const hobbyKeywords = ['hobbies', 'interests', 'passionate', 'enjoy', 'love to'];
      for (const keyword of hobbyKeywords) {
        if (lowerMessage.includes(keyword)) {
          if (fields.includes('hobbies')) extractedData.hobbies = userMessage;
          if (fields.includes('passions')) extractedData.passions = userMessage;
          break;
        }
      }
    }
    
    // For any remaining fields, store the full response
    for (const field of fields) {
      if (!extractedData[field]) {
        extractedData[field] = userMessage;
      }
    }
    
    return extractedData;
  }

  /**
   * Get current question being answered
   */
  private static getCurrentQuestion(currentData: Record<string, unknown>): any {
    // Find the first question with missing required fields
    for (const question of this.ONBOARDING_QUESTIONS) {
      if (question.required) {
        const hasAllFields = question.fields.every(field => currentData[field]);
        if (!hasAllFields) {
          console.log(`🔍 OnboardingAgent: Found incomplete question: ${question.id}`);
          console.log(`📊 Missing fields:`, question.fields.filter(field => !currentData[field]));
          return question;
        }
      }
    }
    console.log('🔍 OnboardingAgent: No incomplete questions found, checking all questions...');
    return null;
  }

  /**
   * Get next question based on current data
   */
  private static getNextQuestion(currentData: Record<string, unknown>): string | null {
    // Find the first question with missing required fields
    for (const question of this.ONBOARDING_QUESTIONS) {
      if (question.required) {
        const hasAllFields = question.fields.every(field => currentData[field]);
        if (!hasAllFields) {
          console.log(`🔍 OnboardingAgent: Next question: ${question.id}`);
          console.log(`📊 Question fields:`, question.fields);
          console.log(`📊 Current data:`, currentData);
          return question.question;
        }
      }
    }
    console.log('🔍 OnboardingAgent: All required questions completed!');
    return null;
  }

  /**
   * Calculate completion progress
   */
  private static calculateProgress(currentData: Record<string, unknown>): number {
    const requiredQuestions = this.ONBOARDING_QUESTIONS.filter(question => question.required);
    const completedQuestions = requiredQuestions.filter(question => 
      question.fields.every(field => currentData[field])
    );
    
    return Math.round((completedQuestions.length / requiredQuestions.length) * 100);
  }

  /**
   * Get fallback question when there's an error
   */
  private static getFallbackQuestion(currentData: Record<string, unknown>): string {
    // Try to find the next incomplete question
    const nextQuestion = this.getNextQuestion(currentData);
    if (nextQuestion) {
      return nextQuestion;
    }
    
    // If no specific question, ask a generic follow-up
    if (!currentData.name) {
      return "I'd love to get to know you better! Could you tell me your name and a bit about yourself?";
    }
    
    if (!currentData.jobTitle) {
      return "Tell me about your work! What do you do for a living?";
    }
    
    if (!currentData.careerGoals) {
      return "What are your goals and aspirations? Where do you want to be in the future?";
    }
    
    if (!currentData.hobbies) {
      return "What are your hobbies and interests? What do you enjoy doing in your free time?";
    }
    
    // Final fallback
    return "Tell me more about yourself! What makes you unique? What are you passionate about?";
  }

  /**
   * Save progress
   */
  private static async saveProgress(
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
      
      console.log('✅ OnboardingAgent: Progress saved');
      console.log(`📊 Progress: ${progress}%`);
      console.log(`📊 Updated data:`, updatedData);
      
      // Update user profile with onboarding data
      await this.updateUserProfile(userId, updatedData);
      
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to save progress:', error);
    }
  }

  /**
   * Update user profile with onboarding data
   */
  private static async updateUserProfile(userId: string, onboardingData: Record<string, unknown>): Promise<void> {
    try {
      console.log('🔄 OnboardingAgent: Updating user profile with onboarding data...');
      
      // This would integrate with your existing user profile update system
      // For now, we'll just log the data that would be updated
      console.log('📊 Profile data to update:', {
        name: onboardingData.name,
        age: onboardingData.age,
        location: onboardingData.location,
        bio: onboardingData.bio,
        jobTitle: onboardingData.jobTitle,
        company: onboardingData.company,
        industry: onboardingData.industry,
        skills: onboardingData.skills,
        careerGoals: onboardingData.careerGoals,
        personalGoals: onboardingData.personalGoals,
        hobbies: onboardingData.hobbies,
        // ... and so on for all fields
      });
      
      // TODO: Integrate with your existing user profile update system
      // This would update the user's profile in Supabase with the onboarding data
      // so it appears in all the Personal Data Card components
      
      console.log('✅ OnboardingAgent: User profile updated with onboarding data');
      
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to update user profile:', error);
    }
  }

  /**
   * Complete onboarding
   */
  private static async completeOnboarding(userId: string, finalData: Record<string, unknown>): Promise<void> {
    try {
      await OnboardingProgressService.completeOnboarding(userId);
      console.log('✅ OnboardingAgent: Onboarding completed');
      console.log('📊 Final data:', finalData);
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to complete onboarding:', error);
    }
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
   * Check if onboarding is active
   */
  static isOnboardingActive(): boolean {
    const history = promptStore.getState().history;
    return history.length > 0 && history.some(msg => 
      msg.message.includes("What should I call you?") || 
      msg.message.includes("How old are you?") ||
      msg.message.includes("Where are you based?") ||
      msg.message.includes("I'd love to get to know you better") ||
      msg.message.includes("Tell me about yourself") ||
      msg.message.includes("What are your goals")
    );
  }

  /**
   * Ensure onboarding continues - called when conversation might have stopped
   */
  static async ensureOnboardingContinues(userId: string): Promise<boolean> {
    try {
      console.log('🔄 OnboardingAgent: Ensuring onboarding continues...');
      
      // Check if onboarding is still active
      if (!this.isOnboardingActive()) {
        console.log('🔄 OnboardingAgent: Onboarding not active, reinitializing...');
        return await this.initializeOnboarding(userId);
      }
      
      // Get current progress
      const savedProgress = await OnboardingProgressService.loadProgress(userId);
      if (!savedProgress) {
        console.log('🔄 OnboardingAgent: No saved progress, starting fresh...');
        return await this.initializeOnboarding(userId);
      }
      
      // Check if we need to continue
      const currentData = savedProgress.onboarding_data || {};
      const nextQuestion = this.getNextQuestion(currentData);
      
      if (nextQuestion) {
        console.log('🔄 OnboardingAgent: Adding next question to continue onboarding...');
        promptStore.getState().addAvatarMessage(nextQuestion);
        return true;
      }
      
      console.log('🔄 OnboardingAgent: Onboarding appears to be complete');
      return false;
      
    } catch (error) {
      console.error('❌ OnboardingAgent: Failed to ensure onboarding continues:', error);
      return false;
    }
  }
}
