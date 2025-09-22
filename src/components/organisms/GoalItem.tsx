import React, {useContext, useEffect, useState} from "react";
import {ChevronDown, ChevronUp, Target} from "lucide-react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/atoms/Collapsible.tsx";
import NewTaskDialog from "@/components/molecules/NewTaskDialog.tsx";
import {Goal} from "@/models/Goal.ts";
import TaskItem from "@/components/organisms/TaskItem.tsx";
import {DailyMapCtx} from "@/context/DailyMapCtx.tsx";
import {cn} from "@/utils/utils.ts";
import {Status} from "@/models/Status.ts";
import {Priority} from "@/models/Priority.ts";

interface GoalItemProps {
    goal: Goal;
    projectName: string;
    isOpen: boolean;
    onToggle: (goalId: string) => void;
    readOnly?: boolean;
}

const GoalItem: React.FC<GoalItemProps> = ({goal, projectName, isOpen, onToggle, readOnly = false}) => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleGoalVisibility = () => {
        onToggle(goal.id);
        setIsVisible(!isVisible);
    }

    useEffect(() => {
        setIsVisible(isOpen);
    }, [isOpen]);

    // Calculate task completion stats
    const tasks = goal.tasks || [];
    const completedTasks = tasks.filter(task => task.completed);
    const totalTasks = tasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Get priority color
    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.High:
                return 'text-red-400';
            case Priority.Medium:
                return 'text-yellow-400';
            case Priority.Low:
                return 'text-green-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <Collapsible
            key={goal.id}
            open={isVisible}
            onOpenChange={toggleGoalVisibility}
            className="flex flex-col border border-[#FF7000]/30 rounded-lg overflow-hidden w-full bg-black/20"
        >
            <CollapsibleTrigger
                className={cn(
                    'w-full',
                    'p-2.5',
                    'flex',
                    'justify-between',
                    'items-center',
                    'bg-[#FF7000]/20',
                    'hover:bg-[#FF7000]/30',
                    'transition-all',
                    'duration-200',
                    'min-h-0'
                )}>
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                    <Target className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 w-full min-w-0">
                            <span className={cn(
                                'text-xs',
                                'font-medium',
                                'text-white',
                                'truncate',
                                'flex-1',
                                'min-w-0'
                            )}>
                              {goal.name}
                            </span>
                        </div>
                        <span className="text-xs text-white/50 truncate w-full">
                            {projectName}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="flex items-center gap-1 text-xs text-white/70">
                        <span>{completedTasks.length}/{totalTasks}</span>
                        {totalTasks > 0 && (
                            <span>({completionPercentage}%)</span>
                        )}
                    </div>
                    {!isVisible ? (
                        <ChevronUp className="h-3.5 w-3.5 text-white/80"/>
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-white/80"/>
                    )}
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="w-full overflow-hidden">
                <div className="p-2.5 bg-black/40 space-y-1.5">
                    {goal.targetDate && (
                        <div className="text-xs text-white/60 px-2 py-1 bg-black/30 rounded truncate">
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </div>
                    )}
                    
                    {totalTasks > 0 ? (
                        <div className="space-y-1 w-full overflow-hidden max-h-32 overflow-y-auto">
                            {tasks.map((task, index) => (
                                <TaskItem 
                                    key={task.id ? `task-${goal.id}-${task.id}` : `task-${goal.id}-${index}`} 
                                    task={task} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-white/50 text-center py-2">
                            No tasks yet
                        </div>
                    )}
                    
                    {!readOnly && (
                        <div className="pt-1.5 border-t border-white/10">
                            <NewTaskDialog
                                projectName={projectName}
                            />
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default GoalItem; 