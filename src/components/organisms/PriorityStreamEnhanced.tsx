import React, { useMemo, useState, useEffect } from 'react';
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
  const synchronizeWorkspace = usePersonasStore((state) => state.synchronizeWorkspace);

  // Create YourSelf project for personal goals and tasks
  const yourSelfProject = useMemo(() => ({
    id: 'yourself-project',
    name: 'YourSelf',
    description: 'Personal development, health, learning, and life goals',
    status: 'active',
    priority: 'high',
    color: '#10b981', // emerald-500
    active: true,
    goals: [],
    milestones: [],
    tasks: []
  }), []);

  // Combine regular projects with YourSelf project
  const allProjects = useMemo(() => {
    return [yourSelfProject, ...projects];
  }, [projects, yourSelfProject]);

  // Listen for priority stream refresh events
  useEffect(() => {
    const handlePriorityStreamRefresh = async () => {
      console.log('🔄 Priority stream refresh event received');
      try {
        const profile = usePersonasStore.getState().currentPersona;
        if (profile) {
          await synchronizeWorkspace(profile.id);
          console.log('✅ Priority stream data refreshed');
        }
      } catch (error) {
        console.error('❌ Failed to refresh priority stream data:', error);
      }
    };

    window.addEventListener('atmo:priority-stream:refresh', handlePriorityStreamRefresh);
    return () => window.removeEventListener('atmo:priority-stream:refresh', handlePriorityStreamRefresh);
  }, [synchronizeWorkspace]);

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
    // Smart limiting: show reasonable number based on context
    // Dashboard gets more space, digital-brain is compact
    const limit = context === 'dashboard' ? 8 : 5;
    return sortedTasks.slice(0, limit);
  }, [sortedTasks, context]);

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
        {allProjects.length > 0 ? (
          <div className="space-y-6">
            {allProjects.map((project) => {
              const projectTasks = sortedTasks.filter(task => task.project === project.name);
              const projectMilestones = project.milestones || [];
              const isProjectExpanded = expandedTasks.has(`project-${project.id}`);

              return (
                <div key={project.id} className="space-y-3">
                  {/* Project Header */}
                  <div
                    className="relative rounded-lg border transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: project.color || '#3b82f6',
                      borderLeftWidth: '4px',
                      borderTopWidth: '1px',
                      borderRightWidth: '1px',
                      borderBottomWidth: '1px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    }}
                    onClick={() => toggleTaskExpansion(`project-${project.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          />
                          <div>
                            <h3 className="text-base font-semibold text-white/90">{project.name}</h3>
                            <p className="text-xs text-white/60">{project.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/50">
                            {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                          </span>
                          <ChevronDown
                            size={16}
                            className={cn(
                              'text-white/40 transition-transform duration-200',
                              isProjectExpanded && 'rotate-180 text-white/60'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Details (Expanded) */}
                  {isProjectExpanded && (
                    <div className="ml-4 space-y-4">
                      {/* Milestones Section */}
                      {projectMilestones.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white/70 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            Milestones ({projectMilestones.length})
                          </h4>
                          <div className="space-y-2">
                            {projectMilestones.map((milestone) => (
                              <div
                                key={milestone.id}
                                className="ml-4 p-3 rounded-lg bg-white/5 border border-white/10"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-sm font-medium text-white/80">{milestone.name}</h5>
                                    <p className="text-xs text-white/60">{milestone.description || 'No description'}</p>
                                  </div>
                                  {milestone.due_date && (
                                    <span className="text-xs text-white/50">
                                      {new Date(milestone.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tasks Section */}
                      {projectTasks.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white/70 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            Tasks ({projectTasks.length})
                          </h4>
                          <div className="space-y-2">
                            {projectTasks.map((task) => {
                              const isTaskExpanded = expandedTasks.has(task.id);
                              const statusBadge = task.priority === Priority.High ? 'Launch Blocker' : task.priority === Priority.Medium ? 'Ready to Execute' : 'Context Ready';

                              return (
                                <div
                                  key={task.id}
                                  className="ml-4 p-3 rounded-lg bg-white/5 border border-white/10"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Checkbox
                                          checked={task.completed}
                                          onCheckedChange={(checked) => handleTaskCompletion(task.id, Boolean(checked))}
                                          className="h-4 w-4 border-white/20 data-[state=checked]:bg-[#ff7000] data-[state=checked]:border-[#ff7000]"
                                        />
                                        <h5 className="text-sm font-medium text-white/80">{task.title}</h5>
                                        <span
                                          className={cn(
                                            'px-2 py-1 rounded text-[10px] font-semibold uppercase',
                                            priorityTheme[task.priority].className
                                          )}
                                        >
                                          {statusBadge}
                                        </span>
                                      </div>
                                      {task.description && (
                                        <p className="text-xs text-white/60 ml-6">{task.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {task.time && (
                                        <span className="text-xs text-white/50">{task.time}</span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTaskEdit(task.id, task.description);
                                        }}
                                        className="p-1 rounded hover:bg-white/10 transition-colors text-white/50"
                                      >
                                        <Edit3 size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTaskDelete(task.id, task.title);
                                        }}
                                        className="p-1 rounded hover:bg-white/10 transition-colors text-white/50"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Empty State for Project */}
                      {projectMilestones.length === 0 && projectTasks.length === 0 && (
                        <div className="ml-4 p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                          <p className="text-sm text-white/60">No milestones or tasks yet</p>
                          <p className="text-xs text-white/40 mt-1">Add some to get started with this project</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Menu size={24} className="text-white/20" />
              </div>
              <h4 className="text-sm font-medium text-white/60 mb-2">No projects found</h4>
              <p className="text-xs text-white/40 max-w-xs">
                Create a project to start organizing your priorities and tasks.
              </p>
            </div>
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
