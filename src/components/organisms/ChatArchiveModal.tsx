import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2, Calendar, MessageCircle } from 'lucide-react';
import {
  useChatSessionsStore,
  type ChatSession,
  type ChatSessionMessage,
} from '@/stores/chatSessionsStore';

interface ChatArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (sessionId: string) => Promise<void>;
}

export const ChatArchiveModal: React.FC<ChatArchiveModalProps> = ({
  isOpen,
  onClose,
  onLoadSession
}) => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatSessionMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'preview'>('list');

  const archivedSessions = useChatSessionsStore((state) => state.archivedSessions);
  const loadArchivedSessions = useChatSessionsStore((state) => state.loadArchivedSessions);
  const previewArchivedSession = useChatSessionsStore((state) => state.previewArchivedSession);
  const activateArchivedSession = useChatSessionsStore((state) => state.activateArchivedSession);
  const deleteArchivedSession = useChatSessionsStore((state) => state.deleteArchivedSession);
  const loadingArchive = useChatSessionsStore((state) => state.loadingArchive);
  const loadingActive = useChatSessionsStore((state) => state.loadingActive);
  const clearPreview = useChatSessionsStore((state) => state.clearPreview);

  // Load archived sessions
  useEffect(() => {
    if (isOpen) {
      void loadArchivedSessions();
    } else {
      setSelectedSession(null);
      setSessionMessages([]);
      setViewMode('list');
      clearPreview();
    }
  }, [isOpen, loadArchivedSessions, clearPreview]);

  const handleSessionClick = async (session: ChatSession) => {
    try {
      setLoading(true);
      const messages = await previewArchivedSession(session.id);
      setSessionMessages(messages);
      setSelectedSession(session);
      setViewMode('preview');
    } catch (error) {
      console.error('Failed to load session messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);

      await activateArchivedSession(selectedSession.id);
      await onLoadSession(selectedSession.id);
      onClose();
    } catch (error) {
      console.error('Failed to load session:', error);
      alert('Failed to load chat session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat? This cannot be undone.')) return;

    try {
      await deleteArchivedSession(sessionId);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setSessionMessages([]);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              {viewMode === 'list' ? 'Chat Archive' : 'Chat Preview'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
              {viewMode === 'list' ? (
                /* Session List */
                <div className="h-full overflow-y-auto p-6">
              {loadingArchive && archivedSessions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400">Loading archived chats...</div>
                </div>
              ) : archivedSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg mb-2">No archived chats yet</p>
                  <p className="text-slate-500 text-sm">
                    Start a new chat and it will be archived here when you begin another
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleSessionClick(session)}
                      className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-4 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium mb-1 truncate">
                            {session.title || 'Untitled Chat'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{session.messageCount} messages</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(session.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Message Preview */
            <div className="h-full flex flex-col">
              {/* Preview Header */}
              <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700">
                <button
                  onClick={() => setViewMode('list')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ← Back to archive
                </button>
                <h3 className="text-white font-medium mt-2 truncate">
                  {selectedSession?.title || 'Untitled Chat'}
                </h3>
                <p className="text-sm text-slate-400">
                  {selectedSession && formatDate(selectedSession.createdAt)} • {sessionMessages.length} messages
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {sessionMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-100 border border-slate-700'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load Button */}
              <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700">
                <button
                  onClick={handleLoadSession}
                  disabled={loading || loadingActive}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  Load This Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
