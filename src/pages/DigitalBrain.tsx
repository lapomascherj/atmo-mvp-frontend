import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { CardContent, CardHeader } from '@/components/atoms/Card';
import SphereChat from '@/components/atoms/SphereChat';
import { User, BarChart3, Brain, Lightbulb, ChevronUp, TrendingUp, Target, Zap, Star, Radar, Settings, Filter, BookOpen, Plus, Circle, X, Edit3, Trash2 } from 'lucide-react';
import { SchedulerView } from '@/components/scheduler/SchedulerView';
import { useSchedulerSync } from '@/hooks/useSchedulerSync';
import { ObsidianKnowledgeGraph } from '@/components/knowledge/ObsidianKnowledgeGraph';
import { ChatOverlay } from '@/components/organisms/ChatOverlay';
import { PriorityStreamEnhanced } from '@/components/organisms/PriorityStreamEnhanced';
import { ProjectDetailOverlay } from '@/components/organisms/ProjectDetailOverlay';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { useMockAuth } from '@/hooks/useMockAuth';
import { supabase } from '@/lib/supabase';
import { updateUserProfile, toggleGrowthTrackerDismissed, getGrowthTrackerDismissed } from '@/services/supabaseDataService';
import type { Project } from '@/models/Project';

const DigitalBrain: React.FC = () => {
  // CRITICAL: Get user first before any other state that depends on it
  const { user } = useMockAuth();

  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // AI Insights state
  const [insightMode, setInsightMode] = useState<'personal' | 'projects'>('personal');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showJournal, setShowJournal] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'ai', timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingOpportunityIds, setSendingOpportunityIds] = useState<Set<string>>(new Set());
  const [showChatOverlay, setShowChatOverlay] = useState(false);

  // Project detail overlay state
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<Project | null>(null);

  // Editable fields state
  const [editingFocusAreas, setEditingFocusAreas] = useState(false);
  // FIXED: Initialize as empty string, will be populated by useEffect
  const [focusAreasInput, setFocusAreasInput] = useState('');
  const [editingGrowthTracker, setEditingGrowthTracker] = useState(false);
  const [growthTrackerInput, setGrowthTrackerInput] = useState('');
  const [growthTrackerDismissed, setGrowthTrackerDismissed] = useState(false);

  // Level state
  const [userLevel, setUserLevel] = useState<number>(1);

  // Loading state for auth initialization
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Refs for outside-click detection
  const growthTrackerRef = useRef<HTMLDivElement>(null);

  // Scheduler sync - shared with Dashboard
  const { events, updateEvents: setEvents } = useSchedulerSync(selectedDate);

  // PersonasStore data
  const currentPersona = usePersonasStore(state => state.currentPersona);
  const loading = usePersonasStore(state => state.loading);
  const fetchPersonaByIam = usePersonasStore(state => state.fetchPersonaByIam);
  const getProjects = usePersonasStore(state => state.getProjects);
  const getMilestones = usePersonasStore(state => state.getMilestones);
  const insights = usePersonasStore(state => state.insights);

  // Monitor auth initialization
  useEffect(() => {
    if (user !== undefined) {
      setIsAuthLoading(false);
      console.log('✅ Auth initialized, user:', user?.id || 'not logged in');
    }
  }, [user]);

  // Initialize PersonasStore on mount and when route changes
  useEffect(() => {
    if (!user?.iam) {
      console.warn('⚠️ DIGITAL BRAIN: User IAM not available, skipping PersonasStore hydration');
      return;
    }

    if (loading) {
      console.log('⏳ DIGITAL BRAIN: PersonasStore already loading, skipping');
      return;
    }

    console.log("🧠 DIGITAL BRAIN: Hydrating PersonasStore for user:", user.iam);

    fetchPersonaByIam(null as any, user.iam, !currentPersona).catch(error => {
      console.error('❌ DIGITAL BRAIN: PersonasStore hydration error:', error);
      console.debug("PersonasStore hydration completed or auto-cancelled");
    });
  }, [user?.iam, loading, fetchPersonaByIam, currentPersona]);

  // Rehydrate focus areas from onboarding_data on user load/change
  useEffect(() => {
    if (user?.id) {
      const onboardingData = user.onboarding_data as any;
      const focusAreas = onboardingData?.work?.focusAreas || user?.focusAreas || [];
      setFocusAreasInput(focusAreas.join(', '));
      console.log('🔄 Rehydrated focus areas from onboarding_data:', focusAreas);
    }
  }, [user?.id, user?.onboarding_data]);

  // Subscribe to store projects for real-time updates
  const storeProjects = usePersonasStore(state => state.projects);

  // Memoize data retrieval to prevent unnecessary recalculations
  const { projects, milestones, goals } = useMemo(() => {
    if (!currentPersona) {
      return { projects: [], milestones: [], goals: [] };
    }

    // Get all data directly from store
    const allProjects = storeProjects;
    const allMilestones = storeProjects.flatMap(p => p.milestones || []);

    // Extract goals from projects
    const allGoals = allProjects.flatMap(project =>
      (project.goals || []).map(goal => ({
        ...goal,
        projectId: project.id,
        projectName: project.name
      }))
    );

    // Filter for active items only (exclude completed/deleted)
    const projects = allProjects.filter(p =>
      p.active !== false &&
      p.status !== 'deleted' &&
      p.status !== 'completed'
    );

    const milestones = allMilestones.filter(m =>
      m.status !== 'completed' &&
      m.status !== 'deleted'
    );

    const goals = allGoals.filter(g =>
      g.status !== 'Completed' &&
      g.status !== 'deleted'
    );

    return { projects, milestones, goals };
  }, [currentPersona, storeProjects]);

  // Compute user level from database
  useEffect(() => {
    if (!user?.id) {
      console.warn('⚠️ User ID not available for level computation');
      return;
    }

    if (goals.length === 0 && milestones.length === 0) {
      console.log('ℹ️ No goals or milestones yet, skipping level computation');
      return;
    }

    console.log('📊 Computing user level for user:', user.id);

    supabase.rpc('compute_user_level', { user_id: user.id })
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Failed to compute user level:', error);
          return;
        }
        if (data && data.length > 0) {
          const computed = data[0];
          setUserLevel(computed.computed_level);
          console.log('✅ User level computed:', computed.computed_level);

          // Update profiles with computed level
          supabase.from('profiles')
            .update({
              level: computed.computed_level,
              level_score: computed.computed_score
            })
            .eq('id', user.id)
            .then(({ error: updateError }) => {
              if (updateError) {
                console.error('❌ Failed to update level in profile:', updateError);
              } else {
                console.log('✅ Level updated in profile:', computed.computed_level);
              }
            })
            .catch(updateErr => {
              console.error('❌ Exception updating level:', updateErr);
            });
        }
      })
      .catch(err => {
        console.error('❌ Exception computing user level:', err);
      });
  }, [user?.id, goals.length, milestones.length]);

  // Handler functions for editable fields
  const handleSaveFocusAreas = async () => {
    if (!user?.id) return;
    const areas = focusAreasInput.split(',').map(a => a.trim()).filter(Boolean);

    // Validation: require non-empty focus areas
    if (areas.length === 0) {
      console.warn('Focus areas cannot be empty');
      return;
    }

    try {
      await updateUserProfile(user.id, { focusAreas: areas });
      // No refetch needed - changes persist via write-through
      setEditingFocusAreas(false);
    } catch (error) {
      console.error('Failed to save focus areas:', error);
      // On failure, could add rollback UI notification here
    }
  };

  const handleSaveGrowthTracker = async () => {
    if (!user?.id) return;
    try {
      await updateUserProfile(user.id, { growthTracker: growthTrackerInput });
      setEditingGrowthTracker(false);
    } catch (error) {
      console.error('Failed to save growth tracker:', error);
    }
  };

  const handleToggleGrowthTracker = async () => {
    if (!user?.id) return;
    const newDismissedState = !growthTrackerDismissed;
    try {
      // Optimistic update
      setGrowthTrackerDismissed(newDismissedState);
      await toggleGrowthTrackerDismissed(user.id, newDismissedState);
    } catch (error) {
      // Rollback on failure
      setGrowthTrackerDismissed(!newDismissedState);
      console.error('Failed to toggle growth tracker:', error);
    }
  };

  // Load growth_tracker_text and dismissed state on mount
  useEffect(() => {
    if (!user?.id) {
      console.warn('⚠️ User ID not available for growth tracker initialization');
      return;
    }

    console.log('📝 Loading growth tracker data for user:', user.id);

    supabase
      .from('profiles')
      .select('growth_tracker_text')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Failed to load growth tracker text:', error);
          return;
        }
        if (data?.growth_tracker_text) {
          setGrowthTrackerInput(data.growth_tracker_text);
          console.log('✅ Growth tracker text loaded');
        }
      })
      .catch(err => {
        console.error('❌ Exception loading growth tracker:', err);
      });

    // Load dismissed state
    getGrowthTrackerDismissed(user.id)
      .then(dismissed => {
        setGrowthTrackerDismissed(dismissed);
        console.log('✅ Growth tracker dismissed state loaded:', dismissed);
      })
      .catch(err => {
        console.error('❌ Exception loading dismissed state:', err);
      });
  }, [user?.id]);

  // Growth Tracker: Close on Esc and outside-click
  useEffect(() => {
    if (!editingGrowthTracker) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSaveGrowthTracker();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (growthTrackerRef.current && !growthTrackerRef.current.contains(e.target as Node)) {
        handleSaveGrowthTracker();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingGrowthTracker]);

  // Growth Tracker: Debounced auto-save while typing
  useEffect(() => {
    if (!editingGrowthTracker || !user?.id) return;

    const debounceTimer = setTimeout(async () => {
      if (growthTrackerInput.trim()) {
        try {
          await updateUserProfile(user.id, { growthTracker: growthTrackerInput });
          console.log(`💾 [${new Date().toLocaleTimeString()}] Growth Tracker auto-saved`);
        } catch (error) {
          console.error('Failed to auto-save growth tracker:', error);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [growthTrackerInput, editingGrowthTracker, user?.id]);

  // Focus Areas: Debounced auto-save while typing
  useEffect(() => {
    if (!editingFocusAreas || !user?.id) return;

    const debounceTimer = setTimeout(async () => {
      const areas = focusAreasInput.split(',').map(a => a.trim()).filter(Boolean);

      // Deduplicate areas
      const uniqueAreas = Array.from(new Set(areas));

      if (uniqueAreas.length > 0) {
        try {
          await updateUserProfile(user.id, { focusAreas: uniqueAreas });
          console.log(`💾 [${new Date().toLocaleTimeString()}] Focus Areas auto-saved:`, uniqueAreas);
        } catch (error) {
          console.error('Failed to auto-save focus areas:', error);
        }
      }
    }, 300); // 300ms debounce (faster for better UX)

    return () => clearTimeout(debounceTimer);
  }, [focusAreasInput, editingFocusAreas, user?.id]);

  // Knowledge Graph is now data-driven from Zustand stores

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((project) => map.set(project.id, project.name));
    return map;
  }, [projects]);

  const normaliseKey = (value: string | null | undefined, fallback: string) =>
    (value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || fallback);

  type FormattedInsight = {
    id: string;
    title: string;
    metadata: string;
    type: string;
    category: 'personal' | 'project';
    project?: string;
    relevance: number;
    sourceUrl?: string;
    typeIcon: string;
  };

  const formattedInsights = useMemo<FormattedInsight[]>(() => {
    if (!insights.length) {
      return [];
    }

    // Map insight types to icons
    const typeIconMap: Record<string, string> = {
      article: '📄',
      opportunity: '💡',
      trend: '📈',
      note: '📝',
    };

    return insights.map((insight) => {
      const type = normaliseKey(insight.insightType, 'note');
      const category = normaliseKey(insight.category, 'personal') === 'project' ? 'project' : 'personal';
      const typeIcon = typeIconMap[type] || '📝';

      const metadataText = (() => {
        if (insight.summary) {
          return insight.summary;
        }
        if (insight.metadata && typeof insight.metadata === 'object') {
          const values = Object.values(insight.metadata)
            .filter((entry) => typeof entry === 'string')
            .map((entry) => entry.trim())
            .filter(Boolean);
          if (values.length) {
            return values.join(' • ');
          }
        }
        return 'Tap to explore this insight.';
      })();

      return {
        id: insight.id,
        title: insight.title,
        metadata: metadataText,
        type,
        category,
        project: insight.projectId ? projectNameById.get(insight.projectId) : undefined,
        relevance: insight.relevance ?? 0,
        sourceUrl: insight.sourceUrl,
        typeIcon,
      };
    });
  }, [insights, projectNameById]);

  const personalInsights = useMemo(
    () => formattedInsights.filter((insight) => insight.category === 'personal'),
    [formattedInsights],
  );
  const projectInsights = useMemo(
    () => formattedInsights.filter((insight) => insight.category === 'project'),
    [formattedInsights],
  );

  type InsightTag = { id: string; name: string };

  const basePersonalTags = useMemo<InsightTag[]>(
    () => [
      { id: 'all', name: 'All' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'learning', name: 'Learning' },
      { id: 'opportunity', name: 'Opportunity' },
      { id: 'trend', name: 'Trend' },
      { id: 'skill', name: 'Skill' },
      { id: 'network', name: 'Network' },
      { id: 'task', name: 'Task' },
    ],
    [],
  );

  const baseProjectTags = useMemo<InsightTag[]>(
    () => [
      { id: 'all', name: 'All' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'funding', name: 'Funding' },
      { id: 'talent', name: 'Talent' },
      { id: 'market', name: 'Market' },
      { id: 'tool', name: 'Tool' },
      { id: 'customer', name: 'Customer' },
      { id: 'task', name: 'Task' },
    ],
    [],
  );

  const formatTagLabel = useCallback((value: string) => {
    return value
      .split(/[-_]/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }, []);

  const buildTags = useCallback(
    (fallback: InsightTag[], dataset: FormattedInsight[]) => {
      const seen = new Set(fallback.map((tag) => tag.id));
      const dynamic: InsightTag[] = [];

      dataset.forEach((item) => {
        if (!item.type || seen.has(item.type)) {
          return;
        }
        seen.add(item.type);
        dynamic.push({ id: item.type, name: formatTagLabel(item.type) });
      });

      return [...fallback, ...dynamic];
    },
    [formatTagLabel],
  );

  const personalTags = useMemo(
    () => buildTags(basePersonalTags, personalInsights),
    [basePersonalTags, personalInsights, buildTags],
  );
  const projectTags = useMemo(
    () => buildTags(baseProjectTags, projectInsights),
    [baseProjectTags, projectInsights, buildTags],
  );

  const getCurrentInsights = useCallback(() => {
    const active = insightMode === 'personal' ? personalInsights : projectInsights;
    if (selectedTag === 'all') {
      return active;
    }
    return active.filter((insight) => insight.type === selectedTag);
  }, [insightMode, personalInsights, projectInsights, selectedTag]);

  const getCurrentTags = useCallback(
    () => (insightMode === 'personal' ? personalTags : projectTags),
    [insightMode, personalTags, projectTags],
  );

  // Journal albums and items (Apple Photos style)
  const defaultAlbums = [
    { id: 'recent', name: 'Recent', count: 0, items: [] }
  ];

  const [selectedAlbum, setSelectedAlbum] = useState('recent');
  const [albums, setAlbums] = useState(defaultAlbums);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [opportunityToSave, setOpportunityToSave] = useState(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  // Send opportunity to chat
  const sendOpportunityToChat = (opportunity: any, type: 'radar' | 'insight') => {
    const opportunityId = `${type}-${opportunity.id}`;

    // Debounce - prevent duplicate sends
    if (sendingOpportunityIds.has(opportunityId)) {
      return;
    }

    // Mark as sending
    setSendingOpportunityIds(prev => new Set(prev).add(opportunityId));

    // Create message with title, summary, and deep link
    let messageText = `📊 **${opportunity.title}**\n\n`;

    if (type === 'radar') {
      messageText += `${opportunity.subtitle}\n\n`;
      if (insightMode === 'personal') {
        messageText += `Match: ${opportunity.match} | Growth: ${opportunity.growth}`;
      } else {
        messageText += `Relevance: ${opportunity.relevance} | Priority: ${opportunity.urgency}`;
      }
    } else {
      messageText += `${opportunity.metadata}\n\n`;
      messageText += `Type: ${opportunity.type}`;
      if (opportunity.project) {
        messageText += ` | Project: ${opportunity.project}`;
      }
    }

    messageText += `\n\n🔗 ID: ${opportunityId}`;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);

    // Remove from sending set after debounce period
    setTimeout(() => {
      setSendingOpportunityIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(opportunityId);
        return newSet;
      });
    }, 500);

    // AI mock response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: `I've analyzed this ${type === 'radar' ? 'opportunity' : 'insight'}. ${opportunity.title} looks promising! Would you like me to help you create an action plan, save it to your journal, or schedule time to work on it?`,
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1500);

    // Open chat overlay
    setShowChatOverlay(true);
  };

  // Album management functions
  const handleCreateAlbum = () => {
    if (newAlbumName.trim()) {
      const newAlbum = {
        id: newAlbumName.toLowerCase().replace(/\s+/g, '-'),
        name: newAlbumName.trim(),
        count: 0,
        items: []
      };
      setAlbums([...albums, newAlbum]);
      setNewAlbumName('');
      setShowCreateAlbum(false);
    }
  };

  const handleDeleteAlbum = (albumId) => {
    if (albumId === 'recent') return; // Don't allow deleting Recent album
    setAlbums(albums.filter(album => album.id !== albumId));
    if (selectedAlbum === albumId) {
      setSelectedAlbum('recent');
    }
  };

  // Opportunity saving functions
  const handleSaveOpportunity = (opportunity) => {
    setOpportunityToSave(opportunity);
    setShowSaveModal(true);
  };

  const handleSaveToAlbum = (albumId) => {
    if (opportunityToSave) {
      const newItem = {
        id: `opp-${Date.now()}`,
        type: 'Opportunity',
        title: opportunityToSave.title,
        source: 'ATMO Radar',
        savedDate: 'Just now',
        thumbnail: opportunityToSave.title.substring(0, 3).toUpperCase()
      };

      setAlbums(albums.map(album =>
        album.id === albumId
          ? { ...album, items: [...album.items, newItem], count: album.count + 1 }
          : album
      ));

      setShowSaveModal(false);
      setOpportunityToSave(null);
    }
  };

  // Loading state while auth initializes
  if (isAuthLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#CC5500]/20 border-t-[#CC5500] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Initializing Digital Brain...</p>
        </div>
      </div>
    );
  }

  // Error state if user is not authenticated
  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-white/60 text-sm mb-4">Please sign in to access your Digital Brain.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#CC5500] hover:bg-[#CC5500]/80 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      {/* Main Content */}
      <div className="h-full flex flex-col p-6">
        {/* Page Title with Avatar */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">Digital Brain</h1>

            {/* Orange Avatar Dot */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowChatOverlay(true);
              }}
              className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#CC5500] to-[#CC5500]/80 hover:from-[#CC5500]/90 hover:to-[#CC5500]/70 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(204,85,0,0.4)] cursor-pointer"
              title="Open Chat"
            >
              <div className="absolute inset-0 bg-[#CC5500]/20 rounded-full blur-md -z-10 animate-pulse-soft" />
            </button>
          </div>

          <p className="text-white/60 text-sm">Your personal knowledge ecosystem</p>
        </div>

        {/* 2x2 Grid of Cards - Full Width */}
        <div className="grid grid-cols-2 grid-rows-2 gap-6 flex-1 min-h-0">

          {/* Card 1 - User Profile */}
          <AtmoCard variant="purple" className="w-full h-full p-4 relative" hover={true}>
            {selectedProjectDetail && (
              <ProjectDetailOverlay
                project={selectedProjectDetail}
                onClose={() => setSelectedProjectDetail(null)}
              />
            )}
            <div className="h-full flex flex-col">

              {/* Header Section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {user?.nickname?.charAt(0)?.toUpperCase() || user?.preferredName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">{user?.nickname || user?.preferredName || user?.email?.split('@')[0] || 'User'}</h3>
                    <p className="text-xs text-white/70 leading-relaxed mt-1 pr-2">
                      {user?.bio || user?.mainPriority || 'Finish setting up in Avatar.'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Skills & USP Section */}
              <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star size={12} className="text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">Focus Areas</span>
                  </div>
                  <button
                    onClick={() => {
                      if (editingFocusAreas) {
                        handleSaveFocusAreas();
                      } else {
                        setFocusAreasInput(user?.focusAreas?.join(', ') || '');
                        setEditingFocusAreas(true);
                      }
                    }}
                    className="text-xs text-white/60 hover:text-white transition-colors"
                  >
                    {editingFocusAreas ? 'Save' : 'Edit'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingFocusAreas ? (
                    <input
                      type="text"
                      value={focusAreasInput}
                      onChange={(e) => setFocusAreasInput(e.target.value)}
                      onBlur={handleSaveFocusAreas}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveFocusAreas()}
                      className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 border border-purple-500/20 focus:outline-none focus:border-purple-500/40"
                      placeholder="Enter focus areas (comma separated)"
                      autoFocus
                    />
                  ) : (
                    <>
                      {(() => {
                        const onboardingData = user?.onboarding_data as any;
                        const focusAreas = onboardingData?.work?.focusAreas || user?.focusAreas || [];
                        return focusAreas.length > 0 ? (
                          focusAreas.slice(0, 3).map((area: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                              {area}
                            </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/40">
                          Finish setting up in Avatar.
                        </span>
                      );
                      })()}
                    </>
                  )}
                </div>
              </div>

              {/* Middle Section - Projects Left, Level Chart Right (Same Height) */}
              <div className="flex-1 grid grid-cols-[2fr_1fr] gap-4 mb-3">
                {/* Left: Projects Section - Two Scrollable Columns */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={12} className="text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">Projects</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white/5 rounded-md p-2 border border-purple-500/20 cursor-pointer hover:bg-white/10 hover:border-purple-500/30 transition-all h-fit"
                        onClick={() => setSelectedProjectDetail(project)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white truncate">{project.name}</span>
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color || '#a855f7' }}
                          ></div>
                        </div>
                        <div className="text-xs text-white/50 truncate mb-1">
                          {(project.goals || []).filter(g => g.status !== 'deleted' && g.status !== 'Completed').length} goals
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${project.progress || 0}%`,
                              backgroundColor: project.color || '#a855f7'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="col-span-2 text-xs text-white/40 text-center py-4">
                        Finish setting up in Avatar.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Level Chart - Same Height as Projects */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-full h-24 relative mb-2">
                      {/* Enhanced Mountain Line Visual */}
                      <svg viewBox="0 0 200 60" className="w-full h-full">
                        <defs>
                          <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgb(168 85 247 / 0.3)" />
                            <stop offset="50%" stopColor="rgb(168 85 247 / 0.4)" />
                            <stop offset="100%" stopColor="rgb(168 85 247 / 0.2)" />
                          </linearGradient>
                        </defs>
                        {/* Mountain path with better progression */}
                        <path
                          d="M10,50 L30,40 L50,32 L80,22 L120,18 L160,28 L190,25"
                          stroke="rgb(168 85 247 / 0.9)"
                          strokeWidth="2.5"
                          fill="none"
                          className="drop-shadow-sm"
                        />
                        {/* Fill area under mountain */}
                        <path
                          d="M10,50 L30,40 L50,32 L80,22 L120,18 L160,28 L190,25 L190,50 Z"
                          fill="url(#mountainGradient)"
                        />
                        {/* Current position dot - positioned at peak */}
                        <circle cx="120" cy="18" r="3" fill="rgb(168 85 247)" className="animate-pulse" />
                        {/* Small figure at current position */}
                        <circle cx="120" cy="15" r="1.5" fill="rgb(255 255 255 / 0.8)" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-white">Level {userLevel}</p>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Growth Tracker & Metrics */}
              <div className="flex justify-between items-end">
                {/* Left: Growth Tracker (editable, closes on Esc/outside-click) */}
                {!growthTrackerDismissed && (
                  <div ref={growthTrackerRef} className="flex-1">
                    {editingGrowthTracker ? (
                      <input
                        type="text"
                        value={growthTrackerInput}
                        onChange={(e) => setGrowthTrackerInput(e.target.value)}
                        onBlur={handleSaveGrowthTracker}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveGrowthTracker()}
                        className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 border border-purple-500/20 focus:outline-none focus:border-purple-500/40"
                        placeholder="Set your growth tracker message"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
                        onClick={() => {
                          setEditingGrowthTracker(true);
                        }}
                      >
                        <TrendingUp size={14} className="text-purple-400" />
                        <div>
                          <p className="text-xs font-medium text-white">Growth Tracker</p>
                          <p className="text-xs text-white/50">
                            {growthTrackerInput || 'Click to edit'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {growthTrackerDismissed && (
                  <div className="flex-1">
                    <button
                      onClick={handleToggleGrowthTracker}
                      className="text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      Show Growth Tracker
                    </button>
                  </div>
                )}

                {/* Right: Key Metrics */}
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-white/60">Active projects</span>
                    <span className="text-xs font-medium text-purple-400">{projects.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </AtmoCard>

          {/* Card 2 - AI Insights / Journal */}
          <AtmoCard variant="orange" className="w-full h-full overflow-hidden" hover={true}>
            <div className="h-full flex flex-col">

              {/* Header with ATMO Insights/Journal, centered toggle, and Journal icon - FIXED */}
              <div className="flex items-center px-4 pt-4 pb-3 flex-shrink-0">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">
                    {showJournal ? 'Journal' : 'ATMO Insights'}
                  </h3>
                </div>

                {/* Perfectly centered mode toggle - only show when not in journal mode */}
                {!showJournal && (
                  <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                      onClick={() => setInsightMode('personal')}
                      className={`px-3 py-1 rounded-md text-xs transition-all ${
                        insightMode === 'personal'
                          ? 'bg-[#89AC76]/20 text-[#89AC76] border border-[#89AC76]/30'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      onClick={() => setInsightMode('projects')}
                      className={`px-3 py-1 rounded-md text-xs transition-all ${
                        insightMode === 'projects'
                          ? 'bg-[#89AC76]/20 text-[#89AC76] border border-[#89AC76]/30'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Projects
                    </button>
                  </div>
                )}

                {/* Journal icon */}
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => setShowJournal(!showJournal)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      showJournal
                        ? 'bg-[#89AC76]/20 text-[#89AC76] border border-[#89AC76]/30'
                        : 'bg-white/5 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    <BookOpen size={12} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0" style={{ scrollBehavior: 'smooth' }}>
                {showJournal ? (
                  /* Journal View - Apple Photos Style */
                  <>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-white mb-2">Digital Wardrobe</h4>
                    <p className="text-xs text-white/60">Your curated collection organized in albums</p>
                  </div>

                  {/* Album Tabs with Create Button */}
                  <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide flex-shrink-0">
                    {albums.map(album => (
                      <div key={album.id} className="relative group">
                        <button
                          onClick={() => setSelectedAlbum(album.id)}
                          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                            selectedAlbum === album.id
                              ? 'bg-[#89AC76]/20 text-[#89AC76] border border-[#89AC76]/30'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {album.name} ({album.count})
                        </button>
                        {album.id !== 'recent' && (
                          <button
                            onClick={() => handleDeleteAlbum(album.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} className="text-white/60" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setShowCreateAlbum(true)}
                      className="px-3 py-1 rounded-full text-xs whitespace-nowrap bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} />
                      New Album
                    </button>
                  </div>

                  {/* Create Album Modal */}
                  {showCreateAlbum && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg border border-[#89AC76]/30">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newAlbumName}
                          onChange={(e) => setNewAlbumName(e.target.value)}
                          placeholder="Album name..."
                          className="flex-1 px-3 py-1 bg-white/10 rounded-md text-xs text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-[#89AC76]/50"
                          autoFocus
                        />
                        <button
                          onClick={handleCreateAlbum}
                          className="px-3 py-1 bg-[#89AC76]/20 text-[#89AC76] text-xs rounded-md border border-[#89AC76]/30 hover:bg-[#89AC76]/30 transition-colors"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateAlbum(false);
                            setNewAlbumName('');
                          }}
                          className="px-3 py-1 bg-white/5 text-white/60 text-xs rounded-md hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Album Content - Grid View */}
                  <div className="grid grid-cols-2 gap-2">
                    {albums.find(album => album.id === selectedAlbum)?.items.map(item => (
                      <div key={item.id} className="group relative aspect-square bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all overflow-hidden cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#89AC76]/20 to-[#89AC76]/10">
                          <span className="text-lg font-bold text-white/40">{item.thumbnail}</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs font-medium text-white truncate">{item.title}</p>
                          <p className="text-xs text-white/60 truncate">{item.source}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {albums.find(album => album.id === selectedAlbum)?.items.length === 0 && (
                    <div className="text-center text-white/40 text-xs mt-8">
                      <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
                      <p>No items in this album yet</p>
                      <p className="mt-1 text-white/30">Save opportunities from the radar to build your collection</p>
                    </div>
                  )}
                  </>
                ) : (
                  /* AI Insights View */
                  <>
                  {/* Tag Filter Pills */}
                  <div className="flex gap-2 overflow-x-auto mb-3 pb-2 scrollbar-hide flex-shrink-0">
                    {getCurrentTags().map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                          selectedTag === tag.id
                            ? 'bg-[#89AC76]/20 text-[#89AC76] border border-[#89AC76]/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>

                  {/* Insights List */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {getCurrentInsights().length > 0 ? (
                      getCurrentInsights().map(insight => (
                        <div
                          key={insight.id}
                          className="group bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#89AC76]/40 hover:bg-white/10 transition-all cursor-pointer"
                          onClick={() => sendOpportunityToChat(insight, 'insight')}
                        >
                          <div className="flex items-start gap-2">
                            {/* Icon */}
                            <div className="w-6 h-6 rounded-md bg-[#89AC76]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#89AC76]/30 transition-colors">
                              <span className="text-sm">
                                {insight.typeIcon}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {insight.sourceUrl ? (
                                <a
                                  href={insight.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-[#89AC76] hover:text-[#89AC76]/80 mb-1 line-clamp-1 block underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {insight.title}
                                </a>
                              ) : (
                                <h4 className="text-xs font-medium text-white mb-1 line-clamp-1">{insight.title}</h4>
                              )}
                              <p className="text-xs text-white/60 mb-2">{insight.metadata}</p>

                              {/* Project Tag (only for project insights) */}
                              {insight.project && (
                                <span className="inline-block px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-full mr-2">
                                  {insight.project}
                                </span>
                              )}
                            </div>

                            {/* Relevance Score */}
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-semibold text-[#89AC76]">{insight.relevance}%</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-white/40 text-xs py-8">
                        <Lightbulb size={24} className="mx-auto mb-2 opacity-40" />
                        <p>Finish setting up in Avatar.</p>
                      </div>
                    )}
                  </div>
                  </>
                )}
              </div>
            </div>
          </AtmoCard>

          {/* Card 3 - Knowledge Graph */}
          <ObsidianKnowledgeGraph className="w-full h-full" />

          {/* Card 4 - Priority Stream */}
          <PriorityStreamEnhanced context="digital-brain" className="w-full h-full" />

        </div>
      </div>

      {/* Chat Overlay */}
      <ChatOverlay
        isOpen={showChatOverlay}
        onClose={() => setShowChatOverlay(false)}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        isCapturing={isCapturing}
        setIsCapturing={setIsCapturing}
      />

      {/* Save to Album Modal */}
      {showSaveModal && opportunityToSave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Save to Album</h3>
            <p className="text-sm text-white/60 mb-4">Choose an album for: {opportunityToSave.title}</p>

            <div className="space-y-2 mb-6">
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => handleSaveToAlbum(album.id)}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors border border-white/10 hover:border-[#89AC76]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{album.name}</span>
                    <span className="text-xs text-white/60">{album.count} items</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setOpportunityToSave(null);
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalBrain;
