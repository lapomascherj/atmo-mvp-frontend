import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Activity as ActivityIcon,
    ArrowLeft,
    Brain,
    Calendar,
    Check,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    Clock,
    Edit,
    FileText,
    FolderOpen,
    MessageSquare,
    Mic,
    Plus,
    Save,
    Target,
    Trash2,
    TrendingUp,
    Zap
} from 'lucide-react';
import {Button} from '@/components/atoms/Button.tsx';
import {Progress} from '@/components/atoms/Progress.tsx';
import {Badge} from '@/components/atoms/Badge.tsx';
import {Input} from '@/components/atoms/Input.tsx';
import {TextArea} from '@/components/atoms/TextArea.tsx';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/atoms/Select.tsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/atoms/Dialog.tsx';
import {Task} from '@/models/Task.ts';
import {Priority} from '@/models/Priority.ts';
import {Project} from '@/models/Project.ts';
import {Milestone} from '@/models/Milestone.ts';
import {useProjectsStore} from '@/stores/useProjectsStore.ts';
import {useTasksStore} from '@/stores/useTasksStore.ts';
import {useGoalsStore} from '@/stores/useGoalsStore.ts';
import {useKnowledgeItemsStore} from '@/stores/useKnowledgeItemsStore.ts';
import {usePersonasStore} from '@/stores/usePersonasStore.ts';
import useMockAuth from '@/hooks/useMockAuth';
import { getPocketBase } from "@/hooks/useMockPocketBase";
import GoalForm from '@/components/molecules/GoalForm.tsx';
import MilestoneForm from '@/components/molecules/MilestoneForm.tsx';
import GoalsTasksTable from '@/components/molecules/GoalsTasksTable.tsx';
import TaskForm from '@/components/molecules/TaskForm.tsx';
import KnowledgeItemsSidebar from '@/components/molecules/KnowledgeItemsSidebar.tsx';
import ProjectViewLayout from '@/components/layouts/ProjectViewLayout.tsx';

import {Goal} from '@/models/Goal.ts';
import {Status} from '@/models/Status.ts';
import { useToast } from '@/hooks/useToast.ts';
import HorizontalScrollGrid from '@/components/atoms/HorizontalScrollGrid.tsx';
import MilestoneCard from '@/components/molecules/MilestoneCard.tsx';
import ErrorBoundary from '@/components/atoms/ErrorBoundary';
import { useMilestonesStore } from '@/stores/useMilestonesStore.ts';

