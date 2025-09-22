import React, {useEffect, useMemo, useState} from 'react';
import {
    ArrowRight,
    Brain,
    ChevronDown,
    ChevronRight,
    FileText,
    FolderOpen,
    MessageSquare,
    Mic,
    Plus,
    Search,
    Star,
    X,
    Link,
    Unlink,
    Tag,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import {Button} from '@/components/atoms/Button.tsx';
import {Input} from '@/components/atoms/Input.tsx';
import {useNavigate} from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/atoms/Dialog.tsx';
import {Project} from "@/models/Project.ts"
import {KnowledgeItem} from "@/models/KnowledgeItem.ts";
import {useProjectsStore} from "@/stores/useProjectsStore.ts";
import {usePersonasStore} from "@/stores/usePersonasStore.ts";
import {useAuth} from "@/hooks/useMockAuth";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import PageHeader from "@/components/atoms/PageHeader.tsx";
import ProjectForm from "@/components/molecules/ProjectForm.tsx";
import KnowledgeOrganizerLayout from "@/components/layouts/KnowledgeOrganizerLayout.tsx";
import KnowledgeItemsSidebar from "@/components/molecules/KnowledgeItemsSidebar.tsx";
import InsightWidgets from "@/components/molecules/InsightWidgets.tsx";
import AssociationDialog from "@/components/molecules/AssociationDialog.tsx";
import { useToast } from "@/hooks/useToast.ts";
import { useIntegrationsStore } from "@/stores/useMockIntegrationsStore";
import { Focus } from '@/models/Focus.ts';
import { JobTitle } from '@/models/JobTitle.ts';
import { IntegrationProvider } from '@/models/IntegrationProvider.ts';
import { IntegrationType } from '@/models/IntegrationType.ts';
import { InteractionType } from '@/models/InteractionType.ts';

const KnowledgeOrganiser: React.FC = () => {
    const navigate = useNavigate();
    const {projects, fetchProjects, addKnowledgeItemToProject, removeKnowledgeItemFromProject, removeProject} = useProjectsStore();
    
    // Use PersonasStore directly instead of useKnowledgeItemsStore for consistency with ProjectView
    const {
        currentPersona,
        fetchPersonaByIam,
        getKnowledgeItems,
        removeKnowledgeItem,
        loading: personasLoading
    } = usePersonasStore();
    
    const { integrations, fetchIntegrations } = useIntegrationsStore();
    const {user} = useAuth();
    const pb = usePocketBase();
    const { toast } = useToast();
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [selectedKnowledgeItem, setSelectedKnowledgeItem] = useState<KnowledgeItem | null>(null);
    const [showProjectAssociationDialog, setShowProjectAssociationDialog] = useState(false);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [draggedItem, setDraggedItem] = useState<KnowledgeItem | null>(null);

    // Transform knowledge items using the same logic as ProjectView for consistency
    const knowledgeItems = useMemo(() => {
        if (!currentPersona?.expand?.items) {
            return [];
        }

        const rawItems = currentPersona.expand.items;
        
        // Use the same transformation logic as ProjectView to ensure consistency
        return rawItems.map(item => {
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

            // Try multiple possible title fields (same as ProjectView)
            const itemTitle = item.title || (item as any).name || (item as any).title || 'Untitled Item';

            // Map to KnowledgeItem interface (same as ProjectView)
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
                // Add projects array for association display
                projects: [], // TODO: This would need to be populated from project associations
            } as KnowledgeItem;
        }).filter(Boolean); // Remove null items
    }, [currentPersona?.expand?.items]);

    console.log("🔍 KNOWLEDGE ORGANIZER: Knowledge items from PersonasStore:", {
        rawItemsCount: currentPersona?.expand?.items?.length || 0,
        transformedItemsCount: knowledgeItems.length,
        personaLoaded: !!currentPersona,
        hasExpand: !!currentPersona?.expand,
        hasItems: !!currentPersona?.expand?.items
    });

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (pb && user && mounted) {
                try {
                    console.log('🔄 KnowledgeOrganiser: Starting data fetch for user:', user.iam);

                    // Fetch projects and integrations in parallel
                    const [projectsResult, integrationsResult] = await Promise.allSettled([
                        fetchProjects(user.iam),
                        fetchIntegrations(pb)
                    ]);

                    console.log('✅ KnowledgeOrganiser: Projects and integrations fetched');

                    // Initialize PersonasStore only once
                    if (!currentPersona && !personasLoading && mounted) {
                        console.log('🔄 KnowledgeOrganiser: Fetching persona data');
                        try {
                            await fetchPersonaByIam(pb, user.iam);
                        } catch (error) {
                            console.log('⚠️ KnowledgeOrganiser: Persona fetch failed (expected for demo)');
                        }
                    }

                    console.log('✅ KnowledgeOrganiser: Data fetch completed');
                } catch (error) {
                    console.log('⚠️ KnowledgeOrganiser: Data fetch completed with errors (expected for demo)');
                }
            }
        };

        // Only fetch data once when component mounts
        if (pb && user) {
            fetchData();
        }

        return () => {
            mounted = false;
        };
    }, []); // Empty dependency array to prevent infinite loops

    // Helper function to get items by project (for compatibility with existing code)
    const getItemsByProject = (projectId: string): KnowledgeItem[] => {
        if (!currentPersona?.expand?.projects) {
            return [];
        }

        const project = currentPersona.expand.projects.find(p => p.id === projectId);
        if (!project?.expand?.items) {
            return [];
        }

        // Transform project items using the same logic
        return project.expand.items.map(item => {
            if (!item) return null;

            let readableContent = '';
            if (item.content) {
                if (typeof item.content === 'string') {
                    readableContent = item.content;
                } else if (typeof item.content === 'object') {
                    const contentObj = item.content as any;
                    if (contentObj.text) readableContent = contentObj.text;
                    else if (contentObj.description) readableContent = contentObj.description;
                    else if (contentObj.summary) readableContent = contentObj.summary;
                    else if (contentObj.message) readableContent = contentObj.message;
                    else readableContent = JSON.stringify(item.content);
                }
            }

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
                projects: [projectId], // This item is associated with this project
            } as KnowledgeItem;
        }).filter(Boolean);
    };


    const filteredData = useMemo(() => {
        // Helper function to get last updated date for a project
        const getLastUpdated = (project: Project) => {
            if (project.lastUpdate) {
                return new Date(project.lastUpdate);
            }
            // Fallback to creation date or current date
            return new Date(project.startDate || Date.now());
        };

        // Sort projects by last updated (most recent first)
        const sortedProjects = [...projects].sort((a, b) => {
            const dateA = getLastUpdated(a);
            const dateB = getLastUpdated(b);
            return dateB.getTime() - dateA.getTime();
        });

        if (!searchQuery.trim()) {
            return sortedProjects.map(project => ({
                ...project,
                knowledgeItems: getItemsByProject(project.id),
                knowledgeItemCount: getItemsByProject(project.id).length
            }));
        }

        const query = searchQuery.toLowerCase();

        return sortedProjects.map(project => {
            const projectMatches = project.name.toLowerCase().includes(query) ||
                project.description?.toLowerCase().includes(query);

            // Get knowledge items associated with this project
            const projectKnowledgeItems = getItemsByProject(project.id);
            const filteredKnowledgeItems = projectKnowledgeItems.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.source?.toLowerCase().includes(query) ||
                item.content?.toLowerCase().includes(query) ||
                item.tags?.some(tag => tag.toLowerCase().includes(query))
            );

            if (projectMatches || filteredKnowledgeItems.length > 0) {
                return {
                    ...project,
                    knowledgeItems: filteredKnowledgeItems,
                    knowledgeItemCount: filteredKnowledgeItems.length
                };
            }

            return null;
        }).filter(Boolean) as (Project & { knowledgeItems: KnowledgeItem[], knowledgeItemCount: number })[];
    }, [projects, searchQuery, getItemsByProject]);

    const handleProjectClick = (projectId: string) => {
        navigate(`/knowledge-organiser/project/${projectId}`);
    };

    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'voice':
                return <Mic className="w-4 h-4"/>;
            case 'chat':
                return <MessageSquare className="w-4 h-4"/>;
            case 'integration':
                return <FolderOpen className="w-4 h-4"/>;
            case 'summary':
                return <Brain className="w-4 h-4"/>;
            default:
                return <FileText className="w-4 h-4"/>;
        }
    };



    const createProjectHandler = () => {
        setShowNewProjectModal(false);
    };

    const handleAssociateWithProject = async (knowledgeItemId: string, projectId: string) => {
        if (!pb) return;

        try {
            await addKnowledgeItemToProject(pb, projectId, knowledgeItemId);
            toast({
                title: "Association Created",
                description: "Knowledge item has been associated with the project.",
            });
        } catch (error) {
            console.error("Failed to associate knowledge item with project:", error);
            toast({
                title: "Association Failed",
                description: "Failed to associate knowledge item with project. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDissociateFromProject = async (knowledgeItemId: string, projectId: string) => {
        if (!pb) return;

        try {
            await removeKnowledgeItemFromProject(pb, projectId, knowledgeItemId);
            toast({
                title: "Association Removed",
                description: "Knowledge item has been dissociated from the project.",
            });
        } catch (error) {
            console.error("Failed to dissociate knowledge item from project:", error);
            toast({
                title: "Dissociation Failed",
                description: "Failed to dissociate knowledge item from project. Please try again.",
                variant: "destructive",
            });
        }
    };

    const openProjectAssociationDialog = (knowledgeItem: KnowledgeItem) => {
        setSelectedKnowledgeItem(knowledgeItem);
        setSelectedProjectIds(knowledgeItem.projects || []);
        setShowProjectAssociationDialog(true);
    };

    const handleProjectSelectionChange = (selectedIds: string[]) => {
        setSelectedProjectIds(selectedIds);
    };

    const handleConfirmProjectAssociation = async (selectedIds: string[]) => {
        if (!selectedKnowledgeItem || !pb) return;

        try {
            const currentAssociations = selectedKnowledgeItem.projects || [];
            
            // Find projects to associate (newly selected)
            const toAssociate = selectedIds.filter(id => !currentAssociations.includes(id));
            
            // Find projects to dissociate (no longer selected)
            const toDissociate = currentAssociations.filter(id => !selectedIds.includes(id));

            // Handle associations
            for (const projectId of toAssociate) {
                await handleAssociateWithProject(selectedKnowledgeItem.id, projectId);
            }

            // Handle dissociations
            for (const projectId of toDissociate) {
                await handleDissociateFromProject(selectedKnowledgeItem.id, projectId);
            }

            toast({
                title: "Associations Updated",
                description: `Successfully updated project associations for "${selectedKnowledgeItem.name}".`,
            });

            setShowProjectAssociationDialog(false);
        } catch (error) {
            console.error("Failed to update project associations:", error);
            toast({
                title: "Update Failed",
                description: "Failed to update project associations. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleCancelProjectAssociation = () => {
        setShowProjectAssociationDialog(false);
        setSelectedProjectIds([]);
    };

    const handleDeleteKnowledgeItem = async (knowledgeItemId: string) => {
        if (!pb) return;
        
        try {
            await removeKnowledgeItem(pb, knowledgeItemId);
            toast({
                title: "Knowledge Item Deleted",
                description: "The knowledge item has been permanently deleted.",
            });
        } catch (error) {
            console.error("Failed to delete knowledge item:", error);
            toast({
                title: "Delete Failed",
                description: "Failed to delete the knowledge item. Please try again.",
                variant: "destructive",
            });
        }
    };

    const syncWithAI = async () => {
        setIsSyncing(true);
        try {
            // Use DigitalBrain API for synchronization
            const { digitalBrainAPI } = await import('@/api/mockDigitalBrainApi');
            
            console.log('🔄 KNOWLEDGE ORGANIZER: Starting AI sync');
            
            // Call the general sync endpoint to synchronize all available integrations
            const syncResponse = await digitalBrainAPI.syncAll({
                forceRefresh: true,
            });
            
            console.log('✅ KNOWLEDGE ORGANIZER: AI sync completed:', syncResponse);
            
            toast({
                title: 'AI Sync Complete',
                description: syncResponse.message || 'Successfully synced data from all available integrations',
            });
            
            // Refresh data after sync
            if (pb && user) {
                await fetchProjects(user.iam, true); // Use user IAM as token
                await fetchPersonaByIam(pb, user.iam); // Refresh persona
            }
            
        } catch (error: any) {
            console.error('❌ KNOWLEDGE ORGANIZER: Failed to sync with AI:', error);
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to sync with AI. Please try again.';
            
            toast({
                title: 'AI Sync Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Project deletion handlers
    const handleDeleteProject = (project: Project) => {
        setProjectToDelete(project);
        setShowDeleteProjectDialog(true);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete || !pb) return;

        try {
            await removeProject(projectToDelete.id);
            toast({
                title: "Project Deleted",
                description: `"${projectToDelete.name}" has been permanently deleted.`,
            });
            setShowDeleteProjectDialog(false);
            setProjectToDelete(null);
        } catch (error) {
            console.error("Failed to delete project:", error);
            toast({
                title: "Delete Failed",
                description: "Failed to delete the project. Please try again.",
                variant: "destructive",
            });
        }
    };

    const cancelDeleteProject = () => {
        setShowDeleteProjectDialog(false);
        setProjectToDelete(null);
    };

    // Drag and drop handlers
    const handleDragStart = (knowledgeItem: KnowledgeItem) => {
        setDraggedItem(knowledgeItem);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (e: React.DragEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedItem || !pb) return;

        try {
            // Check if the knowledge item is already associated with this project
            const isAlreadyAssociated = draggedItem.projects?.includes(projectId);
            
            if (isAlreadyAssociated) {
                toast({
                    title: "Already Associated",
                    description: `"${draggedItem.name}" is already associated with this project.`,
                });
                return;
            }

            await addKnowledgeItemToProject(pb, projectId, draggedItem.id);
            
            const project = projects.find(p => p.id === projectId);
            toast({
                title: "Knowledge Item Added",
                description: `"${draggedItem.name}" has been added to "${project?.name}".`,
            });
        } catch (error) {
            console.error("Failed to add knowledge item to project:", error);
            toast({
                title: "Association Failed",
                description: "Failed to add knowledge item to project. Please try again.",
                variant: "destructive",
            });
        } finally {
            setDraggedItem(null);
        }
    };

    // Create real user insights from available data
    const userInsights = useMemo(() => {
        console.log("🔍 KNOWLEDGE ORGANIZER: Generating user insights from real data:", {
            userFocus: user?.focus,
            userJobTitle: user?.job_title,
            projectsCount: projects.length,
            knowledgeItemsCount: knowledgeItems.length,
            integrationsCount: integrations.length,
            userNickname: user?.nickname,
            integrationsList: integrations.map(i => ({ id: i.id, provider: i.provider, type: i.type }))
        });

        // Generate top skills based on user's focus, job title, and actual activity
        const topSkills = [
            {
                name: user?.focus === Focus.ProjectExecution ? "Project Management" : 
                      user?.focus === Focus.BusinessGrowth ? "Strategic Thinking" :
                      user?.focus === Focus.KnowledgeManagement ? "Research & Analysis" :
                      user?.focus === Focus.LearningAndDevelopment ? "Learning & Development" :
                      user?.focus === Focus.TeamCoordination ? "Team Leadership" : "Personal Development",
                level: Math.min(85 + Math.floor(projects.length * 1.5), 95),
                source: `Derived from ${projects.length} active projects and focus on ${user?.focus || 'Personal Development'}`
            },
            {
                name: user?.job_title === JobTitle.Entrepreneur ? "Business Strategy" :
                      user?.job_title === JobTitle.Manager ? "Team Management" :
                      user?.job_title === JobTitle.Creator ? "Creative Thinking" :
                      user?.job_title === JobTitle.Executive ? "Strategic Planning" :
                      user?.job_title === JobTitle.Developer ? "Technical Skills" :
                      user?.job_title === JobTitle.Student ? "Learning & Research" : "Problem Solving",
                level: Math.min(75 + Math.floor(knowledgeItems.length * 0.8), 90),
                source: `Based on ${user?.job_title || 'Other'} role and ${knowledgeItems.length} knowledge items`
            },
            {
                name: "Knowledge Management",
                level: Math.min(60 + Math.floor(knowledgeItems.length * 1.2), 85),
                source: `From managing ${knowledgeItems.length} knowledge items across ${projects.length} projects`
            }
        ];

        // Generate topics of interest based on user data and actual project content
        const topicsOfInterest = [
            {
                topic: user?.focus === Focus.ProjectExecution ? "Project Execution" :
                       user?.focus === Focus.BusinessGrowth ? "Business Growth" :
                       user?.focus === Focus.KnowledgeManagement ? "Knowledge Management" :
                       user?.focus === Focus.LearningAndDevelopment ? "Learning & Development" :
                       user?.focus === Focus.TeamCoordination ? "Team Coordination" : "Personal Development",
                frequency: Math.max(projects.length + knowledgeItems.length, 1),
                lastInteraction: Date.now()
            },
            {
                topic: user?.job_title === JobTitle.Entrepreneur ? "Entrepreneurship" :
                       user?.job_title === JobTitle.Manager ? "Management" :
                       user?.job_title === JobTitle.Creator ? "Creative Work" :
                       user?.job_title === JobTitle.Executive ? "Executive Leadership" :
                       user?.job_title === JobTitle.Developer ? "Software Development" :
                       user?.job_title === JobTitle.Student ? "Learning & Education" : "Professional Growth",
                frequency: Math.max(projects.length * 2, 3),
                lastInteraction: Date.now() - 86400000 // 1 day ago
            },
            {
                topic: "Digital Organization",
                frequency: Math.max(knowledgeItems.length, 1),
                lastInteraction: Date.now() - 172800000 // 2 days ago
            }
        ];

        // Generate interactions based on actual integrations
        const interactions = integrations.length > 0 ? integrations.map(integration => {
            console.log("🔗 KNOWLEDGE ORGANIZER: Mapping integration:", {
                id: integration.id,
                provider: integration.provider,
                providerType: typeof integration.provider,
                providerString: String(integration.provider),
                hasApiKey: !!(integration.api_key || integration.client || integration.secret),
                type: integration.type
            });
            
            return {
                id: integration.id,
                name: String(integration.provider), // Ensure it's a string
                usage: integration.api_key || integration.client || integration.secret ? 
                       Math.floor(Math.random() * 30) + 70 : // Connected integrations: 70-100%
                       Math.floor(Math.random() * 20) + 10,  // Disconnected integrations: 10-30%
                lastUsed: integration.api_key || integration.client || integration.secret ? 
                         Date.now() - Math.floor(Math.random() * 86400000 * 3) : // Last 3 days for connected
                         Date.now() - Math.floor(Math.random() * 86400000 * 14), // Last 2 weeks for disconnected
                type: integration.type === IntegrationType.KnowledgeBase ? InteractionType.KnowledgeBase :
                      integration.type === IntegrationType.Enhancer ? InteractionType.AIConversations :
                      InteractionType.DocumentStorage
            };
        }) : [
            // Default interactions when no integrations are configured
            {
                id: 'default-knowledge',
                name: IntegrationProvider.Notion,
                usage: 0,
                lastUsed: 0,
                type: InteractionType.KnowledgeBase
            },
            {
                id: 'default-ai',
                name: IntegrationProvider.OpenAI,
                usage: 0,
                lastUsed: 0,
                type: InteractionType.AIConversations
            },
            {
                id: 'default-docs',
                name: IntegrationProvider.Google,
                usage: 0,
                lastUsed: 0,
                type: InteractionType.DocumentStorage
            }
        ];

        console.log("🔗 KNOWLEDGE ORGANIZER: Generated interactions:", interactions.map(i => ({ name: i.name, usage: i.usage, type: i.type })));

        // Generate interaction pattern based on actual user activity
        const totalGoals = projects.reduce((acc, project) => acc + (project.goals?.length || 0), 0);
        const totalTasks = projects.reduce((acc, project) => 
            acc + (project.goals?.reduce((goalAcc, goal) => goalAcc + (goal.tasks?.length || 0), 0) || 0), 0);
        
        const interactionPattern = {
            totalSessions: Math.max(projects.length * 8 + knowledgeItems.length * 1.5 + totalGoals * 3, 15),
            avgSessionLength: 35 + Math.floor((knowledgeItems.length / Math.max(projects.length, 1)) * 10), // More items per project = longer sessions
            preferredTime: user?.focus === Focus.ProjectExecution ? "Morning" :
                          user?.focus === Focus.BusinessGrowth ? "Afternoon" :
                          user?.focus === Focus.LearningAndDevelopment ? "Evening" : 
                          user?.focus === Focus.TeamCoordination ? "Morning" : "Afternoon",
            mostActiveDay: user?.focus === Focus.ProjectExecution ? "Monday" :
                          user?.focus === Focus.BusinessGrowth ? "Tuesday" :
                          user?.focus === Focus.KnowledgeManagement ? "Wednesday" :
                          user?.focus === Focus.LearningAndDevelopment ? "Thursday" :
                          user?.focus === Focus.TeamCoordination ? "Friday" : "Wednesday",
            aiGeneratedContent: Math.max(knowledgeItems.length * 2 + totalGoals, 10)
        };

        const insights = {
            topSkills,
            topicsOfInterest,
            interactions,
            interactionPattern
        };

        console.log("✅ KNOWLEDGE ORGANIZER: Generated user insights:", {
            topSkillsCount: insights.topSkills.length,
            topicsCount: insights.topicsOfInterest.length,
            interactionsCount: insights.interactions.length,
            totalSessions: insights.interactionPattern.totalSessions,
            avgSessionLength: insights.interactionPattern.avgSessionLength,
            aiGeneratedContent: insights.interactionPattern.aiGeneratedContent
        });

        return insights;
    }, [user, projects, knowledgeItems, integrations]);

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
                {/* Simplified background effects */}
                <div
                    className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none"></div>
                <div
                    className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft"/>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
                    {/* Center content for large screens */}
                    <div className="max-w-4xl mx-auto ml-[70px] lg:ml-[70px] xl:ml-auto 2xl:ml-auto">
                        {/* Clean Header */}
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-8">
                                <PageHeader title="Digital Brain" subTitle="Your centralized knowledge workspace and AI insights"/>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={syncWithAI}
                                        disabled={isSyncing}
                                        className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
                                    >
                                        <Brain className="w-4 h-4"/>
                                        {isSyncing ? 'Syncing...' : 'Sync with AI'}
                                    </Button>
                                </div>
                            </div>

                            {/* Insight Widgets */}
                            <InsightWidgets 
                                profile={userInsights}
                            />
                        </div>

                        {/* Main Content Area */}
                        <div className="space-y-8">
                            <section className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-8">
                                <h2 className="text-2xl font-light text-white mb-6">AI-Powered Insights</h2>
                                <div className="text-center py-12">
                                    <div className="mb-6">
                                        <Brain className="w-16 h-16 text-[#FF7000]/60 mx-auto mb-4"/>
                                        <p className="text-slate-400 text-lg mb-2">Your Digital Brain is actively learning from your data</p>
                                        <p className="text-slate-500 text-sm">View your projects and knowledge items in the "Projects & Knowledge" section</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button
                                            onClick={() => navigate('/new-page')}
                                            className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30"
                                        >
                                            <FileText className="w-4 h-4 mr-2"/>
                                            View Projects & Knowledge
                                        </Button>
                                        <Button
                                            onClick={syncWithAI}
                                            disabled={isSyncing}
                                            variant="outline"
                                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                        >
                                            <Brain className="w-4 h-4 mr-2"/>
                                            {isSyncing ? 'Syncing...' : 'Sync with AI'}
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default KnowledgeOrganiser;
