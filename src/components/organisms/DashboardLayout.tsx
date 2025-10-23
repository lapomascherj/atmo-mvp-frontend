import React, { useMemo, useState, useEffect } from 'react';
import CenterColumn from '../layouts/CenterColumn.tsx';
import DailySnapshot from '../organisms/DailySnapshot.tsx';
import { AtmoCard } from '../molecules/AtmoCard.tsx';
import { CardHeader, CardContent } from '../atoms/Card.tsx';
import { Button } from '../atoms/Button.tsx';
import { Badge } from '../atoms/Badge.tsx';
import { Target, Plus, BarChart3 } from 'lucide-react';
import { usePersonasStore } from '@/stores/usePersonasStore.ts';
import { promptStore } from '@/stores/promptStore.ts';
import useMockAuth from '@/hooks/useMockAuth';
import { Priority } from '@/models/Priority.ts';
import HorizontalScrollGrid from '@/components/atoms/HorizontalScrollGrid.tsx';
import ErrorBoundary from '@/components/atoms/ErrorBoundary.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/atoms/Dialog.tsx';
import ProjectForm from '@/components/molecules/ProjectForm.tsx';
import FlowerOfLife from '@/components/atoms/FlowerOfLife.tsx';
import GetCenteredCard from '@/components/molecules/GetCenteredCard.tsx';
import InteractiveDivider from '@/components/atoms/InteractiveDivider.tsx';
import { CompactSchedulerView } from '@/components/scheduler/CompactSchedulerView.tsx';
import { useSchedulerSync } from '@/hooks/useSchedulerSync.ts';
import { PriorityStreamEnhanced } from '@/components/organisms/PriorityStreamEnhanced';
import TodaysActionsCard from '@/components/organisms/TodaysActionsCard';
import { saveAIMessage } from '@/services/chatSessionService.ts';
import { useChatSessionsStore } from '@/stores/chatSessionsStore.ts';

