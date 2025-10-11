import React, {useContext, useEffect, useRef, useState} from 'react';
import {HeartIcon} from 'lucide-react';
import {Button} from "@/components/atoms/Button.tsx";
import DailyWellnessPopup from '@/components/organisms/DailyWellnessPopup.tsx';
import DailyProgress from '@/components/atoms/DailyProgress.tsx';
import ProjectsList from '@/components/organisms/ProjectsList.tsx';
import SphereChat from '@/components/atoms/SphereChat.tsx';
import VoiceModeUI from '@/components/molecules/VoiceModeUI.tsx';
import {DailyMapCtx} from "@/context/DailyMapCtx.tsx";
import {useTasksStore} from "@/stores/useTasksStore.ts";
import {useGoalsStore} from "@/stores/useGoalsStore.ts";
import {Project} from "@/models/Project.ts";
import {WellnessTask} from "@/models";
import {useWellnessStore} from "@/stores/useWellnessStore.ts";
import {useProjectsStore} from "@/stores/useProjectsStore.ts";
import useMockAuth from "@/hooks/useMockAuth";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import useVoiceRecognition from '@/hooks/useVoiceRecognition.ts';
import {useToast} from '@/hooks/useToast.ts';
import {promptStore} from "@/stores/promptStore.ts";

const DailyRoad: React.FC = () => {
    const {calculateCompletion, fetchTasks} = useTasksStore();
    const {goals, fetchGoals} = useGoalsStore();
    const {level, addWellnessTasks, calculateWellnessFromProjects, metrics} = useWellnessStore();
    const {projects, fetchProjects} = useProjectsStore();
    const {user} = useMockAuth();
    const {pb} = usePocketBase();
    const dailyMapCtx = useContext(DailyMapCtx);
    const {toast} = useToast();
    const [isWellnessPopupOpen, setIsWellnessPopupOpen] = React.useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const {
        toggleVoiceMessage,
        addMessageToPrompt,
        isVoiceMessage,
        toggleConversationStarted,
        isConversationStarted
    } = promptStore();

    const {startListening, stopListening, transcript, isListening, error: voiceError, isSupported} = useVoiceRecognition({
        onResult: (result) => {
            // Smart transcription logic - clean and format the text
            const cleanedTranscript = cleanTranscript(result);
            
            // Place the transcribed text in the input field
            addMessageToPrompt(cleanedTranscript);
            
            // Set transcription state
            setIsTranscribing(true);
            
            // Auto-engage chat when voice input is received
            if (!isConversationStarted) {
                toggleConversationStarted();
            }
            
            // Clear any existing timeout
            if (transcriptTimeoutRef.current) {
                clearTimeout(transcriptTimeoutRef.current);
            }
            
            // Auto-submit after user finishes speaking (3 seconds of silence)
            transcriptTimeoutRef.current = setTimeout(() => {
                setIsTranscribing(false);
            }, 3000);
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

    const handleSphereClick = () => {
        if (!isSupported) {
            toast({
                title: "Voice Recognition Not Available",
                description: "Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.",
                duration: 30000, // 30 seconds
            });
            return;
        }

        if (isListening) {
            // Currently listening - stop recording
            stopListening();
        } else {
            // Not listening - start recording
            startListening();
        }

        // Toggle the voice message state
        toggleVoiceMessage();
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
        
        // Reset transcription state
        setIsTranscribing(false);
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

    // Fetch data when component mounts
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (pb && user && mounted) {
                try {
                    // Fetch projects, goals, and tasks data
                    await fetchProjects(pb);
                    await fetchGoals(pb);
                    await fetchTasks(pb);
                    
                    // Calculate completion for tasks
                    calculateCompletion();
                } catch (error) {
                    console.log('Daily Road data fetch completed with potential auto-cancellations');
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [pb, user, fetchProjects, fetchGoals, fetchTasks, calculateCompletion]);

    // Initialize DailyMapCtx with fetched data
    useEffect(() => {
        if (projects.length > 0 && goals.length > 0) {
            // Group projects by activities (goals and tasks)
            dailyMapCtx.groupProjectsByActivities(projects, goals);
            
            // Set the daily map as open
            dailyMapCtx.open = true;
        }

        return () => {
            dailyMapCtx.open = false;
        };
    }, [projects, goals, dailyMapCtx]);

    // Force refresh goals and tasks when projects change to maintain synchronization
    useEffect(() => {
        let mounted = true;

        const refreshData = async () => {
            if (pb && user && mounted && projects.length > 0) {
                try {
                    // Refresh goals and tasks to ensure they're synchronized with updated projects
                    await fetchGoals(pb);
                    await fetchTasks(pb, true);
                } catch (error) {
                    console.log('Data refresh completed with potential auto-cancellations');
                }
            }
        };

        refreshData();

        return () => {
            mounted = false;
        };
    }, [projects, pb, user, fetchGoals, fetchTasks]);

    // Calculate wellness from projects
    useEffect(() => {
        if (projects.length > 0) {
            calculateWellnessFromProjects(projects);
        }
    }, [projects, calculateWellnessFromProjects]);

    const handleWellnessTasksChange = (tasks: WellnessTask[]) => {
        addWellnessTasks(tasks);
    };

    // Update empty projects based on grouped projects
    dailyMapCtx.emptyProjects = projects.filter(p => !dailyMapCtx.groupedProjects.some((project: Project) => project.id === p.id));
    
    return (
        <div className="min-h-screen bg-[#0a0a21] relative">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-5 pointer-events-none"></div>
            <div
                className="fixed top-[10%] right-[15%] -z-10 w-96 h-96 bg-[#FF5F1F]/10 rounded-full blur-[120px] animate-pulse-soft"/>
            <div
                className="fixed top-[60%] left-[5%] -z-10 w-80 h-80 bg-[#FF5F1F]/5 rounded-full blur-[120px] animate-pulse-soft"
                style={{animationDelay: '1.5s'}}/>

            <div className="container px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Daily Road Map */}
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="font-medium text-[#FF5F1F] text-2xl">Daily Road Map</h1>
                            <Button variant="outline" size="sm" onClick={() => setIsWellnessPopupOpen(true)}
                                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-black/30 hover:bg-black/50 text-[#ff7000] border border-[#ff7000]/30 transition-all">
                                <HeartIcon size={16}/>
                                <span>Wellness</span>
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {/* Daily Progress - linked with tasks */}
                            <DailyProgress wellnessLevel={level}/>

                            {/* Roadmap - Projects List */}
                            <ProjectsList/>
                        </div>
                    </div>

                    {/* Right Column - Voice Interface - Enhanced UX with stop control */}
                    {(isVoiceMessage || isListening) && (
                        <div className="w-full h-[calc(100vh-120px)] lg:block flex items-center justify-center">
                            <VoiceModeUI
                                isListening={isListening}
                                isSupported={isSupported}
                                onSphereClick={handleSphereClick}
                                onStopVoiceMode={handleStopVoiceMode}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Wellness Popup */}
            <DailyWellnessPopup isOpen={isWellnessPopupOpen} onClose={() => setIsWellnessPopupOpen(false)}
                                onTasksChange={handleWellnessTasksChange}/>
        </div>
    );
};

export default DailyRoad;
