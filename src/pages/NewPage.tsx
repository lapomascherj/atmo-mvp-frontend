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
import AssociationDialog from "@/components/molecules/AssociationDialog.tsx";
import { useToast } from "@/hooks/useToast.ts";
import { useIntegrationsStore } from "@/stores/useMockIntegrationsStore";
import { Focus } from '@/models/Focus.ts';
import { JobTitle } from '@/models/JobTitle.ts';
import { IntegrationProvider } from '@/models/IntegrationProvider.ts';
import { IntegrationType } from '@/models/IntegrationType.ts';
import { InteractionType } from '@/models/InteractionType.ts';

const NewPage: React.FC = () => {
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

    console.log("🔍 NEW PAGE: Knowledge items from PersonasStore:", {
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
                    await fetchProjects(user.iam); // Use user IAM as token
                    await fetchIntegrations(pb);
                    
                    // Initialize PersonasStore to load knowledge items
                    if (!currentPersona && !personasLoading) {
                        // Fetch persona data which includes expanded knowledge items
                        fetchPersonaByIam(pb, user.iam).catch(error => {
                            console.debug("PersonasStore initialization auto-cancelled or failed");
                        });
                    }
                } catch (error) {
                    console.debug('Data fetch completed with potential auto-cancellations');
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [pb, user, fetchProjects, fetchIntegrations, currentPersona, personasLoading, fetchPersonaByIam]);

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

    return (
        <>
            <KnowledgeOrganizerLayout
                sidebar={
                    <KnowledgeItemsSidebar
                        knowledgeItems={knowledgeItems} // Show all Persona.items
                        projects={projects}
                        onRemoveItem={handleDeleteKnowledgeItem}
                        onAssociateItem={openProjectAssociationDialog}
                        onDeleteItem={handleDeleteKnowledgeItem}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isLoading={personasLoading}
                        mode="organizer"
                    />
                }
            >
                {/* Clean Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <PageHeader title="Projects & Knowledge" subTitle="Manage your active projects and knowledge items"/>
                    </div>

                    {/* Functional Search */}
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <Input
                            placeholder="Search your projects and knowledge..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-500 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20 rounded-xl w-full"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4"/>
                            </Button>
                        )}
                    </div>

                    {/* Search Results Summary */}
                    {searchQuery && (
                        <div className="mt-4 text-sm text-slate-400">
                            {filteredData.length === 0 ? (
                                <div
                                    className="flex items-center gap-2 p-4 bg-slate-800/20 rounded-xl border border-slate-700/30">
                                    <Search className="w-4 h-4"/>
                                    <span>No results found for "{searchQuery}"</span>
                                </div>
                            ) : (
                                <span>Found {filteredData.reduce((sum, project) => sum + project.knowledgeItemCount, 0)} items across {filteredData.length} projects</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Content Area - Better spacing and sizing */}
                <div className="space-y-8">
                    {/* Active Projects - Primary Focus with larger cards */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-light text-white">Active Projects</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {/* Add Project Fake Element - Always at the beginning */}
                            <div 
                                className="group bg-gradient-to-br from-slate-800/10 to-slate-900/10 hover:from-slate-800/20 hover:to-slate-900/20 border border-dashed border-[#FF7000]/30 hover:border-[#FF7000]/50 transition-all duration-300 rounded-2xl p-8 cursor-pointer flex flex-col items-center justify-center min-h-[280px]"
                                onClick={() => setShowNewProjectModal(true)}
                            >
                                <div className="p-4 rounded-full bg-[#FF7000]/10 group-hover:bg-[#FF7000]/20 transition-colors duration-300 mb-4">
                                    <Plus className="w-8 h-8 text-[#FF7000]/60 group-hover:text-[#FF7000] transition-colors duration-300" />
                                </div>
                                <h3 className="text-lg font-medium text-[#FF7000]/60 group-hover:text-[#FF7000] transition-colors duration-300 mb-2">
                                    New Project
                                </h3>
                                <p className="text-sm text-slate-500 text-center leading-relaxed">
                                    Create a new project to organize your knowledge and tasks
                                </p>
                            </div>

                            {filteredData.map((project) => (
                                <div
                                    key={project.id}
                                    className={`group bg-gradient-to-br from-slate-800/30 to-slate-900/30 hover:from-slate-800/40 hover:to-slate-900/40 border border-slate-700/30 hover:border-[#FF7000]/20 transition-all duration-300 rounded-2xl p-8 cursor-pointer relative ${
                                        draggedItem ? 'ring-2 ring-[#FF7000]/20 ring-offset-2 ring-offset-slate-900' : ''
                                    }`}
                                    onClick={(e) => {
                                        // Prevent navigation when clicking delete button
                                        if ((e.target as HTMLElement).closest('.delete-button')) {
                                            return;
                                        }
                                        handleProjectClick(project.id);
                                    }}
                                    onDragOver={draggedItem ? handleDragOver : undefined}
                                    onDrop={draggedItem ? (e) => handleDrop(e, project.id) : undefined}
                                >
                                    {/* Delete Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project);
                                        }}
                                        className="delete-button absolute top-4 right-4 h-8 w-8 p-0 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-800/50 hover:bg-red-500/20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    {/* Drag Drop Overlay */}
                                    {draggedItem && (
                                        <div className="absolute inset-0 bg-[#FF7000]/10 border-2 border-dashed border-[#FF7000]/50 rounded-2xl flex items-center justify-center pointer-events-none">
                                            <div className="text-[#FF7000] text-sm font-medium">
                                                Drop to add "{draggedItem.name}"
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xl font-medium text-white group-hover:text-[#FF7000] transition-colors">
                                                {project.name}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${project.priority === 'high' ? 'bg-[#FF7000]/20 text-[#FF7000]' :
                                                project.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'}
                      `}>
                        {project.priority} priority
                      </span>
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                                            {project.description}
                                        </p>
                                    </div>

                                    <div className="pt-2 text-xs text-slate-500">
                                        {getItemsByProject(project.id).length} knowledge items
                                    </div>

                                    <div
                                        className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/30">
                                        <span className="text-xs text-slate-500">
                                            {project.milestones?.length ? `${project.milestones.length} milestones` : 'No milestones'}
                                        </span>
                                        <ArrowRight
                                            className="w-4 h-4 text-slate-400 group-hover:text-[#FF7000] transition-colors"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </KnowledgeOrganizerLayout>

            {/* Project Association Dialog */}
            <AssociationDialog
                isOpen={showProjectAssociationDialog}
                onOpenChange={setShowProjectAssociationDialog}
                title="Associate with Projects"
                description={`Select projects to associate with "${selectedKnowledgeItem?.name}"`}
                items={projects.map(project => ({
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    color: project.color,
                    priority: project.priority,
                    date: project.lastUpdate || project.startDate
                }))}
                selectedItemIds={selectedProjectIds}
                onSelectionChange={handleProjectSelectionChange}
                onConfirm={handleConfirmProjectAssociation}
                onCancel={handleCancelProjectAssociation}
                confirmButtonText="Update Associations"
                itemType="project"
            />

            {/* Project Delete Confirmation Dialog */}
            <Dialog open={showDeleteProjectDialog} onOpenChange={setShowDeleteProjectDialog}>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Delete Project</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Are you sure you want to permanently delete "{projectToDelete?.name}"? This action cannot be undone and will remove all associated goals, tasks, and milestones.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={cancelDeleteProject}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteProject}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        onSubmit={createProjectHandler}/>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NewPage;