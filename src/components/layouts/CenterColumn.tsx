import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import useMockAuth from '@/hooks/useMockAuth';
import useVoiceRecognition from '@/hooks/useVoiceRecognition.ts';
import SphereChat from '../atoms/SphereChat.tsx';
import { Button } from '@/components/atoms/Button';
import { TextArea } from '@/components/atoms/TextArea';
import { Paperclip, Send, Archive, Plus } from 'lucide-react';
import { cn } from '@/utils/utils';
import { promptStore } from "@/stores/promptStore.ts";
import { useToast } from '@/hooks/useToast.ts';
import { useSidebar } from '@/context/SidebarContext';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { ChatArchiveModal } from '@/components/organisms/ChatArchiveModal';
import { useChatSessionsStore } from '@/stores/chatSessionsStore';
import { OnboardingChatService } from '@/services/onboardingChatService';
import { PersonalDataOnboardingService } from '@/services/personalDataOnboardingService';
import { OnboardingProgressService } from '@/services/onboardingProgressService';
import { OnboardingAgent } from '@/services/onboardingAgent';
import OnboardingStatusIndicator from '@/components/onboarding/OnboardingStatusIndicator';

interface CenterColumnProps {
    maxWidthPercent?: number;
    initialMessage?: string;
    onMessageUsed?: () => void;
}

