import React, { useState, useEffect, useMemo } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { CardContent, CardHeader } from '@/components/atoms/Card';
import SphereChat from '@/components/atoms/SphereChat';
import { User, BarChart3, Brain, Lightbulb, ChevronUp, TrendingUp, Target, Zap, Star, Radar, Settings, Filter, BookOpen, Plus, Circle, X, Edit3 } from 'lucide-react';
import { SchedulerView } from '@/components/scheduler/SchedulerView';
import { useSchedulerSync } from '@/hooks/useSchedulerSync';
import { ObsidianKnowledgeGraph } from '@/components/knowledge/ObsidianKnowledgeGraph';
import { ChatOverlay } from '@/components/organisms/ChatOverlay';
import { PriorityStreamEnhanced } from '@/components/organisms/PriorityStreamEnhanced';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { useAuth } from '@/hooks/useMockAuth';

const DigitalBrain: React.FC = () => {
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

  // Scheduler sync - shared with Dashboard
  const { events, updateEvents: setEvents } = useSchedulerSync();

  // PersonasStore data
  const currentPersona = usePersonasStore(state => state.currentPersona);
  const loading = usePersonasStore(state => state.loading);
  const fetchPersonaByIam = usePersonasStore(state => state.fetchPersonaByIam);
  const getProjects = usePersonasStore(state => state.getProjects);
  const getMilestones = usePersonasStore(state => state.getMilestones);

  // Get user for initialization
  const { user } = useAuth();

  // Initialize PersonasStore when user is available
  useEffect(() => {
    if (user?.iam && !currentPersona && !loading) {
      console.log("🧠 DIGITAL BRAIN: Initializing PersonasStore for user:", user.iam);
      fetchPersonaByIam(null as any, user.iam).catch(error => {
        console.debug("PersonasStore initialization completed or auto-cancelled");
      });
    }
  }, [user?.iam, currentPersona, loading, fetchPersonaByIam]);

  // Memoize data retrieval to prevent unnecessary recalculations
  const { projects, milestones } = useMemo(() => {
    if (!currentPersona) {
      return { projects: [], milestones: [] };
    }
    
    const projects = getProjects();
    const milestones = getMilestones();
    
    return { projects, milestones };
  }, [currentPersona, getProjects, getMilestones]);

  // Knowledge Graph is now data-driven from Zustand stores

  // Mock data for AI Insights
  const personalTags = [
    { id: 'all', name: 'All' },
    { id: 'partnership', name: 'Partnership' },
    { id: 'learning', name: 'Learning' },
    { id: 'opportunity', name: 'Opportunity' },
    { id: 'trend', name: 'Trend' },
    { id: 'skill', name: 'Skill' },
    { id: 'network', name: 'Network' },
    { id: 'task', name: 'Task' },
  ];

  const projectTags = [
    { id: 'all', name: 'All' },
    { id: 'partnership', name: 'Partnership' },
    { id: 'funding', name: 'Funding' },
    { id: 'talent', name: 'Talent' },
    { id: 'market', name: 'Market' },
    { id: 'tool', name: 'Tool' },
    { id: 'customer', name: 'Customer' },
    { id: 'task', name: 'Task' },
  ];

  const personalInsights = [
    {
      id: '1',
      type: 'Task',
      title: 'Write LinkedIn thought piece on AI trends',
      metadata: 'Impact: High • 1h ago',
      action: 'Add to Today',
      relevance: 94
    },
    {
      id: '2',
      type: 'Learning',
      title: 'Leadership in 2024: Remote Team Management',
      metadata: '15min read • 4h ago',
      action: 'Read',
      relevance: 89
    },
    {
      id: '3',
      type: 'Partnership',
      title: 'Y Combinator seeks AI startups',
      metadata: 'Match: 89% • 2h ago',
      action: 'Connect',
      relevance: 89
    },
    {
      id: '4',
      type: 'Opportunity',
      title: 'TechCrunch Disrupt 2024 Speaker Applications',
      metadata: 'Networking: High • 6h ago',
      action: 'Register',
      relevance: 85
    },
    {
      id: '5',
      type: 'Trend',
      title: 'No-code movement growing +47%',
      metadata: 'Growth: High • 1d ago',
      action: 'Explore',
      relevance: 82
    },
    {
      id: '6',
      type: 'Network',
      title: 'Connect with Sarah Chen, VP at Notion',
      metadata: 'Mutual connections: 3 • 3h ago',
      action: 'Connect',
      relevance: 88
    }
  ];

  const projectInsights = [
    {
      id: '1',
      type: 'Partnership',
      title: 'Notion API partnership program',
      metadata: 'Fit: 94% • 3h ago',
      action: 'Apply',
      project: 'GrowIn',
      relevance: 94
    },
    {
      id: '2',
      type: 'Task',
      title: 'Update GrowIn landing page copy',
      metadata: 'Priority: High • 2h ago',
      action: 'Add to Sprint',
      project: 'GrowIn',
      relevance: 92
    },
    {
      id: '3',
      type: 'Funding',
      title: 'Seed funding for AI productivity tools',
      metadata: 'Stage: Perfect • 5h ago',
      action: 'Learn More',
      project: 'ATMO',
      relevance: 90
    },
    {
      id: '4',
      type: 'Task',
      title: 'Research ATMO user personas',
      metadata: 'Deadline: Tomorrow • 4h ago',
      action: 'Schedule',
      project: 'ATMO',
      relevance: 88
    },
    {
      id: '5',
      type: 'Talent',
      title: 'Senior React developer available',
      metadata: 'Skills: 96% match • 8h ago',
      action: 'Contact',
      project: 'Both Projects',
      relevance: 86
    },
    {
      id: '6',
      type: 'Market',
      title: 'Productivity software market analysis',
      metadata: 'Growth: +23% • 1d ago',
      action: 'Analyze',
      project: 'All',
      relevance: 84
    },
    {
      id: '7',
      type: 'Tool',
      title: 'New React performance monitoring tool',
      metadata: 'Relevance: High • 6h ago',
      action: 'Evaluate',
      project: 'GrowIn',
      relevance: 81
    },
    {
      id: '8',
      type: 'Customer',
      title: 'Busy professionals segment analysis',
      metadata: 'Target match: 89% • 12h ago',
      action: 'Research',
      project: 'ATMO',
      relevance: 87
    }
  ];

  const getCurrentInsights = () => {
    const insights = insightMode === 'personal' ? personalInsights : projectInsights;
    if (selectedTag === 'all') return insights;
    return insights.filter(insight => insight.type.toLowerCase() === selectedTag);
  };

  const getCurrentTags = () => {
    return insightMode === 'personal' ? personalTags : projectTags;
  };

  // Journal albums and items (Apple Photos style)
  const journalAlbums = [
    {
      id: 'recent',
      name: 'Recent',
      count: 8,
      items: [
        {
          id: '1',
          type: 'Article',
          title: 'The Future of AI in Productivity Tools',
          source: 'Harvard Business Review',
          savedDate: '2 days ago',
          readTime: '8 min read',
          thumbnail: 'AI'
        },
        {
          id: '2',
          type: 'Opportunity',
          title: 'Y Combinator Application',
          source: 'YC Website',
          savedDate: '1 week ago',
          deadline: 'Dec 15',
          thumbnail: 'YC'
        },
        {
          id: '3',
          type: 'Advice',
          title: 'Building MVP: Core Features',
          source: 'Paul Graham',
          savedDate: '3 days ago',
          readTime: '12 min',
          thumbnail: 'MVP'
        },
        {
          id: '4',
          type: 'Article',
          title: 'Remote Team Leadership',
          source: 'First Round',
          savedDate: '1 week ago',
          readTime: '15 min',
          thumbnail: 'LEAD'
        }
      ]
    },
    {
      id: 'opportunities',
      name: 'Opportunities',
      count: 5,
      items: [
        {
          id: '5',
          type: 'Funding',
          title: 'Seed Funding Programs',
          source: 'AngelList',
          savedDate: '4 days ago',
          thumbnail: 'FUND'
        },
        {
          id: '6',
          type: 'Partnership',
          title: 'Tech Partnership Program',
          source: 'Microsoft',
          savedDate: '6 days ago',
          thumbnail: 'PART'
        }
      ]
    },
    {
      id: 'learning',
      name: 'Learning',
      count: 12,
      items: [
        {
          id: '7',
          type: 'Course',
          title: 'Advanced React Patterns',
          source: 'Kent C. Dodds',
          savedDate: '2 weeks ago',
          thumbnail: 'REACT'
        },
        {
          id: '8',
          type: 'Book',
          title: 'The Lean Startup',
          source: 'Eric Ries',
          savedDate: '1 month ago',
          thumbnail: 'LEAN'
        }
      ]
    }
  ];

  const [selectedAlbum, setSelectedAlbum] = useState('recent');
  const [albums, setAlbums] = useState(journalAlbums);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [opportunityToSave, setOpportunityToSave] = useState(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  // Opportunity Radar data - 3 opportunities
  const opportunityRadarData = {
    personal: [
      {
        id: '1',
        title: 'AI Strategy Workshop',
        subtitle: 'Dec 15 - Online',
        match: '95%',
        growth: '+12%'
      },
      {
        id: '2',
        title: 'Tech Leadership Summit',
        subtitle: 'Jan 20 - San Francisco',
        match: '88%',
        growth: '+8%'
      },
      {
        id: '3',
        title: 'Startup Accelerator',
        subtitle: 'Feb 1 - Applications Open',
        match: '92%',
        growth: '+15%'
      }
    ],
    projects: [
      {
        id: '1',
        title: 'Notion API Partnership',
        subtitle: 'Integration Program',
        relevance: '89%',
        urgency: 'High'
      },
      {
        id: '2',
        title: 'Microsoft for Startups',
        subtitle: 'Azure Credits Program',
        relevance: '85%',
        urgency: 'Medium'
      },
      {
        id: '3',
        title: 'Y Combinator Demo Day',
        subtitle: 'Investor Network',
        relevance: '93%',
        urgency: 'High'
      }
    ]
  };

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
              onClick={() => setShowChatOverlay(true)}
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

          {/* Card 1 - User Profile (Lapo's Design) */}
          <AtmoCard variant="purple" className="w-full h-full p-4" hover={true}>
            <div className="h-full flex flex-col">

              {/* Header Section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    L
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">Lapo</h3>
                    <p className="text-xs text-white/70 leading-relaxed mt-1 pr-2">
                      Tech founder building GrowIn, focusing on AI transformation & digital branding.
                      Specialized in scaling startups through innovative technology solutions and strategic growth hacking.
                    </p>
                  </div>
                </div>

                {/* Top Right Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Growth Portfolio Badge */}
                  <button className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-md border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                    Growth Portfolio
                  </button>
                  {/* Expand Arrow */}
                  <button className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <ChevronUp size={12} className="text-white/60" />
                  </button>
                </div>
              </div>

              {/* Skills & USP Section */}
              <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={12} className="text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">Why I'm Special</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                    AI Strategy
                  </span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                    Growth Hacking
                  </span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                    Product Vision
                  </span>
                </div>
              </div>

              {/* Middle Section - Three Columns Layout */}
              <div className="grid grid-cols-3 gap-4 items-start mb-4">
                {/* Left: Milestones */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={12} className="text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">Milestones</span>
                  </div>
                  <div className="space-y-2">
                    {milestones.slice(0, 2).map((milestone) => (
                      <div key={milestone.id} className="bg-white/5 rounded-md p-2 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white truncate">{milestone.name}</span>
                          <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-400' : 'bg-purple-400'}`}></div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div 
                            className="bg-purple-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${milestone.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {milestones.length === 0 && (
                      <div className="text-xs text-white/40 text-center py-2">
                        No milestones yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Growth Mountain */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full h-16 relative mb-2">
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
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">Level 8</p>
                    <p className="text-xs text-white/50">Peak Performance</p>
                  </div>
                </div>

                {/* Right: Active Projects */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={12} className="text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">Projects</span>
                  </div>
                  <div className="space-y-2">
                    {projects.slice(0, 2).map((project) => (
                      <div key={project.id} className="bg-white/5 rounded-md p-2 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white truncate">{project.name}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            project.priority === 'high' ? 'bg-red-400' : 
                            project.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                          }`}></div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div 
                            className="bg-purple-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="text-xs text-white/40 text-center py-2">
                        No projects yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section - KPI Data */}
              <div className="flex justify-between items-end">
                {/* Left: Progress Tracker */}
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-purple-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Growth Tracker</p>
                    <p className="text-xs text-white/50">Climbing higher</p>
                  </div>
                </div>

                {/* Right: Key Metrics */}
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-white/60">Notes this week</span>
                    <span className="text-xs font-medium text-purple-400">23</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-white/60">Insights explored</span>
                    <span className="text-xs font-medium text-purple-400">12</span>
                  </div>
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
                            className="absolute -top-1 -right-1 w-5 h-5 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-white/20"
                            title="Delete Album"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Create New Album Button */}
                    <button 
                      onClick={() => setShowCreateAlbum(true)}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-[#89AC76]/30 hover:bg-[#89AC76]/10 transition-colors flex items-center justify-center shrink-0"
                      title="Create New Album"
                    >
                      <Plus size={12} className="text-white/60 hover:text-[#89AC76]" />
                    </button>
                  </div>


                  {/* Items Grid - Apple Photos Style */}
                  <div className="flex-1 min-h-0">
                    <div className="grid grid-cols-2 gap-2 pb-4">
                      {albums
                        .find(album => album.id === selectedAlbum)
                        ?.items.map(item => (
                          <div key={item.id} className="group cursor-pointer">
                            <div className="bg-white/5 rounded-lg border border-white/10 hover:border-[#89AC76]/30 transition-all overflow-hidden">
                              {/* Thumbnail */}
                              <div className="h-16 bg-gradient-to-br from-[#89AC76]/20 to-[#89AC76]/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-[#89AC76]">
                                  {item.thumbnail}
                                </span>
                              </div>
                              
                              {/* Content */}
                              <div className="p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-[#89AC76] font-medium">{item.type}</span>
                                  <span className="text-xs text-white/50">{item.savedDate}</span>
                                </div>
                                <h5 className="text-xs font-medium text-white mb-1 line-clamp-2 leading-tight">
                                  {item.title}
                                </h5>
                                <p className="text-xs text-white/60 truncate">{item.source}</p>
                                
                                {/* Metadata */}
                                <div className="mt-1">
                                  <span className="text-xs text-white/50">
                                    {'readTime' in item ? item.readTime : 'deadline' in item ? `Due: ${item.deadline}` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {/* Add New Item Button */}
                      <div className="col-span-2 mt-2">
                        <button className="w-full h-12 border-2 border-dashed border-white/20 rounded-lg text-white/40 hover:border-[#89AC76]/30 hover:text-[#89AC76]/60 transition-colors flex items-center justify-center">
                          <Plus size={14} className="mr-2" />
                          <span className="text-xs">Add to Journal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  </>
                ) : (
                  /* AI Insights View */
                  <>
                    {/* Opportunity Radar Section - 3 Small Cards */}
                    <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Radar size={12} className="text-[#89AC76]" />
                      <span className="text-xs font-medium text-[#89AC76]">Opportunity Radar</span>
                    </div>
                    
                    {/* 3 Opportunity Cards */}
                    <div className="flex gap-2">
                      {opportunityRadarData[insightMode].map(opportunity => (
                        <div key={opportunity.id} className="flex-1 p-2 bg-gradient-to-r from-[#89AC76]/15 to-[#89AC76]/10 rounded-lg border border-[#89AC76]/25">
                          <div className="mb-2">
                            <h4 className="text-xs font-semibold text-white mb-1 line-clamp-1">
                              {opportunity.title}
                            </h4>
                            <p className="text-xs text-white/70 line-clamp-1">
                              {opportunity.subtitle}
                            </p>
                            <p className="text-xs text-[#89AC76] mt-1">
                              {insightMode === 'personal' 
                                ? `Match: ${opportunity.match} | Growth: ${opportunity.growth}`
                                : `Relevance: ${opportunity.relevance} | ${opportunity.urgency}`
                              }
                            </p>
                          </div>
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => sendOpportunityToChat(opportunity, 'radar')}
                              disabled={sendingOpportunityIds.has(`radar-${opportunity.id}`)}
                              className="w-6 h-6 bg-[#89AC76]/20 text-[#89AC76] rounded border border-[#89AC76]/30 hover:bg-[#89AC76]/30 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Send to Chat"
                            >
                              <Circle size={8} className="fill-current" />
                            </button>
                            <button
                              onClick={() => handleSaveOpportunity(opportunity)}
                              className="w-6 h-6 bg-[#89AC76]/20 text-[#89AC76] rounded border border-[#89AC76]/30 hover:bg-[#89AC76]/30 transition-colors flex items-center justify-center"
                              title="Save to Journal"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growth Insights Feed */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-white">
                        {insightMode === 'personal' ? "Today's Growth Discoveries" : "Growth Opportunities"}
                      </h4>
                      {insightMode === 'projects' && (
                        <select 
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded text-xs text-white/80 px-2 py-1"
                        >
                          <option value="all">All Projects</option>
                          <option value="growin">GrowIn</option>
                          <option value="atmo">ATMO</option>
                        </select>
                      )}
                    </div>
                    
                    {/* Tag filters without emojis */}
                    <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide">
                      {getCurrentTags().map(tag => (
                        <button 
                          key={tag.id} 
                          onClick={() => setSelectedTag(tag.id)}
                          className={`px-2 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                            selectedTag === tag.id 
                              ? 'bg-[#89AC76]/20 text-[#89AC76] border border-[#89AC76]/30'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>

                    {/* Horizontal scrolling insights without emojis */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 h-36">
                      {getCurrentInsights().map(insight => (
                        <div key={insight.id} className="flex-shrink-0 w-48 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#89AC76]/30 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-[#89AC76] font-medium">{insight.type}</span>
                            {insightMode === 'projects' && 'project' in insight && (
                              <span className="text-xs text-white/50">• {insight.project}</span>
                            )}
                          </div>
                          <h5 className="text-xs font-medium text-white mb-1 line-clamp-2">
                            {insight.title}
                          </h5>
                          <p className="text-xs text-white/60 mb-2">
                            {insight.metadata}
                          </p>
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => sendOpportunityToChat(insight, 'insight')}
                              disabled={sendingOpportunityIds.has(`insight-${insight.id}`)}
                              className="w-6 h-6 bg-[#89AC76]/20 text-[#89AC76] rounded border border-[#89AC76]/30 hover:bg-[#89AC76]/30 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Send to Chat"
                            >
                              <Circle size={8} className="fill-current" />
                            </button>
                            <button className="w-6 h-6 bg-[#89AC76]/20 text-[#89AC76] rounded border border-[#89AC76]/30 hover:bg-[#89AC76]/30 transition-colors flex items-center justify-center">
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
                )}
              </div>
            </div>

            {/* Save Opportunity Modal */}
            {showSaveModal && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-lg p-4 w-64 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Save to Album</h4>
                  <p className="text-xs text-white/70 mb-3">Choose an album for: {opportunityToSave?.title}</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {albums.map(album => (
                      <button
                        key={album.id}
                        onClick={() => handleSaveToAlbum(album.id)}
                        className="w-full text-left px-3 py-2 bg-white/5 hover:bg-[#89AC76]/10 rounded border border-white/10 hover:border-[#89AC76]/30 transition-colors"
                      >
                        <span className="text-xs text-white">{album.name} ({album.count})</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="w-full mt-3 px-3 py-2 bg-white/5 text-white/70 text-xs rounded border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Create Album Modal */}
            {showCreateAlbum && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-lg p-4 w-64 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Create New Album</h4>
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Album name"
                    className="w-full px-3 py-2 bg-white/5 text-white text-xs rounded border border-white/10 focus:border-[#89AC76]/30 focus:outline-none mb-3"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateAlbum}
                      className="flex-1 px-3 py-2 bg-[#89AC76]/20 text-[#89AC76] text-xs rounded border border-[#89AC76]/30 hover:bg-[#89AC76]/30 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateAlbum(false);
                        setNewAlbumName('');
                      }}
                      className="flex-1 px-3 py-2 bg-white/5 text-white/70 text-xs rounded border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AtmoCard>

          {/* Card 3 - Obsidian Knowledge Graph */}
          <ObsidianKnowledgeGraph className="w-full h-full overflow-hidden" />

          {/* Card 4 - Priority Stream (Mission Control - Replaces Roadmap) */}
          <PriorityStreamEnhanced compact={true} className="w-full h-full" />

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
    </div>
  );
};

export default DigitalBrain;
