import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { useTasksStore } from '@/stores/useTasksStore';
import { CheckCircle, Clock } from 'lucide-react';

interface TaskSidebarProps {
  className?: string;
}

const TaskSidebar: React.FC<TaskSidebarProps> = ({ className }) => {
  const { tasks, toggleTaskCompletion } = useTasksStore();

  // Group tasks by projectID
  const projectGroups = tasks.reduce((groups: any[], task) => {
    const existingGroup = groups.find(group => group.name === task.projectID);
    if (existingGroup) {
      existingGroup.tasks.push(task);
    } else {
      groups.push({
        name: task.projectID,
        tasks: [task]
      });
    }
    return groups;
  }, []);

  const handleTaskCompletion = (id: string, completed: boolean) => {
    toggleTaskCompletion(id);
  };

  const handleBringToChat = (task: any) => {
    // This will be handled by the parent component (CenterColumn)
    if (onTaskToChat) {
      onTaskToChat(task);
    }
    toast({
      title: "Task brought to chat",
      description: `"${task.title}" is now in your conversation`,
      duration: 2000,
    });
  };

  const getPriorityColor = (project: string) => {
    const colors = {
      'Work': 'bg-blue-500/20 border-blue-500/30',
      'Personal': 'bg-green-500/20 border-green-500/30',
      'Health': 'bg-purple-500/20 border-purple-500/30',
      'Learning': 'bg-orange-500/20 border-orange-500/30',
    };
    return colors[project as keyof typeof colors] || 'bg-slate-500/20 border-slate-500/30';
  };

  return (
    <div className={`relative h-full bg-gradient-to-b from-slate-900/50 to-slate-950/50 border-r border-slate-700/30 backdrop-blur-xl transition-all duration-300 ${
      isExpanded ? 'w-80' : 'w-16'
    }`}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-4 right-2 z-10 h-8 w-8 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30"
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </Button>

      {/* NavSidebar Content */}
      <div className="h-full flex flex-col pt-16 pb-4">
        {!isExpanded ? (
          // Collapsed state - Show icons only
          <div className="flex flex-col items-center space-y-4 px-2">
            <div className="p-2 rounded-lg bg-[#FF7000]/20 border border-[#FF7000]/30">
              <Target size={20} className="text-[#FF7000]" />
            </div>
            <div className="text-xs text-slate-400 text-center">
              {tasks.filter(t => !t.completed).length}
            </div>
          </div>
        ) : (
          // Expanded state - Show full task list
          <div className="flex flex-col h-full px-4">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#FF7000]/20 border border-[#FF7000]/30">
                  <Target size={18} className="text-[#FF7000]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Your Tasks</h3>
                  <p className="text-xs text-slate-400">
                    {tasks.filter(t => !t.completed).length} pending • {tasks.filter(t => t.completed).length} completed
                  </p>
                </div>
              </div>
            </div>

            {/* Task List */}
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {projectGroups.map((group) => (
                  <div key={group.name} className="space-y-2">
                    {/* Project Header */}
                    <div className={`px-3 py-2 rounded-lg border ${getPriorityColor(group.name)}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{group.name}</span>
                        <span className="text-xs text-slate-400">
                          {group.tasks.filter((t: any) => !t.completed).length}/{group.tasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-2 ml-2">
                      {group.tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="group bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => handleTaskCompletion(task.id, checked === true)}
                              className="mt-0.5 h-4 w-4 border-slate-500 data-[state=checked]:bg-[#FF7000] data-[state=checked]:border-[#FF7000]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium ${
                                  task.completed ? 'text-slate-400 line-through' : 'text-white'
                                }`}>
                                  {task.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleBringToChat(task)}
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF7000]/20 hover:text-[#FF7000]"
                                  title="Bring to chat"
                                >
                                  <MessageSquare size={12} />
                                </Button>
                              </div>
                              {task.time && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <Clock size={10} />
                                  {task.time}
                                </div>
                              )}
                              {task.description && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {projectGroups.length === 0 && (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#FF7000]/20 flex items-center justify-center">
                      <Target className="w-6 h-6 text-[#FF7000]" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-white mb-1">No tasks yet</h5>
                      <p className="text-xs text-slate-400">Start a conversation with your AI assistant to create tasks</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Add Button */}
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                <Plus size={16} className="mr-2" />
                Quick add task
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSidebar;