const ProjectView: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {user, token} = useMockAuth();
    const pb = getPocketBase();
    const { toast } = useToast();

    // PersonasStore - centralized CRUD operations (following the actual architecture)
    const {
        currentPersona,
        loading: personasLoading,
        fetchPersonaByIam,
        addGoal,
        updateGoal,
        removeGoal,
        addTask,
        updateTask,
        removeTask,
        addMilestone,
        updateMilestone,
        removeMilestone,
        getKnowledgeItems: getPersonaKnowledgeItems,
        addKnowledgeItemToProject,
        removeKnowledgeItemFromProject
    } = usePersonasStore();

    // Individual stores - data accessors and views (following the actual architecture)
    const {projects, getProjectById, fetchProjects, loading: projectsLoading} = useProjectsStore();
    const {goals, fetchGoals} = useGoalsStore();
    const {tasks, fetchTasks} = useTasksStore();
    const {knowledgeItems, fetchKnowledgeItems} = useKnowledgeItemsStore();
    const {addMilestone: addMilestoneToStore, updateMilestone: updateMilestoneInStore, removeMilestone: removeMilestoneFromStore} = useMilestonesStore();

    // Get the current project
    const project = id ? getProjectById(id) : null;
    
    // Get milestones for this project
    const projectMilestones = project?.milestones || [];
    
    // ===== ALL useState HOOKS - MUST BE FIRST =====
    const [localProject, setLocalProject] = useState<Project | null>(null);
    const [editingProjectField, setEditingProjectField] = useState<string | null>(null);
    const [goalText, setGoalText] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [showTaskDialog, setShowTaskDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editingTaskGoalId, setEditingTaskGoalId] = useState<string>('');
    const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [showMilestones, setShowMilestones] = useState(true);
    const [projectGoals, setProjectGoals] = useState<Goal[]>([]);
    const [goalRefreshKey, setGoalRefreshKey] = useState(0);
    
    // Use the project from the store as the current project
    const currentProject = project;

    // Load data on mount and when dependencies change
    useEffect(() => {
        const loadData = async () => {
            if (!user?.iam || !token || !pb) {
                return;
            }

            try {
                // Load projects first (this doesn't require PersonasStore)
                if (!projects || projects.length === 0) {
                    await fetchProjects(token, true);
                }

                // Initialize PersonasStore in background if not loaded
                if (!currentPersona && !personasLoading) {
                    // Don't await this - let it run in background
                    usePersonasStore.getState().fetchPersonaByIam(pb, user.iam).catch(error => {
                        console.debug("PersonasStore initialization auto-cancelled or failed");
                    });
                }
            } catch (error) {
                console.error("❌ PROJECT VIEW: Data loading failed:", error);
            }
        };

        loadData();
    }, [user?.iam, token, pb]); // Removed projects?.length to prevent loops

    // Check if project exists after data is loaded
    useEffect(() => {
        if (!projectsLoading && projects.length > 0 && id && !project) {
            console.log("❌ PROJECT VIEW: Project not found:", id);
            toast({
                title: "Project not found",
                description: "The requested project could not be found.",
                variant: "destructive",
            });
            navigate("/knowledge-organiser");
        }
    }, [project, projectsLoading, projects, id, navigate, toast]);

    // Sync local project state with store project (reactive updates)
    useEffect(() => {
        if (project && !editingProjectField) {
            setLocalProject(prevLocal => {
                // Only update if the local project is significantly different from store project
                // This prevents overwriting optimistic updates while still allowing reactive updates
                if (!prevLocal || 
                    prevLocal.id !== project.id ||
                    (prevLocal.items?.length || 0) !== (project.items?.length || 0)) {
                    return project;
                }
                return prevLocal;
            });
        }
    }, [project, editingProjectField]);

    // Fetch project goals with expanded tasks
    useEffect(() => {
        const fetchProjectGoals = async () => {
            if (!pb || !id) return;

            try {
                // Get the project with its goals, and expand the tasks relation
                const project = await pb.collection('projects').getOne(id, {
                    expand: 'goals,goals.tasks'
                });

                const expandedGoals = project.expand?.goals || [];
                const goalsArray = Array.isArray(expandedGoals) ? expandedGoals : [expandedGoals];
                
                // Process goals and their expanded tasks
                setProjectGoals(goalsArray.map(goal => ({
                    ...goal,
                    tasks: goal.expand?.tasks || [] // Use expanded tasks from PocketBase relation
                })));
            } catch (error) {
                if (error instanceof Error && error.message.includes('autocancelled')) {
                    console.log('Project goals request was auto-cancelled by PocketBase - this is expected');
                    return;
                }

                console.error('Failed to fetch project goals:', error);
                setProjectGoals([]);
            }
        };

        fetchProjectGoals();
    }, [pb, id]);

    // Trigger refresh when goalRefreshKey changes
    useEffect(() => {
        if (goalRefreshKey > 0) {
            refreshProjectGoals();
        }
    }, [goalRefreshKey]);

    // Function to refresh project goals after changes
    const refreshProjectGoals = async () => {
        if (!pb || !id || !user?.iam) return;

        try {
            console.log("🔄 PROJECT VIEW: Refreshing project data from PersonasStore");
            
            // Refresh PersonasStore data (single source of truth)
            await fetchPersonaByIam(pb, user.iam);
            
            // Refresh ProjectsStore to get updated project data
            await fetchProjects(token || '', true);
            
            // Also refresh the local project goals state for immediate UI update
            const project = await pb.collection('projects').getOne(id, {
                expand: 'goals,goals.tasks'
            });

            const expandedGoals = project.expand?.goals || [];
            const goalsArray = Array.isArray(expandedGoals) ? expandedGoals : [expandedGoals];
            
            setProjectGoals(goalsArray.map(goal => ({
                ...goal,
                tasks: goal.expand?.tasks || []
            })));
            
            console.log("✅ PROJECT VIEW: Project data refreshed successfully");
        } catch (error) {
            console.error('❌ PROJECT VIEW: Failed to refresh project goals:', error);
        }
    };

    // ===== ALL useMemo HOOKS - MUST BE AFTER useState BUT BEFORE EARLY RETURNS =====
    // Get project-specific knowledge items from the current project's expand.items
    const projectKnowledge = React.useMemo(() => {
        if (!currentPersona?.expand?.projects) {
            return [];
        }

        const currentProject = currentPersona.expand.projects.find(p => p.id === id);
        if (!currentProject) {
            return [];
        }

        const projectItems = currentProject?.expand?.items || [];
        
        // Map PersonasStore data structure to KnowledgeItem interface
        return projectItems.map(item => {
            if (!item) {
                return null;
            }

            // Extract readable content from potentially complex data structure
            let readableContent = '';
            if (item.content) {
                if (typeof item.content === 'string') {
                    readableContent = item.content;
                } else if (typeof item.content === 'object') {
                    // If content is an object, try to extract meaningful text
                    const contentObj = item.content as any;
                    if (contentObj.text) readableContent = contentObj.text;
                    else if (contentObj.description) readableContent = contentObj.description;
                    else if (contentObj.summary) readableContent = contentObj.summary;
                    else if (contentObj.message) readableContent = contentObj.message;
                    else readableContent = JSON.stringify(item.content);
                }
            }

            // Try multiple possible title fields
            const itemTitle = item.title || (item as any).name || (item as any).title || 'Untitled Item';

            return {
                id: item.id,
                name: itemTitle,
                type: item.type as any,
                content: readableContent,
                date: item.created_at || new Date().toISOString(),
                source: item.source || 'unknown',
                tags: item.tags || [],
                created: item.created_at,
                updated: item.updated_at,
            };
        }).filter(Boolean); // Remove null items
    }, [id, currentPersona?.expand?.projects]);

    // Get available knowledge items for association (global items not already associated with this project)
    const availableKnowledgeItems = React.useMemo(() => {
        if (!currentPersona?.expand?.items) {
            return [];
        }

        const allPersonaKnowledgeItems = currentPersona.expand.items;
        const currentProject = currentPersona?.expand?.projects?.find(p => p.id === id);
        const projectItemIds = (currentProject?.expand?.items || []).map(item => item?.id).filter(Boolean);
        
        const availableItems = allPersonaKnowledgeItems.filter(item => 
            item && !projectItemIds.includes(item.id)
        );
        
        return availableItems.map(item => {
            const itemTitle = item.title || (item as any).name || 'Untitled Item';
            
            return {
                id: item.id,
                name: itemTitle,
                type: item.type as any,
                content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
                date: item.created_at || new Date().toISOString(),
                source: item.source || 'unknown',
                tags: item.tags || [],
                created: item.created_at,
                updated: item.updated_at,
            };
        }).filter(Boolean);
    }, [id, currentPersona?.expand?.projects, currentPersona?.expand?.items]);

    // ===== ALL REMAINING useEffect HOOKS - MUST BE BEFORE EARLY RETURNS =====
    useEffect(() => {
        if (project && !goalText) {
            setGoalText('');
        }
    }, [project, goalText]);

    // ===== ALL CALCULATIONS AND FUNCTIONS - MUST BE BEFORE EARLY RETURNS =====
    // Calculate analytics data from actual project goals and tasks
    const allTasks = projectGoals.flatMap(goal => goal.tasks || []);
    const completedTasks = allTasks.filter(task => task.completed).length;
    const totalTasks = allTasks.length;
    const completedGoals = projectGoals.filter(goal => goal.status === Status.Completed).length;
    const totalGoals = projectGoals.length;
    
    // Calculate project progress based on completed tasks
    const projectProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate last update based on most recent goal/task activity
    const getLastUpdate = () => {
        const dates: Date[] = [];
        
        // Check goal completion dates
        projectGoals.forEach(goal => {
            if (goal.completedDate) {
                dates.push(new Date(goal.completedDate));
            }
        });
        
        // If no completion dates, use project creation date or current date
        if (dates.length === 0) {
            if (project?.startDate) {
                dates.push(new Date(project.startDate));
            } else {
                dates.push(new Date());
            }
        }
        
        // Return the most recent date
        const mostRecent = new Date(Math.max(...dates.map(d => d.getTime())));
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - mostRecent.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    };

    // ===== ALL EARLY RETURNS AFTER ALL HOOKS =====
    // Show loading state
    if (!user?.iam || !token || !pb) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7000] mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading authentication...</p>
                </div>
            </div>
        );
    }

    // Show loading while projects are being fetched (essential for ProjectView)
    if (projectsLoading || (!projects?.length && !projectsLoading)) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7000] mx-auto mb-4"></div>
                    <p className="text-slate-400">
                        {projectsLoading ? "Loading projects..." : "Loading project data..."}
                    </p>
                </div>
            </div>
        );
    }

    // Show error if project not found after projects are loaded
    if (!project && projects?.length > 0 && id) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
                    <p className="text-slate-600 mb-4">
                        The requested project could not be found.
                    </p>
                    <Button 
                        onClick={() => navigate('/knowledge-organiser')}
                        className="bg-[#FF7000] text-white hover:bg-[#E5630A]"
                    >
                        Back to Projects
                    </Button>
                </div>
            </div>
        );
    }

    if (projectsLoading) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div
                        className="w-8 h-8 border-2 border-[#FF7000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading project data...</p>
                </div>
            </div>
        );
    }

    if (!currentProject) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-white mb-4">Project Not Found</h1>
                    <Button onClick={() => navigate('/knowledge-organiser')}
                            className="bg-[#FF7000] hover:bg-[#FF7000]/90">
                        Back to Digital Brain
                    </Button>
                </div>
            </div>
        );
    }

    const toggleTaskCompletion = async (taskId: string) => {
        const task = projectGoals.flatMap(g => g.tasks || []).find(t => t.id === taskId);
        if (task) {
            const updatedTask = {...task, completed: !task.completed};
            await updateTask(pb, taskId, updatedTask);
        }
    };

    const saveGoal = async () => {
        setEditingGoal(null);
    };

    const optimizeProject = async () => {
        setIsSyncing(true);
        try {
            // Use DigitalBrain API for project optimization
            const { digitalBrainAPI } = await import('@/api/mockDigitalBrainApi');
            
            console.log('🔄 PROJECT VIEW: Starting project optimization for:', currentProject.name);
            
            // Prepare data for optimization
            const allTasks = projectGoals.flatMap(goal => goal.tasks || []);
            
            // Call optimize endpoint with project data
            const optimizationResponse = await digitalBrainAPI.optimize({
                message: `Optimize project "${currentProject.name}" with focus on ${currentProject.description || 'general productivity'}`,
                projectId: currentProject.id,
                context: {
                    project: currentProject,
                    goals: projectGoals,
                    tasks: allTasks,
                    timeframe: currentProject.targetDate ? 'custom' : 'flexible',
                    priority: 'balance'
                }
            });
            
            console.log('✅ PROJECT VIEW: Project optimization completed:', optimizationResponse);
            
            toast({
                title: 'Project Optimized',
                description: optimizationResponse.message || 'Project has been optimized based on your goals and knowledge.',
            });
            
            // Apply optimization recommendations if available
            if (optimizationResponse.data.optimization?.optimizationSteps && optimizationResponse.data.optimization.optimizationSteps.length > 0) {
                // Show recommendations in a follow-up toast
                setTimeout(() => {
                    toast({
                        title: 'Optimization Recommendations',
                        description: optimizationResponse.data.optimization.optimizationSteps.slice(0, 2).join('. '),
                    });
                }, 2000);
            }
            
            // Refresh project data after optimization
            await fetchProjects(token!, true);
            
            // Refresh goals to get updated data
            await refreshProjectGoals();
            
        } catch (error) {
            console.error('❌ PROJECT VIEW: Failed to optimize project:', error);
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to optimize project. Please try again.';
            
            toast({
                title: 'Optimization Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Task CRUD operations
    const handleAddTask = async (goalId: string) => {
        setEditingTask(null);
        setEditingTaskGoalId(goalId);
        setShowTaskDialog(true);
    };

    const handleEditTask = (goalId: string, task: Task) => {
        setEditingTask(task);
        setEditingTaskGoalId(goalId);
        setShowTaskDialog(true);
    };



    const handleExpandGoal = (goalId: string) => {
        setExpandedGoals(prevExpanded => {
            const newExpanded = new Set(prevExpanded);
            if (newExpanded.has(goalId)) {
                newExpanded.delete(goalId);
            } else {
                newExpanded.add(goalId);
            }
            return newExpanded;
        });
    };

    // Milestone CRUD operations
    const handleAddMilestone = () => {
        setEditingMilestone(null);
        setShowMilestoneModal(true);
    };

    const handleEditMilestone = (milestone: Milestone) => {
        setEditingMilestone(milestone);
        setShowMilestoneModal(true);
    };

    const handleDeleteMilestone = async (milestoneId: string) => {
        if (!pb) return;

        try {
            await removeMilestone(pb, milestoneId);
        } catch (error) {
            console.error('Failed to delete milestone:', error);
        }
    };



    const handleSaveMilestone = async (milestoneData: any) => {
        if (!pb) return;
        
        try {
            if (editingMilestone) {
                await updateMilestone(pb, editingMilestone.id, milestoneData);
                toast({
                    title: 'Milestone updated',
                    description: 'Milestone has been updated successfully',
                });
            } else {
                const result = await addMilestone(pb, id, milestoneData);
                if (result) {
                    toast({
                        title: 'Milestone created',
                        description: 'Milestone has been created successfully',
                    });
                }
            }
            
            setShowMilestoneModal(false);
            setEditingMilestone(null);
            
            // Refresh milestones
            setGoalRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save milestone:', error);
            toast({
                title: 'Error',
                description: 'Failed to save milestone. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Centralized CRUD handlers for Goals using GoalsStore (following README.md)
    const handleCreateGoal = async (goalData: any) => {
        if (!id) {
            console.error("❌ PROJECT VIEW: No project ID for goal creation");
            return;
        }
        
        console.log("🚀 PROJECT VIEW: Starting goal creation:", {
            projectId: id,
            goalData,
            hasPersonaStore: !!currentPersona,
            personasLoading
        });
        
        try {
            const success = await addGoal(pb, id, goalData);
            console.log("📊 PROJECT VIEW: createGoal result:", success);
            
            if (success) {
                console.log("✅ PROJECT VIEW: Goal created successfully");
                toast({
                    title: 'Goal created',
                    description: `Goal "${goalData.name}" has been created successfully`,
                });
                // Refresh project goals to show the new goal
                await refreshProjectGoals();
            } else {
                console.error("❌ PROJECT VIEW: createGoal returned false");
                toast({
                    title: 'Warning',
                    description: 'Goal may not have been saved properly',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('❌ PROJECT VIEW: Failed to create goal:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create goal. Please try again.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleUpdateGoal = async (goalData: any) => {
        if (!editingGoal) return;
        
        try {
            const success = await updateGoal(pb, editingGoal.id, goalData);
            if (success) {
                toast({
                    title: 'Goal updated',
                    description: `Goal "${goalData.name}" has been updated successfully`,
                });
                // Refresh project goals to show the updated goal
                await refreshProjectGoals();
            }
        } catch (error) {
            console.error('Failed to update goal:', error);
            toast({
                title: 'Error',
                description: 'Failed to update goal. Please try again.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleSaveGoal = async (goalData: any) => {
        if (editingGoal) {
            await handleUpdateGoal(goalData);
        } else {
            await handleCreateGoal(goalData);
        }
        setShowGoalModal(false);
        setEditingGoal(null);
    };

    // Centralized CRUD handlers for Tasks using TasksStore (following README.md)
    const handleCreateTask = async (taskData: any) => {
        console.log("🚀 PROJECT VIEW: handleCreateTask called with:", {
            taskData,
            editingTaskGoalId,
            hasGoalId: !!editingTaskGoalId
        });
        
        if (!editingTaskGoalId) {
            console.error("❌ PROJECT VIEW: Missing goalId for task creation");
            return;
        }
        
        try {
            console.log("📞 PROJECT VIEW: Calling PersonasStore.addTask with goalId:", editingTaskGoalId);
            const success = await addTask(pb, editingTaskGoalId, taskData);
            console.log("📊 PROJECT VIEW: addTask result:", success);
            
            if (success) {
                console.log("✅ PROJECT VIEW: Task created successfully");
                toast({
                    title: 'Task created',
                    description: `Task "${taskData.name}" has been created successfully`,
                });
                
                // Refresh project goals to show the new task
                console.log("🔄 PROJECT VIEW: Refreshing project goals after task creation");
                await refreshProjectGoals();
            } else {
                console.error("❌ PROJECT VIEW: addTask returned false");
                toast({
                    title: 'Warning',
                    description: 'Task may not have been saved properly',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('❌ PROJECT VIEW: Failed to create task:', error);
            toast({
                title: 'Error',
                description: 'Failed to create task. Please try again.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleUpdateTask = async (taskData: any) => {
        if (!editingTask) return;
        
        try {
            const success = await updateTask(pb, editingTask.id, taskData);
            if (success) {
                toast({
                    title: 'Task updated',
                    description: `Task "${taskData.name}" has been updated successfully`,
                });
                
                // Refresh project goals to show the updated task
                await refreshProjectGoals();
            }
        } catch (error) {
            console.error('Failed to update task:', error);
            toast({
                title: "Update Failed",
                description: "Failed to update task field. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleSaveTask = async (taskData: any) => {
        console.log("🚀 PROJECT VIEW: handleSaveTask called with:", {
            taskData,
            editingTask: !!editingTask,
            editingTaskGoalId
        });
        
        try {
            if (editingTask) {
                console.log("📝 PROJECT VIEW: Updating existing task:", editingTask.id);
                await handleUpdateTask(taskData);
            } else {
                console.log("🆕 PROJECT VIEW: Creating new task for goal:", editingTaskGoalId);
                await handleCreateTask(taskData);
            }
            
            console.log("✅ PROJECT VIEW: Task operation completed, closing dialog");
            setShowTaskDialog(false);
            setEditingTask(null);
            setEditingTaskGoalId(''); // Reset the goal ID
        } catch (error) {
            console.error('❌ PROJECT VIEW: Failed to save task:', error);
            // Keep dialog open on error so user can retry
        }
    };

    // Inline editing handlers
    const handleUpdateGoalField = async (goalId: string, field: keyof Goal, value: any) => {
        if (!pb) return;

        try {
            // Find the goal to update
            const goalToUpdate = projectGoals.find(g => g.id === goalId);
            if (!goalToUpdate) {
                console.error('Goal not found:', goalId);
                return;
            }

            // Update the goal field in PocketBase
            await pb.collection('goals').update(goalId, { [field]: value });

            // Goal will be updated reactively through the goals store
            await refreshProjectGoals();
        } catch (error) {
            console.error('Failed to update goal field:', error);
        }
    };

    const handleUpdateTaskField = async (goalId: string, taskId: string, field: keyof Task, value: any) => {
        if (!pb) return;

        try {
            // Update the task field in the tasks collection
            const updatedTask = await pb.collection('tasks').update<Task>(taskId, { [field]: value });

            // Task will be updated reactively through the goals store
            await refreshProjectGoals();
        } catch (error) {
            console.error('Failed to update task field:', error);
            toast({
                title: "Update Failed",
                description: "Failed to update task field. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleUpdateProjectField = async (field: 'name' | 'description', value: string) => {
        if (!pb || !currentProject) return;

        // Update local state optimistically for immediate UI feedback
        setLocalProject(prev => prev ? { ...prev, [field]: value } : null);
        setEditingProjectField(null);

        try {
            // Update PocketBase directly without triggering store refresh
            // This prevents the flickering caused by store updates
            await pb.collection('projects').update(currentProject.id, { [field]: value });
        } catch (error) {
            console.error('Failed to update project field:', error);
            // Revert local state on error
            if (project) { // Use project from store
                setLocalProject(project);
            }
        }
    };

    const handleDeleteTask = async (goalId: string, taskId: string) => {
        try {
            // Delete the task using PersonasStore
            await removeTask(pb, taskId);
            
            // Refresh goals to reflect the deleted task
            await refreshProjectGoals();
            
            toast({
                title: "Task deleted",
                description: "The task has been deleted successfully.",
            });
        } catch (error) {
            console.error("❌ PROJECT VIEW: Failed to delete task:", error);
            toast({
                title: "Delete Failed",
                description: "Failed to delete the task. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleToggleTaskCompletion = async (goalId: string, taskId: string) => {
        const task = projectGoals
            .find(g => g.id === goalId)
            ?.tasks?.find(t => t.id === taskId);
        
        if (task) {
            // Update the task's completion status using PersonasStore
            await updateTask(pb, taskId, {
                completed: !task.completed
            });
            
            // Refresh goals to reflect the task completion change
            await refreshProjectGoals();
        }
    };

    const handleRemoveKnowledgeItem = async (knowledgeItemId: string) => {
        console.log("🗑️ PROJECT VIEW: handleRemoveKnowledgeItem called:", {
            knowledgeItemId,
            projectId: id,
            pb: !!pb
        });
        
        if (!pb || !id) return;
        
        try {
            console.log("📞 PROJECT VIEW: Calling PersonasStore.removeKnowledgeItemFromProject");
            await removeKnowledgeItemFromProject(pb, id, knowledgeItemId);
            
            console.log("✅ PROJECT VIEW: Knowledge item removed successfully");
            
            // Refresh all knowledge items to update the available list
            console.log("🔄 PROJECT VIEW: Refreshing knowledge items after removal");
            // const updatedItems = await getAllKnowledgeItems(pb); // This line is removed as per new_code
            // setAllKnowledgeItems(updatedItems);
            
            toast({
                title: "Knowledge Item Removed",
                description: "The knowledge item has been removed from this project.",
            });
        } catch (error) {
            console.error("❌ PROJECT VIEW: Failed to remove knowledge item:", error);
            toast({
                title: "Remove Failed",
                description: "Failed to remove the knowledge item. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleAddKnowledgeItems = () => {
        console.log("🔗 PROJECT VIEW: handleAddKnowledgeItems called - navigating to knowledge organiser");
        navigate('/knowledge-organiser');
    };

    const handleAssociateKnowledgeItems = async (knowledgeItemIds: string[]) => {
        console.log("🔗 PROJECT VIEW: handleAssociateKnowledgeItems called:", {
            knowledgeItemIds,
            projectId: id,
            count: knowledgeItemIds.length,
            pb: !!pb
        });
        
        if (!pb || !id) return;
        
        try {
            console.log("📞 PROJECT VIEW: Associating knowledge items with project");
            // Associate all selected knowledge items with the project
            for (const itemId of knowledgeItemIds) {
                console.log(`🔗 PROJECT VIEW: Associating item ${itemId} with project ${id}`);
                await addKnowledgeItemToProject(pb, id, itemId);
            }
            
            console.log("✅ PROJECT VIEW: All knowledge items associated successfully");
            
            // Refresh all knowledge items to update the available list
            console.log("🔄 PROJECT VIEW: Refreshing knowledge items after association");
            // const updatedItems = await getAllKnowledgeItems(pb); // This line is removed as per new_code
            // setAllKnowledgeItems(updatedItems);
            
            toast({
                title: "Knowledge Items Linked",
                description: `Successfully linked ${knowledgeItemIds.length} knowledge item${knowledgeItemIds.length > 1 ? 's' : ''} to this project.`,
            });
        } catch (error) {
            console.error("❌ PROJECT VIEW: Failed to associate knowledge items:", error);
            toast({
                title: "Link Failed",
                description: "Failed to link knowledge items. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Inline editing component for project fields - invisible/seamless UX
    const InlineTextEdit = ({ value, onSave, onCancel, multiline = false, placeholder = "", className = "" }: {
        value: string;
        onSave: (value: string) => void;
        onCancel: () => void;
        multiline?: boolean;
        placeholder?: string;
        className?: string;
    }) => {
        const [editValue, setEditValue] = useState(value);

        const handleSave = () => {
            onSave(editValue);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !multiline) {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                onCancel();
            }
        };

        const handleBlur = () => {
            handleSave();
        };

        if (multiline) {
            return (
                <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className={`bg-transparent border-none outline-none resize-none w-full ${className}`}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        padding: 0,
                        margin: 0,
                        height: '3rem', // Fixed height to prevent layout shift
                        overflow: 'hidden',
                        lineHeight: '1.5',
                        fontSize: 'inherit'
                    }}
                    rows={2} // Fixed rows to maintain consistent height
                    placeholder={placeholder}
                    autoFocus
                />
            );
        }

        return (
            <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className={`bg-transparent border-none outline-none w-full ${className}`}
                style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    padding: 0,
                    margin: 0,
                    height: 'auto'
                }}
                placeholder={placeholder}
                autoFocus
            />
        );
    };

    return (
        <ErrorBoundary fallback={
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold mb-2">Project View Error</h2>
                    <p className="text-slate-600 mb-4">Something went wrong loading this project.</p>
                    <Button onClick={() => window.location.href = '/knowledge-organiser'}>
                        Back to Projects
                    </Button>
                </div>
            </div>
        }>
            <ProjectViewLayout 
                sidebar={
                    <KnowledgeItemsSidebar
                        knowledgeItems={projectKnowledge}
                        onRemoveItem={handleRemoveKnowledgeItem}
                        onAddItems={handleAddKnowledgeItems}
                        onAssociateItems={handleAssociateKnowledgeItems}
                        availableKnowledgeItems={availableKnowledgeItems}
                        isLoading={projectsLoading}
                    />
                }
            >
                {/* Clean Header with repositioned back button */}
                <div className="mb-12">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-start gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/knowledge-organiser')}
                                className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2"/>
                                Back to Digital Brain
                            </Button>

                            <div className="h-6 w-px bg-white/20"/>

                            <div className="flex items-start gap-3">
                                <div
                                    className="p-3 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30 flex-shrink-0 mt-1">
                                    <Target className="w-7 h-7 text-[#FF7000]"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Project Name - Inline Editable */}
                                    <div className="group mb-2">
                                        {editingProjectField === 'name' ? (
                                            <InlineTextEdit
                                                value={currentProject.name}
                                                onSave={(value) => handleUpdateProjectField('name', value)}
                                                onCancel={() => setEditingProjectField(null)}
                                                placeholder="Enter project name"
                                                className="text-4xl font-light text-white"
                                            />
                                        ) : (
                                            <h1 
                                                className="text-4xl font-light text-white hover:text-[#FF7000] cursor-pointer transition-colors"
                                                onClick={() => setEditingProjectField('name')}
                                                title="Click to edit project name"
                                            >
                                                {currentProject.name}
                                            </h1>
                                        )}
                                    </div>
                                    
                                    {/* Project Description - Inline Editable */}
                                    <div className="group min-h-[3rem] flex items-start">
                                        {editingProjectField === 'description' ? (
                                            <InlineTextEdit
                                                value={currentProject.description || ''}
                                                onSave={(value) => handleUpdateProjectField('description', value)}
                                                onCancel={() => setEditingProjectField(null)}
                                                multiline
                                                placeholder="Enter project description"
                                                className="text-slate-400 focus:text-slate-300"
                                            />
                                        ) : (
                                            <p 
                                                className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors min-h-[3rem] flex items-start"
                                                onClick={() => setEditingProjectField('description')}
                                                title="Click to edit project description"
                                                style={{ lineHeight: '1.5' }}
                                            >
                                                {currentProject.description || 'Click to add description'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={optimizeProject}
                                disabled={isSyncing}
                                className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
                                title="Optimize Project"
                            >
                                <Zap className="w-4 h-4"/>
                                {isSyncing ? 'Optimizing...' : 'Optimize'}
                            </Button>
                        </div>
                    </div>

                    {/* Project Overview with real-time stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-[#FF7000]"/>
                                <span className="text-white/70 text-sm">Progress</span>
                            </div>
                            <div className="text-white text-2xl font-light mb-2">{projectProgress}%</div>
                            <Progress value={projectProgress} className="h-1.5" indicatorClassName="bg-[#FF7000]"/>
                        </div>

                        <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-purple-400"/>
                                <span className="text-white/70 text-sm">Time Invested</span>
                            </div>
                            <div
                                className="text-white text-2xl font-light">{currentProject.timeInvested ? `${currentProject.timeInvested}h` : '0h'}</div>
                        </div>

                        <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckSquare className="w-5 h-5 text-emerald-400"/>
                                <span className="text-white/70 text-sm">Tasks</span>
                            </div>
                            <div className="text-white text-2xl font-light">{completedTasks}/{totalTasks}</div>
                        </div>

                        <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ActivityIcon className="w-5 h-5 text-blue-400"/>
                                <span className="text-white/70 text-sm">Last Update</span>
                            </div>
                            <div
                                className="text-white text-lg font-light">{getLastUpdate()}</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div className="space-y-8">
                    {/* Milestones Section */}
                    <section>
                        <button
                            onClick={() => setShowMilestones(!showMilestones)}
                            className="flex items-center gap-3 w-full text-left mb-6 group"
                        >
                            {showMilestones ? (
                                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"/>
                            ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"/>
                            )}
                            <h2 className="text-2xl font-light text-white group-hover:text-[#FF7000] transition-colors">
                                Milestones
                            </h2>
                            <span className="text-sm text-slate-500 ml-auto">
                                {/* milestones.filter(m => m.project_id === id).length */}
                            </span>
                        </button>

                        {showMilestones && (
                            <div className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6">
                                <HorizontalScrollGrid>
                                    {projectMilestones.map((milestone, index) => (
                                        <MilestoneCard
                                            key={milestone?.id || `milestone-${index}`}
                                            milestone={milestone}
                                            onEdit={() => handleEditMilestone(milestone)}
                                            onDelete={() => handleDeleteMilestone(milestone.id)}
                                        />
                                    ))}
                                    {/* Add Milestone Button - following Dashboard pattern */}
                                    <div 
                                        className="flex-shrink-0 w-32 p-3 bg-black/10 border border-dashed border-[#FF7000]/30 rounded-lg hover:bg-black/20 hover:border-[#FF7000]/50 transition-colors flex flex-col items-center justify-center cursor-pointer"
                                        onClick={handleAddMilestone}
                                    >
                                        <Plus className="w-4 h-4 text-[#FF7000]/60 mb-1" />
                                        <span className="text-xs text-[#FF7000]/60">Add Milestone</span>
                                    </div>
                                </HorizontalScrollGrid>
                            </div>
                        )}
                    </section>

                    {/* Goals & Tasks Consolidated Section */}
                    <section>
                        <GoalsTasksTable
                            goals={projectGoals}
                            expandedGoals={expandedGoals}
                            onAddGoal={() => setShowGoalModal(true)}
                            onEditGoal={(goal) => {
                                setEditingGoal(goal);
                                setShowGoalModal(true);
                            }}
                            onDeleteGoal={(goalId) => removeGoal(pb, goalId)}
                            onToggleGoalStatus={(goalId, status) => { /* This function is not directly available in the new useGoalsStore */ }}
                            onExpandGoal={handleExpandGoal}
                            onAddTask={handleAddTask}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onToggleTaskCompletion={handleToggleTaskCompletion}
                            onUpdateGoalField={handleUpdateGoalField}
                            onUpdateTaskField={handleUpdateTaskField}
                        />
                    </section>


                </div>
            </ProjectViewLayout>

            {/* Goal Modal Dialog */}
            <Dialog open={showGoalModal} onOpenChange={setShowGoalModal}>
                <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingGoal ? 'Update your goal details' : 'Create a new goal for this project'}
                        </DialogDescription>
                    </DialogHeader>
                    <GoalForm 
                        goal={editingGoal}
                        projectId={id!}
                        milestones={projectMilestones}
                        onCancel={() => {
                            setShowGoalModal(false);
                            setEditingGoal(null);
                        }}
                        onSubmit={handleSaveGoal}
                    />
                </DialogContent>
            </Dialog>

            {/* Milestone Modal Dialog */}
            <Dialog open={showMilestoneModal} onOpenChange={setShowMilestoneModal}>
                <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingMilestone ? 'Update your milestone details' : 'Create a new milestone for this project'}
                        </DialogDescription>
                    </DialogHeader>
                    <MilestoneForm
                        projectId={id!}
                        milestone={editingMilestone}
                        onCancel={() => {
                            setShowMilestoneModal(false);
                            setEditingMilestone(null);
                        }}
                        onSubmit={handleSaveMilestone}
                    />
                </DialogContent>
            </Dialog>

            {/* Task Edit Dialog */}
            <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingTask ? 'Edit Task' : 'Add New Task'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingTask ? 'Update your task details' : 'Create a new task for this goal'}
                        </DialogDescription>
                    </DialogHeader>
                    <TaskForm
                        task={editingTask || undefined}
                        goalId={editingTaskGoalId}
                        onCancel={() => {
                            setShowTaskDialog(false);
                            setEditingTask(null);
                            setEditingTaskGoalId('');
                        }}
                        onSubmit={handleSaveTask}
                    />
                </DialogContent>
            </Dialog>
        </ErrorBoundary>
    );
};

export default ProjectView;

