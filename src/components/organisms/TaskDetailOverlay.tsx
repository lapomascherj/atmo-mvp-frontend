import React, { useState, useRef, useEffect } from 'react';
import { X, Edit3, Trash2, Check, Clock, Target, Zap } from 'lucide-react';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { Priority } from '@/models/Priority';
import { Checkbox } from '@/components/atoms/Checkbox';

interface TaskDetailOverlayProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: Priority;
    project?: string;
    projectId?: string;
    goal?: string;
    projectColor?: string;
    completed: boolean;
    time?: string;
    estimated_time?: number;
    created_at?: string;
    updated_at?: string;
    rollover_count?: number;
  };
  projectDetails?: {
    items?: Array<{ id: string; name: string; content?: string }>;
    milestones?: Array<{ id: string; name: string; due_date?: string; status?: string }>;
  };
  siblingTasks?: Array<{ id: string; title: string }>;
  onClose: () => void;
}

export const TaskDetailOverlay: React.FC<TaskDetailOverlayProps> = ({
  task,
  projectDetails,
  siblingTasks = [],
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateTask = usePersonasStore((state) => state.updateTask);
  const removeTask = usePersonasStore((state) => state.removeTask);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEditing, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSaveDescription = async () => {
    if (editedDescription !== task.description) {
      await updateTask(null, task.id, { description: editedDescription });
    }
    setIsEditing(false);
  };

  const handleToggleCompletion = async () => {
    await updateTask(null, task.id, { completed: !task.completed });
  };

  const handleDelete = async () => {
    if (confirm(`Delete task "${task.title}"?`)) {
      await removeTask(null, task.id);
      onClose();
    }
  };

  const priorityTheme: Record<Priority, { label: string; bgColor: string; textColor: string }> = {
    [Priority.High]: {
      label: 'High Priority',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-300',
    },
    [Priority.Medium]: {
      label: 'Medium Priority',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-200',
    },
    [Priority.Low]: {
      label: 'Low Priority',
      bgColor: 'bg-sky-500/10',
      textColor: 'text-sky-200',
    },
  };

  const lastUpdatedTimestamp = task.updated_at ?? task.created_at;
  const lastUpdatedLabel = lastUpdatedTimestamp
    ? new Date(lastUpdatedTimestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const knowledgeHighlights = (projectDetails?.items ?? [])
    .filter((item) => item?.name)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      name: item.name,
      excerpt: item.content
        ? `${item.content.slice(0, 140)}${item.content.length > 140 ? '...' : ''}`
        : '',
    }));

  const milestoneHighlights = (projectDetails?.milestones ?? [])
    .filter((milestone) => milestone.due_date && milestone.status !== 'deleted')
    .sort((a, b) => {
      const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
      const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
      return aDate - bDate;
    })
    .slice(0, 2);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div
        ref={overlayRef}
        className="bg-slate-900 rounded-2xl border-2 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          borderColor: task.projectColor || '#3b82f6',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.projectColor || '#3b82f6' }}
              />
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                {task.project || 'Uncategorized'}
              </span>
              {task.goal && (
                <>
                  <span className="text-white/30">›</span>
                  <span className="text-xs text-white/60">{task.goal}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{task.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityTheme[task.priority].bgColor} ${priorityTheme[task.priority].textColor}`}
              >
                {priorityTheme[task.priority].label}
              </span>
              {task.time && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70 flex items-center gap-1">
                  <Clock size={12} />
                  {task.time}
                </span>
              )}
              {typeof task.rollover_count === 'number' && task.rollover_count > 0 && (
                <span className="px-3 py-1 rounded-full text-xs bg-orange-500/10 text-orange-300">
                  Rolled {task.rollover_count}x
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Target size={14} />
                Task Details
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Edit3 size={14} className="text-white/60" />
                </button>
              )}
            </div>
            {isEditing ? (
              <div>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Describe what needs to happen and what success looks like..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 resize-none"
                  rows={6}
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveDescription}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedDescription(task.description || '');
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-sm text-white/70 whitespace-pre-line">
                  {task.description?.trim() ||
                    'No description yet. Click the edit button to add details about this task.'}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          {lastUpdatedLabel && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Clock size={12} />
              Last updated: {lastUpdatedLabel}
            </div>
          )}

          {/* Knowledge Context */}
          {knowledgeHighlights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <Zap size={14} />
                Related Knowledge
              </h3>
              <div className="space-y-2">
                {knowledgeHighlights.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <h4 className="text-xs font-semibold text-white/90 mb-1">{item.name}</h4>
                    {item.excerpt && (
                      <p className="text-xs text-white/60 line-clamp-2">{item.excerpt}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Milestones */}
          {milestoneHighlights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-3">Upcoming Milestones</h3>
              <div className="space-y-2">
                {milestoneHighlights.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <span className="text-xs text-white/90">{milestone.name}</span>
                    <span className="text-xs text-white/50">
                      {milestone.due_date
                        ? new Date(milestone.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No date'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Tasks */}
          {siblingTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-3">Related Tasks</h3>
              <div className="space-y-2">
                {siblingTasks.map((sibling) => (
                  <div
                    key={sibling.id}
                    className="bg-white/5 rounded-lg p-3 border border-white/10"
                  >
                    <span className="text-xs text-white/90">{sibling.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleToggleCompletion}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                task.completed
                  ? 'bg-white/5 hover:bg-white/10 text-white/60'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
              }`}
            >
              <Check size={16} />
              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
