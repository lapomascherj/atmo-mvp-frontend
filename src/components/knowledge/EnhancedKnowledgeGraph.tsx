import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import SphereChat from '@/components/atoms/SphereChat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  Search,
  Filter,
  Target,
  Lightbulb,
  BookOpen,
  User,
  Briefcase,
  Calendar,
  Settings
} from 'lucide-react';

// Store imports
import { useProjectsStore } from '@/stores/useProjectsStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { useKnowledgeItemsStore } from '@/stores/useKnowledgeItemsStore';
import { useMockIntegrationsStore } from '@/stores/useMockIntegrationsStore';

// Utilities
import { analyzeKnowledgeGraph, calculateNodePosition, calculateConnectionStrength } from '@/utils/knowledgeGraphAnalyzer';

// Types
interface GraphNode {
  id: string;
  type: 'project' | 'task' | 'goal' | 'knowledge' | 'persona' | 'integration';
  label: string;
  description?: string;
  x: number;
  y: number;
  size: number;
  color: string;
  connections: string[];
  metadata: Record<string, any>;
}

interface GraphConnection {
  id: string;
  from: string;
  to: string;
  type: 'contains' | 'supports' | 'informs' | 'assigned' | 'related';
  strength: number;
  color: string;
  animated: boolean;
  opacity?: number;
}

