import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useMockAuth';
import useVoiceRecognition from '@/hooks/useVoiceRecognition.ts';
import SphereChat from '../atoms/SphereChat.tsx';
import FullHeightChat from '../molecules/FullHeightChat.tsx';
import { promptStore } from "@/stores/promptStore.ts";
import { useToast } from '@/hooks/useToast.ts';
import { digitalBrainAPI } from '@/api/mockDigitalBrainApi';

interface CenterColumnProps {
    maxWidthPercent?: number;
}

const CenterColumn: React.FC<CenterColumnProps> = ({ maxWidthPercent = 100 }) => {
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
        toggleVoiceMessage,
        resetConversationState
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

    // Reset conversation state on component mount to ensure clean slate
    useEffect(() => {
        resetConversationState();
        setInteractionMode('idle');
    }, [resetConversationState]); // Only run on mount

    // Consolidated interaction mode management
    useEffect(() => {
        if (isListening || isVoiceMessage) {
            setInteractionMode('voice');
            // Automatically open chat interface when voice mode starts
            if (!isConversationStarted) {
                toggleConversationStarted();
            }
        } else if (isConversationStarted) {
            // Only switch to chat if conversation is explicitly started, not based on history
            setInteractionMode('chat');
        } else {
            setInteractionMode('idle');
        }
    }, [isListening, isVoiceMessage, isConversationStarted, toggleConversationStarted]);

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

    const showVoiceNotSupportedToast = () => {
        toast({
            title: "Voice Recognition Not Available",
            description: "Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.",
            duration: 30000,
        });
    };

    const handleSphereClick = () => {
        // Sphere is voice-only - start conversation if needed
        if (!isConversationStarted) {
            toggleConversationStarted();
        }

        // Handle voice functionality
        if (!isSupported) {
            showVoiceNotSupportedToast();
            return;
        }

        // Toggle voice-to-voice mode (sphere interaction)
        setVoiceSource('sphere');
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
        toggleVoiceMessage();
    };

    const handleChatMicClick = () => {
        if (!isSupported) {
            showVoiceNotSupportedToast();
            return;
        }

        // Voice-to-text mode (chat input mic)
        setVoiceSource('chat');
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }

        // Enable voice message mode to show avatar is listening
        if (!isVoiceMessage) {
            toggleVoiceMessage();
        }

        // Ensure chat is open for voice-to-text
        if (!isConversationStarted) {
            toggleConversationStarted();
        }
    };

    const handleStopVoiceMode = () => {
        console.log('Stopping voice mode - current states:', { isListening, isVoiceMessage, voiceSource });

        // Stop listening and clear all voice-related state
        if (isListening) {
            stopListening();
        }

        // Clear any pending auto-send timeouts
        if (transcriptTimeoutRef.current) {
            clearTimeout(transcriptTimeoutRef.current);
            transcriptTimeoutRef.current = null;
        }

        // Reset all voice states
        if (isVoiceMessage) {
            toggleVoiceMessage();
        }
        setVoiceSource(null);
        setIsTranscribing(false);

        // Force interaction mode back to appropriate state
        if (isConversationStarted) {
            setInteractionMode('chat');
        } else {
            setInteractionMode('idle');
        }

        console.log('Voice mode stopped successfully');
    };

    const handleStartChat = () => {
        setInteractionMode('chat');
        if (!isConversationStarted) {
            toggleConversationStarted();
        }
    };

    const handleEndChat = () => {
        // Reset conversation state and return to idle
        resetConversationState();
        setInteractionMode('idle');
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

    // Transform history to chat messages format
    const chatMessages = history.map((msg, index) => ({
        id: `msg-${index}`,
        content: msg.message,
        sender: msg.sender,
        timestamp: new Date()
    }));

    return (
        <div className="h-full flex flex-col bg-transparent relative overflow-hidden w-full">
            {/* Orange Sphere - Aligned with right card */}
            <div className="flex-shrink-0 flex flex-col items-center pt-44 pb-6 relative z-10">
                <div className="relative transition-all duration-700 ease-out mb-4">
                    <SphereChat
                        size={220}
                        onClick={handleSphereClick}
                        voiceSupported={isSupported}
                        isListening={isListening || isVoiceMessage}
                        isThinking={isResponding}
                        isResponding={isConversationStarted && !isResponding && history.length > 0}
                    />
                    
                    {/* Enhanced glow effects */}
                    <div className="absolute inset-0 -z-10 bg-[#FF7000]/20 rounded-full blur-2xl animate-pulse-soft"></div>
                    <div className="absolute inset-0 -z-20 bg-[#FF7000]/10 rounded-full blur-3xl scale-150 animate-pulse-soft"></div>
                    <div className="absolute inset-0 -z-30 bg-gradient-to-r from-[#FF7000]/5 to-purple-500/5 rounded-full blur-[100px] scale-200 animate-pulse-soft"></div>
                </div>

                {/* Enhanced Voice Control X Button */}
                {(isListening || isVoiceMessage) && (
                    <button
                        onClick={handleStopVoiceMode}
                        className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-400/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 hover:border-red-400/60 hover:text-red-300 hover:scale-105 transition-all duration-200 shadow-lg backdrop-blur-sm"
                        aria-label="Stop voice interaction"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Always-On Chat Interface - Width-Locked Panel */}
            <div className="flex-1">
                <FullHeightChat
                    messages={chatMessages}
                    currentMessage={input.message}
                    onMessageChange={addMessageToPrompt}
                    onSendMessage={handleSendMessage}
                    onMicClick={handleChatMicClick}
                    onAttachClick={undefined}
                    isMicActive={voiceSource === 'chat' && isListening}
                    isMicSupported={isSupported}
                    isResponding={isResponding}
                    disabled={isTranscribing || isListening}
                    placeholder={isTranscribing ? "Transcribing your voice..." : "Type your message..."}
                    showWelcome={!isConversationStarted}
                />
            </div>
        </div>
    );
};

export default CenterColumn;
