import React, {useContext, useEffect, useState} from "react";
import {AtmoCard} from "@/components/molecules/AtmoCard.tsx";
import {CardContent, CardHeader, CardTitle} from "@/components/atoms/Card.tsx";
import {ScrollArea} from "@/components/atoms/ScrollArea.tsx";
import {DailyMapCtx} from "@/context/DailyMapCtx.tsx";
import {useTasksStore} from "@/stores/useTasksStore.ts";
import {useGoalsStore} from "@/stores/useGoalsStore.ts";
import {useProjectsStore} from "@/stores/useProjectsStore.ts";
import {useToast} from "@/hooks/useToast.ts";
import GoalItem from "@/components/organisms/GoalItem.tsx";
import {Goal} from "@/models/Goal.ts";

interface DailyMapPreviewProps {
    open: boolean;
}

const DailyMapPreview: React.FC<DailyMapPreviewProps> = ({open}) => {
    const {toast} = useToast();
    const {completion, calculateCompletion} = useTasksStore();
    const {goals} = useGoalsStore();
    const {projects} = useProjectsStore();
    const {groupedProjects, emptyProjects, expandedProjectGroups, expandProject, groupProjectsByActivities} = useContext(DailyMapCtx);
    const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!goals || !Array.isArray(goals)) return;
        
        try {
            // Set all projects expanded by default
            const uniqueProjects = [...new Set(goals.map((goal) => (goal as any).projectId).filter(Boolean))];
            uniqueProjects.forEach((projectId) => {
                expandProject(projectId);
            });
            
            // Group goals by projectId (which will organize tasks through the hierarchy)
            groupProjectsByActivities(projects, goals);

            // Calculate completion percentage based on all tasks in all goals
            const allTasks = goals.flatMap(goal => goal.tasks || []);
            if (allTasks.length > 0) {
                calculateCompletion();
            }
        } catch (error) {
            console.error('Error in DailyMapPreview:', error);
        }
    }, [goals, projects, expandedProjectGroups, groupProjectsByActivities, expandProject, calculateCompletion]);

    // Collect all goals from all projects - use Map to prevent duplicates
    const allGoalsMap = new Map<string, {goal: Goal, projectName: string}>();
    
    // Add goals from projects with activities
    if (groupedProjects) {
        groupedProjects.forEach(project => {
            if (project.goals && project.goals.length > 0) {
                project.goals.forEach(goal => {
                    if (goal.tasks && goal.tasks.length > 0) {
                        allGoalsMap.set(goal.id, {goal, projectName: project.name});
                    }
                });
            }
        });
    }

    // Add goals from empty projects - only if not already present
    if (emptyProjects) {
        emptyProjects.forEach(project => {
            if (project.goals && project.goals.length > 0) {
                project.goals.forEach(goal => {
                    // Only add if not already present (prevents duplicates)
                    if (!allGoalsMap.has(goal.id)) {
                        allGoalsMap.set(goal.id, {goal, projectName: project.name});
                    }
                });
            }
        });
    }

    // Convert Map to Array
    const allGoals = Array.from(allGoalsMap.values());

    const handleGoalToggle = (goalId: string) => {
        setExpandedGoals(prev => ({
            ...prev,
            [goalId]: !prev[goalId]
        }));
    };

    if (!open) {
        return null;
    }

    return (
        <AtmoCard variant="orange" className="w-full max-w-md mx-auto border-l-2 border-l-[#FF5F1F]">
            <CardHeader className="pb-2 space-y-2 pt-3 px-0.5">
                <div className="flex justify-between items-center px-3">
                    <h3 className="text-xs font-medium text-atmo-orange tracking-wide">
                        DAILY WARMAP
                    </h3>
                    <p className="text-[10px] text-gray-400">Your day overview</p>
                </div>
            </CardHeader>

            <CardContent className="h-[580px] pt-0 pb-3 px-0.5">
                <ScrollArea className="h-full min-w-full">
                    <div className="space-y-2 pb-3 px-3">
                        {allGoals.length > 0 ? (
                            allGoals.map(({goal, projectName}) => (
                                <GoalItem 
                                    key={goal.id} 
                                    goal={goal}
                                    projectName={projectName}
                                    isOpen={expandedGoals[goal.id] || false}
                                    onToggle={handleGoalToggle}
                                    readOnly={true}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-white/60 text-xs">No goals with tasks yet</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </AtmoCard>
    );
};

export default DailyMapPreview;
