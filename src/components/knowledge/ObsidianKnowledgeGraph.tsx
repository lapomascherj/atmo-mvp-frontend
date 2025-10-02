import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { Brain, Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ObsidianKnowledgeGraphProps {
  className?: string;
}

// Main categories with sub-nodes
const MAIN_CATEGORIES = [
  {
    id: 'personal',
    label: 'Personal',
    icon: '👤',
    color: '#3B82F6', // Blue
    position: { x: 200, y: 150 },
    subNodes: [
      { id: 'personal-goals', label: 'Life Goals', icon: '🎯' },
      { id: 'personal-habits', label: 'Daily Habits', icon: '⚡' },
      { id: 'personal-growth', label: 'Self Development', icon: '📈' },
      { id: 'personal-relationships', label: 'Relationships', icon: '💝' },
      { id: 'personal-finance', label: 'Finance', icon: '💰' },
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: '🚀',
    color: '#10B981', // Green
    position: { x: 400, y: 150 },
    subNodes: [
      { id: 'project-atmo', label: 'ATMO Platform', icon: '🧠' },
      { id: 'project-startup', label: 'Startup Ideas', icon: '💡' },
      { id: 'project-learning', label: 'Learning Projects', icon: '📚' },
      { id: 'project-side', label: 'Side Projects', icon: '🔧' },
      { id: 'project-collab', label: 'Collaborations', icon: '🤝' },
    ]
  },
  {
    id: 'inspo',
    label: 'Inspo',
    icon: '✨',
    color: '#F59E0B', // Orange
    position: { x: 200, y: 350 },
    subNodes: [
      { id: 'inspo-quotes', label: 'Quotes', icon: '💭' },
      { id: 'inspo-books', label: 'Books', icon: '📖' },
      { id: 'inspo-articles', label: 'Articles', icon: '📄' },
      { id: 'inspo-videos', label: 'Videos', icon: '🎥' },
      { id: 'inspo-people', label: 'Inspiring People', icon: '🌟' },
    ]
  },
  {
    id: 'health',
    label: 'Health',
    icon: '🌱',
    color: '#8B5CF6', // Purple
    position: { x: 400, y: 350 },
    subNodes: [
      { id: 'health-fitness', label: 'Fitness', icon: '💪' },
      { id: 'health-nutrition', label: 'Nutrition', icon: '🥗' },
      { id: 'health-mental', label: 'Mental Health', icon: '🧘' },
      { id: 'health-sleep', label: 'Sleep', icon: '😴' },
      { id: 'health-medical', label: 'Medical', icon: '🏥' },
    ]
  }
];

export const ObsidianKnowledgeGraph: React.FC<ObsidianKnowledgeGraphProps> = ({ className }) => {
  // State management
  const [expandedGraph, setExpandedGraph] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, {x: number, y: number}>>({});
  
  // Pan and zoom state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize node positions
  useEffect(() => {
    const initialPositions: Record<string, {x: number, y: number}> = {};
    MAIN_CATEGORIES.forEach(category => {
      initialPositions[category.id] = category.position;
      category.subNodes.forEach((subNode, index) => {
        const radius = 80;
        const angleStep = (2 * Math.PI) / category.subNodes.length;
        const angle = index * angleStep;
        initialPositions[subNode.id] = {
          x: category.position.x + radius * Math.cos(angle),
          y: category.position.y + radius * Math.sin(angle)
        };
      });
    });
    setNodePositions(initialPositions);
  }, []);

  // Drag functionality for nodes
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedNode(nodeId);
    setSelectedNode(nodeId);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && draggedNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / viewBox.scale;
      const y = (e.clientY - rect.top) / viewBox.scale;
      
      setNodePositions(prev => ({
        ...prev,
        [draggedNode]: { x, y }
      }));
    } else if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, draggedNode, isPanning, panStart, viewBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
    setIsPanning(false);
  }, []);

  // Pan functionality
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging]);

  // Zoom functionality
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewBox(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * zoomFactor))
    }));
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, scale: 1 });
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setViewBox(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.2)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewBox(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale * 0.8)
    }));
  }, []);

  // Generate sub-node positions around main nodes
  const generateSubNodePositions = (mainNode: any, subNodes: any[]) => {
    const radius = expandedGraph ? 120 : 60;
    const angleStep = (2 * Math.PI) / subNodes.length;
    
    return subNodes.map((subNode, index) => {
      const angle = index * angleStep;
      const mainPos = nodePositions[mainNode.id] || mainNode.position;
      return {
        ...subNode,
        x: mainPos.x + radius * Math.cos(angle),
        y: mainPos.y + radius * Math.sin(angle)
      };
    });
  };

  // Get node details for info panel
  const getNodeDetails = (nodeId: string) => {
    for (const category of MAIN_CATEGORIES) {
      if (category.id === nodeId) {
        return {
          label: category.label,
          icon: category.icon,
          type: 'Main Category',
          subCount: category.subNodes.length
        };
      }
      const subNode = category.subNodes.find(sub => sub.id === nodeId);
      if (subNode) {
        return {
          label: subNode.label,
          icon: subNode.icon,
          type: 'Sub Node',
          category: category.label
        };
      }
    }
    return null;
  };

  // Compact Graph Preview Component
  const CompactGraphPreview = () => (
    <div className="flex-1 knowledge-graph-cosmic rounded-lg border border-blue-400/20 relative overflow-hidden">
      <svg 
        className="w-full h-full cursor-move" 
        viewBox="0 0 600 500"
        onMouseDown={handlePanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Render connections */}
        {MAIN_CATEGORIES.map(category => {
          const subNodes = generateSubNodePositions(category, category.subNodes);
          const mainPos = nodePositions[category.id] || category.position;
          return subNodes.map(subNode => (
            <line
              key={`${category.id}-${subNode.id}`}
              x1={mainPos.x}
              y1={mainPos.y}
              x2={subNode.x}
              y2={subNode.y}
              className={`connection-line ${hoveredNode === category.id || hoveredNode === subNode.id ? 'active' : ''}`}
            />
          ));
        })}
        
        {/* Render main category nodes */}
        {MAIN_CATEGORIES.map(category => {
          const pos = nodePositions[category.id] || category.position;
          return (
            <g key={category.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="25"
                fill={category.color}
                className="main-node cursor-pointer"
                onMouseDown={(e) => handleNodeMouseDown(e, category.id)}
                onMouseEnter={() => setHoveredNode(category.id)}
                onMouseLeave={() => setHoveredNode(null)}
              />
              <text
                x={pos.x}
                y={pos.y}
                className="text-sm font-medium fill-white text-center pointer-events-none"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {category.icon}
              </text>
              <text
                x={pos.x}
                y={pos.y + 40}
                className="text-xs font-medium fill-white text-center pointer-events-none"
                textAnchor="middle"
              >
                {category.label}
              </text>
            </g>
          );
        })}
        
        {/* Render sub-nodes */}
        {MAIN_CATEGORIES.map(category => {
          const subNodes = generateSubNodePositions(category, category.subNodes);
          return subNodes.map(subNode => (
            <g key={subNode.id}>
              <circle
                cx={subNode.x}
                cy={subNode.y}
                r="8"
                fill={category.color}
                opacity="0.7"
                className="sub-node cursor-pointer"
                onMouseDown={(e) => handleNodeMouseDown(e, subNode.id)}
                onMouseEnter={() => setHoveredNode(subNode.id)}
                onMouseLeave={() => setHoveredNode(null)}
              />
              {hoveredNode === subNode.id && (
                <text
                  x={subNode.x}
                  y={subNode.y - 15}
                  className="text-xs fill-white text-center pointer-events-none"
                  textAnchor="middle"
                >
                  {subNode.label}
                </text>
              )}
            </g>
          ));
        })}
      </svg>
      
      {/* Click to expand overlay */}
      <div 
        className="absolute inset-0 bg-transparent hover:bg-blue-400/5 transition-colors cursor-pointer flex items-center justify-center"
        onClick={() => setExpandedGraph(true)}
      >
        <div className="opacity-0 hover:opacity-100 transition-opacity bg-blue-400/90 text-white px-3 py-1 rounded-full text-xs">
          Click to explore cosmos
        </div>
      </div>
    </div>
  );

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
              title="Expand Cosmos"
            >
              <Maximize2 size={12} className="text-white/60" />
            </button>
          </div>

          <CompactGraphPreview />
        </div>
      </AtmoCard>

      {/* Expanded Modal View - Wide Format */}
      {expandedGraph && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8">
          <div className="w-[90vw] h-[70vh] bg-slate-800 rounded-xl border border-blue-400/30 flex flex-col overflow-hidden">
            
            {/* Modal Header with ATMO Branding */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                  <Brain size={16} className="text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">ATMO Knowledge Cosmos</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Graph Controls */}
                <button 
                  onClick={zoomIn}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={14} className="text-white/60" />
                </button>
                <button 
                  onClick={zoomOut}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} className="text-white/60" />
                </button>
                <button 
                  onClick={resetView}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center transition-colors"
                  title="Reset View"
                >
                  <RotateCcw size={14} className="text-white/60" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button
                  onClick={() => setExpandedGraph(false)}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X size={14} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Full Graph Area - Cosmic Theme */}
            <div className="flex-1 knowledge-graph-cosmic relative">
              <svg 
                ref={svgRef}
                className="w-full h-full cursor-move" 
                viewBox={`${-viewBox.x / viewBox.scale} ${-viewBox.y / viewBox.scale} ${1200 / viewBox.scale} ${600 / viewBox.scale}`}
                onMouseDown={handlePanStart}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* Enhanced connections with glow effects */}
                {MAIN_CATEGORIES.map(category => {
                  const subNodes = generateSubNodePositions(category, category.subNodes);
                  const mainPos = nodePositions[category.id] || category.position;
                  return subNodes.map(subNode => (
                    <line
                      key={`${category.id}-${subNode.id}`}
                      x1={mainPos.x}
                      y1={mainPos.y}
                      x2={subNode.x}
                      y2={subNode.y}
                      stroke={category.color}
                      strokeWidth={hoveredNode === category.id || hoveredNode === subNode.id ? "2" : "1"}
                      opacity={hoveredNode === category.id || hoveredNode === subNode.id ? "0.8" : "0.3"}
                      className="connection-line transition-all duration-300"
                    />
                  ));
                })}
                
                {/* Enhanced main nodes with cosmic styling */}
                {MAIN_CATEGORIES.map(category => {
                  const pos = nodePositions[category.id] || category.position;
                  return (
                    <g key={category.id}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="30"
                        fill={category.color}
                        className="main-node cursor-pointer"
                        onMouseDown={(e) => handleNodeMouseDown(e, category.id)}
                        onMouseEnter={() => setHoveredNode(category.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{
                          filter: `drop-shadow(0 0 ${hoveredNode === category.id ? '30px' : '20px'} ${category.color}50)`
                        }}
                      />
                      <text
                        x={pos.x}
                        y={pos.y}
                        className="text-lg font-medium fill-white text-center pointer-events-none"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {category.icon}
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 50}
                        className="text-sm font-medium fill-white text-center pointer-events-none"
                        textAnchor="middle"
                      >
                        {category.label}
                      </text>
                    </g>
                  );
                })}
                
                {/* Enhanced sub-nodes with better visibility */}
                {MAIN_CATEGORIES.map(category => {
                  const subNodes = generateSubNodePositions(category, category.subNodes);
                  return subNodes.map(subNode => (
                    <g key={subNode.id}>
                      <circle
                        cx={subNode.x}
                        cy={subNode.y}
                        r="12"
                        fill={category.color}
                        opacity="0.8"
                        className="sub-node cursor-pointer"
                        onMouseDown={(e) => handleNodeMouseDown(e, subNode.id)}
                        onMouseEnter={() => setHoveredNode(subNode.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{
                          filter: `drop-shadow(0 0 ${hoveredNode === subNode.id ? '15px' : '8px'} rgba(255,255,255,0.4))`
                        }}
                      />
                      <text
                        x={subNode.x}
                        y={subNode.y}
                        className="text-xs font-medium fill-white text-center pointer-events-none"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {subNode.icon}
                      </text>
                      {(hoveredNode === subNode.id || selectedNode === subNode.id) && (
                        <text
                          x={subNode.x}
                          y={subNode.y - 25}
                          className="text-xs fill-white text-center pointer-events-none font-medium"
                          textAnchor="middle"
                        >
                          {subNode.label}
                        </text>
                      )}
                    </g>
                  ));
                })}
              </svg>
              
              {/* Floating Info Panel */}
              {selectedNode && (
                <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30 max-w-xs">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <span>{getNodeDetails(selectedNode)?.icon}</span>
                    Node Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-white/90">{getNodeDetails(selectedNode)?.label}</p>
                    <p className="text-blue-300">{getNodeDetails(selectedNode)?.type}</p>
                    {getNodeDetails(selectedNode)?.category && (
                      <p className="text-white/70">Category: {getNodeDetails(selectedNode)?.category}</p>
                    )}
                    {getNodeDetails(selectedNode)?.subCount && (
                      <p className="text-white/70">Sub-nodes: {getNodeDetails(selectedNode)?.subCount}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-blue-400/30">
                <div className="text-xs text-white/70 space-y-1">
                  <p>• Drag nodes to move them</p>
                  <p>• Scroll to zoom in/out</p>
                  <p>• Click and drag to pan</p>
                  <p>• Hover for details</p>
                </div>
              </div>
            </div>
            
            {/* Footer with ATMO Branding */}
            <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-blue-900/20">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>4 main categories • {MAIN_CATEGORIES.reduce((acc, cat) => acc + cat.subNodes.length, 0)} sub-nodes • Interactive cosmos</span>
                <span className="flex items-center gap-2">
                  <span>Powered by ATMO</span>
                  <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ObsidianKnowledgeGraph;
