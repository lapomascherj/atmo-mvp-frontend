import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  Clock,
  Target,
  CheckSquare,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/atoms/Button.tsx';
import { Badge } from '@/components/atoms/Badge.tsx';
import { Input } from '@/components/atoms/Input.tsx';
import { TextArea } from '@/components/atoms/TextArea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select.tsx';
import { Goal } from '@/models/Goal.ts';
import { Task } from '@/models/Task.ts';
import { Priority } from '@/models/Priority.ts';
import { Status } from '@/models/Status.ts';

interface GoalsTasksTableProps {
  goals: Goal[];
  expandedGoals?: Set<string>;
  onAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onToggleGoalStatus: (goalId: string, status: Status) => void;
  onExpandGoal?: (goalId: string) => void;
  onAddTask: (goalId: string) => void;
  onEditTask: (goalId: string, task: Task) => void;
  onDeleteTask: (goalId: string, taskId: string) => void;
  onToggleTaskCompletion: (goalId: string, taskId: string) => void;
  onUpdateGoalField: (goalId: string, field: keyof Goal, value: any) => void;
  onUpdateTaskField: (goalId: string, taskId: string, field: keyof Task, value: any) => void;
}

/**
 * Table-like component for managing Goals and Tasks in a hierarchical structure.
 * Goals are displayed as main rows, with Tasks as expandable sub-rows.
 * Follows README requirements for consolidated UX.
 */
