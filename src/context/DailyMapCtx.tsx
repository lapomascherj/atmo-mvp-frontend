import React, {createContext, useState} from "react";
import {Project} from "@/models/Project.ts";
import {Task, Goal} from "@/models";

interface DailyMapCtxType {
    open: boolean;
    completion: number;
    emptyProjects: Project[];
    expandedProjectGroups: Record<string, boolean>;
    groupedProjects: Project[];

    addGroupedProject: (project: Project) => void
    expandProject: (projectID: string) => void
    retrieveEmptyProjects: (projects: Project[]) => void
    groupProjectsByActivities: (projects: Project[], goals: Goal[]) => void
}

export const DailyMapCtx = createContext<DailyMapCtxType>({
    open: false,
    completion: 0,
    emptyProjects: new Array<Project>,
    expandedProjectGroups: {},
    groupedProjects: new Array<Project>,

    addGroupedProject: () => {},
    expandProject: () => {},
    retrieveEmptyProjects: () => {},
    groupProjectsByActivities: (_projects: Project[], _goals: Goal[]) => {},
});

interface DailyMapCtxProviderProps {
    children?: React.ReactNode;
}

export const DailyMapCtxProvider: React.FC<DailyMapCtxProviderProps> = ({children}) => {
    const [open, setOpen] = useState<boolean>(false);
    const [completion, setCompletion] = useState<number>(0);
    const [emptyProjects, setEmptyProjects] = useState<Project[]>([]);
    const [expandedProjectGroups, setExpandedProjectGroups] = useState<Record<string, boolean>>({});
    const [groupedProjects, setGroupedProjects] = useState<Project[]>([]);

    const addGroupedProject = (project: Project) => {
        const grouped = [...groupedProjects, project];
        // Clean up and sort the array
        const groupedSorted = [...new Set(Object.values(grouped).sort((a, b) =>
            a.name.localeCompare(b.name),
        ))];
        setGroupedProjects(groupedSorted);
    }

    const expandProject = (projectID: string) => {
        setExpandedProjectGroups(prev => ({
            ...prev,
            [projectID]: true
        }));
    }

    const retrieveEmptyProjects = (projects: Project[]) => {
        // A project is empty if it has no goals or all its goals have no tasks
        const empty = projects.filter(project => {
            if (project.goals.length === 0) return true;
            return project.goals.every(goal => !goal.tasks || goal.tasks.length === 0);
        });
        setEmptyProjects(empty);
    }

    const groupProjectsByActivities = (projects: Project[], goals: Goal[]) => {
        // New hierarchy: Project → Goals → Tasks
        // Goals are associated with projects through projectId
        // Tasks belong to goals through Goal.tasks[]
        
        const projectMap = new Map<string, Project>();
        
        // Initialize projects with their existing goals
        for (const project of projects) {
            projectMap.set(project.id, { 
                ...project, 
                goals: [...(project.goals || [])] // Keep existing goals from the project
            });
        }

        // Group standalone goals by their projectId and merge with project goals
        const goalsByProject = new Map<string, Goal[]>();
        
        for (const goal of goals) {
            const projectId = (goal as any).projectId;
            if (projectId) {
                if (!goalsByProject.has(projectId)) {
                    goalsByProject.set(projectId, []);
                }
                goalsByProject.get(projectId)!.push(goal);
            }
        }

        // Merge standalone goals into their respective projects
        for (const [projectId, projectGoals] of goalsByProject.entries()) {
            if (projectMap.has(projectId)) {
                const project = projectMap.get(projectId)!;
                
                // Merge goals, avoiding duplicates based on goal.id
                const existingGoalIds = new Set(project.goals.map(g => g.id));
                const newGoals = projectGoals.filter(goal => !existingGoalIds.has(goal.id));
                
                project.goals = [...project.goals, ...newGoals];
            } else {
                // Create a project for orphaned goals if the project doesn't exist
                const orphanedProject: Project = {
                    id: projectId,
                    name: `Project ${projectId}`,
                    goals: projectGoals,
                    items: [],
                    active: true
                };
                projectMap.set(projectId, orphanedProject);
            }
        }

        // Handle goals without projectId - create a "Daily Goals" project
        const orphanedGoals = goals.filter(goal => !(goal as any).projectId);
        if (orphanedGoals.length > 0) {
            const dailyGoalsProjectId = "daily-goals";
            if (!projectMap.has(dailyGoalsProjectId)) {
                projectMap.set(dailyGoalsProjectId, {
                    id: dailyGoalsProjectId,
                    name: "Daily Goals",
                    goals: orphanedGoals,
                    items: [],
                    active: true
                });
            } else {
                const existingProject = projectMap.get(dailyGoalsProjectId)!;
                existingProject.goals = [...existingProject.goals, ...orphanedGoals];
            }
        }

        // Get current grouped projects to preserve projects during updates
        const currentGroupedProjectIds = new Set(groupedProjects.map(p => p.id));

        // Filter projects that have goals with tasks, but also preserve currently visible projects
        // to prevent disappearing during updates
        const projectsWithActivities = Array.from(projectMap.values())
            .filter((project) => {
                // Keep project if it has goals with tasks OR if it was previously visible
                const hasActiveTasks = project.goals.some(goal => goal.tasks && goal.tasks.length > 0);
                const wasPreviouslyVisible = currentGroupedProjectIds.has(project.id);
                return hasActiveTasks || wasPreviouslyVisible;
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        setGroupedProjects(projectsWithActivities);
    }

    const value = {
        open,
        completion,
        emptyProjects,
        expandedProjectGroups,
        groupedProjects,

        addGroupedProject,
        expandProject,
        retrieveEmptyProjects,
        groupProjectsByActivities
    }
    return (
        <DailyMapCtx.Provider value={value}>
            {children}
        </DailyMapCtx.Provider>
    )
}
