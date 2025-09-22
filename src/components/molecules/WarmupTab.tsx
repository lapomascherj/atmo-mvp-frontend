import React, {useState} from 'react';
import {CheckCircle, Circle, Clock, Plus, RefreshCw, Sparkles, Target} from "lucide-react";
import {Button} from "@/components/atoms/Button.tsx";
import {Input} from "@/components/atoms/Input.tsx";
import {TextArea} from "@/components/atoms/TextArea.tsx";

interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
    estimatedTime?: string;
    category?: string;
}

const WarmupTab: React.FC = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium' as 'high' | 'medium' | 'low',
        estimatedTime: '30min',
        category: 'work'
    });

    // Enhanced sample tasks data
    const [tasks, setTasks] = useState<Task[]>([
        {
            id: '1',
            title: 'Review projectID milestones',
            description: 'Check status of UI redesign tasks and prepare summary for team meeting',
            completed: false,
            priority: 'high',
            estimatedTime: '45min',
            category: 'work'
        },
        {
            id: '2',
            title: 'Team meeting preparation',
            description: 'Organize slides and discussion points for 2 PM sync',
            completed: false,
            priority: 'medium',
            estimatedTime: '30min',
            category: 'work'
        },
        {
            id: '3',
            title: 'Sprint planning session',
            description: 'Review metrics and set goals for next sprint',
            completed: true,
            priority: 'medium',
            estimatedTime: '60min',
            category: 'planning'
        }
    ]);

    // Toggle task completion status
    const toggleTaskCompletion = (taskId: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId
                ? {...task, completed: !task.completed}
                : task
        ));
    };

    // Add new task with clean card generation
    const handleAddTask = () => {
        if (!newTask.title.trim()) {
            return;
        }

        const task: Task = {
            // Don't provide ID - let the system generate it
            title: newTask.title,
            description: newTask.description,
            completed: false,
            priority: newTask.priority,
            estimatedTime: newTask.estimatedTime,
            category: newTask.category
        } as Task;

        setTasks([...tasks, task]);
        setNewTask({
            title: '',
            description: '',
            priority: 'medium',
            estimatedTime: '30min',
            category: 'work'
        });
        setShowAddForm(false);
    };

    // Get completion percentage
    const completionPercentage = Math.round(
        (tasks.filter(task => task.completed).length / tasks.length) * 100
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium':
                return 'bg-[#D04907]/20 text-[#D04907] border-[#D04907]/30';
            case 'low':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default:
                return 'bg-[#D04907]/20 text-[#D04907] border-[#D04907]/30';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 zoom-in-95 duration-500">
            {/* Enhanced Progress Header */}
            <div
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#D04907]/10 via-black/40 to-black/60 border border-[#D04907]/20 p-4">
                <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-5"></div>
                <div className="relative">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#D04907]/20">
                                <Sparkles className="w-4 h-4 text-[#D04907]"/>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[#E3E3E3]">Daily Progress</h3>
                                <p className="text-xs text-[#E3E3E3]/60">Stay focused and productive</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-[#D04907]">{completionPercentage}%</div>
                            <div
                                className="text-xs text-[#E3E3E3]/60">{tasks.filter(t => t.completed).length}/{tasks.length} completed
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="relative h-2 w-full bg-black/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#D04907] to-[#FF8159] rounded-full transition-all duration-700 ease-out relative"
                            style={{width: `${completionPercentage}%`}}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Morning Focus Card */}
            <div
                className="rounded-xl p-4 bg-gradient-to-br from-black/60 to-black/40 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:border-[#D04907]/30 transition-all duration-300">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-[#D04907]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-[#D04907]/20">
                            <Target className="w-3.5 h-3.5 text-[#D04907]"/>
                        </div>
                        <h4 className="text-[#D04907] text-sm font-semibold">MORNING FOCUS</h4>
                    </div>
                    <p className="text-xs text-[#E3E3E3]/80 mb-3 leading-relaxed">
                        Begin your day by completing your highest priority task first to build momentum and set a
                        positive tone.
                    </p>
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-[#E3E3E3]/70 hover:text-[#D04907] hover:bg-[#D04907]/10 transition-all duration-200"
                        >
                            <RefreshCw size={12} className="mr-1.5"/>
                            Refresh focus
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tasks Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#D04907]/20">
                        <Target className="w-4 h-4 text-[#D04907]"/>
                    </div>
                    <h4 className="text-sm font-semibold text-[#E3E3E3]">TODAY'S TASKS</h4>
                </div>

                {/* Clean Add Activity Button */}
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`h-8 px-3 text-xs font-medium transition-all duration-300 rounded-lg ${
                        showAddForm
                            ? 'bg-[#D04907] text-white hover:bg-[#D04907]/90'
                            : 'bg-[#D04907]/20 text-[#D04907] hover:bg-[#D04907]/30 border border-[#D04907]/30'
                    }`}
                >
                    <Plus size={14} className="mr-1"/>
                    {showAddForm ? 'Cancel' : 'Add Activity'}
                </Button>
            </div>

            {/* Clean Add Activity Form */}
            {showAddForm && (
                <div
                    className="rounded-xl bg-gradient-to-br from-black/80 to-black/60 border border-[#D04907]/30 p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-[#D04907]/20">
                            <Plus className="w-3.5 h-3.5 text-[#D04907]"/>
                        </div>
                        <h5 className="text-sm font-semibold text-[#E3E3E3]">Create New Task</h5>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-[#E3E3E3]/70 mb-1.5 block">Task Title</label>
                            <Input
                                value={newTask.title}
                                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                placeholder="What needs to be done?"
                                className="bg-black/40 border-white/20 text-[#E3E3E3] placeholder:text-[#E3E3E3]/40 focus:border-[#D04907] focus:ring-[#D04907]/20 h-9 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#E3E3E3]/70 mb-1.5 block">Description (Optional)</label>
                            <TextArea
                                value={newTask.description}
                                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                placeholder="Add more details..."
                                className="bg-black/40 border-white/20 text-[#E3E3E3] placeholder:text-[#E3E3E3]/40 focus:border-[#D04907] focus:ring-[#D04907]/20 text-sm resize-none"
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-[#E3E3E3]/70 mb-1.5 block">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({
                                        ...newTask,
                                        priority: e.target.value as 'high' | 'medium' | 'low'
                                    })}
                                    className="w-full h-9 px-3 bg-black/40 border border-white/20 rounded-md text-[#E3E3E3] text-sm focus:border-[#D04907] focus:ring-[#D04907]/20"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-[#E3E3E3]/70 mb-1.5 block">Estimated Time</label>
                                <select
                                    value={newTask.estimatedTime}
                                    onChange={(e) => setNewTask({...newTask, estimatedTime: e.target.value})}
                                    className="w-full h-9 px-3 bg-black/40 border border-white/20 rounded-md text-[#E3E3E3] text-sm focus:border-[#D04907] focus:ring-[#D04907]/20"
                                >
                                    <option value="15min">15 minutes</option>
                                    <option value="30min">30 minutes</option>
                                    <option value="45min">45 minutes</option>
                                    <option value="1hr">1 hour</option>
                                    <option value="2hr">2 hours</option>
                                    <option value="3hr+">3+ hours</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setShowAddForm(false)}
                            className="h-8 px-3 text-xs text-[#E3E3E3]/70 hover:text-[#E3E3E3] hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddTask}
                            className="h-8 px-4 text-xs bg-[#D04907] text-white hover:bg-[#D04907]/90 font-medium"
                        >
                            Add Task
                        </Button>
                    </div>
                </div>
            )}

            {/* Clean, Well-Structured Activity Cards */}
            <div className="space-y-3">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                            task.completed
                                ? 'border-[#D04907]/20 bg-gradient-to-br from-[#D04907]/5 to-black/40'
                                : 'border-white/10 bg-gradient-to-br from-black/60 to-black/40 hover:border-[#D04907]/30 hover:from-[#D04907]/5'
                        }`}
                    >
                        {/* Subtle background pattern */}
                        <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-5"></div>

                        <div className="relative p-4">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => toggleTaskCompletion(task.id)}
                                    className={`mt-1 transition-all duration-200 hover:scale-110 ${
                                        task.completed ? 'text-[#D04907]' : 'text-[#E3E3E3] hover:text-[#D04907]'
                                    }`}
                                >
                                    {task.completed
                                        ? <CheckCircle size={18} className="text-[#D04907] drop-shadow-sm"/>
                                        : <Circle size={18}/>
                                    }
                                </button>

                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h5 className={`text-sm font-medium transition-all duration-200 ${
                                            task.completed ? 'text-[#E3E3E3]/50 line-through' : 'text-[#E3E3E3] group-hover:text-white'
                                        }`}>
                                            {task.title}
                                        </h5>

                                        <div className="flex items-center gap-2">
                                            {task.estimatedTime && (
                                                <div
                                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/30 border border-white/10">
                                                    <Clock size={10} className="text-[#E3E3E3]/60"/>
                                                    <span
                                                        className="text-xs text-[#E3E3E3]/60">{task.estimatedTime}</span>
                                                </div>
                                            )}
                                            <span
                                                className={`text-xs px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? 'Priority' : task.priority === 'medium' ? 'Today' : 'Later'}
                      </span>
                                        </div>
                                    </div>

                                    {task.description && (
                                        <p className={`text-xs leading-relaxed transition-all duration-200 ${
                                            task.completed ? 'text-[#E3E3E3]/30' : 'text-[#E3E3E3]/70 group-hover:text-[#E3E3E3]/90'
                                        }`}>
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {tasks.length === 0 && (
                <div className="text-center py-8 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#D04907]/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-[#D04907]"/>
                    </div>
                    <div>
                        <h5 className="text-sm font-medium text-[#E3E3E3] mb-1">No tasks yet</h5>
                        <p className="text-xs text-[#E3E3E3]/60">Add your first task to get started with your daily
                            warmup</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarmupTab;