const GoalsTasksTable: React.FC<GoalsTasksTableProps> = ({
  goals,
  expandedGoals: controlledExpandedGoals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onToggleGoalStatus,
  onExpandGoal,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskCompletion,
  onUpdateGoalField,
  onUpdateTaskField,
}) => {
  const [internalExpandedGoals, setInternalExpandedGoals] = useState<Set<string>>(new Set());
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ goalId: string; taskId: string } | null>(null);
  const [editingGoalField, setEditingGoalField] = useState<{ goalId: string; field: keyof Goal } | null>(null);
  const [editingTaskField, setEditingTaskField] = useState<{ goalId: string; taskId: string; field: keyof Task } | null>(null);

  // Use controlled or internal expanded state
  const expandedGoals = controlledExpandedGoals || internalExpandedGoals;

  const toggleGoalExpansion = (goalId: string) => {
    if (onExpandGoal) {
      onExpandGoal(goalId);
    } else {
      const newExpanded = new Set(internalExpandedGoals);
      if (newExpanded.has(goalId)) {
        newExpanded.delete(goalId);
      } else {
        newExpanded.add(goalId);
      }
      setInternalExpandedGoals(newExpanded);
    }
  };

  const handleGoalFieldEdit = (goalId: string, field: keyof Goal) => {
    setEditingGoalField({ goalId, field });
  };

  const handleTaskFieldEdit = (goalId: string, taskId: string, field: keyof Task) => {
    setEditingTaskField({ goalId, taskId, field });
  };

  const handleGoalFieldSave = (goalId: string, field: keyof Goal, value: any) => {
    onUpdateGoalField(goalId, field, value);
    setEditingGoalField(null);
  };

  const handleTaskFieldSave = (goalId: string, taskId: string, field: keyof Task, value: any) => {
    onUpdateTaskField(goalId, taskId, field, value);
    setEditingTaskField(null);
  };

  const handleGoalFieldCancel = () => {
    setEditingGoalField(null);
  };

  const handleTaskFieldCancel = () => {
    setEditingTaskField(null);
  };

  // Inline editing components - invisible/seamless UX
  const InlineTextEdit = ({ value, onSave, onCancel, multiline = false, type = "text", className = "" }: {
    value: string;
    onSave: (value: string) => void;
    onCancel: () => void;
    multiline?: boolean;
    type?: string;
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

    // Calculate dynamic rows based on content
    const calculateRows = (text: string) => {
      if (!text) return 1;
      const lines = text.split('\n').length;
      return Math.max(1, Math.min(lines, 4)); // Min 1, max 4 rows
    };

    if (multiline) {
      const dynamicRows = calculateRows(editValue);
      
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
            height: 'auto',
            overflow: 'hidden',
            lineHeight: '1.5',
            fontSize: 'inherit'
          }}
          rows={dynamicRows}
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
        type={type}
        autoFocus
      />
    );
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.High:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case Priority.Medium:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case Priority.Low:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.Completed:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case Status.InProgress:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case Status.Planned:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const completedGoals = goals.filter(goal => goal.status === Status.Completed).length;
  const totalTasks = goals.reduce((sum, goal) => sum + (goal.tasks?.length || 0), 0);
  const completedTasks = goals.reduce((sum, goal) => 
    sum + (goal.tasks?.filter(task => task.completed).length || 0), 0
  );

  return (
    <div className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-light text-white">Goals & Tasks</h2>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {completedGoals}/{goals.length} goals
            </span>
            <span className="flex items-center gap-1">
              <CheckSquare className="w-4 h-4" />
              {completedTasks}/{totalTasks} tasks
            </span>
          </div>
        </div>
        <Button
          onClick={onAddGoal}
          className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
        >
          <Plus size={16} />
          Add Goal
        </Button>
      </div>

      {/* Table */}
      <div className="space-y-1">
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No goals yet</h3>
            <p className="text-slate-400 mb-4">Create your first goal to get started</p>
            <Button
              onClick={onAddGoal}
              className="bg-[#FF7000] hover:bg-[#FF7000]/90"
            >
              <Plus size={16} className="mr-2" />
              Add Goal
            </Button>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="border border-slate-700/20 rounded-lg overflow-hidden">
              {/* Goal Row */}
              <div className={`flex items-center gap-4 p-4 transition-colors group border-l-4 ${
                goal.status === Status.Completed
                  ? 'bg-slate-800/30 border-slate-600/30 border-l-emerald-500/50'
                  : 'bg-slate-800/20 hover:bg-slate-800/30 border-l-[#FF7000]/50 hover:border-l-[#FF7000]/70'
              }`}>
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => toggleGoalExpansion(goal.id)}
                  className="p-1 rounded hover:bg-slate-700/30 transition-colors"
                  disabled={!goal.tasks || goal.tasks.length === 0}
                >
                  {goal.tasks && goal.tasks.length > 0 ? (
                    expandedGoals.has(goal.id) ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </button>

                {/* Goal Status Checkbox */}
                <button
                  onClick={() => onToggleGoalStatus(
                    goal.id,
                    goal.status === Status.Completed ? Status.InProgress : Status.Completed
                  )}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    goal.status === Status.Completed
                      ? 'bg-emerald-500/20 border-emerald-400/40'
                      : 'border-slate-400 hover:border-slate-300'
                  }`}
                >
                  {goal.status === Status.Completed && (
                    <Check size={12} className="text-emerald-400" />
                  )}
                </button>

                {/* Goal Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {/* Goal Name - Inline Editable */}
                    {editingGoalField?.goalId === goal.id && editingGoalField?.field === 'name' ? (
                      <div className="flex-1">
                        <InlineTextEdit
                          value={goal.name}
                          onSave={(value) => handleGoalFieldSave(goal.id, 'name', value)}
                          onCancel={handleGoalFieldCancel}
                          className="font-semibold text-lg text-white"
                        />
                      </div>
                    ) : (
                      <h3 
                        className={`font-semibold text-lg transition-colors cursor-pointer hover:text-[#FF7000] ${
                          goal.status === Status.Completed
                            ? 'text-slate-400 line-through'
                            : 'text-white'
                        }`}
                        onClick={() => handleGoalFieldEdit(goal.id, 'name')}
                        title="Click to edit name"
                      >
                        {goal.name}
                      </h3>
                    )}
                    
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {/* Target Date - Native Date Picker */}
                    <div className="relative">
                      <span 
                        className="flex items-center gap-1 cursor-pointer hover:text-[#FF7000] transition-colors"
                        onClick={() => {
                          const input = document.getElementById(`date-input-${goal.id}`) as HTMLInputElement;
                          if (input) {
                            if (input.showPicker) {
                              input.showPicker();
                            } else {
                              input.click();
                            }
                          }
                        }}
                        title="Click to select due date"
                      >
                        <CalendarIcon className="w-3 h-3" />
                        Due: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No date'}
                      </span>
                      <input
                        id={`date-input-${goal.id}`}
                        type="date"
                        value={goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => onUpdateGoalField(goal.id, 'targetDate', e.target.value)}
                        className="absolute opacity-0 pointer-events-none"
                        tabIndex={-1}
                      />
                    </div>
                    
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      {goal.tasks?.filter(t => t.completed).length || 0}/{goal.tasks?.length || 0} tasks
                    </span>
                  </div>
                  
                  {/* Goal Description - Read Only */}
                  <p 
                    className="text-slate-400 text-sm mt-1 truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                    title={goal.description || 'No description'}
                    style={{ lineHeight: '1.5' }}
                  >
                    {goal.description || 'No description'}
                  </p>
                </div>

                {/* Goal Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddTask(goal.id)}
                    className="h-8 px-3 text-slate-400 hover:text-[#FF7000] hover:bg-[#FF7000]/10 border border-transparent hover:border-[#FF7000]/30 transition-all flex items-center gap-1.5"
                    title="Add task to this goal"
                  >
                    <Plus size={14} />
                    <span className="text-xs">Add Task</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditGoal(goal)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-[#FF7000]"
                    title="Edit goal"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                    title="Delete goal"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Tasks Sub-rows */}
              {expandedGoals.has(goal.id) && goal.tasks && goal.tasks.length > 0 && (
                <div className="bg-slate-900/40 border-t border-slate-700/30 max-w-full overflow-hidden">
                  {goal.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 py-3 pr-4 transition-colors group relative max-w-full ${
                        task.completed
                          ? 'bg-slate-900/50 border-l-2 border-l-emerald-500/30'
                          : 'bg-slate-900/30 hover:bg-slate-900/50 border-l-2 border-l-slate-600/30 hover:border-l-[#FF7000]/50'
                      } ${index !== (goal.tasks?.length || 0) - 1 ? 'border-b border-slate-700/20' : ''}`}
                      style={{ paddingLeft: '4.5rem' }} // Align with goal content after expand button + checkbox + gaps
                    >
                      {/* Indentation Line */}
                      <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-600/30"></div>
                      <div className="absolute left-10 top-1/2 w-8 h-px bg-slate-600/30"></div>
                      
                      {/* Task Checkbox */}
                      <button
                        onClick={() => onToggleTaskCompletion(goal.id, task.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                          task.completed
                            ? 'bg-emerald-500/20 border-emerald-400/40'
                            : 'border-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {task.completed && <Check size={10} className="text-emerald-400" />}
                      </button>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        {/* Task Name and Priority - Main Line */}
                        <div className="flex items-center gap-3 mb-1">
                          {/* Task Name - Inline Editable */}
                          {editingTaskField?.goalId === goal.id && editingTaskField?.taskId === task.id && editingTaskField?.field === 'name' ? (
                            <div className="flex-1 min-w-0">
                              <InlineTextEdit
                                value={task.name}
                                onSave={(value) => handleTaskFieldSave(goal.id, task.id, 'name', value)}
                                onCancel={handleTaskFieldCancel}
                                className="text-sm font-medium text-slate-100"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h4 
                                className={`text-sm font-medium transition-colors cursor-pointer hover:text-[#FF7000] truncate ${
                                  task.completed
                                    ? 'text-slate-400 line-through'
                                    : 'text-slate-100'
                                }`}
                                onClick={() => handleTaskFieldEdit(goal.id, task.id, 'name')}
                                title={`Click to edit: ${task.name}`}
                              >
                                {task.name}
                              </h4>
                              <Badge className={`${getPriorityColor(task.priority)} text-xs flex-shrink-0`} variant="outline">
                                {task.priority}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Task Time - Secondary Line */}
                        <div className="flex items-center text-xs text-slate-500">
                          {/* Task Time - Inline Editable */}
                          {editingTaskField?.goalId === goal.id && editingTaskField?.taskId === task.id && editingTaskField?.field === 'time' ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <InlineTextEdit
                                value={task.time}
                                onSave={(value) => handleTaskFieldSave(goal.id, task.id, 'time', value)}
                                className="text-xs text-slate-500"
                                onCancel={handleTaskFieldCancel}
                                type="time"
                              />
                            </div>
                          ) : (
                            <span 
                              className="flex items-center gap-1 cursor-pointer hover:text-[#FF7000]"
                              onClick={() => handleTaskFieldEdit(goal.id, task.id, 'time')}
                              title="Click to edit time"
                            >
                              <Clock className="w-3 h-3" />
                              {task.time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Task Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTask(goal.id, task)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-[#FF7000]"
                          title="Edit task"
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteTask(goal.id, task.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                          title="Delete task"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalsTasksTable; 