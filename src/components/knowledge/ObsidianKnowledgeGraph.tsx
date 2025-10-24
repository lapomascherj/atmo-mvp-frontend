import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { Brain, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, BookOpen } from 'lucide-react';
import { PersonalDataCard } from '@/components/organisms/PersonalDataCard';

interface ObsidianKnowledgeGraphProps {
  className?: string;
  user?: any;
}

// Main categories with sub-nodes - All Orange Shades with Varying Sizes
const MAIN_CATEGORIES = [
  {
    id: 'personal',
    label: 'Personal',
    color: '#FF6B35', // Vibrant orange-red
    size: 28, // Larger main node
    position: { x: 200, y: 150 },
    subNodes: [
      { id: 'personal-goals', label: 'Life Goals', size: 8 },
      { id: 'personal-habits', label: 'Daily Habits', size: 6 },
      { id: 'personal-growth', label: 'Self Development', size: 9 },
      { id: 'personal-relationships', label: 'Relationships', size: 7 },
      { id: 'personal-finance', label: 'Finance', size: 6 },
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    color: '#FF8C42', // Warm orange
    size: 32, // Largest main node (most important)
    position: { x: 400, y: 150 },
    subNodes: [
      { id: 'project-atmo', label: 'ATMO Platform', size: 10 },
      { id: 'project-startup', label: 'Startup Ideas', size: 8 },
      { id: 'project-learning', label: 'Learning Projects', size: 7 },
      { id: 'project-side', label: 'Side Projects', size: 6 },
      { id: 'project-collab', label: 'Collaborations', size: 9 },
    ]
  },
  {
    id: 'inspo',
    label: 'Inspo',
    color: '#FFB366', // Light orange
    size: 25, // Medium main node
    position: { x: 200, y: 350 },
    subNodes: [
      { id: 'inspo-quotes', label: 'Quotes', size: 5 },
      { id: 'inspo-books', label: 'Books', size: 8 },
      { id: 'inspo-articles', label: 'Articles', size: 6 },
      { id: 'inspo-videos', label: 'Videos', size: 7 },
      { id: 'inspo-people', label: 'Inspiring People', size: 9 },
    ]
  },
  {
    id: 'health',
    label: 'Health',
    color: '#FFA726', // Golden orange
    size: 30, // Large main node
    position: { x: 400, y: 350 },
    subNodes: [
      { id: 'health-fitness', label: 'Fitness', size: 9 },
      { id: 'health-nutrition', label: 'Nutrition', size: 8 },
      { id: 'health-mental', label: 'Mental Health', size: 10 },
      { id: 'health-sleep', label: 'Sleep', size: 7 },
      { id: 'health-medical', label: 'Medical', size: 6 },
    ]
  }
];

export const ObsidianKnowledgeGraph: React.FC<ObsidianKnowledgeGraphProps> = ({ className, user }) => {
  // State management
  const [expandedGraph, setExpandedGraph] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, {x: number, y: number}>>({});
  const [showPersonalDataCard, setShowPersonalDataCard] = useState(false);
  
  // Pan and zoom state for both compact and expanded views
  const [compactViewBox, setCompactViewBox] = useState({ x: 0, y: 0, scale: 1 });
  const [expandedViewBox, setExpandedViewBox] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  
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

  const handleMouseMove = useCallback((e: React.MouseEvent, isCompact: boolean = false) => {
    const currentViewBox = isCompact ? compactViewBox : expandedViewBox;
    const setCurrentViewBox = isCompact ? setCompactViewBox : setExpandedViewBox;
    
    if (isDragging && draggedNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / currentViewBox.scale;
      const y = (e.clientY - rect.top) / currentViewBox.scale;
      
      setNodePositions(prev => ({
        ...prev,
        [draggedNode]: { x, y }
      }));
    } else if (isPanning) {
      const deltaX = (e.clientX - panStart.x) / currentViewBox.scale;
      const deltaY = (e.clientY - panStart.y) / currentViewBox.scale;
      
      setCurrentViewBox(prev => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, draggedNode, isPanning, panStart, compactViewBox, expandedViewBox]);

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

  // Enhanced wheel/trackpad handling for both zoom and pan
  const handleWheel = useCallback((e: React.WheelEvent, isCompact: boolean = false) => {
    e.preventDefault();
    const currentViewBox = isCompact ? compactViewBox : expandedViewBox;
    const setCurrentViewBox = isCompact ? setCompactViewBox : setExpandedViewBox;
    
    // Detect if this is a pinch gesture (ctrlKey is set for trackpad pinch)
    if (e.ctrlKey) {
      // Pinch to zoom
      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
      setCurrentViewBox(prev => ({
        ...prev,
        scale: Math.max(0.1, Math.min(3, prev.scale * zoomFactor))
      }));
    } else {
      // Two-finger pan gesture
      const panSpeed = 1 / currentViewBox.scale;
      setCurrentViewBox(prev => ({
        ...prev,
        x: prev.x + e.deltaX * panSpeed,
        y: prev.y + e.deltaY * panSpeed
      }));
    }
  }, [compactViewBox, expandedViewBox]);

  // Touch event handlers for mobile and trackpad gestures
  const handleTouchStart = useCallback((e: React.TouchEvent, isCompact: boolean = false) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for potential pan
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch/zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastTouchDistance(distance);
      
      // Set touch start for pan
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setTouchStart({ x: centerX, y: centerY });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, isCompact: boolean = false) => {
    e.preventDefault();
    const currentViewBox = isCompact ? compactViewBox : expandedViewBox;
    const setCurrentViewBox = isCompact ? setCompactViewBox : setExpandedViewBox;

    if (e.touches.length === 1 && touchStart) {
      // Single finger pan
      const touch = e.touches[0];
      const deltaX = (touch.clientX - touchStart.x) / currentViewBox.scale;
      const deltaY = (touch.clientY - touchStart.y) / currentViewBox.scale;
      
      setCurrentViewBox(prev => ({
        ...prev,
        x: prev.x - deltaX * 0.5,
        y: prev.y - deltaY * 0.5
      }));
      
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2 && touchStart && lastTouchDistance > 0) {
      // Two finger pinch and pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate new distance for zoom
      const newDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Calculate zoom factor
      const zoomFactor = newDistance / lastTouchDistance;
      
      // Calculate center for pan
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      const deltaX = (centerX - touchStart.x) / currentViewBox.scale;
      const deltaY = (centerY - touchStart.y) / currentViewBox.scale;
      
      setCurrentViewBox(prev => ({
        x: prev.x - deltaX * 0.5,
        y: prev.y - deltaY * 0.5,
        scale: Math.max(0.1, Math.min(3, prev.scale * zoomFactor))
      }));
      
      setLastTouchDistance(newDistance);
      setTouchStart({ x: centerX, y: centerY });
    }
  }, [compactViewBox, expandedViewBox, touchStart, lastTouchDistance]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setLastTouchDistance(0);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setExpandedViewBox({ x: 0, y: 0, scale: 1 });
  }, []);

  // Zoom controls for expanded view
  const zoomIn = useCallback(() => {
    setExpandedViewBox(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.2)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setExpandedViewBox(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale * 0.8)
    }));
  }, []);

  // Generate sub-node positions around main nodes with natural variation
  const generateSubNodePositions = (mainNode: any, subNodes: any[]) => {
    const baseRadius = expandedGraph ? 120 : 60;
    const angleStep = (2 * Math.PI) / subNodes.length;
    
    return subNodes.map((subNode, index) => {
      // Add natural variation to radius and angle
      const radiusVariation = 0.3 + Math.sin(index * 2.5) * 0.2; // Natural radius variation
      const angleVariation = Math.sin(index * 1.7) * 0.4; // Natural angle variation
      const radius = baseRadius * (0.8 + radiusVariation);
      const angle = index * angleStep + angleVariation;
      
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
          type: 'Main Category',
          subCount: category.subNodes.length
        };
      }
      const subNode = category.subNodes.find(sub => sub.id === nodeId);
      if (subNode) {
        return {
          label: subNode.label,
          type: 'Sub Node',
          category: category.label
        };
      }
    }
    return null;
  };

  // Compact Graph Preview Component - Empty State
  const CompactGraphPreview = () => (
    <div className="flex-1 rounded-lg border border-blue-400/20 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-900/5 to-slate-900/50">
      <p className="text-sm text-white/40 text-center px-4">
        Chat with avatar to populate this card
      </p>
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
            <div className="flex items-center gap-1">
              {user && (
                <button 
                  onClick={() => setShowPersonalDataCard(true)}
                  className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
                  title="Open Personal Data Card"
                >
                  <BookOpen size={12} className="text-white/60 group-hover:text-blue-400 transition-colors" />
                </button>
              )}
              <button 
                onClick={() => setExpandedGraph(true)}
                className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                title="Expand Cosmos"
              >
                <Maximize2 size={12} className="text-white/60" />
              </button>
            </div>
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
                {/* Personal Data Card Button */}
                {user && (
                  <button 
                    onClick={() => setShowPersonalDataCard(true)}
                    className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center transition-colors group"
                    title="Open Personal Data Card"
                  >
                    <BookOpen size={14} className="text-white/60 group-hover:text-blue-400 transition-colors" />
                  </button>
                )}
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
                className="w-full h-full cursor-move touch-none" 
                viewBox={`${expandedViewBox.x} ${expandedViewBox.y} ${1200 / expandedViewBox.scale} ${600 / expandedViewBox.scale}`}
                onMouseDown={handlePanStart}
                onMouseMove={(e) => handleMouseMove(e, false)}
                onMouseUp={handleMouseUp}
                onWheel={(e) => handleWheel(e, false)}
                onTouchStart={(e) => handleTouchStart(e, false)}
                onTouchMove={(e) => handleTouchMove(e, false)}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
              >
                {/* Enhanced connections with natural curves and orange glow */}
                {MAIN_CATEGORIES.map(category => {
                  const subNodes = generateSubNodePositions(category, category.subNodes);
                  const mainPos = nodePositions[category.id] || category.position;
                  return subNodes.map(subNode => {
                    // Create slightly curved connections for more natural feel
                    const midX = (mainPos.x + subNode.x) / 2 + Math.sin((mainPos.x + subNode.x) * 0.008) * 8;
                    const midY = (mainPos.y + subNode.y) / 2 + Math.cos((mainPos.y + subNode.y) * 0.008) * 6;
                    const pathData = `M ${mainPos.x} ${mainPos.y} Q ${midX} ${midY} ${subNode.x} ${subNode.y}`;
                    
                    return (
                      <path
                        key={`${category.id}-${subNode.id}`}
                        d={pathData}
                        fill="none"
                        stroke="rgba(255, 165, 0, 0.25)"
                        strokeWidth={hoveredNode === category.id || hoveredNode === subNode.id ? "2" : "1.2"}
                        opacity={hoveredNode === category.id || hoveredNode === subNode.id ? "0.6" : "0.3"}
                        className="connection-line transition-all duration-300"
                        style={{
                          filter: `drop-shadow(0 0 ${hoveredNode === category.id || hoveredNode === subNode.id ? '6px' : '3px'} rgba(255, 165, 0, 0.2))`
                        }}
                      />
                    );
                  });
                })}
                
                {/* Enhanced main nodes with dynamic sizes and orange cosmic styling */}
                {MAIN_CATEGORIES.map(category => {
                  const pos = nodePositions[category.id] || category.position;
                  const expandedSize = category.size * 1.2; // Slightly larger in expanded view
                  return (
                    <g key={category.id}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={expandedSize}
                        fill={category.color}
                        className="main-node cursor-pointer"
                        onMouseDown={(e) => handleNodeMouseDown(e, category.id)}
                        onMouseEnter={() => setHoveredNode(category.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{
                          filter: `drop-shadow(0 0 ${hoveredNode === category.id ? '35px' : '25px'} ${category.color}60) drop-shadow(0 0 ${hoveredNode === category.id ? '60px' : '40px'} ${category.color}30)`
                        }}
                      />
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={expandedSize * 0.35}
                        fill="white"
                        opacity="0.9"
                        className="pointer-events-none"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + expandedSize + 20}
                        className="text-sm font-medium fill-white text-center pointer-events-none"
                        textAnchor="middle"
                      >
                        {category.label}
                      </text>
                    </g>
                  );
                })}
                
                {/* Enhanced sub-nodes with dynamic sizes and orange styling */}
                {MAIN_CATEGORIES.map(category => {
                  const subNodes = generateSubNodePositions(category, category.subNodes);
                  return subNodes.map(subNode => {
                    const expandedSubSize = subNode.size * 1.4; // Larger in expanded view
                    return (
                      <g key={subNode.id}>
                        <circle
                          cx={subNode.x}
                          cy={subNode.y}
                          r={expandedSubSize}
                          fill={category.color}
                          opacity="0.85"
                          className="sub-node cursor-pointer"
                          onMouseDown={(e) => handleNodeMouseDown(e, subNode.id)}
                          onMouseEnter={() => setHoveredNode(subNode.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                          style={{
                            filter: `drop-shadow(0 0 ${hoveredNode === subNode.id ? '20px' : '12px'} ${category.color}40) drop-shadow(0 0 ${hoveredNode === subNode.id ? '35px' : '20px'} ${category.color}20)`
                          }}
                        />
                        <circle
                          cx={subNode.x}
                          cy={subNode.y}
                          r={expandedSubSize * 0.3}
                          fill="white"
                          opacity="0.9"
                          className="pointer-events-none"
                        />
                        {(hoveredNode === subNode.id || selectedNode === subNode.id) && (
                          <text
                            x={subNode.x}
                            y={subNode.y - expandedSubSize - 12}
                            className="text-xs fill-orange-200 text-center pointer-events-none font-medium"
                            textAnchor="middle"
                          >
                            {subNode.label}
                          </text>
                        )}
                      </g>
                    );
                  });
                })}
              </svg>
              
              {/* Floating Info Panel */}
              {selectedNode && (
                <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30 max-w-xs">
                  <h4 className="text-white font-semibold mb-2">
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
                  <p>• Two-finger pan to navigate</p>
                  <p>• Pinch to zoom in/out</p>
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

      {/* Personal Data Card */}
      {showPersonalDataCard && user && (
        <PersonalDataCard
          user={user}
          onClose={() => setShowPersonalDataCard(false)}
        />
      )}
    </>
  );
};

export default ObsidianKnowledgeGraph;
