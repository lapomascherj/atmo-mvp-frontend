import React, { useState } from 'react';
import { ChevronDown, ChevronRight, List, Grid as GridIcon, Clock, Sparkles, FileText, CheckCircle2, AlertCircle, Menu, Edit3, Trash2, X } from 'lucide-react';
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
  priorityOnly?: boolean; // For main dashboard
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
    aiDraft: `// Authentication flow using NextAuth.js
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  ]
})`,
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
    timeEstimate: '-2 hrs',
    aiDraft: `// AI Context API Integration
const generateContext = async (taskData) => {
  const response = await fetch('/api/ai/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: taskData.title,
      project: taskData.project,
      history: taskData.previousTasks
    })
  });

  return await response.json();
};`,
    researchNotes: [
      'GPT-4 provides best context understanding for complex tasks',
      'Token optimization reduces API costs by 60%',
      'Context window of 8K tokens sufficient for most workflows'
    ],
    executionSteps: [
      'Set up OpenAI API credentials and endpoints',
      'Build context prompt template system',
      'Implement caching layer for repeated queries',
      'Add fallback handling for API rate limits'
    ]
  },
  {
    id: '3',
    project: 'INSTAGRAM',
    projectColor: 'bg-orange-500',
    title: 'Complete payment integration prototype',
    description: 'Critical blocker for beta launch timeline',
    status: 'critical_path',
    timeEstimate: '-3 hrs',
    aiDraft: `// Stripe Payment Integration
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(amount) {
  return await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: 'usd',
    payment_method_types: ['card']
  });
}`,
    researchNotes: [
      'Stripe Connect enables marketplace payments for creators',
      'Platform fee structure: 2.9% + 30¢ per transaction',
      'Payout schedule: T+7 days for new accounts'
    ],
    executionSteps: [
      'Configure Stripe Connect account and webhooks',
      'Build payment flow UI with error handling',
      'Implement subscription management system',
      'Test with staging environment and test cards'
    ]
  },
  {
    id: '4',
    project: 'SOLE',
    projectColor: 'bg-purple-500',
    title: 'Write launch announcement',
    description: '',
    status: 'draft_prepared',
    timeEstimate: '~30 min',
    aiDraft: `🚀 Introducing SOLE - Your AI-Powered Productivity Partner

We're excited to announce SOLE, a revolutionary platform that transforms how you manage your work and life. With intelligent task prioritization and seamless integrations, SOLE helps you focus on what matters most.

Key Features:
- Smart task management with AI-powered suggestions
- Real-time collaboration with your team
- Deep integrations with your favorite tools

Join our beta today: sole.app/beta`,
    researchNotes: [
      'Launch timing: Tuesday 9 AM PST shows highest engagement',
      'Product Hunt launch requires 3-month preparation',
      'Early access creates 40% higher retention vs. open launch'
    ],
    executionSteps: [
      'Finalize launch copy and social media assets',
      'Schedule Product Hunt hunter and supporters',
      'Prepare launch day monitoring dashboard',
      'Set up automated email sequences for signups'
    ]
  },
  {
    id: '5',
    project: 'INSTAGRAM',
    projectColor: 'bg-orange-500',
    title: 'Design creator onboarding flow',
    description: '',
    status: 'context_ready',
    timeEstimate: '~90 min',
    researchNotes: [
      'Multi-step onboarding increases completion by 25%',
      'Profile customization in first session drives engagement',
      'Sample content library reduces time-to-first-post by 50%'
    ],
    executionSteps: [
      'Design 5-step onboarding wizard with progress bar',
      'Create sample content templates for creators',
      'Build profile setup with image upload',
      'Add skip option with comeback incentives'
    ]
  },
  {
    id: '6',
    project: 'ATMO',
    projectColor: 'bg-blue-500',
    title: 'Add cross-project momentum visualization',
    description: '',
    status: 'context_ready',
    timeEstimate: '~1 hr',
    researchNotes: [
      'Visual momentum indicators increase project completion by 30%',
      'D3.js provides best performance for real-time visualizations',
      'Color psychology: green signals progress, red signals attention needed'
    ],
    executionSteps: [
      'Design momentum chart with project breakdown',
      'Implement D3.js force-directed graph',
      'Add real-time updates via WebSocket',
      'Create interactive hover states and tooltips'
    ]
  }
];

