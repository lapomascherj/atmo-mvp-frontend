import React, { useRef, useEffect, useState, useCallback } from 'react';
import SphereChat from '@/components/atoms/SphereChat';
import { X } from 'lucide-react';
import { usePersonasStore } from '@/stores/usePersonasStore';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // State for dragging and blur - SIMPLIFIED
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isBlurred, setIsBlurred] = useState(true);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialModalPos, setInitialModalPos] = useState({ x: 0, y: 0 });

  // BULLETPROOF DRAG SYSTEM - SIMPLE AND CLEAN
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging from header, but exclude buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-drag')) {
      return;
    }
    
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
      e.preventDefault();
      e.stopPropagation();
      
      // Store initial positions - NO OFFSET CALCULATION
      setInitialMousePos({ x: e.clientX, y: e.clientY });
      setInitialModalPos({ x: position.x, y: position.y });
      setIsDragging(true);
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate how much the mouse has moved from initial position
      const deltaX = e.clientX - initialMousePos.x;
      const deltaY = e.clientY - initialMousePos.y;
      
      // Add the movement to the initial modal position
      const newX = initialModalPos.x + deltaX;
      const newY = initialModalPos.y + deltaY;
      
      // Get viewport dimensions and modal dimensions dynamically
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalRect = modalRef.current?.getBoundingClientRect();
      const modalWidth = modalRect?.width || 600;
      const modalHeight = modalRect?.height || 700;
      
      // Allow movement to all edges with minimal padding (5px)
      const padding = 5;
      const minX = -modalWidth + padding; // Allow moving mostly off-screen to the left
      const maxX = viewportWidth - padding; // Allow moving mostly off-screen to the right
      const minY = -modalHeight + 100; // Keep header visible when moving up
      const maxY = viewportHeight - padding; // Allow moving mostly off-screen down
      
      const boundedX = Math.max(minX, Math.min(maxX, newX));
      const boundedY = Math.max(minY, Math.min(maxY, newY));
      
      // Use requestAnimationFrame for ultra-smooth 60fps movement
      requestAnimationFrame(() => {
        setPosition({ x: boundedX, y: boundedY });
      });
    }
  }, [isDragging, initialMousePos, initialModalPos]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  }, [isDragging]);

  // Touch handlers - SIMPLIFIED
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-drag')) {
      return;
    }
    
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      setInitialMousePos({ x: touch.clientX, y: touch.clientY });
      setInitialModalPos({ x: position.x, y: position.y });
      setIsDragging(true);
    }
  }, [position]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      
      // Calculate movement delta
      const deltaX = touch.clientX - initialMousePos.x;
      const deltaY = touch.clientY - initialMousePos.y;
      
      // Apply to initial position
      const newX = initialModalPos.x + deltaX;
      const newY = initialModalPos.y + deltaY;
      
      // Get viewport dimensions and modal dimensions dynamically
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalRect = modalRef.current?.getBoundingClientRect();
      const modalWidth = modalRect?.width || 600;
      const modalHeight = modalRect?.height || 700;
      
      // Allow movement to all edges with minimal padding (5px)
      const padding = 5;
      const minX = -modalWidth + padding; // Allow moving mostly off-screen to the left
      const maxX = viewportWidth - padding; // Allow moving mostly off-screen to the right
      const minY = -modalHeight + 100; // Keep header visible when moving up
      const maxY = viewportHeight - padding; // Allow moving mostly off-screen down
      
      const boundedX = Math.max(minX, Math.min(maxX, newX));
      const boundedY = Math.max(minY, Math.min(maxY, newY));
      
      // Use requestAnimationFrame for ultra-smooth touch movement
      requestAnimationFrame(() => {
        setPosition({ x: boundedX, y: boundedY });
      });
    }
  }, [isDragging, initialMousePos, initialModalPos]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  }, [isDragging]);
  const handleHeaderDoubleClick = useCallback((e: React.MouseEvent) => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
      setIsBlurred(!isBlurred);
    }
    setLastClickTime(currentTime);
  }, [lastClickTime, isBlurred]);

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Ultra-smooth event listeners with performance optimizations
  useEffect(() => {
    if (isDragging) {
      const options = { passive: false, capture: true };
      
      document.addEventListener('mousemove', handleMouseMove, options);
      document.addEventListener('mouseup', handleMouseUp, options);
      document.addEventListener('touchmove', handleTouchMove, options);
      document.addEventListener('touchend', handleTouchEnd, options);
      
      // Enhanced drag styling for better performance
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.WebkitUserSelect = 'none';
      document.body.style.MozUserSelect = 'none';
      document.body.style.msUserSelect = 'none';
      document.body.style.WebkitTouchCallout = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Optimize rendering during drag
      document.body.style.textRendering = 'optimizeSpeed';
      document.body.style.imageRendering = 'auto';
      
      if (modalRef.current) {
        modalRef.current.style.pointerEvents = 'auto';
      }
    }

    return () => {
      const options = { passive: false, capture: true };
      document.removeEventListener('mousemove', handleMouseMove, options);
      document.removeEventListener('mouseup', handleMouseUp, options);
      document.removeEventListener('touchmove', handleTouchMove, options);
      document.removeEventListener('touchend', handleTouchEnd, options);
      
      // Reset all styles
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.WebkitUserSelect = '';
      document.body.style.MozUserSelect = '';
      document.body.style.msUserSelect = '';
      document.body.style.WebkitTouchCallout = '';
      document.body.style.pointerEvents = '';
      document.body.style.textRendering = '';
      document.body.style.imageRendering = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

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

  const sendChatMessage = usePersonasStore(state => state.sendChatMessage);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (chatInput.trim() && !isLoading) {
      const userMessageText = chatInput.trim();

      // Add user message
      const newMessage = {
        id: Date.now().toString(),
        text: userMessageText,
        sender: 'user' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
      setIsLoading(true);

      try {
        // Call Claude AI via Supabase edge function
        const response = await sendChatMessage(userMessageText);

        // Add AI response
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Failed to send message:', error);

        // Show detailed error message to user
        let errorText = 'Sorry, I encountered an error. Please try again.';
        if (error instanceof Error) {
          errorText = error.message;
          // If it's an auth error, provide clearer message
          if (error.message.includes('login') || error.message.includes('auth')) {
            errorText = 'You must be logged in to use chat. Please refresh the page and sign in.';
          }
        }

        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Semi-transparent backdrop - allows seeing background */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ${
          isBlurred ? 'bg-black/20 backdrop-blur-sm' : 'bg-black/10'
        }`}
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Draggable Modal - ULTRA SMOOTH & FREE MOVEMENT */}
      <div
        ref={modalRef}
        className={`w-[600px] h-[700px] bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden ${
          isDragging ? 'transition-none select-none' : 'transition-all duration-300 ease-out'
        }`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          pointerEvents: 'auto',
          backdropFilter: isBlurred ? 'blur(20px)' : 'blur(5px)',
          boxShadow: isDragging 
            ? '0 30px 60px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15)' 
            : '0 20px 40px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          willChange: isDragging ? 'transform' : 'auto',
          zIndex: isDragging ? 9999 : 'auto',
          // Enhanced GPU acceleration for ultra-smooth movement
          contain: 'layout style paint',
          isolation: 'isolate',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          // Ensure smooth rendering during movement
          imageRendering: 'auto',
          textRendering: 'optimizeSpeed'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Draggable Header */}
        <div 
          ref={headerRef}
          className={`flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 transition-all duration-200 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onClick={handleHeaderDoubleClick}
          style={{ userSelect: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {/* macOS-style window controls */}
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors"></div>
            </div>
            <h3 className="text-white font-semibold">Chat with ATMO</h3>
            {!isBlurred && (
              <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
                Transparent Mode
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-white/40 hidden sm:block">
              Double-click to toggle blur
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white/70" />
            </button>
          </div>
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
          {isLoading && (
            <div className="flex justify-start animate-[slideIn_0.3s_ease-out]">
              <div className="max-w-[85%] px-3 py-2 bg-white/10 text-white/90 rounded-[18px] rounded-bl-[6px] backdrop-blur-sm border border-white/10 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-white/60">ATMO is thinking...</span>
                </div>
              </div>
            </div>
          )}
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
                disabled={!chatInput.trim() || isLoading}
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
