import { z } from "zod";

/**
 * OnboardingProgress model for tracking user onboarding state
 * Stores progress, current step, completed steps, and chat state
 */
export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: number;
  completed_steps: number[];
  last_message_id?: string;
  onboarding_data: Record<string, unknown>;
  messages: OnboardingMessage[];
  updated_at: string;
  created_at: string;
}

export interface OnboardingMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

export const OnboardingMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['ai', 'user']),
  content: z.string(),
  timestamp: z.string(),
  isTyping: z.boolean().optional(),
});

export const OnboardingProgressSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  current_step: z.number().min(0),
  completed_steps: z.array(z.number()),
  last_message_id: z.string().optional(),
  onboarding_data: z.record(z.unknown()),
  messages: z.array(OnboardingMessageSchema),
  updated_at: z.string(),
  created_at: z.string(),
});

export type OnboardingProgressInput = Omit<OnboardingProgress, 'id' | 'created_at' | 'updated_at'>;
