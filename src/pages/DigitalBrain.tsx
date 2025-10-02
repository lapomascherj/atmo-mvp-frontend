import React, { useState, useEffect } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { CardContent, CardHeader } from '@/components/atoms/Card';
import SphereChat from '@/components/atoms/SphereChat';
import { User, BarChart3, Brain, Lightbulb, ChevronUp, TrendingUp, Target, Zap, Star, Radar, Settings, Filter, BookOpen, Plus, Circle, X, Edit3 } from 'lucide-react';
import { SchedulerView } from '@/components/scheduler/SchedulerView';
import { type SchedulerEvent } from '@/types/scheduler';
import { ObsidianKnowledgeGraph } from '@/components/knowledge/ObsidianKnowledgeGraph';

const STORAGE_KEY = 'atmo_roadmap_tasks';

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
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const chatInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [sendingOpportunityIds, setSendingOpportunityIds] = useState<Set<string>>(new Set());

  // Load tasks from localStorage on mount
  const loadTasksFromStorage = (): SchedulerEvent[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
    }
    // Default tasks if nothing in storage
    return [
      {
        id: 'task-1',
        title: 'Morning Meeting',
        startTime: '08:00',
        duration: 30,
      },
      {
        id: 'task-2',
        title: 'Project Planning',
        startTime: '09:00',
        duration: 60,
      },
      {
        id: 'task-3',
        title: 'Team Sync',
        startTime: '10:00',
        duration: 45,
      },
      {
        id: 'task-4',
        title: 'Lunch Break',
        startTime: '12:00',
        duration: 60,
      },
      {
        id: 'task-5',
        title: 'Design Review',
        startTime: '14:00',
        duration: 90,
      },
      {
        id: 'task-6',
        title: 'Client Call',
        startTime: '16:00',
        duration: 45,
      },
      {
        id: 'task-7',
        title: 'Wrap Up',
        startTime: '17:00',
        duration: 30,
      },
    ];
  };

  const [events, setEvents] = useState<SchedulerEvent[]>(loadTasksFromStorage());

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      // TODO: Add API call here for cross-device sync
      // await syncTasksToBackend(events);
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }, [events]);

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

  const handleQuickCapture = () => {
    setIsCapturing(!isCapturing);
  };

  // Chat functions
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      // Force instant scroll to bottom without animation for perfect snapping
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const focusChatInput = () => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  React.useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [chatMessages]);

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

    // Focus chat input after short delay
    setTimeout(() => {
      focusChatInput();
      // Remove from sending set after debounce period
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
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: chatInput,
        sender: 'user' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');

      // Simulate AI response
      setTimeout(() => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: "I'm processing your request. This is a demo response!",
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      {/* Left Section - Cards Grid */}
      <div className="flex-1 h-full flex flex-col p-6 pl-8 pr-4">
        {/* Page Title - Top Left */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">Digital Brain</h1>
          <p className="text-white/60 text-xs">Your personal knowledge ecosystem</p>
        </div>

        {/* 2x2 Grid of Cards - Smaller */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4 max-h-[calc(100vh-140px)]">

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

              {/* Visual Section - Growth Mountain */}
              <div className="flex-1 flex items-center justify-center mb-4">
                <div className="w-full h-16 relative">
                  {/* Simple Mountain Line Visual */}
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <defs>
                      <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(168 85 247 / 0.3)" />
                        <stop offset="100%" stopColor="rgb(168 85 247 / 0.1)" />
                      </linearGradient>
                    </defs>
                    {/* Mountain path */}
                    <path
                      d="M10,50 L30,35 L50,30 L80,20 L120,15 L160,25 L190,20"
                      stroke="rgb(168 85 247 / 0.8)"
                      strokeWidth="2"
                      fill="none"
                      className="drop-shadow-sm"
                    />
                    {/* Fill area under mountain */}
                    <path
                      d="M10,50 L30,35 L50,30 L80,20 L120,15 L160,25 L190,20 L190,50 Z"
                      fill="url(#mountainGradient)"
                    />
                    {/* Current position dot */}
                    <circle cx="160" cy="25" r="3" fill="rgb(168 85 247)" className="animate-pulse" />
                  </svg>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex justify-between items-end">
                {/* Left: Progress Tracker */}
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-purple-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Level 7</p>
                    <p className="text-xs text-white/50">142 steps climbed</p>
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
                    <span className="text-xs font-medium text-purple-400">3</span>
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

          {/* Card 4 - Analytics with Scheduler */}
          <AtmoCard variant="gold" className="w-full h-full overflow-hidden" hover={true}>
            <SchedulerView
              events={events}
              onEventsChange={setEvents}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </AtmoCard>

        </div>
      </div>

      {/* Right Panel - Avatar and Chat */}
      <div className="w-64 h-full flex flex-col p-6 pt-32">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="relative"
            style={{
              filter: 'drop-shadow(0 0 15px rgba(204, 85, 0, 0.15))',
            }}
          >
            <SphereChat
              size={90}
              isActive={isCapturing}
              isListening={isCapturing}
              onClick={handleQuickCapture}
              voiceSupported={true}
            />

            {/* Subtle glow effects */}
            <div className={`absolute inset-0 -z-10 bg-[#CC5500]/10 rounded-full blur-xl transition-all duration-300 ${
              isCapturing ? 'animate-pulse scale-110' : 'animate-pulse-soft'
            }`}></div>
            <div className={`absolute inset-0 -z-20 bg-[#CC5500]/5 rounded-full blur-2xl scale-150 transition-all duration-300 ${
              isCapturing ? 'animate-pulse scale-125' : 'animate-pulse-soft'
            }`}></div>
          </div>

          {/* Voice Control X Button */}
          {isCapturing && (
            <div className="mt-6">
              <button
                onClick={() => setIsCapturing(false)}
                className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-lg flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Chat Section - Blue outlined area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Messages Container - Scrollable */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2"
            style={{
              scrollBehavior: 'smooth',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 100%)'
            }}
          >
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[slideIn_0.3s_ease-out]`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-[#CC5500]/80 to-[#CC5500]/60 text-white rounded-[18px] rounded-br-[6px]'
                      : 'bg-white/10 text-white/90 rounded-[18px] rounded-bl-[6px] backdrop-blur-sm border border-white/10'
                  } shadow-lg`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <span className="text-[10px] opacity-60 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Box - Red outlined area (fixed at bottom) */}
          <div className="flex-shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-3 shadow-xl">
              <div className="flex items-end gap-2">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none resize-none min-h-[32px] max-h-[120px] py-1 px-2 rounded-xl"
                  rows={1}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#CC5500] to-[#CC5500]/80 hover:from-[#CC5500]/90 hover:to-[#CC5500]/70 disabled:from-white/10 disabled:to-white/5 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 shadow-lg"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalBrain;
