import { OnboardingFlowService } from './onboardingFlowService';
import { OnboardingProgressService } from './onboardingProgressService';
import { promptStore } from '@/stores/promptStore';

/**
 * Service for generating intelligent AI responses during onboarding
 * The AI knows what questions to ask and what data is still needed
 */
export class OnboardingAIResponseService {
  /**
   * Generate intelligent AI response for onboarding
   */
  static async generateOnboardingResponse(
    userMessage: string,
    userId: string,
    currentOnboardingData: Record<string, unknown>
  ): Promise<{
    response: string;
    shouldContinue: boolean;
    isComplete: boolean;
    progress: number;
  }> {
    try {
      console.log('🤖 Generating intelligent onboarding response');
      console.log('📝 User message:', userMessage);
      console.log('📊 Current data:', currentOnboardingData);

      // Get completion status to understand what's missing
      const completionStatus = OnboardingFlowService.getCompletionStatus(currentOnboardingData);
      
      console.log(`📈 Progress: ${completionStatus.progress}%`);
      console.log(`❌ Missing fields: ${completionStatus.missingFields.length}`);

      // If onboarding is complete, provide completion message
      if (completionStatus.isComplete) {
        return {
          response: this.getCompletionMessage(currentOnboardingData),
          shouldContinue: false,
          isComplete: true,
          progress: 100
        };
      }

      // Determine what question to ask next
      const nextQuestion = this.getNextQuestionToAsk(currentOnboardingData, completionStatus);
      
      if (nextQuestion) {
        console.log('❓ Next question:', nextQuestion);
        return {
          response: nextQuestion,
          shouldContinue: true,
          isComplete: false,
          progress: completionStatus.progress
        };
      }

      // Fallback response
      return {
        response: "Thanks for sharing that! Let me ask you about something else. What are your main goals for the next few months?",
        shouldContinue: true,
        isComplete: false,
        progress: completionStatus.progress
      };

    } catch (error) {
      console.error('❌ Failed to generate onboarding response:', error);
      return {
        response: "I'm having trouble processing your response. Could you tell me a bit more about yourself?",
        shouldContinue: true,
        isComplete: false,
        progress: 0
      };
    }
  }

  /**
   * Get the next question to ask based on missing data
   */
  private static getNextQuestionToAsk(
    currentData: Record<string, unknown>,
    completionStatus: { missingFields: string[]; progress: number }
  ): string | null {
    // Priority order for questions
    const questionPriority = [
      'name', 'age', 'location', 'bio',
      'job_title', 'company', 'industry', 'experience_level',
      'short_term_goals', 'long_term_goals', 'career_goals', 'personal_goals',
      'work_preferences', 'communication_style', 'work_environment',
      'daily_routines', 'weekly_routines', 'important_habits',
      'sleep_pattern', 'exercise_routine', 'stress_management', 'wellness_goals',
      'current_learning', 'skills_to_develop', 'learning_resources', 'learning_style',
      'current_projects', 'work_environment_details', 'collaboration_style',
      'hobbies', 'values', 'personal_mission'
    ];

    // Find the first missing field in priority order
    for (const field of questionPriority) {
      if (completionStatus.missingFields.includes(field)) {
        return this.getQuestionForField(field, currentData);
      }
    }

    return null;
  }