interface DashboardLayoutProps {
  userName: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userName }) => {
  // Use PersonasStore as single source of truth (following README.md)
  // Subscribe to the actual state to ensure re-renders when data changes
  const currentPersona = usePersonasStore(state => state.currentPersona);
  const loading = usePersonasStore(state => state.loading);
  const fetchPersonaByIam = usePersonasStore(state => state.fetchPersonaByIam);
  const getProjects = usePersonasStore(state => state.getProjects);
  const getTasks = usePersonasStore(state => state.getTasks);
  const getGoals = usePersonasStore(state => state.getGoals);

  // Get user data for dashboard
  const { user } = useMockAuth();

  // Initialize PersonasStore on mount and when route changes
  // Stable ref to track if we've already loaded for this user
  const loadedUserRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    if (!user?.iam) {
      return;
    }

    // Skip if already loading or if we've already loaded for this user
    if (loading || loadedUserRef.current === user.iam) {
      return;
    }

    // Skip if persona is already loaded for this user
    if (currentPersona && currentPersona.iam === user.iam) {
      loadedUserRef.current = user.iam;
      return;
    }

    loadedUserRef.current = user.iam;

    // Access store method directly without dependency (async IIFE for error handling)
    (async () => {
      try {
        await usePersonasStore.getState().fetchPersonaByIam(null as any, user.iam, false);
      } catch (error) {
        loadedUserRef.current = null; // Reset on error to allow retry
      }
    })();
  }, [user?.iam, loading]); // Removed currentPersona dependency

  // Add modal state for project creation
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  
  // Sacred geometry modal state
  const [showSacredModal, setShowSacredModal] = useState(false);
  const [isFlowerActive, setIsFlowerActive] = useState(false);
  const [hasNewContent, setHasNewContent] = useState(false);

  // Interactive divider state
  const [dividerPosition, setDividerPosition] = useState(50);

  // Scheduler state - synced across dashboard and Digital Brain
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { events: schedulerEvents, updateEvents: setSchedulerEvents } = useSchedulerSync(selectedDate);

  // Handler for Today's Actions - ATMO asks the question in main chat
  const handleOpenChatWithQuestion = async (question: string, color: "green" | "yellow" | "purple") => {
    console.log('🎯 Today\'s Actions clicked:', { question, color });
    const { addHighlightedAIQuestion, toggleConversationStarted, isConversationStarted } = promptStore.getState();
    const { refreshActiveSession } = useChatSessionsStore.getState();

    // Add the highlighted question from ATMO to main chat history (in-memory)
    addHighlightedAIQuestion(question, color);
    console.log('✅ Question added to main chat with color:', color);

    // Start conversation if not started
    if (!isConversationStarted) {
      toggleConversationStarted();
      console.log('✅ Conversation started in main chat');
    }

    // Save the question to the database with color so it persists across refreshes
    try {
      await saveAIMessage(question, color);
      console.log('✅ Question saved to database with color:', color);

      // Refresh the active session to sync the database message
      await refreshActiveSession({ force: true });
      console.log('✅ Chat session refreshed');
    } catch (error) {
      console.error('❌ Failed to save question to database:', error);
    }

    // NO NAVIGATION - question appears in main chat on Dashboard
    // The CenterColumn component already displays the history, so the question appears immediately
  };

  // Check for new mantra content (6am daily)
  React.useEffect(() => {
    const checkForNewContent = () => {
      const today = new Date().toDateString();
      const lastMantraDate = localStorage.getItem('lastMantraDate');
      setHasNewContent(lastMantraDate !== today);
    };
    
    checkForNewContent();
    // Check every hour for 6am reset
    const interval = setInterval(checkForNewContent, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFlowerClick = () => {
    setIsFlowerActive(true);
    setHasNewContent(false); // Clear notification when opened
    setTimeout(() => {
      setShowSacredModal(true);
      setIsFlowerActive(false);
    }, 1200); // 1.2 seconds for enhanced animation
  };

  // Memoize data retrieval to prevent unnecessary recalculations
  const { projects, tasks, goals } = useMemo(() => {
    if (!currentPersona) {
      console.debug("📊 DASHBOARD: No currentPersona loaded yet");
      return { projects: [], tasks: [], goals: [] };
    }

    const projects = getProjects();
    const tasks = getTasks();
    const goals = getGoals();

    console.log("📊 DASHBOARD: Data loaded from PersonasStore (single invocation):", {
      personaId: currentPersona.id,
      projects: projects.length,
      tasks: tasks.length,
      goals: goals.length,
    });

    return { projects, tasks, goals };
  // Only depend on currentPersona to prevent triple loading
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPersona]);

  // Memoize dashboard calculations to prevent re-computation on every render
  const dashboardStats = useMemo(() => {
    // More robust filtering: include projects that are explicitly active or have no active field set
    const activeProjects = projects.filter(project => {
      const isActive = project.active !== false && project.status !== 'deleted' && project.status !== 'completed';
      console.log(`📊 Project "${project.name}": active=${project.active}, status=${project.status}, isActive=${isActive}`);
      return isActive;
    }).slice(0, 4);
    
    console.log(`📊 DASHBOARD STATS: Total projects: ${projects.length}, Active projects: ${activeProjects.length}`);
    
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get priority distribution
    const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === Priority.High).length;
    const mediumPriorityTasks = tasks.filter(t => !t.completed && t.priority === Priority.Medium).length;
    const lowPriorityTasks = tasks.filter(t => !t.completed && t.priority === Priority.Low).length;

    return {
      activeProjects,
      completedTasks,
      totalTasks,
      completionRate,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks
    };
  }, [projects, tasks]);

  const { 
    activeProjects, 
    completedTasks, 
    completionRate, 
    highPriorityTasks, 
    mediumPriorityTasks, 
    lowPriorityTasks 
  } = dashboardStats;

  return (
    <>
      <div className="h-full bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 relative overflow-hidden">
        {/* Sophisticated Background Effects with Orange/Indigo Palette */}
        <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.008] pointer-events-none"></div>
        
        {/* Elegant Orange/Indigo Ambient Lighting */}
        <div className="fixed top-[15%] right-[20%] -z-10 w-[500px] h-[500px] bg-gradient-to-r from-orange-500/8 via-orange-400/6 to-indigo-600/4 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="fixed bottom-[15%] left-[15%] -z-10 w-[400px] h-[400px] bg-gradient-to-r from-indigo-500/6 via-orange-400/4 to-indigo-400/3 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="fixed top-[50%] right-[70%] -z-10 w-[350px] h-[350px] bg-gradient-to-r from-orange-400/5 via-white/3 to-indigo-500/2 rounded-full blur-[90px] animate-pulse-soft" />
        
        {/* Additional Depth Layers for Sophistication */}
        <div className="fixed top-[80%] left-[60%] -z-10 w-[300px] h-[300px] bg-gradient-to-r from-orange-300/4 via-indigo-400/3 to-orange-200/2 rounded-full blur-[80px] animate-pulse-soft" />
        <div className="fixed top-[30%] left-[80%] -z-10 w-[250px] h-[250px] bg-gradient-to-r from-indigo-300/3 via-orange-300/2 to-white/2 rounded-full blur-[70px] animate-pulse-soft" />

        <div className="h-full flex flex-col p-0 relative overflow-hidden">
          {/* Flower of Life Button - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <FlowerOfLife 
              size={64} 
              isActive={isFlowerActive} 
              onClick={handleFlowerClick}
              hasNewContent={hasNewContent}
              className="hover:drop-shadow-2xl"
            />
          </div>

          {/* Main Content Layout - Interactive Split with Full-Height Divider */}
          <div className="flex-1 relative overflow-hidden">
            <div className="h-full w-full flex relative">
              
              {/* Left Section - Avatar & Chat Area - Width Locked */}
              <div
                className="h-full flex flex-col overflow-hidden"
                style={{
                  width: `${dividerPosition}%`,
                  maxWidth: `${dividerPosition}%`,
                  minWidth: '0'
                }}
              >
                <div className="w-full h-full overflow-hidden">
                    <CenterColumn
                      maxWidthPercent={dividerPosition}
                    />
                </div>
              </div>

              {/* Right Section - Perfect Mosaic Layout with Minimum Width Protection */}
              <div
                className="h-full flex flex-col overflow-hidden p-4"
                style={{
                  width: `${100 - dividerPosition}%`,
                  minWidth: '600px' // Ensure cards don't collapse
                }}
              >
                {/* Title - at top */}
                <div className="text-center mt-12 mb-2 flex-shrink-0">
                  <h1 className="text-xl font-bold text-white mb-0.5">Daily Roadmap</h1>
                  <p className="text-white/60 text-xs">Small daily actions → big growth</p>
                </div>

                {/* Cards Row - centered in remaining space */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="flex items-stretch gap-4 h-full max-h-[600px]">
                    {/* Daily Snapshot - Full Height */}
                    <div className="flex items-center">
                      <ErrorBoundary fallback={
                        <AtmoCard className="w-full h-full">
                          <CardContent className="h-full flex items-center justify-center p-4 text-center text-white/60">
                            <p>Daily snapshot temporarily unavailable</p>
                          </CardContent>
                        </AtmoCard>
                      }>
                        <DailySnapshot />
                      </ErrorBoundary>
                    </div>

                    {/* Cards Column - Centered vertically */}
                    <div className="flex flex-col justify-center gap-4">
                  {/* Card 1 - Priority Stream (Mission Control) */}
                  <div className="w-72 h-[420px]">
                    <PriorityStreamEnhanced compact={false} priorityOnly={true} context="dashboard" className="w-full h-full" />
                  </div>

                  {/* Card 2 - Today's Actions */}
                  <TodaysActionsCard onOpenChat={handleOpenChatWithQuestion} />
                  </div>
                </div>
              </div>
              </div>

              {/* Ultra-Responsive Interactive Divider */}
              <InteractiveDivider
                initialPosition={50}
                minPosition={25}
                maxPosition={55}
                onPositionChange={setDividerPosition}
                className="z-20"
                showOnMobile={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Get Centered Card */}
      <GetCenteredCard
        isOpen={showSacredModal}
        onClose={() => setShowSacredModal(false)}
      />

      {/* New Project Dialog */}
      <Dialog open={showNewProjectModal} onOpenChange={setShowNewProjectModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Project</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new project to organize your knowledge and tasks
            </DialogDescription>
          </DialogHeader>

          <ProjectForm
            onCancel={() => setShowNewProjectModal(false)}
            onSubmit={() => setShowNewProjectModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default React.memo(DashboardLayout); 