const CenterColumn: React.FC<CenterColumnProps> = ({ maxWidthPercent = 100, initialMessage, onMessageUsed }) => {
    const { user } = useMockAuth();
    const { toast } = useToast();
    const { sidebarWidth } = useSidebar();
    const location = useLocation();
    const [isCapturing, setIsCapturing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isOnboardingMode, setIsOnboardingMode] = useState(false);
    const [showOnboardingIndicator, setShowOnboardingIndicator] = useState(false);
    const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
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
            // Don't auto-process the result here - let the user decide with OK button
            // This allows for better control over when to send the message
            console.log('Voice recognition final result:', result);
        },
        onInterimResult: (result) => {
            // Handle interim results for real-time display
            console.log('Voice recognition interim result:', result);
        }
    });

    // Reset conversation state on component mount to ensure clean start
    // Don't reset conversation state - we want to preserve chat history
    // useEffect(() => {
    //     resetConversationState();
    // }, [resetConversationState]);

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

    // Connect voice recognition to isCapturing state
    useEffect(() => {
        const handleVoiceCapture = async () => {
            if (isCapturing && isSupported && !isResponding && !isTranscribing) {
                if (!isConversationStarted) {
                    toggleConversationStarted();
                }
                try {
                    await startListening();
                } catch (error) {
                    console.error('Failed to start voice recognition:', error);
                    toast({
                        title: "Microphone Error",
                        description: "Please allow microphone access to use voice input.",
                        variant: "destructive"
                    });
                }
            } else if (!isCapturing) {
                // Always stop when not capturing, regardless of other states
                stopListening();
            }
        };

        handleVoiceCapture();
    }, [isCapturing, isSupported, isResponding, isTranscribing, isConversationStarted, startListening, stopListening, toggleConversationStarted, toast]);

    const cleanTranscript = (text: string): string => {
        return text
            .trim()
            // Remove common filler words and hesitations
            .replace(/\b(um|uh|er|ah|like|you know|so|well)\b/gi, '')
            // Clean up multiple spaces
            .replace(/\s+/g, ' ')
            // Remove leading/trailing spaces
            .trim()
            // Capitalize first letter
            .replace(/^./, str => str.toUpperCase())
            // Ensure proper punctuation
            .replace(/([.!?])?\s*$/, match => {
                if (match.includes('.') || match.includes('!') || match.includes('?')) {
                    return match;
                }
                return '.';
            });
    };

    const handleQuickCapture = () => {
        setIsCapturing(!isCapturing);
    };

    const sendChatMessage = usePersonasStore(state => state.sendChatMessage);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const avatarClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const initializeChatSessions = useChatSessionsStore((state) => state.initialize);
    const startNewChatSession = useChatSessionsStore((state) => state.startNewChatSession);
    const refreshActiveSession = useChatSessionsStore((state) => state.refreshActiveSession);

    // Get PersonasStore refresh function
    const fetchPersonaByIam = usePersonasStore((state) => state.fetchPersonaByIam);
    const profileSnapshot = usePersonasStore((state) => state.profileSnapshot);

    useEffect(() => {
        void initializeChatSessions();
    }, [initializeChatSessions]);

    // Handle onboarding continuation from URL parameters
    useEffect(() => {
        const handleOnboardingContinuation = async () => {
            const urlParams = new URLSearchParams(location.search);
            const onboardingContinue = urlParams.get('onboarding_continue');
            const onboardingStart = urlParams.get('onboarding_start');

            if (onboardingContinue || onboardingStart) {
                console.log('🔄 Onboarding continuation detected in chat');
                setIsOnboardingMode(true);
                
                if (user?.id) {
                    try {
                    if (onboardingContinue) {
                        console.log('📋 Continuing existing onboarding in chat');
                        await OnboardingAgent.initializeOnboarding(user.id);
                        setShowOnboardingIndicator(true);
                    } else if (onboardingStart) {
                        console.log('🆕 Starting fresh onboarding in chat');
                        await OnboardingAgent.initializeOnboarding(user.id);
                        setShowOnboardingIndicator(true);
                    }
                        
                        // Clear URL parameters after initialization
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.delete('onboarding_continue');
                        newUrl.searchParams.delete('onboarding_start');
                        window.history.replaceState({}, '', newUrl.toString());

                    } catch (error) {
                        console.error('❌ Failed to initialize onboarding in chat:', error);
                        toast({
                            title: "Onboarding Error",
                            description: "Failed to load your onboarding progress. Please try again.",
                            variant: "destructive"
                        });
                    }
                }
            }
        };

        handleOnboardingContinuation();
    }, [location.search, user?.id, toast]);

    // Check if onboarding is already active when component loads
    useEffect(() => {
        const checkActiveOnboarding = async () => {
            if (user?.id && !isOnboardingMode) {
                try {
                    const savedProgress = await OnboardingProgressService.loadProgress(user.id);
                    if (savedProgress && savedProgress.messages.length > 0) {
                        console.log('🔄 Active onboarding detected, resuming...');
                        setIsOnboardingMode(true);
                        await OnboardingAgent.initializeOnboarding(user.id);
                    }
                } catch (error) {
                    console.error('❌ Failed to check active onboarding:', error);
                }
            }
        };

        checkActiveOnboarding();
    }, [user?.id, isOnboardingMode]);

    // Periodic check to ensure onboarding continues
    useEffect(() => {
        if (!isOnboardingMode || !user?.id) return;

        const checkOnboardingStatus = async () => {
            try {
                const isActive = OnboardingAgent.isOnboardingActive();
                if (!isActive) {
                    console.log('🔄 OnboardingAgent: Onboarding not active, ensuring it continues...');
                    await OnboardingAgent.ensureOnboardingContinues(user.id);
                }
            } catch (error) {
                console.error('❌ Failed to check onboarding status:', error);
            }
        };

        // Check every 5 seconds
        const interval = setInterval(checkOnboardingStatus, 5000);
        return () => clearInterval(interval);
    }, [isOnboardingMode, user?.id]);

    // Note: initialMessage is no longer used - questions are now added directly via promptStore

    const handleAIResponse = async (userMessage: string) => {
        // Set responding state to true at start
        promptStore.getState().setRespondingState?.(true);

        // CRITICAL FIX: Declare response outside try block so it's accessible in finally block
        let response: any = null;

        try {
            // Check if we're in onboarding mode
            if (isOnboardingMode && user?.id) {
                console.log('🤖 OnboardingAgent: Processing user response');
                
                try {
                    // Use the dedicated onboarding agent
                    const onboardingResponse = await OnboardingAgent.processUserResponse(
                        user.id,
                        userMessage
                    );
                    
                    console.log('📊 OnboardingAgent Response:', onboardingResponse);
                    
                    // Add AI response to history
                    const { addAIResponse } = promptStore.getState();
                    addAIResponse(onboardingResponse.response);
                    
                    // Check if onboarding is complete
                    if (onboardingResponse.isComplete) {
                        console.log('🎉 Onboarding completion detected');
                        setIsOnboardingMode(false);
                        setShowOnboardingIndicator(false);
                        toast({
                            title: "Onboarding Complete!",
                            description: "Your Personal Data Card has been fully populated with all your information.",
                            variant: "default"
                        });
                    } else {
                        // Ensure onboarding continues
                        console.log('🔄 OnboardingAgent: Ensuring onboarding continues...');
                        await OnboardingAgent.ensureOnboardingContinues(user.id);
                    }
                    
                } catch (error) {
                    console.error('❌ OnboardingAgent: Error processing response:', error);
                    
                    // Fallback: try to continue onboarding
                    try {
                        await OnboardingAgent.ensureOnboardingContinues(user.id);
                    } catch (fallbackError) {
                        console.error('❌ OnboardingAgent: Fallback failed:', fallbackError);
                        const { addAIResponse } = promptStore.getState();
                        addAIResponse("I'm having trouble processing your response. Could you tell me more about yourself?");
                    }
                }
                
            } else {
                // Regular chat mode - use existing AI
                response = await sendChatMessage(userMessage);

                // Add AI response to history using addAIResponse function
                const { addAIResponse } = promptStore.getState();

                // Debug log the response
                console.log('📊 Chat Response:', {
                    response: response.response,
                    entitiesExtracted: response.entitiesExtracted,
                    entitiesCreated: response.entitiesCreated
                });

                // If entities were created, add a note about it
                const createdEntities = (response.entitiesCreated || []).filter(entity => entity.mode !== 'deleted');
                if (createdEntities.length > 0) {
                    const createdList = createdEntities
                        .map(e => `✓ ${e.type}: "${e.name}"`)
                        .join('\n');
                    addAIResponse(`${response.response}\n\n**Created:**\n${createdList}`);
                    window.dispatchEvent(new Event('atmo:outputs:refresh'));
                } else {
                    addAIResponse(response.response);
                }
            }

        } catch (error) {
            console.error('Error getting AI response:', error);
            const { addAIResponse } = promptStore.getState();
            const errorMsg = error instanceof Error ? error.message : "I'm having trouble processing your request right now. Please try again.";
            addAIResponse(errorMsg);
        } finally {
            // Ensure responding state is false after response
            promptStore.getState().setRespondingState?.(false);

            // Refresh chat session to ensure it's synced
            await refreshActiveSession({ force: true }).catch((err) => {
                console.error('Failed to synchronize chat session after AI response:', err);
            });

            // CRITICAL: Refresh workspace to fetch newly created projects/goals/tasks
            if (profileSnapshot?.id) {
                console.log('🔄 [CenterColumn] Refreshing workspace to fetch newly created entities...');
                console.log('   → Profile ID:', profileSnapshot.id);
                console.log('   → Force refresh: TRUE');
                console.log('   → Created entities:', response?.entitiesCreated?.length || 0);
                try {
                    const refreshedPersona = await fetchPersonaByIam(null, profileSnapshot.id, true);
                    console.log('✅ [CenterColumn] Workspace refreshed successfully');
                    console.log('   → Current projects count:', refreshedPersona?.projects?.length || 0);
                    if (refreshedPersona?.projects && refreshedPersona.projects.length > 0) {
                        console.log('   → Projects:', refreshedPersona.projects.map(p => ({ name: p.name, id: p.id })));
                    }
                } catch (err) {
                    console.error('❌ [CenterColumn] Failed to refresh workspace after AI response:', err);
                }
            } else {
                console.error('❌ [CenterColumn] No profileSnapshot available - cannot refresh workspace!');
            }
        }
    };

    const resetInputHeight = useCallback(() => {
        const textarea = inputRef.current;
        if (!textarea) {
            return;
        }
        textarea.style.height = 'auto';
        textarea.style.overflowY = 'hidden';
    }, []);

    const adjustInputHeight = useCallback(() => {
        const textarea = inputRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = 'auto';
        const maxHeight = 220;
        const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${nextHeight}px`;
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, []);

    useEffect(() => {
        if (!input.message) {
            resetInputHeight();
            return;
        }
        adjustInputHeight();
    }, [input.message, adjustInputHeight, resetInputHeight]);

    const handleSendMessage = async () => {
        const messageText = input.message?.trim();
        if (!messageText || isResponding) return; // Prevent sending while AI is responding

        if (!isConversationStarted) {
            toggleConversationStarted();
        }

        // Message is already in input from user typing, just add to history
        addToHistory();
        clearInput(); // Clear input immediately after adding to history
        resetInputHeight();

        // Save onboarding progress if in onboarding mode
        if (isOnboardingMode && user?.id) {
            try {
                await OnboardingChatService.saveOnboardingProgress(user.id, messageText);
                console.log('✅ Onboarding progress saved from chat');
            } catch (error) {
                console.error('❌ Failed to save onboarding progress:', error);
            }
        }

        await handleAIResponse(messageText);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
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

    const handleNewChat = async () => {
        try {
            await startNewChatSession();

            toast({
                title: 'New chat started',
                description: 'Previous chat has been archived',
            });
        } catch (error) {
            console.error('Failed to create new chat:', error);
            toast({
                title: 'Error',
                description: 'Failed to start new chat',
                variant: 'destructive',
            });
        }
    };

    const handleLoadArchivedChat = async (sessionId: string) => {
        try {
            await refreshActiveSession({ force: true }).catch((err) => {
                console.error('Failed to refresh active session after archive load:', err);
            });
            toast({
                title: 'Chat loaded',
                description: 'Previous conversation restored',
            });
        } catch (error) {
            console.error('Failed post-load handling for archived chat:', error);
            toast({
                title: 'Error',
                description: 'Could not load the archived chat. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleAvatarClick = () => {
        // Detect double-click
        if (avatarClickTimeoutRef.current) {
            // This is a double-click
            clearTimeout(avatarClickTimeoutRef.current);
            avatarClickTimeoutRef.current = null;
            setShowArchiveModal(true);
        } else {
            // This is first click - wait to see if there's a second
            avatarClickTimeoutRef.current = setTimeout(() => {
                // Single click - toggle capture
                handleQuickCapture();
                avatarClickTimeoutRef.current = null;
            }, 300);
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden w-full">

            {/* Avatar - Centered initially, moves UP when conversation starts - LOWERED */}
            <div className={`relative w-full transition-all duration-700 ease-out z-30 flex-shrink-0 ${
                history.length > 0 ? 'h-[200px] md:h-[220px]' : 'h-[45vh]'
            }`}>
                <div className={`absolute left-1/2 transform -translate-x-1/2 transition-all duration-700 ease-out ${
                    history.length > 0 ? 'top-16 md:top-18' : 'top-1/2 -translate-y-1/2'
                }`}
                style={{
                    filter: 'drop-shadow(0 0 20px rgba(204, 85, 0, 0.15))',
                }}>
                    <div className="relative transition-all duration-700 ease-out">
                        <SphereChat
                            size={history.length > 0 ? 160 : 220}
                            isActive={isCapturing}
                            isListening={isCapturing}
                            onClick={handleAvatarClick}
                            voiceSupported={true}
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

                    {/* Minimal Voice Control Interface */}
                    {isCapturing && (
                        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
                            {/* Minimal transcript display */}
                            {transcript ? (
                                <div className="mb-3 text-center">
                                    <div className="text-white/70 text-sm max-w-xs mx-auto px-3 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                                        {transcript}
                                        {isListening && (
                                            <span className="inline-block w-1 h-3 bg-orange-400 ml-1 animate-pulse"></span>
                                        )}
                                    </div>
                                </div>
                            ) : isListening ? (
                                <div className="mb-3 text-center">
                                    <div className="text-white/50 text-sm max-w-xs mx-auto px-3 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                                        Listening...
                                        <span className="inline-block w-1 h-3 bg-orange-400 ml-1 animate-pulse"></span>
                                    </div>
                                </div>
                            ) : null}
                            
                            {/* Minimal control buttons */}
                            <div className="flex justify-center gap-4">
                                {/* OK Button - Minimal Apple style */}
                                <button
                                    onClick={() => {
                                        setIsCapturing(false);
                                        // Process the final transcript
                                        if (transcript.trim()) {
                                            const cleanedTranscript = cleanTranscript(transcript);
                                            addMessageToPrompt(cleanedTranscript, 'user');
                                            addToHistory();
                                            handleAIResponse(cleanedTranscript);
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all duration-200 flex items-center justify-center text-lg font-light hover:scale-105"
                                    title="Send"
                                >
                                    ✓
                                </button>
                                
                                {/* X Button - Minimal Apple style */}
                                <button
                                    onClick={() => setIsCapturing(false)}
                                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-all duration-200 flex items-center justify-center text-lg font-light hover:scale-105"
                                    title="Cancel"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom ATMO Scrollbar Styles */}
            <style>{`
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

            {/* Messages Area - FLEX GROW Container - CANNOT overflow */}
            <div className="flex-1 overflow-y-auto atmo-scrollbar min-h-0">
                <div className="px-4 md:px-6 space-y-3 py-4">
                    {history.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-4">
                            Click the orange sphere to start a voice conversation
                        </div>
                    ) : (
                        history
                            .filter(message => message.message && message.message.trim() && message.message.trim() !== '...')
                            .map((message, index) => {
                                // Get highlight color styles for AI questions
                                const getHighlightStyles = () => {
                                    if (!message.highlightColor) return {};

                                    const colorMap = {
                                        green: {
                                            bg: "bg-green-500/15",
                                            border: "border-green-500/40",
                                            glow: "shadow-lg shadow-green-500/20"
                                        },
                                        yellow: {
                                            bg: "bg-yellow-500/15",
                                            border: "border-yellow-500/40",
                                            glow: "shadow-lg shadow-yellow-500/20"
                                        },
                                        purple: {
                                            bg: "bg-purple-500/15",
                                            border: "border-purple-500/40",
                                            glow: "shadow-lg shadow-purple-500/20"
                                        }
                                    };
                                    return colorMap[message.highlightColor];
                                };

                                const highlightStyles = getHighlightStyles();

                                return (
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
                                                : message.highlightColor
                                                    ? `${highlightStyles.bg} border ${highlightStyles.border} ${highlightStyles.glow} text-white rounded-2xl rounded-bl-md`
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
                                </div>
                            </div>
                                );
                            })
                    )}

                    {/* Typing Indicator */}
                    {isResponding && (
                        <div className="flex justify-start">
                            <div className="max-w-[90%] md:max-w-[80%]">
                                <div className="bg-slate-800/50 border border-slate-600/30 rounded-2xl rounded-bl-md px-3 py-2 backdrop-blur-sm">
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex space-x-0.5">
                                            <div className="w-1.5 h-1.5 bg-orange-500/40 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-orange-500/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-orange-500/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-orange-500/60 text-xs ml-1">ATMO is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scroll target for auto-scroll */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Bar at Bottom - FLEX SHRINK 0 - PHYSICAL BOUNDARY */}
            <div className="flex-shrink-0 border-t border-slate-700/40 pt-3 pb-3 px-4 bg-gradient-to-t from-slate-950/95 via-slate-950/90 to-transparent">
                <div className="flex items-center gap-3 mx-2">
                    <Button
                        onClick={() => setShowArchiveModal(true)}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 p-3 text-white/60 hover:text-white/85 hover:bg-slate-700/50 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-600/30"
                        title="View archived chats"
                    >
                        <Archive className="w-5 h-5" />
                    </Button>

                    <Button
                        onClick={handleNewChat}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 p-3 text-white/60 hover:text-white/85 hover:bg-slate-700/50 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-600/30"
                        title="Start new chat"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>

                    <Button
                        onClick={handleFileUpload}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 p-3 text-white/60 hover:text-white/85 hover:bg-slate-700/50 rounded-xl transition-all duration-300 border border-transparent hover:border-slate-600/30"
                        title="Upload file"
                    >
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    <TextArea
                        ref={inputRef}
                        placeholder="Type your message..."
                        value={input.message || ''}
                        onChange={(e) => addMessageToPrompt(e.target.value, 'user')}
                        onInput={adjustInputHeight}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 !min-h-[52px] max-h-56 bg-slate-800/70 border border-slate-600/50 rounded-xl px-5 py-3 text-white/95 placeholder-white/45 focus:outline-none focus:border-orange-500/60 focus:bg-slate-800/85 transition-all duration-300 font-light resize-none"
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

            {/* Chat Archive Modal */}
            <ChatArchiveModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onLoadSession={handleLoadArchivedChat}
            />
            
            {/* Onboarding Status Indicator */}
            {showOnboardingIndicator && user?.id && (
                <OnboardingStatusIndicator
                    userId={user.id}
                    onContinueLater={() => {
                        setShowOnboardingIndicator(false);
                        setIsOnboardingMode(false);
                        toast({
                            title: "Onboarding Saved",
                            description: "Your onboarding progress has been saved. You can continue later.",
                            variant: "default"
                        });
                    }}
                    onComplete={() => {
                        setShowOnboardingIndicator(false);
                        setIsOnboardingMode(false);
                        toast({
                            title: "Onboarding Complete!",
                            description: "Your Personal Data Card has been fully populated with all your information.",
                            variant: "default"
                        });
                    }}
                />
            )}
        </div>
    );
};

export default CenterColumn;
