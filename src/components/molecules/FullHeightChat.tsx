import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Paperclip, Mic, MicOff, Send } from 'lucide-react';
import { cn } from '@/utils/utils';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface FullHeightChatProps {
  messages: ChatMessage[];
  currentMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onMicClick?: () => void;
  isMicActive?: boolean;
  isMicSupported?: boolean;
  isResponding?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showWelcome?: boolean;
}

const FullHeightChat: React.FC<FullHeightChatProps> = ({
  messages,
  currentMessage,
  onMessageChange,
  onSendMessage,
  onMicClick,
  isMicActive = false,
  isMicSupported = true,
  isResponding = false,
  disabled = false,
  placeholder = "Type your message...",
  showWelcome = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentMessage.trim() && !disabled) {
        onSendMessage();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">
      {/* Messages Area - Properly Spaced, Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-track-gray-900/20 scrollbar-thumb-gray-600/40">
        {showWelcome || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/40">
              <p className="text-base font-light">Start a conversation</p>
              <p className="text-xs mt-2 opacity-70">Ask me anything about your goals and projects</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn(
                  "flex w-full",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 relative group font-mono text-sm leading-relaxed",
                    message.sender === 'user'
                      ? "bg-black border border-[#FF7000]/50 text-white"
                      : "bg-gray-900/40 border border-gray-700/40 text-white"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div
                    className={cn(
                      "text-xs mt-1 opacity-30 group-hover:opacity-60 transition-opacity font-sans",
                      message.sender === 'user' ? "text-[#FF7000]/50" : "text-white/30"
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* AI Typing Indicator */}
            {isResponding && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-900/40 border border-gray-700/40 text-white">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-[#FF7000] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#FF7000] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-[#FF7000] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-white/60 font-mono">thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Tech-Style Input Bar - Proportional Width */}
      <div className="flex-shrink-0 bg-black px-4 py-4 border-t border-white/5">
        <div className="flex items-center space-x-3">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-[#FF7000] hover:bg-[#FF7000]/10 transition-all duration-200 h-8 w-8"
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Tech Input Field - Full Width */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "w-full h-10 bg-gray-900/60 border border-gray-700/60 rounded-xl px-4 py-2",
                "text-white placeholder-white/40 font-mono text-sm",
                "focus:border-[#FF7000]/80 focus:ring-1 focus:ring-[#FF7000]/30 focus:outline-none",
                "hover:border-gray-600/80 transition-all duration-200",
                "shadow-sm backdrop-blur-sm"
              )}
            />
          </div>

          {/* Microphone Button */}
          {isMicSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMicClick}
              disabled={disabled}
              className={cn(
                "transition-all duration-200 h-8 w-8",
                isMicActive
                  ? "text-[#FF7000] bg-[#FF7000]/20 hover:bg-[#FF7000]/30"
                  : "text-white/40 hover:text-[#FF7000] hover:bg-[#FF7000]/10"
              )}
            >
              {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}

          {/* Send Button */}
          <Button
            onClick={onSendMessage}
            disabled={!currentMessage.trim() || disabled}
            size="icon"
            className={cn(
              "bg-[#FF7000] hover:bg-[#FF7000]/90 text-white transition-all duration-200 h-8 w-8",
              "hover:scale-105 active:scale-95",
              (!currentMessage.trim() || disabled) && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FullHeightChat;
