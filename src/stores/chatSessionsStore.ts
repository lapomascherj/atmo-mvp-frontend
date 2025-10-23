import { create } from 'zustand';
import {
  createNewChatSession,
  deleteSession as deleteSessionFromService,
  getActiveSession,
  getArchivedSessions,
  getSessionMessages,
  loadArchivedSession,
  type ChatSession,
  type ChatSessionMessage,
} from '@/services/chatSessionService';
import { promptStore } from '@/stores/promptStore';
import { usePersonasStore } from '@/stores/usePersonasStore';

type PromptEntry = { message: string; sender: 'user' | 'ai' };

interface HydrationCheckpoint {
  sessionId: string | null;
  lastMessageId: string | null;
  messageCount: number;
}

interface CachedActiveSession {
  session: ChatSession | null;
  messages: ChatSessionMessage[];
  checkpoint: HydrationCheckpoint;
  timestamp: number;
}

interface CachedArchive {
  sessions: ChatSession[];
  timestamp: number;
}

type PreviewCache = Record<
  string,
  {
    messages: ChatSessionMessage[];
    fetchedAt: number;
  }
>;

interface ChatSessionsState {
  activeSession: ChatSession | null;
  messages: ChatSessionMessage[];
  archivedSessions: ChatSession[];
  previewCache: PreviewCache;
  hydrationCheckpoint: HydrationCheckpoint;
  initialized: boolean;
  loadingActive: boolean;
  loadingArchive: boolean;
  lastError: string | null;
  initialize: () => Promise<void>;
  refreshActiveSession: (options?: { force?: boolean }) => Promise<ChatSession | null>;
  loadArchivedSessions: (force?: boolean) => Promise<ChatSession[]>;
  previewArchivedSession: (sessionId: string) => Promise<ChatSessionMessage[]>;
  activateArchivedSession: (sessionId: string) => Promise<void>;
  startNewChatSession: () => Promise<ChatSession>;
  deleteArchivedSession: (sessionId: string) => Promise<void>;
  clearPreview: (sessionId?: string) => void;
}

const ACTIVE_CACHE_KEY = 'atmo.chat.active';
const ARCHIVE_CACHE_KEY = 'atmo.chat.archive';

const EMPTY_CHECKPOINT: HydrationCheckpoint = {
  sessionId: null,
  lastMessageId: null,
  messageCount: 0,
};

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readCache = <T>(key: string): T | null => {
  if (!hasWindow()) return null;
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error(`[ChatSessionsStore] Failed to read cache for key "${key}":`, error);
    return null;
  }
};

const writeCache = <T>(key: string, value: T | null): void => {
  if (!hasWindow()) return;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`[ChatSessionsStore] Failed to write cache for key "${key}":`, error);
  }
};

const normalizeMessagesToPromptEntries = (messages: ChatSessionMessage[]): PromptEntry[] =>
  messages.map((msg) => ({
    message: msg.content,
    sender: msg.role === 'user' ? 'user' : 'ai',
    highlightColor: msg.metadata?.highlightColor,  // Restore color from metadata
  }));

const historiesAreEqual = (current: PromptEntry[], next: PromptEntry[]): boolean => {
  if (current.length !== next.length) return false;
  for (let i = 0; i < current.length; i += 1) {
    if (current[i].message !== next[i].message || current[i].sender !== next[i].sender) {
      return false;
    }
  }
  return true;
};

const hydratePromptStore = (messages: ChatSessionMessage[], force = false) => {
  const normalized = normalizeMessagesToPromptEntries(messages);
  const promptState = promptStore.getState();
  const shouldHydrate =
    force || !historiesAreEqual(promptState.history, normalized);

  if (shouldHydrate) {
    promptState.setHistory(normalized);
    promptState.setConversationStarted(normalized.length > 0);
  }
};

const refreshWorkspaceSnapshot = async () => {
  const { fetchPersonaByIam, profileSnapshot } = usePersonasStore.getState();
  if (!profileSnapshot?.id) return;

  try {
    await fetchPersonaByIam(null, profileSnapshot.id, true);
  } catch (error) {
    console.error('[ChatSessionsStore] Failed to refresh workspace snapshot:', error);
  }
};

