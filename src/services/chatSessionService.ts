import { supabase } from '@/lib/supabase';

export interface ChatSession {
  id: string;
  ownerId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  messageCount: number;
}

export interface ChatSessionMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    highlightColor?: "green" | "yellow" | "purple";
  };
}

/**
 * Get the active (non-archived) chat session if it exists
 * Returns null if no active session
 */
export const getActiveSession = async (): Promise<ChatSession | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('owner_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data ? mapSessionRow(data) : null;
};

/**
 * Get or create the active (non-archived) chat session
 */
export const getOrCreateActiveSession = async (): Promise<ChatSession> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_or_create_active_session', {
    user_id: user.id
  });

  if (error) throw error;

  // Fetch the full session details
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', data)
    .single();

  if (sessionError) throw sessionError;

  return mapSessionRow(session);
};

/**
 * Create a new chat session and archive the current one
 */
export const createNewChatSession = async (): Promise<ChatSession> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: sessionId, error } = await supabase.rpc('create_new_chat_session', {
    user_id: user.id
  });

  if (error) throw error;

  // Fetch the new session
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) throw sessionError;

  return mapSessionRow(session);
};

/**
 * Get all archived chat sessions
 */
export const getArchivedSessions = async (): Promise<ChatSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('owner_id', user.id)
    .eq('archived', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapSessionRow);
};

/**
 * Get messages for a specific session
 */
export const getSessionMessages = async (sessionId: string): Promise<ChatSessionMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(msg => ({
    id: msg.id,
    sessionId: msg.session_id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at
  }));
};

/**
 * Get recent messages from active session (for focus area analysis)
 */
export const getRecentMessagesFromActiveSession = async (limit: number = 20): Promise<ChatSessionMessage[]> => {
  try {
    const activeSession = await getActiveSession();
    if (!activeSession) {
      return [];
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', activeSession.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent messages:', error);
      return [];
    }

    return (data || []).map(msg => ({
      id: msg.id,
      sessionId: msg.session_id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at
    }));
  } catch (error) {
    console.error('Failed to get recent messages:', error);
    return [];
  }
};

/**
 * Load an archived session (unarchive it and archive current active session)
 */
export const loadArchivedSession = async (sessionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('switch_to_archived_session', {
    user_id: user.id,
    session_id: sessionId
  });

  if (error) throw error;
};

/**
 * Delete a chat session
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
};

/**
 * Update session title
 */
export const updateSessionTitle = async (sessionId: string, title: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ title })
    .eq('id', sessionId);

  if (error) throw error;
};

/**
 * Save an AI-initiated message (like Today's Actions questions) to the database
 * This ensures the message persists across page refreshes
 * @param content - The message content
 * @param highlightColor - Optional color for Today's Actions questions (green/yellow/purple)
 */
export const saveAIMessage = async (
  content: string,
  highlightColor?: "green" | "yellow" | "purple"
): Promise<ChatSessionMessage | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Cannot save AI message: not authenticated');
    return null;
  }

  try {
    // Get or create active session
    const session = await getOrCreateActiveSession();

    // Insert the AI message with color metadata
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        owner_id: user.id,
        session_id: session.id,
        role: 'assistant',
        content: content,
        metadata: highlightColor ? { highlightColor } : {}
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save AI message:', error);
      return null;
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      role: data.role,
      content: data.content,
      createdAt: data.created_at,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error saving AI message:', error);
    return null;
  }
};

// Helper to map database row to ChatSession
const mapSessionRow = (row: any): ChatSession => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  archived: row.archived,
  messageCount: row.message_count
});
