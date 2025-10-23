import React, { useRef, useEffect, useState } from 'react';
import { X, Target, TrendingUp, Award, AlertCircle, Edit3, Check, Sparkles, User, Briefcase, Circle } from 'lucide-react';
import type { Project } from '@/models/Project';
import type { Goal } from '@/models/Goal';
import { generateProfessionalDescription } from '@/utils/professionalDescriptionGenerator';
import {
  extractCoreAmbitions,
  calculatePersonalStats,
  extractRecentAchievements,
  extractCurrentChallenges,
  formatDate,
  formatDeadline,
  type CoreAmbition,
  type PersonalStats,
  type Achievement,
  type Challenge,
} from '@/utils/personalSnapshotAnalyzer';
import { supabase } from '@/lib/supabase';

interface PersonalSnapshotOverlayProps {
  user: any;
  projects: Project[];
  allGoals: Array<Goal & { projectName?: string }>;
  focusAreas: string[];
  userLevel: number;
  onClose: () => void;
}

export const PersonalSnapshotOverlay: React.FC<PersonalSnapshotOverlayProps> = ({
  user,
  projects,
  allGoals,
  focusAreas,
  userLevel,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [personalNotes, setPersonalNotes] = useState<string>(
    user?.onboarding_data?.personal?.notes || ''
  );
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Debug: Log projects received
  useEffect(() => {
    console.log('📋 [PersonalSnapshotOverlay] Received projects:', {
      count: projects.length,
      projects: projects.map(p => ({ name: p.name, id: p.id, status: p.status, active: p.active }))
    });
  }, [projects]);

  // Analyze data
  const ambitions: CoreAmbition[] = extractCoreAmbitions(
    user?.onboarding_data,
    allGoals,
    projects
  );
  const stats: PersonalStats = calculatePersonalStats(
    projects,
    allGoals,
    focusAreas,
    userLevel
  );
  const achievements: Achievement[] = extractRecentAchievements(allGoals);
  const challenges: Challenge[] = extractCurrentChallenges(allGoals, projects);

  // Professional description
  const professionalDescription = generateProfessionalDescription(user?.onboarding_data);

  // Handle ESC key and outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
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

  // Save personal notes to database
  const handleSaveNotes = async () => {
    if (!user?.id) return;

    setIsSavingNotes(true);
    try {
      const updatedOnboardingData = {
        ...user.onboarding_data,
        personal: {
          ...(user.onboarding_data?.personal || {}),
          notes: personalNotes,
        },
      };

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_data: updatedOnboardingData })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save personal notes:', error);
      } else {
        setEditingNotes(false);
      }
    } catch (error) {
      console.error('Error saving personal notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: Challenge['urgency']) => {
    switch (urgency) {
      case 'overdue':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'urgent':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'upcoming':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    }
  };

  // Get impact color
  const getImpactColor = (impact: Achievement['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-green-400';
      case 'medium':
        return 'text-blue-400';
      default:
        return 'text-purple-400';
    }
  };

  // Get activity level badge color
  const getActivityLevelColor = (level: PersonalStats['activityLevel']) => {
    switch (level) {
      case 'expert':
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/30';
      case 'advanced':
        return 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 border-blue-400/30';
      case 'intermediate':
        return 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-200 border-green-400/30';
      default:
        return 'bg-gradient-to-r from-gray-500/20 to-gray-500/20 text-gray-200 border-gray-400/30';
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
    >
      {/* Main content container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
        {/* Purple accent border (left side) */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600"></div>

        {/* Gradient glow background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-purple-500/10 rounded-2xl blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative px-8 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {user?.nickname?.charAt(0)?.toUpperCase() || user?.preferredName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user?.nickname || user?.preferredName || 'Personal Snapshot'}
              </h2>
              <p className="text-xs text-white/60">Your professional journey at a glance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white/70" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="relative overflow-y-auto max-h-[calc(90vh-88px)] px-8 py-6">
          <div className="space-y-6">
            {/* Hero Section - Professional Description */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles size={20} className="text-purple-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-purple-200 mb-2">Professional Profile</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{professionalDescription}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{stats.activeProjects}</div>
                <div className="text-xs text-white/60">Active Projects</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{stats.completedGoals}</div>
                <div className="text-xs text-white/60">Completed Goals</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-2xl font-bold text-white">Level {stats.userLevel}</div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getActivityLevelColor(stats.activityLevel)}`}>
                    {stats.activityLevel}
                  </div>
                </div>
                <div className="text-xs text-white/60">Current Level</div>
              </div>
            </div>

            {/* My Active Projects */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">My Active Projects</h3>
                <span className="text-xs text-white/50">({projects.length})</span>
              </div>

              {projects.length === 0 ? (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10 text-center">
                  <Briefcase size={32} className="text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/60">No active projects yet</p>
                  <p className="text-xs text-white/40 mt-1">Start by chatting with ATMO: "create a project for..."</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {projects.map((project) => {
                    const goalsCount = project.goals?.length || 0;
                    const completedGoalsCount = project.goals?.filter(g =>
                      g.status === 'Completed' || g.status === 'completed'
                    ).length || 0;
                    const progressPercentage = project.progress ||
                      (goalsCount > 0 ? Math.round((completedGoalsCount / goalsCount) * 100) : 0);

                    return (
                      <div
                        key={project.id}
                        className="group bg-gradient-to-br from-white/5 to-white/3 rounded-lg p-4 border border-white/10 hover:border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                      >
                        <div className="flex items-start gap-3">
                          {/* Color indicator */}
                          <div
                            className="w-1 h-16 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          />

                          <div className="flex-1 min-w-0">
                            {/* Project name and status */}
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate pr-2">
                                {project.name}
                              </h4>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                project.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                project.status === 'on-hold' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {project.status || 'active'}
                              </span>
                            </div>

                            {/* Description */}
                            {project.description && (
                              <p className="text-xs text-white/60 mb-3 line-clamp-2 leading-relaxed">
                                {project.description}
                              </p>
                            )}

                            {/* Progress bar */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-white/50">Progress</span>
                                <span className="text-[10px] text-white/50">{progressPercentage}%</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Meta info */}
                            <div className="flex items-center gap-3 text-[10px] text-white/50">
                              <div className="flex items-center gap-1">
                                <Target size={10} />
                                <span>{goalsCount} {goalsCount === 1 ? 'goal' : 'goals'}</span>
                              </div>
                              {project.priority && (
                                <div className="flex items-center gap-1">
                                  <Circle size={10} className={
                                    project.priority === 'high' ? 'fill-red-400 text-red-400' :
                                    project.priority === 'medium' ? 'fill-yellow-400 text-yellow-400' :
                                    'fill-blue-400 text-blue-400'
                                  } />
                                  <span className="capitalize">{project.priority}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Core Ambitions */}
            {ambitions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target size={18} className="text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Core Ambitions</h3>
                </div>
                <div className="space-y-3">
                  {ambitions.map((ambition, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{ambition.title}</h4>
                        <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                          {ambition.source === 'northStar' ? 'North Star' : ambition.source === 'highPriorityGoal' ? 'Goal' : 'Project'}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">{ambition.description}</p>
                      {ambition.relatedProjects && ambition.relatedProjects.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ambition.relatedProjects.map((project, i) => (
                            <span key={i} className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                              {project}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Professional Focus Areas */}
            {stats.focusAreas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Professional Focus</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.focusAreas.map((area, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-500/15 to-purple-600/10 text-purple-100 text-xs font-medium rounded-full border border-purple-400/20"
                    >
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Achievements */}
            {achievements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Award size={18} className="text-green-400" />
                  <h3 className="text-sm font-semibold text-white">Recent Achievements</h3>
                </div>
                <div className="space-y-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-green-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-white">{achievement.title}</h4>
                        <Award size={14} className={getImpactColor(achievement.impact)} />
                      </div>
                      {achievement.projectName && (
                        <div className="text-[10px] text-blue-300 mb-1">{achievement.projectName}</div>
                      )}
                      <div className="text-xs text-white/60">{formatDate(achievement.completedDate)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Challenges */}
            {challenges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={18} className="text-orange-400" />
                  <h3 className="text-sm font-semibold text-white">Current Challenges</h3>
                </div>
                <div className="space-y-2">
                  {challenges.slice(0, 5).map((challenge) => (
                    <div
                      key={challenge.id}
                      className={`rounded-lg p-3 border ${getUrgencyColor(challenge.urgency)}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-white">{challenge.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                          {challenge.priority}
                        </span>
                      </div>
                      {challenge.projectName && (
                        <div className="text-[10px] text-white/60 mb-1">{challenge.projectName}</div>
                      )}
                      {challenge.deadline && (
                        <div className="text-xs text-white/70">{formatDeadline(challenge.deadline)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Notes - Editable */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Personal Notes</h3>
                </div>
                {!editingNotes ? (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 size={12} />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="text-xs text-green-300 hover:text-green-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Check size={12} />
                    {isSavingNotes ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
              {editingNotes ? (
                <textarea
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder="Add personal reflections, goals, or notes..."
                  className="w-full h-32 bg-white/5 border border-purple-500/20 rounded-lg p-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500/40 resize-none"
                />
              ) : (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[80px]">
                  {personalNotes ? (
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{personalNotes}</p>
                  ) : (
                    <p className="text-sm text-white/40 italic">No personal notes yet. Click Edit to add some.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