  /**
   * Get the specific question for a field
   */
  private static getQuestionForField(field: string, currentData: Record<string, unknown>): string {
    const questions: Record<string, string> = {
      name: "Hi! I'm ATMO, your AI assistant. I'm excited to learn about you so I can provide personalized help. What should I call you?",
      age: "How old are you? This helps me understand your life stage and provide age-appropriate suggestions.",
      location: "Where are you based? This helps me understand your timezone and local context.",
      bio: "Tell me a bit about yourself. What makes you unique? What are you passionate about?",
      job_title: "What's your current job title or role?",
      company: "What company or organization do you work for?",
      industry: "What industry are you in?",
      experience_level: "How many years of experience do you have in your field?",
      short_term_goals: "What are your main goals for the next 3-6 months?",
      long_term_goals: "What about your long-term goals? Where do you see yourself in 2-3 years?",
      career_goals: "What are your main career goals?",
      personal_goals: "What personal goals are important to you?",
      work_preferences: "How do you prefer to work? (e.g., independently, in teams, remote, office, etc.)",
      communication_style: "What's your preferred communication style? (e.g., direct, detailed, encouraging, etc.)",
      work_environment: "What's your ideal work environment like?",
      daily_routines: "What does your typical day look like? What are your main routines?",
      weekly_routines: "What about your weekly routines? How do you structure your week?",
      important_habits: "What habits are most important to you?",
      sleep_pattern: "How would you describe your sleep pattern?",
      exercise_routine: "What about your exercise routine? How do you stay active?",
      stress_management: "How do you manage stress? What helps you relax?",
      wellness_goals: "What are your wellness goals?",
      current_learning: "What are you currently learning or studying?",
      skills_to_develop: "What skills would you like to develop?",
      learning_resources: "What learning resources do you prefer? (e.g., books, courses, videos, etc.)",
      learning_style: "What's your learning style? (e.g., visual, hands-on, theoretical, etc.)",
      current_projects: "What projects are you currently working on?",
      work_environment_details: "What's your work environment like?",
      collaboration_style: "How do you prefer to collaborate with others?",
      hobbies: "What are your hobbies and interests?",
      values: "What values are most important to you?",
      personal_mission: "What's your personal mission or purpose? What drives you?"
    };

    return questions[field] || "Could you tell me more about that?";
  }

  /**
   * Get completion message
   */
  private static getCompletionMessage(onboardingData: Record<string, unknown>): string {
    const name = onboardingData.name || 'there';
    return `Perfect! Your onboarding is now complete, ${name}! 🎉

I now have a comprehensive understanding of who you are, your goals, and how you work. This will help me provide you with personalized assistance and insights.

Here's what I learned about you:
• **Personal**: ${onboardingData.name}, ${onboardingData.age}, based in ${onboardingData.location}
• **Work**: ${onboardingData.job_title} at ${onboardingData.company} in ${onboardingData.industry}
• **Goals**: ${onboardingData.short_term_goals} (short-term) and ${onboardingData.long_term_goals} (long-term)
• **Style**: ${onboardingData.work_preferences} with ${onboardingData.communication_style} communication

I'm excited to help you achieve your goals! What would you like to work on first?`;
  }

  /**
   * Process user response and extract data
   */
  static extractDataFromResponse(
    userMessage: string,
    currentField: string,
    currentData: Record<string, unknown>
  ): Record<string, unknown> {
    // Simple extraction - can be enhanced with NLP
    const updatedData = { ...currentData };
    
    // Store the user's response
    updatedData[currentField] = userMessage;
    
    // Try to extract additional information from the response
    if (currentField === 'name' && userMessage) {
      // Extract first name if full name is provided
      const firstName = userMessage.split(' ')[0];
      updatedData.first_name = firstName;
    }
    
    if (currentField === 'age' && userMessage) {
      // Extract numeric age
      const ageMatch = userMessage.match(/\d+/);
      if (ageMatch) {
        updatedData.age_number = parseInt(ageMatch[0]);
      }
    }
    
    if (currentField === 'location' && userMessage) {
      // Extract city/country information
      const locationParts = userMessage.split(',');
      if (locationParts.length > 1) {
        updatedData.city = locationParts[0].trim();
        updatedData.country = locationParts[1].trim();
      }
    }
    
    return updatedData;
  }

  /**
   * Check if onboarding should continue
   */
  static shouldContinueOnboarding(currentData: Record<string, unknown>): boolean {
    const completionStatus = OnboardingFlowService.getCompletionStatus(currentData);
    return !completionStatus.isComplete && completionStatus.missingFields.length > 0;
  }
}
