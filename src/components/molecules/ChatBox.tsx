import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/atoms/Button.tsx';
import { Input } from '@/components/atoms/Input.tsx';
import { Mic } from 'lucide-react';

interface ChatMessage {
  message: string;
  sender: 'user' | 'ai';
}

interface ChatBoxProps {
  messages: ChatMessage[];
  currentMessage: string;
  isResponding: boolean;
  isConversationStarted: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  userName?: string;
  disabled?: boolean;
  // Optional voice-to-text controls for chat input
  onMicClick?: () => void;
  isMicActive?: boolean;
  isMicSupported?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  currentMessage,
  isResponding,
  isConversationStarted,
  onMessageChange,
  onSendMessage,
  onKeyDown,
  placeholder = "Type your message here...",
  userName = "there",
  disabled = false,
  onMicClick,
  isMicActive = false,
  isMicSupported = true
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      {/* Chat History - Flexible scrollable area */}
      <div className="flex-1 overflow-y-auto mb-6">
        <div className="space-y-4">
          {/* Welcome Message - Always shown as first message from ATMO */}
          {!isConversationStarted || messages.length === 0 ? (
            <div className="flex justify-start">
              <div
                className="max-w-[80%] px-5 py-3 rounded-2xl text-sm transition-all duration-200 bg-slate-800/40 text-slate-100 border border-slate-600/20 mr-4 backdrop-blur-sm"
              >
                Welcome back, {userName}! I'm your AI mentor, ready to help you plan with intention. What would you like to accomplish today?
              </div>
            </div>
          ) : (
            /* Real Chat Messages */
            <>
              {messages.slice(-8).map((message, index) => (
                <div key={`${message.sender}-${index}-${message.message.substring(0, 20)}`} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm transition-all duration-200 ${
                      message.sender === 'user'
                        ? 'bg-[#FF7000]/15 text-orange-100 border border-[#FF7000]/20 ml-4 backdrop-blur-sm'
                        : 'bg-slate-800/40 text-slate-100 border border-slate-600/20 mr-4 backdrop-blur-sm'
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isResponding && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/40 text-slate-100 border border-slate-600/20 mr-4 backdrop-blur-sm px-5 py-3 rounded-2xl text-sm">
                    <div className="flex items-center gap-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="ml-2 text-slate-400">ATMO is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Area - Always at bottom */}
      <div className="flex-shrink-0 relative">
        <Input
          placeholder={placeholder}
          // Increased padding-right to accommodate mic + send buttons
          className="bg-slate-800/40 border-slate-600/20 text-white placeholder:text-slate-400 pr-28 rounded-2xl focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20 transition-all duration-300 backdrop-blur-sm h-12 text-sm"
          value={currentMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isResponding || disabled}
        />
        {/* Mic icon for voice-to-text transcription inside chat input */}
        {isMicSupported && (
          <Button
            size="icon"
            onClick={onMicClick}
            aria-label="Start voice input"
            className={`absolute right-12 top-2 h-8 w-8 rounded-full transition-all duration-200 ${
              isMicActive
                ? 'bg-[#FF7000] text-white animate-pulse shadow-lg shadow-[#FF7000]/30'
                : 'bg-slate-700/70 hover:bg-slate-700/90 text-white'
            }`}
            disabled={isResponding || disabled}
          >
            <Mic size={16} />
          </Button>
        )}
        <Button
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-[#FF7000] hover:bg-[#FF7000]/90 text-white transition-all duration-200 shadow-lg shadow-[#FF7000]/30"
          onClick={onSendMessage}
          disabled={!currentMessage.trim() || isResponding}
        >
          <Send size={16}/>
        </Button>
      </div>
    </div>
  );
};

export default ChatBox; 