import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Check, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Project } from '@/models/Project';
import type { Goal } from '@/models/Goal';
import { usePersonasStore } from '@/stores/usePersonasStore';
import {
  categorizeGoalsByTimeHorizon,
  TimeHorizon,
  TIME_HORIZON_LABELS,
  type GoalsByTimeHorizon,
} from '@/utils/timeHorizonCalculator';

interface ProjectDetailOverlayProps {
  project: Project;
  onClose: () => void;
}

export const ProjectDetailOverlay: React.FC<ProjectDetailOverlayProps> = ({ project, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle Esc key and outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  // Edit states for project fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description || '');
  const [editStatus, setEditStatus] = useState(project.status || 'active');
  const [editColor, setEditColor] = useState(project.color || '#a855f7');
  const [editStartDate, setEditStartDate] = useState(project.startDate || '');
  const [editTargetDate, setEditTargetDate] = useState(project.targetDate || '');

  // Goal states
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Time horizon collapsed state
  const [collapsedHorizons, setCollapsedHorizons] = useState<Set<TimeHorizon>>(new Set());

  // Store actions
  const updateProject = usePersonasStore(state => state.updateProject);
  const updateGoal = usePersonasStore(state => state.updateGoal);
  const removeGoal = usePersonasStore(state => state.removeGoal);
  const addGoal = usePersonasStore(state => state.addGoal);
  const removeProject = usePersonasStore(state => state.removeProject);

  const handleSaveField = async (field: string) => {
    const updates: Partial<Project> = {};

    switch (field) {
      case 'name':
        if (editName.trim()) updates.name = editName.trim();
        break;
      case 'description':
        updates.description = editDescription;
        break;
      case 'status':
        updates.status = editStatus as any;
        break;
      case 'color':
        updates.color = editColor;
        break;
      case 'startDate':
        updates.startDate = editStartDate;
        break;
      case 'targetDate':
        updates.targetDate = editTargetDate;
        break;
    }

    if (Object.keys(updates).length > 0) {
      await updateProject(null, project.id, updates);
    }
    setEditingField(null);
  };

  const handleCreateGoal = async () => {
    if (!newGoalName.trim()) return;

    const newGoal: Partial<Goal> = {
      id: crypto.randomUUID(),
      name: newGoalName.trim(),
      description: newGoalDescription,
      targetDate: newGoalTargetDate,
      status: 'Planned' as any,
      priority: 'Medium' as any,
      order: (project.goals?.length || 0) + 1,
      tasks: []
    };

    await addGoal(null, project.id, newGoal as Goal);
    setCreatingGoal(false);
    setNewGoalName('');
    setNewGoalDescription('');
    setNewGoalTargetDate('');
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Delete this goal?')) {
      await removeGoal(null, goalId);
    }
  };

  const handleToggleGoalStatus = async (goal: Goal) => {
    const newStatus = goal.status === 'Completed' ? 'In Progress' : 'Completed';
    await updateGoal(null, goal.id, { status: newStatus as any });
  };

  const activeGoals = (project.goals || []).filter(g => g.status !== 'deleted' && g.status !== 'Completed');

  // Categorize goals by time horizon
  const goalsByHorizon: GoalsByTimeHorizon = categorizeGoalsByTimeHorizon(activeGoals);

  // Toggle horizon collapse
  const toggleHorizon = (horizon: TimeHorizon) => {
    const newCollapsed = new Set(collapsedHorizons);
    if (newCollapsed.has(horizon)) {
      newCollapsed.delete(horizon);
    } else {
      newCollapsed.add(horizon);
    }
    setCollapsedHorizons(newCollapsed);
  };

  return (
    <div ref={overlayRef} className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 p-4 overflow-y-auto rounded-2xl">
      {/* Header with Delete Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {editingField === 'name' ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-white/10 text-white text-lg font-semibold rounded px-2 py-1 border border-purple-500/20 focus:outline-none focus:border-purple-500/40"
                autoFocus
              />
              <button onClick={() => handleSaveField('name')} className="text-green-400 hover:text-green-300">
                <Check size={18} />
              </button>
              <button onClick={() => setEditingField(null)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              <button onClick={() => setEditingField('name')} className="text-white/40 hover:text-white/60">
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Delete button - right-aligned */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-md text-xs text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors ml-4"
        >
          Delete Project
        </button>
      </div>

      {/* Theme Color Swatches */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-purple-400 font-medium">Color</span>
          <div className="flex gap-2">
            {[
              { color: '#a855f7', name: 'Purple' },
              { color: '#3b82f6', name: 'Blue' },
              { color: '#10b981', name: 'Green' },
              { color: '#f59e0b', name: 'Orange' },
              { color: '#ef4444', name: 'Red' }
            ].map((swatch) => (
              <button
                key={swatch.color}
                onClick={async () => {
                  setEditColor(swatch.color);
                  await updateProject(null, project.id, { color: swatch.color });
                }}
                className={`w-6 h-6 rounded-md border-2 transition-all ${
                  editColor === swatch.color
                    ? 'border-white scale-110'
                    : 'border-white/20 hover:border-white/40 hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.color }}
                title={swatch.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-purple-400 font-medium">Description</span>
          {editingField !== 'description' && (
            <button onClick={() => setEditingField('description')} className="text-white/40 hover:text-white/60">
              <Edit3 size={12} />
            </button>
          )}
        </div>
        {editingField === 'description' ? (
          <div className="space-y-2">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-white/10 text-white text-sm rounded px-3 py-2 border border-purple-500/20 focus:outline-none focus:border-purple-500/40 min-h-[80px]"
              placeholder="Project description..."
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => handleSaveField('description')} className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30">
                Save
              </button>
              <button onClick={() => setEditingField(null)} className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded hover:bg-white/20">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/60">
            {project.description || 'No description provided'}
          </p>
        )}
      </div>

      {/* Status, Dates Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Status */}
        <div className="bg-white/5 rounded-lg p-3 border border-purple-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-purple-400 font-medium">Status</span>
            {editingField !== 'status' && (
              <button onClick={() => setEditingField('status')} className="text-white/40 hover:text-white/60">
                <Edit3 size={12} />
              </button>
            )}
          </div>
          {editingField === 'status' ? (
            <select
              value={editStatus}
              onChange={(e) => {
                setEditStatus(e.target.value);
                handleSaveField('status');
              }}
              className="w-full bg-white/10 text-white text-sm rounded px-2 py-1 border border-purple-500/20 focus:outline-none capitalize"
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          ) : (
            <p className="text-sm text-white font-medium capitalize">
              {project.status || 'active'}
            </p>
          )}
        </div>

        {/* Start Date */}
        <div className="bg-white/5 rounded-lg p-3 border border-purple-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-purple-400 font-medium">Start Date</span>
            {editingField !== 'startDate' && (
              <button onClick={() => setEditingField('startDate')} className="text-white/40 hover:text-white/60">
                <Edit3 size={12} />
              </button>
            )}
          </div>
          {editingField === 'startDate' ? (
            <input
              type="date"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
              onBlur={() => handleSaveField('startDate')}
              className="w-full bg-white/10 text-white text-sm rounded px-2 py-1 border border-purple-500/20 focus:outline-none"
              autoFocus
            />
          ) : (
            <p className="text-sm text-white font-medium">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
            </p>
          )}
        </div>

        {/* Target Date */}
        <div className="bg-white/5 rounded-lg p-3 border border-purple-500/20 col-span-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-purple-400 font-medium">Target Date</span>
            {editingField !== 'targetDate' && (
              <button onClick={() => setEditingField('targetDate')} className="text-white/40 hover:text-white/60">
                <Edit3 size={12} />
              </button>
            )}
          </div>
          {editingField === 'targetDate' ? (
            <input
              type="date"
              value={editTargetDate}
              onChange={(e) => setEditTargetDate(e.target.value)}
              onBlur={() => handleSaveField('targetDate')}
              className="w-full bg-white/10 text-white text-sm rounded px-2 py-1 border border-purple-500/20 focus:outline-none"
              autoFocus
            />
          ) : (
            <p className="text-sm text-white font-medium">
              {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : 'Not set'}
            </p>
          )}
        </div>
      </div>

      {/* Goals Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-purple-400">Goals ({activeGoals.length})</h4>
          <button
            onClick={() => setCreatingGoal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded hover:bg-purple-500/30 transition-colors"
          >
            <Plus size={12} />
            Add Goal
          </button>
        </div>

        {/* Create New Goal Form */}
        {creatingGoal && (
          <div className="bg-white/5 rounded-lg p-3 border border-purple-500/20 mb-2 space-y-2">
            <input
              type="text"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="Goal name..."
              className="w-full bg-white/10 text-white text-sm rounded px-2 py-1 border border-purple-500/20 focus:outline-none focus:border-purple-500/40"
              autoFocus
            />
            <textarea
              value={newGoalDescription}
              onChange={(e) => setNewGoalDescription(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full bg-white/10 text-white text-sm rounded px-2 py-1 border border-purple-500/20 focus:outline-none focus:border-purple-500/40 min-h-[60px]"
            />
            <input
              type="date"
              value={newGoalTargetDate}
              onChange={(e) => setNewGoalTargetDate(e.target.value)}
              className="w-full bg-white/10 text-white text-sm rounded px-2 py-1 border border-purple-500/20 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGoal}
                className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setCreatingGoal(false);
                  setNewGoalName('');
                  setNewGoalDescription('');
                  setNewGoalTargetDate('');
                }}
                className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Goals by Time Horizon */}
        <div className="space-y-3">
          {activeGoals.length === 0 && !creatingGoal ? (
            <p className="text-xs text-white/40 bg-white/5 rounded-lg p-3 text-center">
              Finish setting up in Avatar.
            </p>
          ) : (
            <>
              {/* Short-term Goals */}
              {goalsByHorizon[TimeHorizon.ShortTerm].length > 0 && (
                <div>
                  <button
                    onClick={() => toggleHorizon(TimeHorizon.ShortTerm)}
                    className="w-full flex items-center justify-between mb-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TIME_HORIZON_LABELS[TimeHorizon.ShortTerm].emoji}</span>
                      <span className="text-sm font-medium text-white">
                        {TIME_HORIZON_LABELS[TimeHorizon.ShortTerm].label}
                      </span>
                      <span className="text-xs text-white/40">
                        ({goalsByHorizon[TimeHorizon.ShortTerm].length})
                      </span>
                    </div>
                    {collapsedHorizons.has(TimeHorizon.ShortTerm) ? (
                      <ChevronDown size={16} className="text-white/60 group-hover:text-white/80" />
                    ) : (
                      <ChevronUp size={16} className="text-white/60 group-hover:text-white/80" />
                    )}
                  </button>
                  {!collapsedHorizons.has(TimeHorizon.ShortTerm) && (
                    <div className="space-y-2 ml-2">
                      {goalsByHorizon[TimeHorizon.ShortTerm].map(goal => (
                        <div
                          key={goal.id}
                          className="bg-white/5 rounded-lg p-3 border border-purple-500/20 transition-colors hover:border-purple-500/30"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color || '#a855f7' }}
                              ></div>
                              <span className="text-sm text-white font-medium">{goal.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleGoalStatus(goal)}
                                className="px-2 py-1 text-xs rounded transition-colors"
                                style={{
                                  backgroundColor: goal.status === 'Completed' ? '#22c55e40' : `${project.color || '#a855f7'}20`,
                                  color: goal.status === 'Completed' ? '#22c55e' : project.color || '#a855f7'
                                }}
                              >
                                {goal.status === 'Completed' ? 'Done' : goal.status || 'Active'}
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {goal.description && (
                            <p className="text-xs text-white/60 mt-1 ml-4">{goal.description}</p>
                          )}
                          {goal.targetDate && (
                            <p className="text-xs mt-2 ml-4" style={{ color: project.color || '#a855f7' }}>
                              Target: {new Date(goal.targetDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Medium-term Goals */}
              {goalsByHorizon[TimeHorizon.MediumTerm].length > 0 && (
                <div>
                  <button
                    onClick={() => toggleHorizon(TimeHorizon.MediumTerm)}
                    className="w-full flex items-center justify-between mb-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TIME_HORIZON_LABELS[TimeHorizon.MediumTerm].emoji}</span>
                      <span className="text-sm font-medium text-white">
                        {TIME_HORIZON_LABELS[TimeHorizon.MediumTerm].label}
                      </span>
                      <span className="text-xs text-white/40">
                        ({goalsByHorizon[TimeHorizon.MediumTerm].length})
                      </span>
                    </div>
                    {collapsedHorizons.has(TimeHorizon.MediumTerm) ? (
                      <ChevronDown size={16} className="text-white/60 group-hover:text-white/80" />
                    ) : (
                      <ChevronUp size={16} className="text-white/60 group-hover:text-white/80" />
                    )}
                  </button>
                  {!collapsedHorizons.has(TimeHorizon.MediumTerm) && (
                    <div className="space-y-2 ml-2">
                      {goalsByHorizon[TimeHorizon.MediumTerm].map(goal => (
                        <div
                          key={goal.id}
                          className="bg-white/5 rounded-lg p-3 border border-blue-500/20 transition-colors hover:border-blue-500/30"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color || '#a855f7' }}
                              ></div>
                              <span className="text-sm text-white font-medium">{goal.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleGoalStatus(goal)}
                                className="px-2 py-1 text-xs rounded transition-colors"
                                style={{
                                  backgroundColor: goal.status === 'Completed' ? '#22c55e40' : `${project.color || '#a855f7'}20`,
                                  color: goal.status === 'Completed' ? '#22c55e' : project.color || '#a855f7'
                                }}
                              >
                                {goal.status === 'Completed' ? 'Done' : goal.status || 'Active'}
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {goal.description && (
                            <p className="text-xs text-white/60 mt-1 ml-4">{goal.description}</p>
                          )}
                          {goal.targetDate && (
                            <p className="text-xs mt-2 ml-4" style={{ color: project.color || '#a855f7' }}>
                              Target: {new Date(goal.targetDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Long-term Goals */}
              {goalsByHorizon[TimeHorizon.LongTerm].length > 0 && (
                <div>
                  <button
                    onClick={() => toggleHorizon(TimeHorizon.LongTerm)}
                    className="w-full flex items-center justify-between mb-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TIME_HORIZON_LABELS[TimeHorizon.LongTerm].emoji}</span>
                      <span className="text-sm font-medium text-white">
                        {TIME_HORIZON_LABELS[TimeHorizon.LongTerm].label}
                      </span>
                      <span className="text-xs text-white/40">
                        ({goalsByHorizon[TimeHorizon.LongTerm].length})
                      </span>
                    </div>
                    {collapsedHorizons.has(TimeHorizon.LongTerm) ? (
                      <ChevronDown size={16} className="text-white/60 group-hover:text-white/80" />
                    ) : (
                      <ChevronUp size={16} className="text-white/60 group-hover:text-white/80" />
                    )}
                  </button>
                  {!collapsedHorizons.has(TimeHorizon.LongTerm) && (
                    <div className="space-y-2 ml-2">
                      {goalsByHorizon[TimeHorizon.LongTerm].map(goal => (
                        <div
                          key={goal.id}
                          className="bg-white/5 rounded-lg p-3 border border-green-500/20 transition-colors hover:border-green-500/30"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color || '#a855f7' }}
                              ></div>
                              <span className="text-sm text-white font-medium">{goal.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleGoalStatus(goal)}
                                className="px-2 py-1 text-xs rounded transition-colors"
                                style={{
                                  backgroundColor: goal.status === 'Completed' ? '#22c55e40' : `${project.color || '#a855f7'}20`,
                                  color: goal.status === 'Completed' ? '#22c55e' : project.color || '#a855f7'
                                }}
                              >
                                {goal.status === 'Completed' ? 'Done' : goal.status || 'Active'}
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {goal.description && (
                            <p className="text-xs text-white/60 mt-1 ml-4">{goal.description}</p>
                          )}
                          {goal.targetDate && (
                            <p className="text-xs mt-2 ml-4" style={{ color: project.color || '#a855f7' }}>
                              Target: {new Date(goal.targetDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No Date Goals */}
              {goalsByHorizon[TimeHorizon.NoDate].length > 0 && (
                <div>
                  <button
                    onClick={() => toggleHorizon(TimeHorizon.NoDate)}
                    className="w-full flex items-center justify-between mb-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TIME_HORIZON_LABELS[TimeHorizon.NoDate].emoji}</span>
                      <span className="text-sm font-medium text-white">
                        {TIME_HORIZON_LABELS[TimeHorizon.NoDate].label}
                      </span>
                      <span className="text-xs text-white/40">
                        ({goalsByHorizon[TimeHorizon.NoDate].length})
                      </span>
                    </div>
                    {collapsedHorizons.has(TimeHorizon.NoDate) ? (
                      <ChevronDown size={16} className="text-white/60 group-hover:text-white/80" />
                    ) : (
                      <ChevronUp size={16} className="text-white/60 group-hover:text-white/80" />
                    )}
                  </button>
                  {!collapsedHorizons.has(TimeHorizon.NoDate) && (
                    <div className="space-y-2 ml-2">
                      {goalsByHorizon[TimeHorizon.NoDate].map(goal => (
                        <div
                          key={goal.id}
                          className="bg-white/5 rounded-lg p-3 border border-gray-500/20 transition-colors hover:border-gray-500/30"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color || '#a855f7' }}
                              ></div>
                              <span className="text-sm text-white font-medium">{goal.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleGoalStatus(goal)}
                                className="px-2 py-1 text-xs rounded transition-colors"
                                style={{
                                  backgroundColor: goal.status === 'Completed' ? '#22c55e40' : `${project.color || '#a855f7'}20`,
                                  color: goal.status === 'Completed' ? '#22c55e' : project.color || '#a855f7'
                                }}
                              >
                                {goal.status === 'Completed' ? 'Done' : goal.status || 'Active'}
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {goal.description && (
                            <p className="text-xs text-white/60 mt-1 ml-4">{goal.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {project.progress !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-purple-400 font-medium">Progress</span>
            <span className="text-xs text-white font-medium">{project.progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${project.progress}%`,
                backgroundColor: project.color || '#a855f7'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog - Inside Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-20 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-xl border border-red-500/30 p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold text-white mb-2">Delete Project</h4>
            <p className="text-sm text-white/70 mb-6">
              Are you sure you want to delete <span className="text-red-400 font-medium">{project.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await removeProject(null, project.id);
                    setShowDeleteConfirm(false);
                    onClose(); // Close detail view and restore focus to list
                  } catch (error) {
                    console.error('Failed to delete project:', error);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-400 border border-red-500/40 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
