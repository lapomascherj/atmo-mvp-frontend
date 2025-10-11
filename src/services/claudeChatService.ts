import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatResponse {
  response: string;
  entitiesExtracted: number;
}

/**
 * Send a chat message to Claude via Supabase Edge Function
 * This will:
 * 1. Store the user's message
 * 2. Send to Claude API with user context (onboarding + current projects)
 * 3. Parse Claude's response for entities (projects, tasks, etc.)
 * 4. Store assistant's response
 * 5. Queue entities for processing
 */
export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  const enableChat = import.meta.env.VITE_ENABLE_CLAUDE_CHAT === 'true';

  if (!enableChat) {
    throw new Error('Claude chat is currently disabled. Enable with VITE_ENABLE_CLAUDE_CHAT=true');
  }

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message }
  });

  if (error) throw error;
  return data as ChatResponse;
};

/**
 * Retrieve chat history for the current user
 * Used to build conversation context and display in UI
 */
export const getChatHistory = async (limit: number = 50): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }));
};

/**
 * Get parsed entities that are pending processing
 * Useful for debugging or showing preview in dry-run mode
 */
export const getPendingEntities = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('claude_parsed_entities')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};