interface SearchFilters {
  query: string;
  nodeTypes: string[];
  status: string[];
  priority: string[];
  dateRange: null | { start: Date; end: Date };
  tags: string[];
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AIInsight {
  type: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
}

interface EnhancedKnowledgeGraphProps {
  className?: string;
}

export const EnhancedKnowledgeGraph: React.FC<EnhancedKnowledgeGraphProps> = ({ className }) => {
  // Store data
  const projects = useProjectsStore(state => state.projects);
  const tasks = useTasksStore(state => state.tasks);
  const goals = useGoalsStore(state => state.goals);
  const personas = usePersonasStore(state => state.currentPersona);
  const knowledgeItems = useKnowledgeItemsStore(state => state.knowledgeItems);
  const integrations = useMockIntegrationsStore(state => state.integrations);

  // Component state
  const [expandedGraph, setExpandedGraph] = useState(false);
  const [isGraphChatActive, setIsGraphChatActive] = useState(false);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: GraphNode;
    actions: Array<{ label: string; action: () => void; destructive?: boolean }>;
  } | null>(null);

  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    nodeTypes: ['all'],
    status: ['all'],
    priority: ['all'],
    dateRange: null,
    tags: []
  });

  // AI Insights state
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Pan and zoom state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Position calculation helpers using utility function
  const calculatePosition = useCallback((item: any, type: string, index: number, total: number) => {
    return calculateNodePosition(item, type, index, total, 150, 100);
  }, []);

  const calculateNodeSize = useCallback((connections: number, priority?: string) => {
    const baseSize = 8;
    const connectionBonus = Math.min(connections * 2, 12);
    const priorityBonus = priority === 'high' ? 4 : priority === 'medium' ? 2 : 0;
    return baseSize + connectionBonus + priorityBonus;
  }, []);

  const getNodeColor = useCallback((type: string, status?: string, priority?: string) => {
    const colors = {
      project: '#3B82F6',
      task: '#10B981',
      goal: '#8B5CF6',
      knowledge: '#F59E0B',
      persona: '#EF4444',
      integration: '#6B7280'
    };

    let baseColor = colors[type as keyof typeof colors] || '#6B7280';
    
    // Adjust opacity based on status
    if (status === 'completed') {
      baseColor += '80'; // 50% opacity
    } else if (status === 'paused') {
      baseColor += 'B3'; // 70% opacity
    }

    return baseColor;
  }, []);

  // Generate nodes from real data
  const generateKnowledgeNodes = useMemo(() => {
    const nodes: GraphNode[] = [];

    // Project nodes
    projects.forEach((project, index) => {
      const position = calculatePosition(project, 'project', index, projects.length);
      const relatedTasks = tasks.filter(task => task.project_id === project.id);
      const relatedGoals = goals.filter(goal => goal.project_id === project.id);
      
      nodes.push({
        id: `project-${project.id}`,
        type: 'project',
        label: project.name || 'Untitled Project',
        description: project.description,
        x: position.x,
        y: position.y,
        size: calculateNodeSize(relatedTasks.length + relatedGoals.length, project.priority),
        color: getNodeColor('project', project.status, project.priority),
        connections: [
          ...relatedTasks.map(t => `task-${t.id}`),
          ...relatedGoals.map(g => `goal-${g.id}`)
        ],
        metadata: {
          status: project.status,
          progress: project.progress,
          priority: project.priority,
          startDate: project.startDate,
          category: project.category
        }
      });
    });

    // Task nodes
    tasks.forEach((task, index) => {
      const parentProject = projects.find(p => p.id === task.project_id);
      const basePosition = parentProject ? 
        nodes.find(n => n.id === `project-${parentProject.id}`) : 
        { x: 100, y: 100 };
      
      const angle = (index / tasks.length) * 2 * Math.PI;
      const radius = 30;
      
      nodes.push({
        id: `task-${task.id}`,
        type: 'task',
        label: task.name || 'Untitled Task',
        description: task.description,
        x: (basePosition?.x || 100) + radius * Math.cos(angle),
        y: (basePosition?.y || 100) + radius * Math.sin(angle),
        size: calculateNodeSize(0, task.priority),
        color: getNodeColor('task', task.status, task.priority),
        connections: parentProject ? [`project-${parentProject.id}`] : [],
        metadata: {
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date,
          completed: task.completed,
          estimatedHours: task.estimated_time
        }
      });
    });

    // Goal nodes
    goals.forEach((goal, index) => {
      const parentProject = projects.find(p => p.id === goal.project_id);
      const basePosition = parentProject ? 
        nodes.find(n => n.id === `project-${parentProject.id}`) : 
        { x: 200, y: 100 };
      
      const angle = (index / goals.length) * 2 * Math.PI;
      const radius = 50;
      
      const relatedTasks = tasks.filter(task => task.goal_id === goal.id);
      
      nodes.push({
        id: `goal-${goal.id}`,
        type: 'goal',
        label: goal.name || 'Untitled Goal',
        description: goal.description,
        x: (basePosition?.x || 200) + radius * Math.cos(angle),
        y: (basePosition?.y || 100) + radius * Math.sin(angle),
        size: calculateNodeSize(relatedTasks.length),
        color: getNodeColor('goal', goal.status),
        connections: [
          ...(parentProject ? [`project-${parentProject.id}`] : []),
          ...relatedTasks.map(t => `task-${t.id}`)
        ],
        metadata: {
          status: goal.status,
          progress: goal.progress,
          targetDate: goal.target_date,
          category: goal.category
        }
      });
    });

    // Knowledge item nodes
    knowledgeItems.forEach((item, index) => {
      const position = calculatePosition(item, 'knowledge', index, knowledgeItems.length);
      
      nodes.push({
        id: `knowledge-${item.id}`,
        type: 'knowledge',
        label: item.title || item.name || 'Untitled Item',
        description: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        x: position.x + 200, // Offset knowledge items
        y: position.y,
        size: calculateNodeSize(item.projects?.length || 0),
        color: getNodeColor('knowledge'),
        connections: item.projects?.map(pid => `project-${pid}`) || [],
        metadata: {
          type: item.type,
          source: item.source,
          tags: item.tags,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }
      });
    });

    // Persona node (if available)
    if (personas) {
      nodes.push({
        id: `persona-${personas.id}`,
        type: 'persona',
        label: personas.nickname || 'User',
        description: 'Your digital persona',
        x: 150,
        y: 50,
        size: 20,
        color: getNodeColor('persona'),
        connections: projects.map(p => `project-${p.id}`),
        metadata: {
          iam: personas.iam,
          onboardingCompleted: personas.onboarding_completed
        }
      });
    }

    return nodes;
  }, [projects, tasks, goals, knowledgeItems, personas, calculatePosition, calculateNodeSize, getNodeColor]);

  // Generate connections between nodes
  const generateConnections = useMemo(() => {
    const connections: GraphConnection[] = [];

    // Project-Task relationships
    projects.forEach(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id);
      projectTasks.forEach(task => {
        connections.push({
          id: `proj-task-${project.id}-${task.id}`,
          from: `project-${project.id}`,
          to: `task-${task.id}`,
          type: 'contains',
          strength: 2,
          color: '#3B82F6',
          animated: task.status === 'in_progress',
          opacity: 0.7
        });
      });
    });

    // Goal-Project relationships
    goals.forEach(goal => {
      if (goal.project_id) {
        connections.push({
          id: `goal-proj-${goal.id}-${goal.project_id}`,
          from: `goal-${goal.id}`,
          to: `project-${goal.project_id}`,
          type: 'supports',
          strength: 3,
          color: '#8B5CF6',
          animated: goal.status === 'active',
          opacity: 0.8
        });
      }
    });

    // Goal-Task relationships
    tasks.forEach(task => {
      if (task.goal_id) {
        connections.push({
          id: `task-goal-${task.id}-${task.goal_id}`,
          from: `task-${task.id}`,
          to: `goal-${task.goal_id}`,
          type: 'supports',
          strength: 1,
          color: '#10B981',
          animated: task.status === 'in_progress',
          opacity: 0.6
        });
      }
    });

    // Knowledge-Project relationships
    knowledgeItems.forEach(item => {
      if (item.projects) {
        item.projects.forEach(projectId => {
          connections.push({
            id: `knowledge-proj-${item.id}-${projectId}`,
            from: `knowledge-${item.id}`,
            to: `project-${projectId}`,
            type: 'informs',
            strength: 1,
            color: '#F59E0B',
            animated: false,
            opacity: 0.5
          });
        });
      }
    });

    // Persona-Project relationships
    if (personas) {
      projects.forEach(project => {
        connections.push({
          id: `persona-proj-${personas.id}-${project.id}`,
          from: `persona-${personas.id}`,
          to: `project-${project.id}`,
          type: 'assigned',
          strength: 2,
          color: '#EF4444',
          animated: project.status === 'active',
          opacity: 0.6
        });
      });
    }

    return connections;
  }, [projects, tasks, goals, knowledgeItems, personas]);

  // Filter nodes based on search criteria
  const filteredNodes = useMemo(() => {
    return generateKnowledgeNodes.filter(node => {
      // Text search
      if (searchFilters.query) {
        const searchLower = searchFilters.query.toLowerCase();
        if (!node.label.toLowerCase().includes(searchLower) &&
            !node.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (!searchFilters.nodeTypes.includes('all') && 
          !searchFilters.nodeTypes.includes(node.type)) {
        return false;
      }

      // Status filter
      if (!searchFilters.status.includes('all') &&
          !searchFilters.status.includes(node.metadata?.status)) {
        return false;
      }

      // Priority filter
      if (!searchFilters.priority.includes('all') &&
          !searchFilters.priority.includes(node.metadata?.priority)) {
        return false;
      }

      return true;
    });
  }, [generateKnowledgeNodes, searchFilters]);

  // Filter connections based on filtered nodes
  const filteredConnections = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    return generateConnections.filter(conn => 
      nodeIds.has(conn.from) && nodeIds.has(conn.to)
    );
  }, [generateConnections, filteredNodes]);

  // Handle node interactions
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    
    switch(node.type) {
      case 'project':
        // Could navigate to project view
        console.log('Navigate to project:', node.id);
        break;
      case 'task':
        console.log('Open task editor:', node.id);
        break;
      case 'goal':
        console.log('Highlight goal network:', node.id);
        break;
      case 'knowledge':
        console.log('View knowledge item:', node.id);
        break;
      case 'persona':
        console.log('Show persona details:', node.id);
        break;
    }
  }, []);

  const handleNodeRightClick = useCallback((e: React.MouseEvent, node: GraphNode) => {
    e.preventDefault();
    const actions = [
      { label: 'View Details', action: () => handleNodeClick(node) },
      { label: 'Edit', action: () => console.log('Edit node:', node.id) },
      { label: 'Delete', action: () => console.log('Delete node:', node.id), destructive: true }
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
      actions
    });
  }, [handleNodeClick]);

  // Pan and zoom handlers
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    
    setViewBox(prev => ({
      ...prev,
      x: prev.x - deltaX / zoomLevel,
      y: prev.y - deltaY / zoomLevel
    }));
    
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, zoomLevel]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoom = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
  }, []);

  // AI Insights generation using the analyzer utility
  const generateInsights = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const graphData = {
        nodes: filteredNodes,
        connections: filteredConnections,
        userContext: {
          activeProjects: projects.filter(p => p.status === 'active').length,
          overdueTasks: tasks.filter(t => new Date(t.due_date || '') < new Date()).length,
          completedGoals: goals.filter(g => g.status === 'completed').length
        }
      };

      const aiInsights = await analyzeKnowledgeGraph(
        filteredNodes,
        filteredConnections,
        graphData.userContext
      );
      
      setInsights(aiInsights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setInsights([{
        type: 'Error',
        message: 'Unable to generate insights at this time.',
        priority: 'low'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [filteredNodes, filteredConnections, projects, tasks, goals]);

  // Stats calculation
  const totalNodes = filteredNodes.length;
  const totalConnections = filteredConnections.length;
  const lastUpdated = new Date().toLocaleTimeString();

  // Compact graph preview component
  const CompactGraphPreview = () => (
    <div className="flex-1 bg-white/95 rounded-lg border border-blue-400/20 relative overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 300 200">
        {/* Connections */}
        {filteredConnections.slice(0, 10).map(conn => {
          const fromNode = filteredNodes.find(n => n.id === conn.from);
          const toNode = filteredNodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <line
              key={conn.id}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={conn.color}
              strokeWidth={conn.strength}
              opacity={conn.opacity || 0.6}
              className={conn.animated ? "animate-pulse" : ""}
            />
          );
        })}
        
        {/* Nodes */}
        {filteredNodes.slice(0, 15).map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={node.color}
              opacity={0.8}
              className="hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            {hoveredNode === node.id && (
              <text
                x={node.x}
                y={node.y - node.size - 5}
                className="text-xs fill-slate-700 text-center pointer-events-none"
                textAnchor="middle"
              >
                {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      
      {/* Click to expand overlay */}
      <div 
        className="absolute inset-0 bg-transparent hover:bg-blue-400/5 transition-colors cursor-pointer flex items-center justify-center"
        onClick={() => setExpandedGraph(true)}
      >
        <div className="opacity-0 hover:opacity-100 transition-opacity bg-blue-400/90 text-white px-3 py-1 rounded-full text-xs">
          Click to explore
        </div>
      </div>
    </div>
  );

  // Filter toggle helper
  const toggleFilter = (filterType: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => {
      const currentValues = prev[filterType] as string[];
      if (value === 'all') {
        return { ...prev, [filterType]: ['all'] };
      }
      
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value && v !== 'all')
        : [...currentValues.filter(v => v !== 'all'), value];
      
      return { ...prev, [filterType]: newValues.length ? newValues : ['all'] };
    });
  };

  // Real-time updates - subscribe to store changes
  useEffect(() => {
    // Subscribe to projects store changes
    const unsubscribeProjects = useProjectsStore.subscribe(
      (state) => state.projects,
      (projects) => {
        console.log('🔄 Knowledge Graph: Projects updated, refreshing graph');
        // The graph will automatically update due to useMemo dependencies
      }
    );

    // Subscribe to tasks store changes
    const unsubscribeTasks = useTasksStore.subscribe(
      (state) => state.tasks,
      (tasks) => {
        console.log('🔄 Knowledge Graph: Tasks updated, refreshing graph');
        // The graph will automatically update due to useMemo dependencies
      }
    );

    // Subscribe to goals store changes
    const unsubscribeGoals = useGoalsStore.subscribe(
      (state) => state.goals,
      (goals) => {
        console.log('🔄 Knowledge Graph: Goals updated, refreshing graph');
        // The graph will automatically update due to useMemo dependencies
      }
    );

    // Subscribe to knowledge items store changes
    const unsubscribeKnowledge = useKnowledgeItemsStore.subscribe(
      (state) => state.knowledgeItems,
      (knowledgeItems) => {
        console.log('🔄 Knowledge Graph: Knowledge items updated, refreshing graph');
        // The graph will automatically update due to useMemo dependencies
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeGoals();
      unsubscribeKnowledge();
    };
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Auto-refresh insights when data changes
  useEffect(() => {
    if (expandedGraph && (projects.length > 0 || tasks.length > 0)) {
      generateInsights();
    }
  }, [projects.length, tasks.length, goals.length, knowledgeItems.length, expandedGraph, generateInsights]);

  return (
    <>
      {/* Compact Card View */}
      <AtmoCard variant="blue" className={`w-full h-full p-4 ${className}`} hover={true}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Knowledge Graph</h3>
            </div>
            <button 
              onClick={() => setExpandedGraph(true)}
              className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Expand Graph"
            >
              <Maximize2 size={12} className="text-white/60" />
            </button>
          </div>

          {/* Compact Graph Preview */}
          <CompactGraphPreview />
        </div>
      </AtmoCard>

      {/* Expanded Modal View */}
      {expandedGraph && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="w-full h-full max-w-6xl max-h-4xl bg-slate-800 rounded-xl border border-blue-400/30 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Knowledge Graph</h2>
              <div className="flex items-center gap-4">
                {/* ATMO Sphere Integration */}
                <div className="relative">
                  <SphereChat
                    size={40}
                    isActive={isGraphChatActive}
                    isListening={isGraphChatActive}
                    onClick={() => setIsGraphChatActive(!isGraphChatActive)}
                    voiceSupported={true}
                  />
                </div>
                <button
                  onClick={() => setExpandedGraph(false)}
                  className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Full Graph Area */}
            <div className="flex-1 bg-gradient-to-br from-white via-slate-50 to-blue-50 relative">
              <svg 
                className="w-full h-full cursor-move" 
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onWheel={handleZoom}
              >
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Connections */}
                {filteredConnections.map(conn => {
                  const fromNode = filteredNodes.find(n => n.id === conn.from);
                  const toNode = filteredNodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  
                  return (
                    <g key={conn.id}>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={conn.color}
                        strokeWidth={conn.strength * zoomLevel}
                        opacity={conn.opacity || 0.6}
                        filter="url(#glow)"
                        className={conn.animated ? "animate-pulse" : "transition-all duration-300"}
                      />
                    </g>
                  );
                })}
                
                {/* Nodes */}
                {filteredNodes.map(node => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size * zoomLevel}
                      fill={node.color}
                      filter="url(#glow)"
                      className="cursor-pointer hover:opacity-90 transition-all"
                      onClick={() => handleNodeClick(node)}
                      onContextMenu={(e) => handleNodeRightClick(e, node)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    {(hoveredNode === node.id || selectedNode?.id === node.id) && (
                      <>
                        <text
                          x={node.x}
                          y={node.y}
                          className="text-xs font-medium fill-white text-center pointer-events-none"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {node.type === 'project' ? '🚀' : 
                           node.type === 'task' ? '✓' :
                           node.type === 'goal' ? '🎯' :
                           node.type === 'knowledge' ? '📚' :
                           node.type === 'persona' ? '👤' : '⚙️'}
                        </text>
                        <text
                          x={node.x}
                          y={node.y + node.size * zoomLevel + 16}
                          className="text-xs font-medium fill-slate-700 text-center pointer-events-none"
                          textAnchor="middle"
                        >
                          {node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
                        </text>
                      </>
                    )}
                  </g>
                ))}
              </svg>
              
              {/* Graph Controls */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <button 
                  onClick={() => setZoomLevel(prev => Math.min(3, prev * 1.2))}
                  className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
                >
                  <ZoomIn size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setZoomLevel(prev => Math.max(0.1, prev * 0.8))}
                  className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
                >
                  <ZoomOut size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => {
                    setViewBox({ x: 0, y: 0, width: 800, height: 600 });
                    setZoomLevel(1);
                  }}
                  className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
                >
                  <RotateCcw size={16} className="text-slate-700" />
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search knowledge..."
                    className="w-64 px-4 py-2 bg-white/90 rounded-lg shadow-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchFilters(prev => ({ ...prev, query: e.target.value }));
                    }}
                  />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
                  >
                    <Filter size={16} className="text-slate-700" />
                  </button>
                </div>
                
                {/* Advanced Filter Panel */}
                {showFilters && (
                  <div className="w-80 bg-white/95 rounded-lg shadow-xl p-4 border border-blue-400/20">
                    <h4 className="font-semibold text-slate-800 mb-3">Filter Graph</h4>
                    
                    {/* Node Type Filter */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-slate-600 mb-2 block">Node Types</label>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'project', 'task', 'goal', 'knowledge', 'persona'].map(type => (
                          <button
                            key={type}
                            onClick={() => toggleFilter('nodeTypes', type)}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${
                              searchFilters.nodeTypes.includes(type)
                                ? 'bg-blue-400 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-slate-600 mb-2 block">Status</label>
                      <Select 
                        value={searchFilters.status[0]} 
                        onValueChange={(value) => setSearchFilters(prev => ({...prev, status: [value]}))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Insights Panel */}
              <div className="absolute bottom-4 left-4 w-80 bg-slate-800/90 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">AI Insights</h4>
                  <button
                    onClick={generateInsights}
                    disabled={isAnalyzing}
                    className="px-3 py-1 bg-blue-400 hover:bg-blue-500 rounded text-xs transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Refresh'}
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {insights.map((insight, index) => (
                    <div key={index} className="text-xs bg-white/10 rounded p-2">
                      <div className="font-medium text-blue-300">{insight.type}</div>
                      <div className="text-white/80">{insight.message}</div>
                      {insight.action && (
                        <button
                          onClick={insight.action}
                          className="mt-1 text-blue-300 hover:text-blue-200 underline"
                        >
                          {insight.actionLabel}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Graph Stats Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{totalNodes} nodes • {totalConnections} connections</span>
                <span>Last updated: {lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-slate-800 rounded-lg shadow-xl border border-white/10 py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                setContextMenu(null);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                action.destructive ? 'text-red-400' : 'text-white'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default EnhancedKnowledgeGraph;
