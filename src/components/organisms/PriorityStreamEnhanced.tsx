import React, { useMemo, useState } from 'react';
import { cn } from '@/utils/utils';
import { Menu, Grid3x3, Calendar, ChevronDown, X, Edit3 } from 'lucide-react';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { Priority } from '@/models/Priority';
import { Checkbox } from '@/components/atoms/Checkbox';

interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  project?: string;
  projectColor?: string;
  completed: boolean;
  time?: string;
  created_at?: string;
  updated_at?: string;
  rollover_count?: number;
  archived_at?: string | null;
}

interface EnhancedMilestone {
  id: string;
  name: string;
  dueDateLabel: string;
  project?: string;
}

interface PriorityStreamProps {
  compact?: boolean;
  className?: string;
  priorityOnly?: boolean;
  context?: 'dashboard' | 'digital-brain';
}

export const PriorityStreamEnhanced: React.FC<PriorityStreamProps> = ({ className, priorityOnly, context = 'digital-brain' }) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'schedule' | 'priority'>('priority');
  const [milestonesCollapsed, setMilestonesCollapsed] = useState(true);

  const projects = usePersonasStore((state) => state.projects);
  const updateTask = usePersonasStore((state) => state.updateTask);
  const removeTask = usePersonasStore((state) => state.removeTask);

  // Task interaction handlers with optimistic updates
  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    console.log(`✏️ [${new Date().toLocaleTimeString()}] Updating task completion:`, taskId, completed);
    await updateTask(null, taskId, { completed });
  };

  const handleTaskEdit = (taskId: string, currentDescription: string | undefined) => {
    const updatedDescription = prompt("Update task description:", currentDescription || "");
    if (updatedDescription !== null && updatedDescription !== currentDescription) {
      console.log(`✏️ [${new Date().toLocaleTimeString()}] Updating task description:`, taskId);
      updateTask(null, taskId, { description: updatedDescription });
    }
  };

  const handleTaskDelete = async (taskId: string, taskName: string) => {
    if (confirm(`Delete task "${taskName}"?`)) {
      console.log(`🗑️ [${new Date().toLocaleTimeString()}] Deleting task:`, taskId);
      await removeTask(null, taskId);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const taskProjectLookup = useMemo(() => {
    const lookup = new Map<string, { name: string; color: string }>();
    projects.forEach((project) => {
      (project.goals ?? []).forEach((goal) => {
        (goal.tasks ?? []).forEach((task) => {
          lookup.set(task.id, { name: project.name, color: project.color || '#3b82f6' });
        });
      });
    });
    return lookup;
  }, [projects]);

  const outstandingTasks = useMemo(() => {
    const map = new Map<string, EnhancedTask>();

    projects.forEach((project) => {
      (project.goals ?? []).forEach((goal) => {
        (goal.tasks ?? []).forEach((task) => {
          if (task.completed || task.archived_at) {
            return;
          }

          const projectInfo = taskProjectLookup.get(task.id);
          const candidate: EnhancedTask = {
            id: task.id,
            title: task.name,
            description: task.description,
            priority: task.priority,
            project: projectInfo?.name,
            projectColor: projectInfo?.color,
            completed: task.completed,
            time: task.estimated_time ? `~${Math.ceil(task.estimated_time / 60)} hrs` : undefined,
            created_at: task.created_at,
            updated_at: task.updated_at,
            rollover_count: task.rollover_count,
            archived_at: task.archived_at ?? null,
          };

          const existing = map.get(task.id);
          if (!existing) {
            map.set(task.id, candidate);
            return;
          }

          const existingTimestamp = new Date(existing.updated_at ?? existing.created_at ?? 0).getTime();
          const candidateTimestamp = new Date(candidate.updated_at ?? candidate.created_at ?? 0).getTime();

          if (candidateTimestamp >= existingTimestamp) {
            map.set(task.id, candidate);
          }
        });
      });
    });

    return Array.from(map.values());
  }, [projects, taskProjectLookup]);

  const priorityWeight: Record<Priority, number> = {
    [Priority.High]: 0,
    [Priority.Medium]: 1,
    [Priority.Low]: 2,
  };

  const sortedTasks = useMemo(() => {
    return [...outstandingTasks].sort((a, b) => {
      const dateA = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const dateB = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      const weight = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (weight !== 0) {
        return weight;
      }
      return a.title.localeCompare(b.title);
    });
  }, [outstandingTasks]);

  const tasksToShow = useMemo(() => {
    return sortedTasks.slice(0, priorityOnly ? 3 : 5);
  }, [sortedTasks, priorityOnly]);

  const priorityTotals = useMemo(() => {
    return sortedTasks.reduce(
      (acc, task) => {
        acc[task.priority] += 1;
        return acc;
      },
      {
        [Priority.High]: 0,
        [Priority.Medium]: 0,
        [Priority.Low]: 0,
      } as Record<Priority, number>,
    );
  }, [sortedTasks]);

  // Cross-Project Balance: Calculate today's work distribution per project
  const crossProjectBalance = useMemo(() => {
    // Group tasks by project and sum hours
    const projectEffort = new Map<string, { hours: number; color: string }>();

    sortedTasks.forEach((task) => {
      const projectName = task.project || 'Uncategorized';
      const projectColor = task.projectColor || '#3b82f6';

      // Parse time estimate (e.g., "2h", "30m", or fallback to 1 hour)
      let hours = 1;
      if (task.time) {
        const match = task.time.match(/(\d+\.?\d*)([hm])/);
        if (match) {
          const value = parseFloat(match[1]);
          const unit = match[2];
          hours = unit === 'h' ? value : value / 60;
        }
      }

      const existing = projectEffort.get(projectName);
      if (existing) {
        existing.hours += hours;
      } else {
        projectEffort.set(projectName, { hours, color: projectColor });
      }
    });

    const totalHours = Array.from(projectEffort.values()).reduce((sum, { hours }) => sum + hours, 0);

    if (totalHours === 0) {
      return { projectBreakdown: [], totalHours: 0, hasData: false };
    }

    // Convert to percentages and round to whole numbers
    const projectBreakdown = Array.from(projectEffort.entries()).map(([project, { hours, color }]) => ({
      project,
      hours,
      color,
      percentage: Math.round((hours / totalHours) * 100)
    }));

    // Normalize to ensure sum = 100%
    const currentSum = projectBreakdown.reduce((sum, p) => sum + p.percentage, 0);
    if (currentSum !== 100 && projectBreakdown.length > 0) {
      projectBreakdown[0].percentage += (100 - currentSum);
    }

    return { projectBreakdown, totalHours, hasData: true };
  }, [sortedTasks]);

  const balancePercent = crossProjectBalance.hasData
    ? Math.round((crossProjectBalance.projectBreakdown.length / (projects.length || 1)) * 100)
    : 0;

  const upcomingMilestones = useMemo(() => {
    const rawMilestones = projects.flatMap((project) =>
      (project.milestones ?? []).map((milestone) => {
        const dueDate = milestone.due_date ? new Date(milestone.due_date) : null;
        const isValidDate = dueDate && !Number.isNaN(dueDate.getTime());

        return {
          id: milestone.id,
          name: milestone.name,
          dueDateLabel: isValidDate
            ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : 'No date',
          project: project.name,
          order: isValidDate ? dueDate.getTime() : Number.POSITIVE_INFINITY,
        };
      }),
    );

    return rawMilestones
      .filter((item) => item.name.trim())
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .map<EnhancedMilestone>(({ order: _order, ...rest }) => rest);
  }, [projects]);

  const totalOutstanding = sortedTasks.length;
  const highPercent = totalOutstanding ? Math.round((priorityTotals[Priority.High] / totalOutstanding) * 100) : 0;
  const mediumPercent = totalOutstanding ? Math.round((priorityTotals[Priority.Medium] / totalOutstanding) * 100) : 0;
  const lowPercent = totalOutstanding ? Math.max(0, 100 - highPercent - mediumPercent) : 0;

  const headerSubTitle = totalOutstanding
    ? `${totalOutstanding} active task${totalOutstanding === 1 ? '' : 's'}`
    : 'Everything is clear';

  const priorityTheme: Record<Priority, { label: string; className: string }> = {
    [Priority.High]: {
      label: 'High',
      className: 'text-red-300 bg-red-500/10 border border-red-400/30',
    },
    [Priority.Medium]: {
      label: 'Medium',
      className: 'text-amber-200 bg-amber-500/10 border border-amber-400/30',
    },
    [Priority.Low]: {
      label: 'Low',
      className: 'text-sky-200 bg-sky-500/10 border border-sky-400/30',
    },
  };

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 glass-card bg-black/60 backdrop-blur-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-white">Priority Stream</h3>
          <p className="text-xs text-white/40 mt-0.5">{headerSubTitle}</p>
        </div>

        {/* Only show toggle buttons in Digital Brain, hide in Dashboard */}
        {!priorityOnly && (
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Menu size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Grid3x3 size={16} />
              </button>
            </div>

            {/* Tab Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === 'schedule' ? 'priority' : 'schedule')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 transition-colors flex items-center gap-1.5"
            >
              <Calendar size={12} />
              {activeTab === 'schedule' ? 'Schedule' : 'Priority'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tasksToShow.length ? (
          <div className="space-y-3">
            {tasksToShow.map((task) => {
              const isExpanded = expandedTasks.has(task.id);
              const statusBadge = task.priority === Priority.High ? 'Launch Blocker' : task.priority === Priority.Medium ? 'Ready to Execute' : 'Context Ready';

              return (
                <div
                  key={task.id}
                  className="relative rounded-lg border transition-all duration-200"
                  style={{
                    borderColor: task.projectColor || '#3b82f6',
                    borderLeftWidth: '4px',
                    borderTopWidth: '1px',
                    borderRightWidth: '1px',
                    borderBottomWidth: '1px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Card Header - Always visible */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.projectColor || '#3b82f6' }}
                        />
                        <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
                          {task.project || 'Uncategorized'}
                        </span>
                      </div>
                      {task.time && (
                        <span className="text-xs text-white/50">{task.time}</span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white/90 mb-1">
                          {task.title}
                        </h4>
                        {task.description && !isExpanded && (
                          <p className="text-xs text-white/60 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                      >
                        <ChevronDown
                          size={16}
                          className={cn(
                            'text-white/60 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-semibold uppercase',
                          priorityTheme[task.priority].className
                        )}
                      >
                        {statusBadge}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-semibold uppercase',
                          priorityTheme[task.priority].className
                        )}
                      >
                        {priorityTheme[task.priority].label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Section - Only visible when expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                      {/* AI Summary Panel */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <h5 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-2">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                          </svg>
                          AI Summary
                        </h5>
                        <p className="text-xs text-white/60">
                          {task.description || 'No summary available yet. The AI will generate one based on your progress and context.'}
                        </p>
                      </div>

                      {/* Research Notes Panel */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <h5 className="text-xs font-semibold text-white/80 mb-2">Research Notes</h5>
                        <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                          <li>Key findings and insights will appear here</li>
                          <li>Relevant resources and documentation links</li>
                          <li>Important context and dependencies</li>
                        </ul>
                      </div>

                      {/* Next Steps Panel */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <h5 className="text-xs font-semibold text-white/80 mb-2">Next Steps</h5>
                        <ol className="text-xs text-white/60 space-y-1 list-decimal list-inside">
                          <li>Suggested action items will appear here</li>
                          <li>Sequenced based on dependencies</li>
                          <li>Updated as you make progress</li>
                        </ol>
                      </div>

                      {/* AI-Generated Draft (for code-relevant tasks) */}
                      {task.description?.toLowerCase().includes('code') ||
                       task.description?.toLowerCase().includes('implement') ||
                       task.title.toLowerCase().includes('code') ||
                       task.title.toLowerCase().includes('implement') ? (
                        <div className="bg-white/5 rounded-lg p-3">
                          <h5 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            AI-Generated Draft
                          </h5>
                          <div className="text-xs text-white/60 font-mono bg-black/30 p-2 rounded">
                            Code suggestions will be generated here based on your task requirements.
                          </div>
                        </div>
                      ) : null}

                      {/* Action buttons - only in Digital Brain context */}
                      {context === 'digital-brain' && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleTaskCompletion(task.id, !task.completed)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 transition-colors"
                          >
                            <Checkbox
                              id={`task-${task.id}-expanded`}
                              checked={task.completed}
                              onCheckedChange={(checked) => handleTaskCompletion(task.id, checked === true)}
                              className="h-3 w-3 border-white/20 data-[state=checked]:bg-[#ff7000] data-[state=checked]:border-[#ff7000]"
                            />
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleTaskEdit(task.id, task.description)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 transition-colors"
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleTaskDelete(task.id, task.title)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-red-500/20 rounded text-xs text-white/70 hover:text-red-400 transition-colors"
                          >
                            <X size={12} />
                            Delete
                          </button>
                        </div>
                      )}

                      {/* Delete only button for Dashboard */}
                      {context === 'dashboard' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTaskCompletion(task.id, !task.completed)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70 transition-colors"
                          >
                            <Checkbox
                              id={`task-${task.id}-expanded`}
                              checked={task.completed}
                              onCheckedChange={(checked) => handleTaskCompletion(task.id, checked === true)}
                              className="h-3 w-3 border-white/20 data-[state=checked]:bg-[#ff7000] data-[state=checked]:border-[#ff7000]"
                            />
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleTaskDelete(task.id, task.title)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-red-500/20 rounded text-xs text-white/70 hover:text-red-400 transition-colors"
                          >
                            <X size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-white/40 text-center">
            No tasks for today. Chat with ATMO to plan your next steps.
          </div>
        )}
      </div>

      {/* End-of-Day Milestones Section with Cross-Project Balance - Collapsible */}
      <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50">
        <button
          onClick={() => setMilestonesCollapsed(!milestonesCollapsed)}
          className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            <h4 className="text-xs uppercase tracking-wide text-white/40">End-of-Day Milestones</h4>
          </div>
          <ChevronDown
            size={14}
            className={cn(
              'text-white/40 transition-transform',
              milestonesCollapsed && 'rotate-180'
            )}
          />
        </button>
        {!milestonesCollapsed && (
          <div className="space-y-4">
            {/* Cross-Project Balance - Inside collapsible */}
            {crossProjectBalance.hasData ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    <span className="text-xs uppercase tracking-wide text-white/40">Cross-Project Balance</span>
                  </div>
                  <span className="text-xs text-white/50">{Math.round(crossProjectBalance.totalHours)}h total</span>
                </div>

                {/* Progress Bar with per-project colors */}
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-0 flex">
                    {crossProjectBalance.projectBreakdown.map((project, idx) => (
                      <div
                        key={idx}
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${project.percentage}%`,
                          backgroundColor: project.color,
                          opacity: 0.6
                        }}
                        title={`${project.project}: ${project.hours.toFixed(1)}h (${project.percentage}%)`}
                      />
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {crossProjectBalance.projectBreakdown.map((project, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project.color, opacity: 0.8 }}
                      />
                      <span className="text-[10px] text-white/60">
                        {project.project}: {project.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-white/30">
                No active work scheduled for today.
              </div>
            )}

        {/* Milestones */}
        <div className="space-y-3">
          {upcomingMilestones.length ? (
            upcomingMilestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-center justify-between text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: ['rgb(96 165 250 / 0.4)', 'rgb(167 139 250 / 0.4)', 'rgb(251 191 36 / 0.4)'][index % 3],
                    }}
                  />
                  <span className="font-medium text-white/80">{milestone.name}</span>
                  {milestone.project && (
                    <span className="text-[10px] text-white/40 uppercase tracking-wide">{milestone.project}</span>
                  )}
                </div>
                <span className="text-white/50">{milestone.dueDateLabel}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-white/30">No upcoming milestones captured yet.</p>
          )}
        </div>
      </div>
    )}
      </div>
    </div>
  );
};

export default PriorityStreamEnhanced;
