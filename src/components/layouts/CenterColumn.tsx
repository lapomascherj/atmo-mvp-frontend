import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useMockAuth';
import useVoiceRecognition from '@/hooks/useVoiceRecognition.ts';
import SphereChat from '../atoms/SphereChat.tsx';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Paperclip, Send } from 'lucide-react';
import { cn } from '@/utils/utils';
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
    const [voiceSource, setVoiceSource] = useState<'sphere' | 'chat' | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isAvatarInForeground, setIsAvatarInForeground] = useState(false);
    const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
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
            const cleanedTranscript = cleanTranscript(result);
            
            if (voiceSource === 'sphere') {
                // Voice-to-voice: Add to history and get AI response
                addMessageToPrompt(cleanedTranscript, 'user');
                addToHistory();
                handleAIResponse(cleanedTranscript);
            } else {
                // Voice-to-text: Add to input field
                addMessageToPrompt(cleanedTranscript, 'user');
            }
            
            setIsTranscribing(false);
            setVoiceSource(null);
        },
        onError: (error) => {
            console.error('Voice recognition error:', error);
            setIsTranscribing(false);
            setVoiceSource(null);
        }
    });

    // Reset conversation state on component mount to ensure clean start
    useEffect(() => {
        resetConversationState();
    }, [resetConversationState]);

    // Clean up transcription timeout on unmount
    useEffect(() => {
        return () => {
            if (transcriptTimeoutRef.current) {
                clearTimeout(transcriptTimeoutRef.current);
            }
        };
    }, []);

    // Handle real-time transcript updates
    useEffect(() => {
        if (transcript && isListening) {
            setIsTranscribing(true);

            // Clear existing timeout
            if (transcriptTimeoutRef.current) {
                clearTimeout(transcriptTimeoutRef.current);
            }

            // Set new timeout for when transcript stops updating
            transcriptTimeoutRef.current = setTimeout(() => {
                setIsTranscribing(false);
            }, 1500);
        }
    }, [transcript, isListening]);

    // Auto-scroll to bottom when new messages arrive (like WhatsApp)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const cleanTranscript = (text: string): string => {
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^(um|uh|er|ah)\s+/i, '')
            .replace(/\s+(um|uh|er|ah)(\s+|$)/gi, ' ')
            .trim();
    };

    const handleSphereClick = () => {
        // Toggle avatar foreground state
        setIsAvatarInForeground(!isAvatarInForeground);

        if (isListening) {
            stopListening();
            setInteractionMode('idle');
            setVoiceSource(null);
        } else if (isSupported && !isResponding && !isTranscribing) {
            // Prevent activation while AI is responding or transcribing
            setVoiceSource('sphere');
            setInteractionMode('voice');
            if (!isConversationStarted) {
                toggleConversationStarted();
            }
            startListening();
        }
    };

    const handleAIResponse = async (userMessage: string) => {
        try {
            toggleRespondingState();
            
            const response = await digitalBrainAPI.sendMessage(userMessage, {
                conversationHistory: history,
                currentTask: currentTask || undefined,
                userName: user?.nickname || 'User'
            });

            // Add AI response to history using addAIResponse function
            const { addAIResponse } = promptStore.getState();
            addAIResponse(response.message);

            if (response.task) {
                // Handle task context if needed
            }

        } catch (error) {
            console.error('Error getting AI response:', error);
            const { addAIResponse } = promptStore.getState();
            addAIResponse("I'm having trouble processing your request right now. Please try again.");
        }
    };

    const handleSendMessage = async () => {
        const messageText = input.message?.trim();
        if (!messageText || isResponding) return; // Prevent sending while AI is responding

        if (!isConversationStarted) {
            toggleConversationStarted();
        }

        // Message is already in input from user typing, just add to history
        addToHistory();
        clearInput(); // Clear input immediately after adding to history

        await handleAIResponse(messageText);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit'
        });
    };

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Handle file upload logic here
            console.log('Files selected:', Array.from(files).map(f => f.name));
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="h-full relative bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 overflow-hidden w-full">

            {/* Avatar - Centered initially, moves UP when conversation starts */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-700 ease-out ${
                isAvatarInForeground ? 'z-50' : 'z-30'
            } ${
                history.length > 0 ? 'top-16 md:top-20' : 'top-1/2 -translate-y-1/2'
            }`}
            style={{
                filter: 'drop-shadow(0 0 20px rgba(204, 85, 0, 0.15))',
            }}>
                <div className="relative transition-all duration-700 ease-out">
                    <SphereChat
                        size={history.length > 0 ? 160 : 220}
                        onClick={handleSphereClick}
                        voiceSupported={isSupported}
                        isListening={isListening || isVoiceMessage}
                        isThinking={isResponding}
                        isResponding={isConversationStarted && !isResponding && history.length > 0}
                    />

                    {/* Subtle glow effects with activity pulse */}
                    <div className={`absolute inset-0 -z-10 bg-[#CC5500]/12 rounded-full blur-2xl transition-all duration-300 ${
                        isResponding ? 'animate-pulse scale-110' : 'animate-pulse-soft'
                    }`}></div>
                    <div className={`absolute inset-0 -z-20 bg-[#CC5500]/6 rounded-full blur-3xl scale-150 transition-all duration-300 ${
                        isResponding ? 'animate-pulse scale-125' : 'animate-pulse-soft'
                    }`}></div>
                    <div className="absolute inset-0 -z-30 bg-gradient-to-r from-[#CC5500]/3 to-indigo-500/2 rounded-full blur-[80px] scale-200 animate-pulse-soft"></div>
                </div>

                {/* Voice Control X Button */}
                {(isListening || isVoiceMessage) && (
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                        <Button
                            onClick={() => {
                                stopListening();
                                setInteractionMode('idle');
                                setVoiceSource(null);
                            }}
                            variant="ghost"
                            size="sm"
                            className="w-10 h-10 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-lg"
                        >
                            ✕
                        </Button>
                    </div>
                )}
            </div>

            {/* Custom ATMO Scrollbar Styles */}
            <style jsx>{`
                .atmo-scrollbar {
                    /* Firefox scrollbar styling */
                    scrollbar-width: thin;
                    scrollbar-color: rgba(51, 65, 85, 0.6) rgba(15, 23, 42, 0.1);
                }

                .atmo-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .atmo-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.1);
                    border-radius: 4px;
                }

                .atmo-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(51, 65, 85, 0.6);
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }

                .atmo-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(249, 115, 22, 0.7);
                    box-shadow: 0 0 8px rgba(249, 115, 22, 0.3);
                }

                .atmo-scrollbar::-webkit-scrollbar-corner {
                    background: rgba(15, 23, 42, 0.1);
                }
            `}</style>

            {/* Messages Area - Scrollable, positioned below avatar when active */}
            <div
                className={`atmo-scrollbar absolute left-0 right-0 bottom-0 overflow-y-auto transition-all duration-700 ${
                    history.length > 0 ? 'top-[240px] md:top-[260px]' : 'top-3/4'
                }`}
            >
                <div className="px-4 md:px-6 space-y-3 pb-24">
                    {history.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-4">
                            Click the orange sphere to start a voice conversation
                        </div>
                    ) : (
                        history.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex",
                                    message.sender === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn("max-w-[90%] md:max-w-[80%]")}>
                                    <div
                                        className={cn(
                                            "px-4 py-3 text-sm leading-relaxed transition-all duration-200 backdrop-blur-sm",
                                            message.sender === 'user'
                                                ? "bg-orange-500/15 border border-orange-500/30 text-white rounded-2xl rounded-br-md"
                                                : "bg-slate-800/70 border border-slate-600/40 text-white/95 rounded-2xl rounded-bl-md"
                                        )}
                                        style={{
                                            lineHeight: '1.6',
                                            wordSpacing: '0.02em',
                                            letterSpacing: '0.005em'
                                        }}
                                    >
                                        <div 
                                            className="whitespace-pre-wrap break-words font-normal"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                                fontWeight: '400'
                                            }}
                                        >
                                            {message.message}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "text-xs text-white/30 mt-1.5",
                                        message.sender === 'user' ? "text-right" : "text-left"
                                    )}>
                                        {formatTime(new Date())}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Typing Indicator */}
                    {isResponding && (
                        <div className="flex justify-start">
                            <div className="max-w-[90%] md:max-w-[80%]">
                                <div className="bg-slate-800/70 border border-slate-600/40 text-white rounded-2xl rounded-bl-md px-4 py-3 backdrop-blur-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scroll target for auto-scroll */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Fixed Input Bar at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/85 backdrop-blur-md border-t border-slate-700/40 p-4 pl-20">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleFileUpload}
                        variant="ghost"
                        size="sm"
                        className="p-2 text-white/60 hover:text-white/85 hover:bg-slate-700/50 rounded-lg transition-all duration-300 border border-transparent hover:border-slate-600/30"
                    >
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your message..."
                        value={input.message || ''}
                        onChange={(e) => addMessageToPrompt(e.target.value, 'user')}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-slate-800/70 border border-slate-600/50 rounded-xl px-5 py-3 text-white/95 placeholder-white/45 focus:outline-none focus:border-orange-500/60 focus:bg-slate-800/85 transition-all duration-300 font-light"
                    />

                    <Button
                        onClick={handleSendMessage}
                        disabled={!input.message?.trim() || isResponding}
                        className="bg-orange-500/25 hover:bg-orange-500/35 disabled:bg-slate-700/40 border border-orange-500/40 disabled:border-slate-600/30 text-orange-400 disabled:text-white/25 p-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:hover:scale-100"
                    >
                        <Send className="w-5 h-5" />
                    </Button>

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
        </div>
    );
};

export default CenterColumn;