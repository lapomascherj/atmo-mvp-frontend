import { supabase } from '@/lib/supabase';
import type { OnboardingProgress, OnboardingProgressInput, OnboardingMessage } from '@/models/OnboardingProgress';

/**
 * Service for managing onboarding progress persistence
 * Handles saving, loading, and updating onboarding state in Supabase
 */
export class OnboardingProgressService {
  /**
   * Save or update onboarding progress
   */
  static async saveProgress(
    userId: string,
    progressData: Partial<OnboardingProgressInput>
  ): Promise<OnboardingProgress> {
    const payload = {
      user_id: userId,
      current_step: progressData.current_step ?? 0,
      completed_steps: progressData.completed_steps ?? [],
      last_message_id: progressData.last_message_id,
      onboarding_data: progressData.onboarding_data ?? {},
      messages: progressData.messages ?? [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to save onboarding progress: ${error.message}`);
    }

    return data;
  }

  /**
   * Load onboarding progress for a user
   */
  static async loadProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No progress found
          console.log('📭 No onboarding progress found for user');
          return null;
        }
        
        // Check if table doesn't exist (common during setup)
        if (error.code === '42P01' || error.message.includes('relation "onboarding_progress" does not exist')) {
          console.warn('⚠️ onboarding_progress table does not exist. Please run the database setup script.');
          return null;
        }
        
        throw new Error(`Failed to load onboarding progress: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error loading onboarding progress:', error);
      return null;
    }
  }

  /**
   * Update current step and save progress
   */
  static async updateStep(
    userId: string,
    stepIndex: number,
    completedSteps: number[],
    onboardingData: Record<string, unknown>,
    messages: OnboardingMessage[]
  ): Promise<OnboardingProgress> {
    return this.saveProgress(userId, {
      current_step: stepIndex,
      completed_steps: completedSteps,
      onboarding_data: onboardingData,
      messages,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Add a message to the conversation and save progress
   */
  static async addMessage(
    userId: string,
    message: OnboardingMessage,
    currentStep: number,
    completedSteps: number[],
    onboardingData: Record<string, unknown>,
    existingMessages: OnboardingMessage[]
  ): Promise<OnboardingProgress> {
    const updatedMessages = [...existingMessages, message];
    
    return this.saveProgress(userId, {
      current_step: currentStep,
      completed_steps: completedSteps,
      onboarding_data: onboardingData,
      messages: updatedMessages,
      last_message_id: message.id,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Complete onboarding and clean up progress
   */
  static async completeOnboarding(userId: string): Promise<void> {
    const { error } = await supabase
      .from('onboarding_progress')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
  }

  /**
   * Get onboarding completion percentage
   */
  static calculateProgress(currentStep: number, totalSteps: number): number {
    return Math.round((currentStep / totalSteps) * 100);
  }

  /**
   * Check if onboarding is completed
   */
  static isCompleted(currentStep: number, totalSteps: number): boolean {
    return currentStep >= totalSteps;
  }
}
