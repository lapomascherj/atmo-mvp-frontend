import React from 'react';
import { Clock, MessageSquare } from 'lucide-react';
import { Checkbox } from '@/components/atoms/Checkbox.tsx';
import { Button } from '@/components/atoms/Button.tsx';
import { Task } from '@/models/Task.ts';
import { useTasksStore } from '@/stores/useTasksStore.ts';
import { useToast } from '@/hooks/useToast.ts';
import { promptStore } from '@/stores/promptStore.ts';

interface TaskItemProps {
    task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    const { toast } = useToast();
    const { toggleTaskCompletion } = useTasksStore();
    const { 
        processTaskWithAI
    } = promptStore();

    const handleTaskCompletion = async (id: string, completed: boolean) => {
        try {
            await toggleTaskCompletion(id);
            // Show toast notification with emojis
            if (completed) {
                toast({
                    title: "Task completed! 🎯📈🔥",
                    description: "Great progress on your daily goals",
                    duration: 2000,
                });
            }
        } catch (error) {
            console.error('Failed to toggle task completion:', error);
            toast({
                title: "Error",
                description: "Failed to update task completion",
                duration: 3000,
                variant: "destructive",
            });
        }
    };

    const handleTaskClick = async () => {
        // Show toast notification
        toast({
            title: "Task sent to AI",
            description: `"${task.name}" is being processed...`,
            duration: 2000,
        });
        
        // Process task with AI
        await processTaskWithAI(task);
    };

    return (
        <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-black/20 transition-all duration-200 border border-transparent hover:border-white/10 w-full overflow-hidden">
            <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={(checked) =>
                    handleTaskCompletion(
                        task.id,
                        checked === true,
                    )
                }
                className="h-4 w-4 border-white/30 data-[state=checked]:bg-[#FF7000] data-[state=checked]:border-[#FF7000] flex-shrink-0"
            />
            <div 
                className="flex-1 min-w-0 cursor-pointer overflow-hidden"
                onClick={handleTaskClick}
                title="Click to get AI assistance with this task"
            >
                <div className="flex items-center gap-2 mb-1 min-w-0">
                    <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {task.time}
                    </span>
                    <span
                        className={`text-sm font-medium ${
                            task.completed 
                                ? "line-through text-white/50" 
                                : "text-white/90"
                        } truncate hover:text-[#FF7000] transition-colors min-w-0 flex-1`}
                    >
                        {task.name}
                    </span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    handleTaskClick();
                }}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF7000]/20 hover:text-[#FF7000] flex-shrink-0"
                title="Get AI assistance"
            >
                <MessageSquare className="h-3 w-3" />
            </Button>
        </div>
    );
};

export default TaskItem;
