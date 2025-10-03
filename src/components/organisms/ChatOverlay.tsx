import React, { useRef, useEffect } from 'react';
import SphereChat from '@/components/atoms/SphereChat';
import { X } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  isCapturing: boolean;
  setIsCapturing: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  isCapturing,
  setIsCapturing,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const focusChatInput = () => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleQuickCapture = () => {
    setIsCapturing(!isCapturing);
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: chatInput,
        sender: 'user' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');

      // Simulate AI response
      setTimeout(() => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: "I'm processing your request. This is a demo response!",
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[600px] h-[700px] bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-white font-semibold">Chat with ATMO</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white/70" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center py-6 flex-shrink-0">
          <div
            className="relative"
            style={{
              filter: 'drop-shadow(0 0 15px rgba(204, 85, 0, 0.15))',
            }}
          >
            <SphereChat
              size={90}
              isActive={isCapturing}
              isListening={isCapturing}
              onClick={handleQuickCapture}
              voiceSupported={true}
            />

            {/* Subtle glow effects */}
            <div className={`absolute inset-0 -z-10 bg-[#CC5500]/10 rounded-full blur-xl transition-all duration-300 ${
              isCapturing ? 'animate-pulse scale-110' : 'animate-pulse-soft'
            }`}></div>
            <div className={`absolute inset-0 -z-20 bg-[#CC5500]/5 rounded-full blur-2xl scale-150 transition-all duration-300 ${
              isCapturing ? 'animate-pulse scale-125' : 'animate-pulse-soft'
            }`}></div>
          </div>

          {/* Voice Control X Button */}
          {isCapturing && (
            <div className="mt-4">
              <button
                onClick={() => setIsCapturing(false)}
                className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-lg flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Chat Messages Container - Scrollable */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-0"
          style={{
            scrollBehavior: 'smooth',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 100%)'
          }}
        >
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[slideIn_0.3s_ease-out]`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-[#CC5500]/80 to-[#CC5500]/60 text-white rounded-[18px] rounded-br-[6px]'
                    : 'bg-white/10 text-white/90 rounded-[18px] rounded-bl-[6px] backdrop-blur-sm border border-white/10'
                } shadow-lg`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <span className="text-[10px] opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input Box - fixed at bottom */}
        <div className="flex-shrink-0 p-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-3 shadow-xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none resize-none min-h-[32px] max-h-[120px] py-1 px-2 rounded-xl"
                rows={1}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#CC5500] to-[#CC5500]/80 hover:from-[#CC5500]/90 hover:to-[#CC5500]/70 disabled:from-white/10 disabled:to-white/5 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 shadow-lg"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
