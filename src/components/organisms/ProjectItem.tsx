import React, {useContext, useEffect, useState} from "react";
import {ChevronDown, ChevronUp} from "lucide-react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/atoms/Collapsible.tsx";
import NewTaskDialog from "@/components/molecules/NewTaskDialog.tsx";
import {Project} from "@/models/Project.ts";
import TaskItem from "@/components/organisms/TaskItem.tsx";
import {DailyMapCtx} from "@/context/DailyMapCtx.tsx";
import {cn} from "@/utils/utils.ts";

interface ProjectItemProps {
    project: Project;
    isOpen: boolean;
}

const ProjectItem: React.FC<ProjectItemProps> = ({project, isOpen}) => {
    const [isVisible, setIsVisible] = useState(false);
    const dailyMapCtx = useContext(DailyMapCtx)

    const toggleProjectItemVisibility = () => {
        dailyMapCtx.expandedProjectGroups[project.id] = !dailyMapCtx.expandedProjectGroups[project.id];
        setIsVisible(!isVisible);
    }

    useEffect(() => {
        setIsVisible(isOpen);
    }, [isOpen]);

    // Get all tasks from all goals in the project
    const allTasks = project.goals?.flatMap(goal => goal.tasks || []) || [];
    const completedTasks = allTasks.filter(task => task.completed);
    const totalTasks = allTasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    return (
        <Collapsible
            key={project.name}
            open={isVisible}
            onOpenChange={toggleProjectItemVisibility}
            className="flex flex-col border border-white/5 rounded-lg overflow-hidden"
        >
            <CollapsibleTrigger
                className={cn(
                    'w-full',
                    'p-3',
                    'flex',
                    'flex-grow',
                    'justify-between',
                    'items-center',
                    `bg-orange-500`,
                    'bg-opacity-80',
                    'min-h-full',
                    'h-fit',
                    'hover:bg-opacity-90',
                    'transition-all',
                    'duration-200'
                )}>
                <div className="flex flex-grow items-center gap-2">
                    <span className={cn(
                        'text-sm',
                        'font-medium',
                        'text-shadow-sm',
                        'text-shadow-black',
                        'text-white',
                    )}>
                      {project.name}
                    </span>
                    <span className="text-xs text-gray-800/75">
                      {completedTasks.length}/{totalTasks} tasks
                    </span>
                    {totalTasks > 0 && (
                        <span className="text-xs text-gray-800/75">
                            ({completionPercentage}%)
                        </span>
                    )}
                </div>
                {!isVisible ? (
                    <ChevronUp className="h-4 w-4 text-gray-800/80"/>
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-800/80"/>
                )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 p-3 bg-black/30">
                <div className="space-y-2">
                    {totalTasks > 0 ? (
                        <div className="space-y-1">
                            {project.goals?.map((goal) => (
                                goal.tasks && goal.tasks.length > 0 && (
                                    <div key={goal.id} className="space-y-1">
                                        <div className="text-xs text-white/60 font-medium px-2 py-1 bg-black/20 rounded">
                                            {goal.name} ({goal.tasks.filter(t => t.completed).length}/{goal.tasks.length})
                                        </div>
                                        {goal.tasks.map((task) => (
                                            <TaskItem key={task.id} task={task} />
                                        ))}
                                    </div>
                                )
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-white/50 text-center py-2">
                            No tasks yet
                        </div>
                    )}
                </div>
                <div className="pt-2 border-t border-white/10">
                    <NewTaskDialog
                        projectName={project.name}
                    />
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default ProjectItem;
