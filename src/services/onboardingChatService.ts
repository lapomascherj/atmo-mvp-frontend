import { OnboardingProgressService } from './onboardingProgressService';
import { PersonalDataOnboardingService } from './personalDataOnboardingService';
import { promptStore } from '@/stores/promptStore';
import type { OnboardingMessage } from '@/models/OnboardingProgress';

/**
 * Service for handling onboarding continuation in the chat interface
 * Integrates with the prompt store to restore onboarding conversations
 */
export class OnboardingChatService {
  /**
   * Initialize Personal Data Card onboarding in chat
   */
  static async initializeOnboardingChat(userId: string): Promise<boolean> {
    try {
      console.log('🔄 Initializing Personal Data Card onboarding chat for user:', userId);
      
      // Use the new Personal Data Card focused service
      return await PersonalDataOnboardingService.initializePersonalDataOnboarding(userId);
      
    } catch (error) {
      console.error('❌ Failed to initialize Personal Data Card onboarding chat:', error);
      return false;
    }
  }
  
  /**
   * Start fresh Personal Data Card onboarding in chat
   */
  static startFreshOnboarding(): boolean {
    try {
      console.log('🆕 Starting fresh Personal Data Card onboarding in chat');
      
      // Use the new Personal Data Card focused service
      return PersonalDataOnboardingService.startFreshPersonalDataOnboarding();
      
    } catch (error) {
      console.error('❌ Failed to start fresh Personal Data Card onboarding:', error);
      return false;
    }
  }
  
  /**
   * Get continuation message based on current step
   */
  private static getContinuationMessage(currentStep: number): string {
    const stepMessages = [
      "Welcome back! Let's continue getting to know you better.",
      "Great! Let's continue with your personal information.",
      "Now let's talk about your work and career.",
      "Let's discuss your goals and aspirations.",
      "Tell me about your preferences and style.",
      "Let's talk about your habits and routines.",
      "Now let's discuss your wellness and health.",
      "Let's talk about your learning and development.",
      "Tell me about your current projects and work.",
      "Let's discuss your personal interests.",
      "Finally, let's review everything together."
    ];
    
    return stepMessages[currentStep] || "Let's continue with your onboarding process.";
  }
  
  /**
   * Save Personal Data Card progress when user responds in chat
   */
  static async saveOnboardingProgress(
    userId: string,
    userMessage: string,
    aiResponse?: string
  ): Promise<void> {
    try {
      // Get current onboarding data
      const savedProgress = await OnboardingProgressService.loadProgress(userId);
      const currentData = savedProgress?.onboarding_data || {};
      
      // Process the user's response and get updated data
      const response = await PersonalDataOnboardingService.processPersonalDataResponse(
        userId,
        userMessage,
        currentData
      );
      
      // Save the updated progress
      await PersonalDataOnboardingService.savePersonalDataProgress(
        userId,
        userMessage,
        aiResponse || response.response,
        response.updatedData
      );
      
      console.log('✅ Personal Data Card progress saved from chat');
      console.log(`📊 Progress: ${response.progress}%`);
      
    } catch (error) {
      console.error('❌ Failed to save Personal Data Card progress:', error);
    }
  }
  
  /**
   * Extract onboarding data from conversation messages
   */
  private static extractOnboardingDataFromMessages(messages: OnboardingMessage[]): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    
    // Simple extraction based on conversation patterns
    messages.forEach((msg, index) => {
      if (msg.type === 'user') {
        // Extract common onboarding fields
        if (msg.content.toLowerCase().includes('name') || index < 2) {
          data.name = msg.content;
        } else if (msg.content.toLowerCase().includes('age')) {
          data.age = msg.content;
        } else if (msg.content.toLowerCase().includes('work') || msg.content.toLowerCase().includes('job')) {
          data.jobTitle = msg.content;
        } else if (msg.content.toLowerCase().includes('goal')) {
          data.goals = msg.content;
        }
      }
    });
    
    return data;
  }
  
  /**
   * Complete onboarding from chat
   */
  static async completeOnboardingFromChat(userId: string): Promise<void> {
    try {
      console.log('🎉 Completing onboarding from chat');
      
      // Get final conversation data
      const currentHistory = promptStore.getState().history;
      const onboardingData = this.extractOnboardingDataFromMessages(
        currentHistory.map((entry, index) => ({
          id: `msg_${Date.now()}_${index}`,
          type: entry.sender,
          content: entry.message,
          timestamp: new Date().toISOString()
        }))
      );
      
      // Save final onboarding data
      // This would integrate with your existing completeOnboarding function
      console.log('📊 Final onboarding data:', onboardingData);
      
      // Clear onboarding progress
      await OnboardingProgressService.completeOnboarding(userId);
      
      // Clear chat conversation
      promptStore.getState().clearPrompt();
      
      console.log('✅ Onboarding completed from chat');
      
    } catch (error) {
      console.error('❌ Failed to complete onboarding from chat:', error);
    }
  }
}