const laterTasks = [
  { id: 'l1', project: 'ATMO', projectColor: 'bg-blue-500', title: 'Implement drag-and-drop task reordering' },
  { id: 'l2', project: 'SOLE', projectColor: 'bg-purple-500', title: 'Add collaborative editing features' },
  { id: 'l3', project: 'INSTAGRAM', projectColor: 'bg-orange-500', title: 'Build analytics dashboard for creators' },
  { id: 'l4', project: 'ATMO', projectColor: 'bg-blue-500', title: 'Set up monitoring and alerting' }
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

export const PriorityStreamEnhanced: React.FC<PriorityStreamProps> = ({
  compact = false,
  className,
  priorityOnly = false
}) => {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [viewMode, setViewMode] = useState<'schedule' | 'priority'>('schedule');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['SOLE', 'ATMO', 'INSTAGRAM']));
  const [showLaterTasks, setShowLaterTasks] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

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

  // Priority mode shows all tasks ungrouped
  const displayTasks = viewMode === 'priority' || priorityOnly ? mockTasks : null;

  const handleEdit = (taskId: string) => {
    const task = mockTasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTaskForEdit(taskId);
      setEditingTitle(task.title);
      setEditingDescription(task.description);
      setShowEditModal(true);
    }
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      console.log('Deleting task:', taskId);
      // TODO: Implement actual delete logic with PocketBase
    }
  };

  const handleSaveEdit = () => {
    console.log('Saving task edit:', { id: selectedTaskForEdit, title: editingTitle, description: editingDescription });
    // TODO: Implement actual save logic with PocketBase
    setShowEditModal(false);
    setSelectedTaskForEdit(null);
  };

  // Close modal on Esc key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditModal) {
        setShowEditModal(false);
      }
    };

    if (showEditModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showEditModal]);

  return (
    <div className={cn('relative flex flex-col bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {priorityOnly ? (
              <div className="flex items-center gap-2">
                <Menu size={20} className="text-white/60" />
                Priority Stream
              </div>
            ) : (
              'Priority Stream'
            )}
          </h2>
          <p className="text-sm text-white/60">Thu, Oct 2 — 14 tasks</p>
        </div>

        {!priorityOnly && (
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
                <GridIcon size={18} />
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
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: compact ? '600px' : '800px' }}>

        {/* Priority Mode - All Tasks */}
        {(viewMode === 'priority' || priorityOnly) && displayTasks && (
          <div className="space-y-3">
            {displayTasks.map(task => {
              const StatusIcon = statusConfig[task.status].icon;
              const isTaskExpanded = expandedTasks.has(task.id);

              return (
                <div
                  key={task.id}
                  className={cn(
                    'rounded-xl border transition-all duration-200',
                    task.status === 'launch_blocker' ? 'border-red-500/40 bg-slate-800/60' :
                    task.status === 'critical_path' ? 'border-orange-500/40 bg-slate-800/60' :
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
                    <div className="px-4 pb-4 space-y-4 border-t border-white/10 mt-2 pt-4">
                      {task.aiDraft && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                            <FileText size={16} />
                            AI-Generated Draft
                          </div>
                          <pre className="p-4 bg-slate-950/60 rounded-lg text-xs text-white/80 overflow-x-auto border border-white/5 font-mono">
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

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        {!priorityOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(task.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Edit3 size={14} />
                            Edit Task
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule Mode - Grouped by Project */}
        {viewMode === 'schedule' && !priorityOnly && view === 'list' && (
          <>
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
                          task.status === 'launch_blocker' ? 'border-red-500/40 bg-slate-800/60' :
                          task.status === 'critical_path' ? 'border-orange-500/40 bg-slate-800/60' :
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
                          <div className="px-4 pb-4 space-y-4 border-t border-white/10 mt-2 pt-4">
                            {task.aiDraft && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                                  <FileText size={16} />
                                  AI-Generated Draft
                                </div>
                                <pre className="p-4 bg-slate-950/60 rounded-lg text-xs text-white/80 overflow-x-auto border border-white/5 font-mono">
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

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2 border-t border-white/5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(task.id);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Edit3 size={14} />
                                Edit Task
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(task.id);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Later Tasks Section */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => setShowLaterTasks(!showLaterTasks)}
                className="w-full flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors mb-3"
              >
                {showLaterTasks ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Later Tasks ({laterTasks.length})
              </button>

              {showLaterTasks && (
                <div className="space-y-2 pl-6">
                  {laterTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 text-sm text-white/70">
                      <div className={cn('w-1.5 h-1.5 rounded-full', task.projectColor)} />
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Grid View Mode */}
        {viewMode === 'schedule' && !priorityOnly && view === 'grid' && (
          <div className="grid grid-cols-2 gap-3">
            {mockTasks.map(task => {
              const StatusIcon = statusConfig[task.status].icon;

              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-200 text-left',
                    task.status === 'launch_blocker' ? 'border-red-500/40 bg-slate-800/60' :
                    task.status === 'critical_path' ? 'border-orange-500/40 bg-slate-800/60' :
                    'bg-slate-900/40 border-white/10 hover:border-white/20'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-1.5 h-1.5 rounded-full', task.projectColor)} />
                      <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{task.project}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-white/60 line-clamp-2">{task.description}</p>
                    )}
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
                      statusConfig[task.status].color
                    )}>
                      <StatusIcon size={10} />
                      {statusConfig[task.status].label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

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

        {/* Cross-Project Balance - Collapsible */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="w-full flex items-center justify-between mb-3 group"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              CROSS-PROJECT BALANCE
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">65%</span>
              <ChevronDown
                size={16}
                className={cn(
                  'text-white/60 transition-transform duration-200',
                  !showBalance && '-rotate-90'
                )}
              />
            </div>
          </button>

          {showBalance && (
            <>
              {/* Progress Bar */}
              <div className="flex h-2 rounded-full overflow-hidden mb-3">
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
            </>
          )}
        </div>
      </div>

      {/* Edit Task Panel - In-Card Editor */}
      {showEditModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md rounded-2xl"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-xs bg-slate-900/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Editor Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-slate-900/60">
              <div>
                <h3 className="text-sm font-semibold text-white">Edit Task</h3>
                <p className="text-xs text-white/60 mt-0.5">Update task details</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
                aria-label="Close editor"
              >
                <X size={14} className="text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Editor Form */}
            <div className="px-3 py-3 space-y-2.5 max-h-56 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="Enter task title"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/80 uppercase tracking-wider">Description</label>
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all"
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
            </div>

            {/* Editor Actions */}
            <div className="flex gap-2 px-3 py-2.5 bg-slate-950/60 border-t border-white/10">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/90 hover:text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-3 py-1.5 text-xs bg-[#CC5500] hover:bg-[#CC5500]/90 text-white rounded-lg transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
