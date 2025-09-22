import React, { useMemo, useState } from 'react';
import CenterColumn from '../layouts/CenterColumn.tsx';
import CompactDailySnapshot from '../molecules/CompactDailySnapshot.tsx';
import { AtmoCard } from '../molecules/AtmoCard.tsx';
import { CardHeader, CardContent } from '../atoms/Card.tsx';
import { Button } from '../atoms/Button.tsx';
import { Badge } from '../atoms/Badge.tsx';
import { Target, Plus, BarChart3 } from 'lucide-react';
import { usePersonasStore } from '@/stores/usePersonasStore.ts';
import { useAuth } from '@/hooks/useMockAuth';
import { Priority } from '@/models/Priority.ts';
import HorizontalScrollGrid from '@/components/atoms/HorizontalScrollGrid.tsx';
import ErrorBoundary from '@/components/atoms/ErrorBoundary.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/atoms/Dialog.tsx';
import ProjectForm from '@/components/molecules/ProjectForm.tsx';
import FlowerOfLife from '@/components/atoms/FlowerOfLife.tsx';
import SacredModal from '@/components/molecules/SacredModal.tsx';

interface DashboardLayoutProps {
  userName: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userName }) => {
  // Use PersonasStore as single source of truth (following README.md)
  // Subscribe to the actual state to ensure re-renders when data changes
  const currentPersona = usePersonasStore(state => state.currentPersona);
  const loading = usePersonasStore(state => state.loading);
  const getProjects = usePersonasStore(state => state.getProjects);
  const getTasks = usePersonasStore(state => state.getTasks);
  const getGoals = usePersonasStore(state => state.getGoals);
  
  // Get user data for dashboard
  const { user } = useAuth();

  // Add modal state for project creation
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  
  // Sacred geometry modal state
  const [showSacredModal, setShowSacredModal] = useState(false);
  const [isFlowerActive, setIsFlowerActive] = useState(false);
  const [hasNewContent, setHasNewContent] = useState(false);

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
    
    console.log("📊 DASHBOARD: Data loaded from PersonasStore:", {
      personaId: currentPersona.id,
      projects: projects.length,
      tasks: tasks.length,
      goals: goals.length,
      hasExpand: !!currentPersona.expand,
      hasProjects: !!currentPersona.expand?.projects,
      hasItems: !!currentPersona.expand?.items
    });
    
    return { projects, tasks, goals };
  }, [currentPersona, getProjects, getTasks, getGoals]);

  // Memoize dashboard calculations to prevent re-computation on every render
  const dashboardStats = useMemo(() => {
    const activeProjects = projects.filter(project => project.active !== false).slice(0, 4);
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
      <div className="h-full bg-black relative overflow-hidden">
        {/* Sophisticated Background Effects with Orange/Indigo Palette */}
        <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.008] pointer-events-none"></div>
        
        {/* Elegant Orange/Indigo Ambient Lighting */}
        <div className="fixed top-[15%] right-[20%] -z-10 w-[500px] h-[500px] bg-gradient-to-r from-orange-500/8 via-orange-400/6 to-indigo-600/4 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="fixed bottom-[15%] left-[15%] -z-10 w-[400px] h-[400px] bg-gradient-to-r from-indigo-500/6 via-orange-400/4 to-indigo-400/3 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="fixed top-[50%] right-[70%] -z-10 w-[350px] h-[350px] bg-gradient-to-r from-orange-400/5 via-white/3 to-indigo-500/2 rounded-full blur-[90px] animate-pulse-soft" />
        
        {/* Additional Depth Layers for Sophistication */}
        <div className="fixed top-[80%] left-[60%] -z-10 w-[300px] h-[300px] bg-gradient-to-r from-orange-300/4 via-indigo-400/3 to-orange-200/2 rounded-full blur-[80px] animate-pulse-soft" />
        <div className="fixed top-[30%] left-[80%] -z-10 w-[250px] h-[250px] bg-gradient-to-r from-indigo-300/3 via-orange-300/2 to-white/2 rounded-full blur-[70px] animate-pulse-soft" />

        <div className="h-screen flex flex-col p-8 relative">
          {/* Flower of Life Button - Top Right */}
          <div className="absolute top-6 right-6 z-20">
            <FlowerOfLife 
              size={64} 
              isActive={isFlowerActive} 
              onClick={handleFlowerClick}
              hasNewContent={hasNewContent}
              className="hover:drop-shadow-2xl"
            />
          </div>

          {/* Two-Column Layout with Top Row */}
          <div className="flex-1 flex flex-col space-y-6">
            {/* Active Projects Card - Match Daily Snapshot width */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="w-full max-w-sm">
                <AtmoCard variant="orange" className="w-full h-48" hover={true}>
                  <CardHeader className="pb-3 pt-4 px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#FF5F1F]/20">
                          <Target className="w-5 h-5 text-[#FF5F1F]" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">Active Projects</span>
                          <p className="text-xs text-slate-300">Current work in progress</p>
                        </div>
                      </div>
                      
                      {/* Compact Analytics - Same Row */}
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-base font-bold text-[#FF5F1F]">{completionRate}%</div>
                          <div className="text-xs text-slate-400">Progress</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-green-400">{completedTasks}</div>
                          <div className="text-xs text-slate-400">Done</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-red-400">{highPriorityTasks}</div>
                          <div className="text-xs text-slate-400">High</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-yellow-400">{mediumPriorityTasks}</div>
                          <div className="text-xs text-slate-400">Medium</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-blue-400">{activeProjects.length}</div>
                          <div className="text-xs text-slate-400">Projects</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-4 pt-0">
                    {/* Projects List - Horizontal Fill First */}
                    <HorizontalScrollGrid
                      emptyState={
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <Target className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm mb-3">No active projects</p>
                            <Button
                              size="sm"
                              className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
                              onClick={() => setShowNewProjectModal(true)}
                            >
                              <Plus className="w-3 h-3" />
                              New Project
                            </Button>
                          </div>
                        </div>
                      }
                    >
                      {activeProjects.map((project) => (
                        <div key={project.id} className="flex-shrink-0 w-32 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#FF5F1F]"></div>
                            <h4 className="text-white text-xs font-medium truncate flex-1">{project.name}</h4>
                          </div>
                          <div className="text-xs text-[#FF5F1F] font-medium mb-2">{project.progress || 0}%</div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#FF5F1F] rounded-full transition-all duration-500"
                              style={{ width: `${project.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {/* Add Project Button */}
                      <div 
                        className="flex-shrink-0 w-32 p-3 bg-black/10 border border-dashed border-[#FF5F1F]/30 rounded-lg hover:bg-black/20 hover:border-[#FF5F1F]/50 transition-colors flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setShowNewProjectModal(true)}
                      >
                        <Plus className="w-4 h-4 text-[#FF5F1F]/60 mb-1" />
                        <span className="text-xs text-[#FF5F1F]/60">Add Project</span>
                      </div>
                    </HorizontalScrollGrid>
                  </CardContent>
                </AtmoCard>
              </div>
            </div>

            {/* Main Content Row - Centered Two-Column Layout */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-7xl grid grid-cols-12 gap-8">
                {/* Main Column - Chat */}
                <div className="col-span-8 flex flex-col">
                  <ErrorBoundary fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white/60">
                        <p>Chat interface temporarily unavailable</p>
                      </div>
                    </div>
                  }>
                    <CenterColumn />
                  </ErrorBoundary>
                </div>

                {/* Companion Column - Daily Information */}
                <div className="col-span-4 flex flex-col">
                  <div className="h-full flex items-start justify-center pt-4">
                    <div className="w-full max-w-sm">
                      <ErrorBoundary fallback={
                        <div className="bg-slate-800/20 rounded-xl p-4 text-center text-white/60">
                          <p>Daily snapshot temporarily unavailable</p>
                        </div>
                      }>
                        <CompactDailySnapshot />
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sacred Geometry Modal */}
      <SacredModal 
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