import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface CreatedEntity {
  type: 'project' | 'task' | 'goal' | 'milestone' | 'knowledge' | 'insight';
  name: string;
  id: string;
  projectId?: string;
  projectName?: string;
  status?: string;
  targetDate?: string | null;
  description?: string | null;
  priority?: string | null;
  mode?: 'created' | 'updated' | 'deleted';
}

export interface NextStep {
  action: string;
  description: string;
  command: string;
}

export interface ChatResponse {
  response: string;
  entitiesExtracted: number;
  entitiesCreated?: CreatedEntity[];
  nextSteps?: NextStep[];
  documentGenerated?: boolean;
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
const generateMessageId = () => {
  try {
    const globalCrypto =
      typeof globalThis !== 'undefined' ? (globalThis.crypto || (globalThis as any).msCrypto) : undefined;

    if (globalCrypto?.randomUUID) {
      return globalCrypto.randomUUID();
    }

    if (globalCrypto?.getRandomValues) {
      const bytes = globalCrypto.getRandomValues(new Uint8Array(16));
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch (error) {
    console.warn('Unable to use crypto APIs for message id generation:', error);
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  const enableChat = import.meta.env.VITE_ENABLE_CLAUDE_CHAT === 'true';

  if (!enableChat) {
    // More graceful fallback - allow chat to work even without the env var in development
    console.warn('VITE_ENABLE_CLAUDE_CHAT not set to true, proceeding anyway...');
  }

  // Verify user is authenticated with session refresh fallback
  let session: any = null;
  
  try {
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !currentSession) {
      console.log('🔄 Current session invalid, attempting refresh...');
      // Try to refresh the session first
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        throw new Error('Authentication expired. Please refresh the page and sign in again.');
      }
      
      session = refreshedSession;
      console.log('✅ Session refreshed successfully');
    } else {
      session = currentSession;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    throw new Error('Authentication failed. Please refresh the page and sign in again.');
  }

  // Generate unique messageId for idempotency
  const messageId = generateMessageId();
  console.log(`📨 [${new Date().toLocaleTimeString()}] Sending message with ID:`, messageId);

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, messageId },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (error) {
    console.error('Edge function error:', error);
    let errorMessage = error.message || 'Failed to send message';

    const contextResponse = (error as any)?.context;
    if (contextResponse instanceof Response) {
      try {
        const cloned = contextResponse.clone ? contextResponse.clone() : contextResponse;
        const contentType = cloned.headers.get('content-type') || '';
        const status = cloned.status;

        if (contentType.includes('application/json')) {
          const body = await cloned.json();
          if (body?.error) {
            errorMessage = body.error;
          } else if (body?.message) {
            errorMessage = body.message;
          }
        } else {
          const text = await cloned.text();
          if (text?.trim()) {
            errorMessage = text.trim();
          }
        }

        if (status === 404) {
          errorMessage = 'Chat service is offline (Supabase Edge Function "chat" returned 404). Redeploy the function and try again.';
        }
      } catch (parseError) {
        console.warn('Failed to parse edge function error response:', parseError);
      }
    }

    throw new Error(errorMessage);
  }

  const response = data as ChatResponse;

  // If entities were extracted but not created, process them via the process-entities function
  if (response.entitiesExtracted > 0 && (!response.entitiesCreated || response.entitiesCreated.length === 0)) {
    console.log('🔄 Entities extracted but not created, triggering process-entities function...');
    try {
      const { data: processData, error: processError } = await supabase.functions.invoke('process-entities', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!processError && processData) {
        console.log('✅ process-entities result:', processData);
      } else if (processError) {
        console.error('⚠️ process-entities error:', processError);
      }
    } catch (processErr) {
      console.error('⚠️ Failed to invoke process-entities:', processErr);
    }
  }

  return response;
};

/**
 * Retrieve chat history for the current user
 * Used to build conversation context and display in UI
 */
export const getChatHistory = async (limit: number = 50): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || [])
    .map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }))
    .reverse();
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

/**
 * Chat Session Management for Archive/Reload
 */

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

/**
 * Get list of archived chat sessions
 */
export const getArchivedSessions = async (): Promise<ChatSession[]> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Must be logged in to view archived chats');
  }

  const { data, error } = await supabase.rpc('get_archived_sessions', {
    user_id: session.user.id
  });

  if (error) {
    console.error('Failed to fetch archived sessions:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title || 'Untitled Chat',
    created_at: row.created_at,
    updated_at: row.updated_at,
    message_count: row.message_count
  }));
};

/**
 * Load messages from an archived session
 */
export const loadArchivedChat = async (sessionId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at
  }));
};

/**
 * Switch to an archived session (unarchive and make active)
 */
export const switchToArchivedSession = async (sessionId: string): Promise<void> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Must be logged in to switch sessions');
  }

  const { error } = await supabase.rpc('switch_to_archived_session', {
    user_id: session.user.id,
    session_id: sessionId
  });

  if (error) {
    throw new Error(`Failed to switch session: ${error.message}`);
  }
};
