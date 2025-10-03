import React, { useState } from 'react';
import { ChevronDown, ChevronRight, List, Grid, Clock, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/utils';

interface Task {
  id: string;
  project: string;
  projectColor: string;
  title: string;
  description: string;
  status: 'launch_blocker' | 'ready_to_execute' | 'context_ready' | 'critical_path' | 'draft_prepared';
  timeEstimate: string;
  aiDraft?: string;
  researchNotes?: string[];
  executionSteps?: string[];
}

interface PriorityStreamProps {
  compact?: boolean;
  className?: string;
}

const statusConfig = {
  launch_blocker: { label: 'Launch Blocker', icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  ready_to_execute: { label: 'Ready to Execute', icon: CheckCircle2, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  context_ready: { label: 'Context Ready', icon: Sparkles, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  critical_path: { label: 'Critical Path', icon: AlertCircle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  draft_prepared: { label: 'Draft Prepared', icon: FileText, color: 'text-green-400 bg-green-500/10 border-green-500/30' },
};

const mockTasks: Task[] = [
  {
    id: '1',
    project: 'SOLE',
    projectColor: 'bg-purple-500',
    title: 'Finalize user authentication flow',
    description: 'Last major feature before MVP launch',
    status: 'ready_to_execute',
    timeEstimate: '-2 hrs',
    researchNotes: [
      'OAuth 2.0 provides secure, industry-standard authentication',
      'Consider passwordless options for better UX',
      'Session management critical for security'
    ],
    executionSteps: [
      'Implement OAuth providers (Google, GitHub)',
      'Add session management with JWT tokens',
      'Create password reset flow',
      'Test across different browsers and devices'
    ]
  },
  {
    id: '2',
    project: 'ATMO',
    projectColor: 'bg-blue-500',
    title: 'Integrate AI context generation API',
    description: '',
    status: 'context_ready',
    timeEstimate: '-2 hrs'
  },
  {
    id: '3',
    project: 'INSTAGRAM',
    projectColor: 'bg-orange-500',
    title: 'Complete payment integration prototype',
    description: 'Critical blocker for beta launch timeline',
    status: 'critical_path',
    timeEstimate: '-3 hrs'
  }
];

const mockMilestones = [
  { project: 'blue', text: 'Priority Stream Timeline shipped and deployed' },
  { project: 'purple', text: 'Sole authentication ready for beta testing' },
  { project: 'orange', text: 'Instagram payment prototype reviewed by team' }
];

const projectBalance = [
  { name: 'Atmo', percentage: 68, color: 'bg-blue-500', momentum: 'Moderate' },
  { name: 'Instagram', percentage: 42, color: 'bg-orange-500', momentum: 'Low' },
  { name: 'Sole', percentage: 85, color: 'bg-purple-500', momentum: 'Strong' }
];

export const PriorityStream: React.FC<PriorityStreamProps> = ({ compact = false, className }) => {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [viewMode, setViewMode] = useState<'schedule' | 'priority'>('schedule');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['SOLE', 'ATMO', 'INSTAGRAM']));

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleProject = (project: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(project)) {
        next.delete(project);
      } else {
        next.add(project);
      }
      return next;
    });
  };

  const groupedTasks = mockTasks.reduce((acc, task) => {
    if (!acc[task.project]) {
      acc[task.project] = [];
    }
    acc[task.project].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className={cn('flex flex-col bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-white">Priority Stream</h2>
          <p className="text-sm text-white/60">Thu, Oct 2 — 14 tasks</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg border border-white/10">
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-2 rounded transition-colors',
                view === 'list' ? 'bg-slate-700 text-white' : 'text-white/60 hover:text-white'
              )}
              aria-label="List view"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setView('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                view === 'grid' ? 'bg-slate-700 text-white' : 'text-white/60 hover:text-white'
              )}
              aria-label="Grid view"
            >
              <Grid size={18} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('schedule')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'schedule'
                  ? 'bg-slate-700 text-white'
                  : 'text-white/60 hover:text-white hover:bg-slate-800/50'
              )}
            >
              Schedule
            </button>
            <button
              onClick={() => setViewMode('priority')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'priority'
                  ? 'bg-slate-700 text-white'
                  : 'text-white/60 hover:text-white hover:bg-slate-800/50'
              )}
            >
              Priority
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: compact ? '600px' : '800px' }}>
        {/* Grouped Tasks */}
        {Object.entries(groupedTasks).map(([project, tasks]) => {
          const projectData = projectBalance.find(p => p.name.toUpperCase() === project);
          const isExpanded = expandedProjects.has(project);

          return (
            <div key={project} className="space-y-3">
              {/* Project Header */}
              <button
                onClick={() => toggleProject(project)}
                className="w-full flex items-center justify-between text-left group hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                  <div className={cn('w-2 h-2 rounded-full', tasks[0].projectColor)} />
                  <span className="text-sm font-medium text-white">{project}</span>
                  <span className="text-sm text-white/40">{tasks.length} tasks</span>
                </div>
                {projectData && (
                  <span className="text-sm text-white/60">{projectData.percentage}% momentum</span>
                )}
              </button>

              {/* Tasks */}
              {isExpanded && tasks.map(task => {
                const StatusIcon = statusConfig[task.status].icon;
                const isTaskExpanded = expandedTasks.has(task.id);

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'rounded-xl border transition-all duration-200',
                      isTaskExpanded
                        ? 'bg-slate-800/60 border-purple-500/40'
                        : 'bg-slate-900/40 border-white/10 hover:border-white/20'
                    )}
                  >
                    {/* Task Header */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-1.5 h-1.5 rounded-full', task.projectColor)} />
                            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{task.project}</span>
                            <span className="text-xs text-white/40">{task.timeEstimate}</span>
                          </div>
                          <h3 className="text-base font-semibold text-white leading-tight">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-white/60">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
                              statusConfig[task.status].color
                            )}>
                              <StatusIcon size={12} />
                              {statusConfig[task.status].label}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          size={20}
                          className={cn(
                            'text-white/40 transition-transform duration-200 flex-shrink-0',
                            isTaskExpanded && 'rotate-180'
                          )}
                        />
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isTaskExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-white/10">
                        {task.aiDraft && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                              <FileText size={16} />
                              AI-Generated Draft
                            </div>
                            <pre className="p-4 bg-slate-950/60 rounded-lg text-xs text-white/80 overflow-x-auto border border-white/5">
                              <code>{task.aiDraft}</code>
                            </pre>
                          </div>
                        )}

                        {task.researchNotes && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                              <Sparkles size={16} />
                              Research Notes
                            </div>
                            <ul className="space-y-2 text-sm text-white/70">
                              {task.researchNotes.map((note, idx) => (
                                <li key={idx} className="flex gap-2">
                                  <span className="text-white/40">•</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {task.executionSteps && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
                              <CheckCircle2 size={16} />
                              Execution Steps
                            </div>
                            <ol className="space-y-2 text-sm text-white/70">
                              {task.executionSteps.map((step, idx) => (
                                <li key={idx} className="flex gap-3">
                                  <span className="text-white/40 font-medium">{idx + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* End of Day Milestones */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Clock size={16} />
            END-OF-DAY MILESTONES
          </div>
          <ul className="space-y-2">
            {mockMilestones.map((milestone, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5', `bg-${milestone.project}-500`)} />
                <span>{milestone.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cross-Project Balance */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              CROSS-PROJECT BALANCE
            </div>
            <span className="text-sm font-semibold text-white">65%</span>
          </div>

          {/* Progress Bar */}
          <div className="flex h-2 rounded-full overflow-hidden">
            {projectBalance.map((project, idx) => (
              <div
                key={idx}
                className={project.color}
                style={{ width: `${project.percentage}%` }}
              />
            ))}
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-3 gap-3">
            {projectBalance.map((project, idx) => (
              <div key={idx} className="p-3 bg-slate-800/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn('w-2 h-2 rounded-full', project.color)} />
                  <span className="text-xs font-medium text-white">{project.name}</span>
                </div>
                <div className="text-2xl font-bold text-white">{project.percentage}<span className="text-sm text-white/40">%</span></div>
                <div className={cn(
                  'text-xs font-medium',
                  project.momentum === 'Strong' ? 'text-green-400' :
                  project.momentum === 'Moderate' ? 'text-blue-400' :
                  'text-orange-400'
                )}>
                  {project.momentum}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
