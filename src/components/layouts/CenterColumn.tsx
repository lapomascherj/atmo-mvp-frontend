import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useMockAuth';
import { Button } from '@/components/atoms/Button.tsx';
import useVoiceRecognition from '@/hooks/useVoiceRecognition.ts';
import SphereChat from '../atoms/SphereChat.tsx';
import ChatBox from '../molecules/ChatBox.tsx';
import VoiceModeUI from '../molecules/VoiceModeUI.tsx';
import { promptStore } from "@/stores/promptStore.ts";
import { useToast } from '@/hooks/useToast.ts';
import { digitalBrainAPI } from '@/api/mockDigitalBrainApi';
import { MessageSquare, Mic, MicOff } from 'lucide-react';

const CenterColumn: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [interactionMode, setInteractionMode] = useState<'idle' | 'voice' | 'chat'>('idle');
    // Track where voice was initiated from: sphere (voice-to-voice) or chat mic (voice-to-text)
    const [voiceSource, setVoiceSource] = useState<'sphere' | 'chat' | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const {
        history,
        input,
        currentTask,
        isVoiceMessage,
        isResponding,
        isConversationStarted,
        addMessageToPrompt,
        addToHistory,
        clearInput,
        clearTaskContext,
        toggleConversationStarted,
        toggleRespondingState,
        toggleVoiceMessage
    } = promptStore();

    const { startListening, stopListening, transcript, isListening, error: voiceError, isSupported } = useVoiceRecognition({
        onResult: (result) => {
            // Smart transcription logic - clean and format the text
            const cleanedTranscript = cleanTranscript(result);
            
            // Add to chat input in real-time
            addMessageToPrompt(cleanedTranscript);
            
            // Set transcription state
            setIsTranscribing(true);
            
            // Clear any existing timeout
            if (transcriptTimeoutRef.current) {
                clearTimeout(transcriptTimeoutRef.current);
            }
            
            // In chat mic mode we DO NOT auto-send. In sphere mode, we keep behavior to auto-send after pause.
            if (voiceSource === 'sphere') {
              transcriptTimeoutRef.current = setTimeout(() => {
                if (cleanedTranscript.trim()) {
                  handleSendMessage();
                  setIsTranscribing(false);
                }
              }, 3000);
            }
        },
        onStart: () => {
            setIsTranscribing(false);
        },
        onEnd: () => {
            // Finalize transcription after a short delay
            setTimeout(() => {
                setIsTranscribing(false);
            }, 1000);
        }
    });

    // Smart transcription cleaning function
    const cleanTranscript = (rawTranscript: string): string => {
        return rawTranscript
            .trim()
            // Capitalize first letter
            .replace(/^./, str => str.toUpperCase())
            // Remove common ASR artifacts
            .replace(/\buh\b|\bum\b|\ber\b/gi, '')
            // Clean up multiple spaces
            .replace(/\s+/g, ' ')
            // Ensure proper punctuation if missing
            .replace(/([.!?])?\s*$/, match => match.includes('.') || match.includes('!') || match.includes('?') ? match : '.');
    };

    // Auto-engage chat when voice mode is activated
    useEffect(() => {
        if (isVoiceMessage || isListening) {
            setInteractionMode('voice');
            
            // Automatically open chat interface when voice mode starts
            if (!isConversationStarted) {
                toggleConversationStarted();
            }
        } else if (isConversationStarted || history.length > 0) {
            setInteractionMode('chat');
        } else {
            setInteractionMode('idle');
        }
    }, [isListening, isVoiceMessage, isConversationStarted, history.length, toggleConversationStarted]);

    // Update interaction mode based on current state
    useEffect(() => {
        if (isListening || isVoiceMessage) {
            setInteractionMode('voice');
        } else if (isConversationStarted || history.length > 0) {
            setInteractionMode('chat');
        } else {
            setInteractionMode('idle');
        }
    }, [isListening, isVoiceMessage, isConversationStarted, history.length]);

    const handleSendMessage = () => {
        if (!input.message.trim()) return;

        if (!isConversationStarted) {
            toggleConversationStarted();
            setInteractionMode('chat');
        }

        addToHistory();
        toggleRespondingState();
        generateAIResponse();
    };

    const generateAIResponse = async () => {
        try {
            const response = await digitalBrainAPI.getHelp({
                message: input.message,
                context: currentTask ? { task: currentTask } : undefined
            });

            if (response.success && response.data.response) {
                addMessageToPrompt(response.data.response, 'ai');
                addToHistory();
            } else {
                // Fallback response
                const fallbackResponse = currentTask 
                    ? generateTaskSpecificFallback(currentTask, input.message)
                    : generateGeneralFallback(input.message);
                
                addMessageToPrompt(fallbackResponse, 'ai');
                addToHistory();
            }
        } catch (error) {
            console.error('Error generating AI response:', error);
            const fallbackResponse = "I'm having trouble connecting right now, but I'm here to help you plan and organize. What would you like to work on?";
            addMessageToPrompt(fallbackResponse, 'ai');
            addToHistory();
        } finally {
            toggleRespondingState();
            clearInput();
        }
    };

    const generateTaskSpecificFallback = (task: any, message: string) => {
        return `I can help you with "${task.name}". Here are some suggestions:

• Break it down into smaller, manageable steps
• Set a specific time block for focused work
• Consider what resources or tools you might need
• Think about potential obstacles and how to overcome them

What specific aspect would you like to focus on first?`;
    };

    const generateGeneralFallback = (message: string) => {
        return `I'm here to help you plan with intention and achieve your goals. While I'm working on getting fully connected, I can still assist you with:

• Organizing your tasks and priorities
• Breaking down complex projects
• Setting realistic timelines
• Staying motivated and focused

What would you like to work on today?`;
    };

    const handleSphereClick = () => {
        if (!isSupported) {
            toast({
                title: "Voice Recognition Not Available",
                description: "Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.",
                duration: 30000,
            });
            return;
        }

        // Enter/exit true voice-to-voice mode (keeps sphere visible above chat)
        setVoiceSource('sphere');
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
        toggleVoiceMessage();
    };

    // Chat input microphone: trigger voice-to-text, stay in chat mode, do not auto-send.
    const handleChatMicClick = () => {
        if (!isSupported) {
            toast({
                title: "Voice Recognition Not Available",
                description: "Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.",
                duration: 30000,
            });
            return;
        }
        setVoiceSource('chat');
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
        // Ensure chat is open
        if (!isConversationStarted) {
            toggleConversationStarted();
        }
        setInteractionMode('chat');
    };

    // NEW: Handle stopping voice mode completely
    const handleStopVoiceMode = () => {
        // Stop listening if active
        if (isListening) {
            stopListening();
        }
        
        // Clear any pending timeouts
        if (transcriptTimeoutRef.current) {
            clearTimeout(transcriptTimeoutRef.current);
            transcriptTimeoutRef.current = null;
        }
        
        // Reset voice state
        if (isVoiceMessage) {
            toggleVoiceMessage();
        }
        setVoiceSource(null);
        
        // Reset transcription state
        setIsTranscribing(false);
        
        // Return to chat mode if conversation exists, otherwise idle
        if (isConversationStarted || history.length > 0) {
            setInteractionMode('chat');
        } else {
            setInteractionMode('idle');
        }
    };

    const handleStartChat = () => {
        setInteractionMode('chat');
        if (!isConversationStarted) {
            toggleConversationStarted();
        }
    };

    const handleEndChat = () => {
        setInteractionMode('idle');
        // Don't clear conversation history, just change mode
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Show toast notification for voice errors - ONLY when actually triggered
    useEffect(() => {
        // Only show error if:
        // 1. There is actually an error from useVoiceRecognition
        // 2. User has attempted to use voice recognition (isListening or was listening)
        // 3. Voice recognition is supported (to avoid showing error for unsupported browsers)
        if (voiceError && (isListening || isVoiceMessage) && isSupported) {
            toast({
                title: "Voice Recognition Issue",
                description: voiceError,
                duration: 30000, // 30 seconds
                variant: "destructive",
            });
        }
    }, [voiceError, isListening, isVoiceMessage, isSupported, toast]);

    return (
        <div className="h-full flex items-start justify-center relative pt-20">
            {/* Central Sphere - The Avatar (hidden when chat is active) - Horizontally adjusted */}
            {interactionMode === 'idle' && (
                <div className="flex flex-col items-center translate-x-12">
                    <div className="relative transition-all duration-700 ease-out mb-16 transform translate-y-0 scale-125">
                        <SphereChat
                            size={260}
                            onClick={handleSphereClick}
                            voiceSupported={isSupported}
                            isListening={false}
                            isThinking={isResponding}
                            isResponding={isConversationStarted && !isResponding && history.length > 0}
                        />
                        
                        {/* Enhanced glow effects for idle mode */}
                        <div className="absolute inset-0 -z-10 bg-[#FF7000]/20 rounded-full blur-2xl animate-pulse-soft"></div>
                        <div className="absolute inset-0 -z-20 bg-[#FF7000]/10 rounded-full blur-3xl scale-150 animate-pulse-soft"></div>
                        <div className="absolute inset-0 -z-30 bg-gradient-to-r from-[#FF7000]/5 to-purple-500/5 rounded-full blur-[100px] scale-200 animate-pulse-soft"></div>
                    </div>

                    {/* Welcome Message Below Avatar */}
                    <div className="text-center animate-in fade-in-0 duration-500">
                        <h2 className="text-3xl font-light text-white mb-4">
                            Welcome back, {user?.nickname || 'there'}
                        </h2>
                        <p className="text-slate-400 mb-6 max-w-md">
                            I'm your AI mentor. Click me to speak, or start a conversation below.
                        </p>
                        
                        {/* Quick Action Buttons */}
                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={handleStartChat}
                                className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Start Chat
                            </Button>
                            
                            {/* Icon-only mic button replacing the labeled Voice Mode */}
                            {isSupported && (
                              <Button
                                onClick={handleSphereClick}
                                variant="outline"
                                size="icon"
                                aria-label="Voice mode"
                                className="bg-slate-800/30 border-slate-600 text-slate-300 hover:bg-slate-700/40"
                              >
                                <Mic className="w-4 h-4" />
                              </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Voice Mode UI - NEW: Enhanced UX with stop control */}
            {interactionMode === 'voice' && (
                <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-start pt-16 animate-in fade-in-0 duration-500">
                    {/* Voice Mode Interface */}
                    <div className="mb-8">
                        <VoiceModeUI
                            isListening={isListening}
                            isSupported={isSupported}
                            onSphereClick={handleSphereClick}
                            onStopVoiceMode={handleStopVoiceMode}
                        />
                    </div>

                    {/* Auto-engaged Chat Interface - appears below voice UI */}
                    <div className="w-full h-3/5 mx-4 flex items-center justify-center">
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full h-full shadow-2xl flex flex-col">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#FF7000]/20 flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4 text-[#FF7000]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">ATMO Assistant - Voice Mode</h3>
                                        <p className="text-slate-400 text-sm">
                                            {isTranscribing ? 'Transcribing...' : 'Speak naturally, I\'ll understand'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleStopVoiceMode}
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-white"
                                >
                                    Exit Voice
                                </Button>
                            </div>

                            {/* Chat Content Area */}
                            <div className="flex-1 overflow-hidden pb-4">
                                <ChatBox
                                    messages={history}
                                    currentMessage={input.message}
                                    isResponding={isResponding}
                                    isConversationStarted={isConversationStarted}
                                    onMessageChange={addMessageToPrompt}
                                    onSendMessage={handleSendMessage}
                                    onKeyDown={handleKeyDown}
                                    userName={user?.nickname || 'there'}
                                    placeholder={isTranscribing ? "Transcribing your voice..." : "Voice input will appear here..."}
                                    disabled={isTranscribing || isListening} // Disable manual input during voice
                                    // Mic inside ChatBox mirrors sphere voice state
                                    onMicClick={handleChatMicClick}
                                    isMicActive={voiceSource === 'chat' && isListening}
                                    isMicSupported={isSupported}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Interface - Sheet Style (when not in voice mode) */}
            {interactionMode === 'chat' && (
                <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center animate-in fade-in-0 duration-500">
                    {/* Chat Sheet - Full Width */}
                    <div className="relative w-full h-full mx-4 flex items-center justify-center">
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full h-5/6 shadow-2xl flex flex-col">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#FF7000]/20 flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4 text-[#FF7000]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">ATMO Assistant</h3>
                                        <p className="text-slate-400 text-sm">Ready to help you plan with intention</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isSupported && (
                                        <Button
                                            onClick={handleSphereClick}
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Voice mode"
                                            className="text-slate-400 hover:text-white"
                                        >
                                            <Mic className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleEndChat}
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-white"
                                    >
                                        Minimize
                                    </Button>
                                </div>
                            </div>

                            {/* Chat Content Area - Full Width with Input at Bottom */}
                            <div className="flex-1 overflow-hidden pb-4">
                                <ChatBox
                                    messages={history}
                                    currentMessage={input.message}
                                    isResponding={isResponding}
                                    isConversationStarted={isConversationStarted}
                                    onMessageChange={addMessageToPrompt}
                                    onSendMessage={handleSendMessage}
                                    onKeyDown={handleKeyDown}
                                    userName={user?.nickname || 'there'}
                                    placeholder="Share your thoughts or ask for help..."
                                    onMicClick={handleChatMicClick}
                                    isMicActive={voiceSource === 'chat' && isListening}
                                    isMicSupported={isSupported}
                                />
                            </div>
                        </div>

                        {/* Avatar positioned 1/4 in, 3/4 out on top edge, horizontally adjusted 3rem right */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 translate-x-12 -translate-y-1/4 z-10">
                            <div className="animate-pulse-soft">
                                <SphereChat
                                    onClick={handleSphereClick}
                                    voiceSupported={isSupported}
                                    isListening={isVoiceMessage || isListening}
                                    isThinking={isResponding}
                                    isResponding={isConversationStarted && !isResponding && history.length > 0}
                                />
                            </div>
                            {/* Enhanced glow effect */}
                            <div className="absolute inset-0 -z-10 bg-[#FF7000]/25 rounded-full blur-xl animate-pulse-soft"></div>
                            <div className="absolute inset-0 -z-20 bg-[#FF7000]/10 rounded-full blur-2xl scale-150 animate-pulse-soft"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Action Suggestions for Chat Mode - Full Width */}
            {interactionMode === 'chat' && !isConversationStarted && (
                <div className="absolute bottom-24 left-0 right-0 px-6 z-20">
                    <div className="flex justify-center gap-3 flex-wrap w-full">
                        {[
                            "Plan my day",
                            "Review my goals", 
                            "What should I focus on?",
                            "Help with my project"
                        ].map((action) => (
                            <Button
                                key={action}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    addMessageToPrompt(action);
                                    handleSendMessage();
                                }}
                                className="bg-slate-800/40 border-slate-600/40 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-[#FF7000]/40 transition-all duration-300 backdrop-blur-sm"
                            >
                                {action}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CenterColumn;