export const useChatSessionsStore = create<ChatSessionsState>((set, get) => ({
  activeSession: null,
  messages: [],
  archivedSessions: [],
  previewCache: {},
  hydrationCheckpoint: EMPTY_CHECKPOINT,
  initialized: false,
  loadingActive: false,
  loadingArchive: false,
  lastError: null,

  initialize: async () => {
    if (get().initialized) return;

    const cachedActive = readCache<CachedActiveSession>(ACTIVE_CACHE_KEY);
    const cachedArchive = readCache<CachedArchive>(ARCHIVE_CACHE_KEY);

    if (cachedActive) {
      set({
        activeSession: cachedActive.session,
        messages: cachedActive.messages,
        hydrationCheckpoint: cachedActive.checkpoint ?? EMPTY_CHECKPOINT,
      });
      hydratePromptStore(cachedActive.messages, true);
    }

    if (cachedArchive) {
      set({ archivedSessions: cachedArchive.sessions });
    }

    set({ initialized: true });

    try {
      await get().refreshActiveSession({ force: true });
    } catch (error) {
      console.error('[ChatSessionsStore] Failed to refresh active session during init:', error);
      const message = error instanceof Error ? error.message : 'Failed to initialize chat sessions';
      set({ lastError: message });
    }
  },

  refreshActiveSession: async ({ force = false } = {}) => {
    if (get().loadingActive) {
      if (!force) {
        return get().activeSession;
      }
    }

    set({ loadingActive: true, lastError: null });

    try {
      const session = await getActiveSession();

      if (!session) {
        if (force || get().activeSession !== null) {
          set({
            activeSession: null,
            messages: [],
            hydrationCheckpoint: EMPTY_CHECKPOINT,
          });
          hydratePromptStore([], true);
          promptStore.getState().clearInput();
          writeCache<CachedActiveSession>(ACTIVE_CACHE_KEY, {
            session: null,
            messages: [],
            checkpoint: EMPTY_CHECKPOINT,
            timestamp: Date.now(),
          });
        }
        return null;
      }

      const state = get();
      const sameSession = state.activeSession?.id === session.id;
      const checkpoint = sameSession ? state.hydrationCheckpoint : EMPTY_CHECKPOINT;
      const messageCountChanged = checkpoint.messageCount !== session.messageCount;
      const shouldFetchMessages = force || !sameSession || messageCountChanged;

      const messages = shouldFetchMessages
        ? await getSessionMessages(session.id)
        : state.messages;

      const newCheckpoint: HydrationCheckpoint = {
        sessionId: session.id,
        lastMessageId: messages.length > 0 ? messages[messages.length - 1].id : null,
        messageCount: messages.length,
      };

      set({
        activeSession: session,
        messages,
        hydrationCheckpoint: newCheckpoint,
      });

      hydratePromptStore(messages, force || !sameSession || messageCountChanged);

      writeCache<CachedActiveSession>(ACTIVE_CACHE_KEY, {
        session,
        messages,
        checkpoint: newCheckpoint,
        timestamp: Date.now(),
      });

      return session;
    } catch (error) {
      console.error('[ChatSessionsStore] Failed to refresh active session:', error);
      const message = error instanceof Error ? error.message : 'Failed to refresh active chat session';
      set({ lastError: message });
      throw error;
    } finally {
      set({ loadingActive: false });
    }
  },

  loadArchivedSessions: async (force = false) => {
    const state = get();
    if (!force && state.archivedSessions.length > 0) {
      return state.archivedSessions;
    }

    if (state.loadingArchive) {
      return state.archivedSessions;
    }

    set({ loadingArchive: true, lastError: null });

    try {
      const sessions = await getArchivedSessions();
      set({ archivedSessions: sessions });

      writeCache<CachedArchive>(ARCHIVE_CACHE_KEY, {
        sessions,
        timestamp: Date.now(),
      });

      return sessions;
    } catch (error) {
      console.error('[ChatSessionsStore] Failed to load archived sessions:', error);
      const message = error instanceof Error ? error.message : 'Failed to load archived chats';
      set({ lastError: message });
      throw error;
    } finally {
      set({ loadingArchive: false });
    }
  },

  previewArchivedSession: async (sessionId: string) => {
    const state = get();

    if (state.activeSession?.id === sessionId) {
      return state.messages;
    }

    const cachedPreview = state.previewCache[sessionId];
    if (cachedPreview) {
      return cachedPreview.messages;
    }

    const messages = await getSessionMessages(sessionId);

    set((current) => ({
      previewCache: {
        ...current.previewCache,
        [sessionId]: {
          messages,
          fetchedAt: Date.now(),
        },
      },
    }));

    return messages;
  },

  activateArchivedSession: async (sessionId: string) => {
    set({ loadingActive: true, lastError: null });

    try {
      await loadArchivedSession(sessionId);
      await get().refreshActiveSession({ force: true });
      promptStore.getState().clearInput();
      await get().loadArchivedSessions(true);

      const { previewCache } = get();
      if (previewCache[sessionId]) {
        const { [sessionId]: _removed, ...rest } = previewCache;
        set({ previewCache: rest });
      }

      void refreshWorkspaceSnapshot();
    } catch (error) {
      console.error('[ChatSessionsStore] Failed to activate archived session:', error);
      const message = error instanceof Error ? error.message : 'Failed to load archived session';
      set({ lastError: message });
      throw error;
    } finally {
      set({ loadingActive: false });
    }
  },

  startNewChatSession: async () => {
    set({ loadingActive: true, lastError: null });

    const previousActive = get().activeSession;

    try {
      const newSession = await createNewChatSession();

      const newCheckpoint: HydrationCheckpoint = {
        sessionId: newSession.id,
        lastMessageId: null,
        messageCount: 0,
      };

      set({
        activeSession: newSession,
        messages: [],
        hydrationCheckpoint: newCheckpoint,
      });

      hydratePromptStore([], true);
      promptStore.getState().clearInput();

      writeCache<CachedActiveSession>(ACTIVE_CACHE_KEY, {
        session: newSession,
        messages: [],
        checkpoint: newCheckpoint,
        timestamp: Date.now(),
      });

      if (previousActive) {
        const archivedWithPrevious = [
          { ...previousActive, archived: true, updatedAt: new Date().toISOString() },
          ...get().archivedSessions.filter((session) => session.id !== previousActive.id),
        ];
        set({ archivedSessions: archivedWithPrevious });
        writeCache<CachedArchive>(ARCHIVE_CACHE_KEY, {
          sessions: archivedWithPrevious,
          timestamp: Date.now(),
        });
      }

      await get().loadArchivedSessions(true);

      return newSession;
    } catch (error) {
      console.error('[ChatSessionsStore] Failed to start a new chat session:', error);
      const message = error instanceof Error ? error.message : 'Failed to create new chat session';
      set({ lastError: message });
      throw error;
    } finally {
      set({ loadingActive: false });
    }
  },

  deleteArchivedSession: async (sessionId: string) => {
    try {
      await deleteSessionFromService(sessionId);

      set((state) => {
        const updatedSessions = state.archivedSessions.filter((session) => session.id !== sessionId);
        const { [sessionId]: _removed, ...rest } = state.previewCache;
        writeCache<CachedArchive>(ARCHIVE_CACHE_KEY, {
          sessions: updatedSessions,
          timestamp: Date.now(),
        });
        return {
          archivedSessions: updatedSessions,
          previewCache: rest,
        };
      });
    } catch (error) {
      console.error('[ChatSessionsStore] Failed to delete archived session:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete archived chat session';
      set({ lastError: message });
      throw error;
    }
  },

  clearPreview: (sessionId?: string) => {
    if (!sessionId) {
      set({ previewCache: {} });
      return;
    }

    set((state) => {
      if (!state.previewCache[sessionId]) {
        return state;
      }
      const { [sessionId]: _removed, ...rest } = state.previewCache;
      return { previewCache: rest };
    });
  },
}));

export type { ChatSession, ChatSessionMessage } from '@/services/chatSessionService';
