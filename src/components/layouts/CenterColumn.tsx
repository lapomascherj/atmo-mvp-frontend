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
    const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
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
                addToHistory(cleanedTranscript, 'user');
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

    const cleanTranscript = (text: string): string => {
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^(um|uh|er|ah)\s+/i, '')
            .replace(/\s+(um|uh|er|ah)(\s+|$)/gi, ' ')
            .trim();
    };

    const handleSphereClick = () => {
        if (isListening) {
            stopListening();
            setInteractionMode('idle');
            setVoiceSource(null);
        } else if (isSupported) {
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
            
            addToHistory(response.message, 'ai');
            
            if (response.task) {
                // Handle task context if needed
            }
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            addToHistory("I'm having trouble processing your request right now. Please try again.", 'ai');
        } finally {
            toggleRespondingState();
        }
    };

    const handleSendMessage = async () => {
        const messageText = input.message?.trim();
        if (!messageText) return;

        if (!isConversationStarted) {
            toggleConversationStarted();
        }

        addToHistory(messageText, 'user');
        clearInput();

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
        <div className="h-full relative bg-transparent overflow-hidden w-full">
            {/* Fixed Orange Sphere - Always positioned at top - responsive */}
            <div className="absolute top-32 md:top-44 left-1/2 transform -translate-x-1/2 z-30">
                <div className="relative transition-all duration-700 ease-out">
                    <SphereChat
                        size={220}
                        onClick={handleSphereClick}
                        voiceSupported={isSupported}
                        isListening={isListening || isVoiceMessage}
                        isThinking={isResponding}
                        isResponding={isConversationStarted && !isResponding && history.length > 0}
                    />
                    
                    {/* Enhanced glow effects with activity pulse */}
                    <div className={`absolute inset-0 -z-10 bg-[#FF7000]/20 rounded-full blur-2xl transition-all duration-300 ${
                        isResponding ? 'animate-pulse scale-110' : 'animate-pulse-soft'
                    }`}></div>
                    <div className={`absolute inset-0 -z-20 bg-[#FF7000]/10 rounded-full blur-3xl scale-150 transition-all duration-300 ${
                        isResponding ? 'animate-pulse scale-125' : 'animate-pulse-soft'
                    }`}></div>
                    <div className="absolute inset-0 -z-30 bg-gradient-to-r from-[#FF7000]/5 to-purple-500/5 rounded-full blur-[100px] scale-200 animate-pulse-soft"></div>
                </div>

                {/* Enhanced Voice Control X Button */}
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

            {/* Gradient Fade Effect for Messages Area */}
            <div className="absolute top-0 left-0 right-0 h-80 md:h-96 bg-gradient-to-b from-transparent via-transparent to-black/0 pointer-events-none z-20" 
                 style={{
                     background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,1) 100%)'
                 }}>
            </div>

            {/* Messages Area - Scrollable with padding for sphere */}
            <div 
                className="h-full overflow-y-auto pt-96 md:pt-[420px] pb-24"
            >
                <div className="px-6 space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center text-white/40 text-sm">
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
                                <div className={cn("max-w-[85%] md:max-w-[75%]")}>
                                    <div
                                        className={cn(
                                            "px-5 py-4 text-sm leading-relaxed transition-all duration-200 shadow-lg backdrop-blur-sm",
                                            message.sender === 'user'
                                                ? "bg-orange-500/10 border border-orange-500/20 text-white rounded-2xl rounded-br-md"
                                                : "bg-white/5 border border-white/10 text-white rounded-2xl rounded-bl-md"
                                        )}
                                        style={{
                                            lineHeight: '1.7',
                                            wordSpacing: '0.05em',
                                            letterSpacing: '0.01em'
                                        }}
                                    >
                                        <div 
                                            className="whitespace-pre-wrap break-words font-normal"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '1.7'
                                            }}
                                        >
                                            {message.message}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "text-xs text-white/30 mt-1",
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
                            <div className="max-w-[85%] md:max-w-[75%]">
                                <div className="bg-white/5 border border-white/10 text-white rounded-2xl rounded-bl-md px-5 py-4 shadow-lg backdrop-blur-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Input Bar at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm border-t border-white/10 p-4">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleFileUpload}
                        variant="ghost"
                        size="sm"
                        className="p-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
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
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 transition-colors"
                    />

                    <Button
                        onClick={handleSendMessage}
                        disabled={!input.message?.trim()}
                        className="bg-orange-500/20 hover:bg-orange-500/30 disabled:bg-white/5 border border-orange-500/30 disabled:border-white/10 text-orange-400 disabled:text-white/30 p-3 rounded-xl transition-colors"
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