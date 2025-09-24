import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Paperclip, Send } from 'lucide-react';
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
  onAttachClick?: () => void;
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
  onAttachClick,
  isMicActive = false,
  isMicSupported = true,
  isResponding = false,
  disabled = false,
  placeholder = "Type your message...",
  showWelcome = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // For now, just show the file names in chat
      const fileNames = files.map(file => file.name).join(', ');
      onMessageChange(`📎 Attached files: ${fileNames}`);
      console.log('Files selected:', files);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      {/* ATMO Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin scrollbar-track-gray-900/20 scrollbar-thumb-gray-600/40 min-h-0">
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
                  "flex w-full gap-3",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {/* ATMO AI Avatar */}
                {message.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-sm bg-orange-500" />
                  </div>
                )}

                <div className="max-w-[70%] relative group">
                  {/* ATMO Message Bubble */}
                  <div
                    className={cn(
                      "px-4 py-3 text-sm leading-relaxed transition-all duration-200",
                      message.sender === 'user'
                        ? "bg-orange-500/10 border border-orange-500/20 text-white rounded-xl"
                        : "bg-white/5 border border-white/10 text-white rounded-xl"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words font-normal">
                      {message.content}
                    </p>
                  </div>

                  {/* ATMO Timestamp */}
                  <div
                    className={cn(
                      "text-xs mt-1.5 opacity-30 group-hover:opacity-50 transition-opacity font-normal",
                      message.sender === 'user' ? "text-right text-orange-400/60" : "text-left text-white/30"
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {/* ATMO User Avatar */}
                {message.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-sm bg-orange-500" />
                  </div>
                )}
              </div>
            ))}

            {/* ATMO AI Typing Indicator */}
            {isResponding && (
              <div className="flex w-full gap-3 justify-start">
                {/* AI Avatar */}
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-sm bg-orange-500 animate-pulse" />
                </div>

                <div className="max-w-[70%] relative">
                  <div className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                      <span className="text-sm text-white/60 font-normal">thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ATMO Input Bar */}
      <div className="flex-shrink-0 bg-transparent px-5 py-4 border-t border-white/10">
        <div className="flex items-center space-x-3">
          {/* ATMO Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileUpload}
            className="text-white/40 hover:text-orange-500 hover:bg-orange-500/10 transition-all duration-200 h-10 w-10 rounded-lg border border-white/10 hover:border-orange-500/20"
            disabled={disabled}
            title="Attach Files"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* ATMO Input Field */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "w-full h-10 bg-white/5 border border-white/15 rounded-lg px-4 py-2",
                "text-white placeholder-white/40 text-sm font-normal",
                "focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 focus:outline-none",
                "hover:border-white/25 transition-all duration-200"
              )}
            />
          </div>

          {/* ATMO Send Button */}
          <Button
            onClick={onSendMessage}
            disabled={!currentMessage.trim() || disabled}
            size="icon"
            className={cn(
              "bg-orange-500 hover:bg-orange-400 text-white transition-all duration-200 h-10 w-10 rounded-lg",
              "hover:scale-105 active:scale-95",
              (!currentMessage.trim() || disabled) && "opacity-40 cursor-not-allowed hover:scale-100"
            )}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

export default FullHeightChat;