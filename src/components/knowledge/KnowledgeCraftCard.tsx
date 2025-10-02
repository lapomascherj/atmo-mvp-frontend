import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Crosshair, ZoomIn, ZoomOut, RotateCw, Move } from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  type?: 'idea' | 'note' | 'task';
  x?: number;
  y?: number;
  z?: number;
  level?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight?: number;
}

interface KnowledgeCraftCardProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
  rotationX: number;
  rotationY: number;
}

interface DragState {
  isDragging: boolean;
  isPanning: boolean;
  isRotating: boolean;
  draggedNodeId: string | null;
  startX: number;
  startY: number;
}

export const KnowledgeCraftCard: React.FC<KnowledgeCraftCardProps> = ({ nodes: initialNodes, links: initialLinks }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links] = useState(initialLinks);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1, rotationX: 0, rotationY: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isPanning: false,
    isRotating: false,
    draggedNodeId: null,
    startX: 0,
    startY: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [rotationMode, setRotationMode] = useState(false);

  // Build hierarchical tree structure
  useEffect(() => {
    const buildHierarchy = () => {
      const linkMap = new Map<string, Set<string>>();
      links.forEach(link => {
        if (!linkMap.has(link.source)) linkMap.set(link.source, new Set());
        linkMap.get(link.source)!.add(link.target);
      });

      // Find root nodes (nodes with no incoming edges)
      const hasIncoming = new Set<string>();
      links.forEach(link => hasIncoming.add(link.target));
      const roots = initialNodes.filter(node => !hasIncoming.has(node.id));

      // If no clear roots, use first node
      if (roots.length === 0 && initialNodes.length > 0) {
        roots.push(initialNodes[0]);
      }

      const positioned = new Set<string>();
      const hierarchyNodes: GraphNode[] = [];

      // BFS to assign levels and positions
      const queue: Array<{ node: GraphNode; level: number; parentX?: number; siblingIndex: number; totalSiblings: number }> = [];

      roots.forEach((root, idx) => {
        queue.push({ node: root, level: 0, siblingIndex: idx, totalSiblings: roots.length });
      });

      while (queue.length > 0) {
        const { node, level, parentX, siblingIndex, totalSiblings } = queue.shift()!;

        if (positioned.has(node.id)) continue;
        positioned.add(node.id);

        // Calculate position in hierarchical layout
        const levelSpacing = 200;
        const nodeSpacing = 150;

        const y = level * levelSpacing - 200;
        const baseX = parentX !== undefined ? parentX : 0;
        const offsetX = (siblingIndex - (totalSiblings - 1) / 2) * nodeSpacing;
        const x = baseX + offsetX;
        const z = Math.sin(level * 0.5) * 50; // Slight 3D depth variation

        hierarchyNodes.push({
          ...node,
          x,
          y,
          z,
          level
        });

        // Add children to queue
        const children = Array.from(linkMap.get(node.id) || [])
          .map(childId => initialNodes.find(n => n.id === childId))
          .filter((n): n is GraphNode => n !== undefined && !positioned.has(n.id));

        children.forEach((child, idx) => {
          queue.push({
            node: child,
            level: level + 1,
            parentX: x,
            siblingIndex: idx,
            totalSiblings: children.length
          });
        });
      }

      // Add any orphaned nodes
      initialNodes.forEach(node => {
        if (!positioned.has(node.id)) {
          hierarchyNodes.push({
            ...node,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            z: Math.random() * 100 - 50,
            level: 99
          });
        }
      });

      setNodes(hierarchyNodes);
    };

    buildHierarchy();
  }, [initialNodes, links]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [dimensions]);

  // 3D projection
  const project3D = useCallback((x: number, y: number, z: number): { x: number; y: number } => {
    const { rotationX, rotationY, zoom } = camera;

    // Apply rotation matrices
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);

    // Rotate around Y axis
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;

    // Rotate around X axis
    let y1 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    // Perspective projection
    const perspective = 1000;
    const scale = perspective / (perspective + z2);

    return {
      x: x1 * scale * zoom,
      y: y1 * scale * zoom
    };
  }, [camera]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const { width, height } = dimensions;

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + camera.x, height / 2 + camera.y);

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Sort nodes and links by depth for proper rendering
    const nodesWithDepth = nodes.map(node => {
      const projected = project3D(node.x || 0, node.y || 0, node.z || 0);
      const depth = (node.z || 0) * Math.cos(camera.rotationX) * Math.cos(camera.rotationY);
      return { node, projected, depth };
    }).sort((a, b) => a.depth - b.depth);

    // Draw links with depth-based opacity
    links.forEach(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return;

      const sourceProjected = project3D(source.x || 0, source.y || 0, source.z || 0);
      const targetProjected = project3D(target.x || 0, target.y || 0, target.z || 0);

      const avgDepth = ((source.z || 0) + (target.z || 0)) / 2;
      const depthFactor = Math.max(0.2, 1 - avgDepth / 200);

      const isConnectedToHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
      const isConnectedToSelected = selectedNodeId === source.id || selectedNodeId === target.id;

      if (isConnectedToHovered || isConnectedToSelected) {
        ctx.strokeStyle = `rgba(220, 20, 60, ${0.9 * depthFactor})`;
        ctx.lineWidth = (2.5 * (link.weight || 1)) / camera.zoom;
      } else {
        ctx.strokeStyle = `rgba(220, 20, 60, ${0.3 * depthFactor})`;
        ctx.lineWidth = (1.2 * (link.weight || 1)) / camera.zoom;
      }

      ctx.beginPath();
      ctx.moveTo(sourceProjected.x, sourceProjected.y);
      ctx.lineTo(targetProjected.x, targetProjected.y);
      ctx.stroke();
    });

    // Get neighbors for highlighting
    const getNeighbors = (nodeId: string): Set<string> => {
      const neighbors = new Set<string>();
      links.forEach(link => {
        if (link.source === nodeId) neighbors.add(link.target);
        if (link.target === nodeId) neighbors.add(link.source);
      });
      return neighbors;
    };

    const hoveredNeighbors = hoveredNodeId ? getNeighbors(hoveredNodeId) : new Set();
    const selectedNeighbors = selectedNodeId ? getNeighbors(selectedNodeId) : new Set();

    // Draw nodes with depth-based size
    nodesWithDepth.forEach(({ node, projected, depth }) => {
      const isHovered = node.id === hoveredNodeId;
      const isSelected = node.id === selectedNodeId;
      const isNeighborOfHovered = hoveredNeighbors.has(node.id);
      const isNeighborOfSelected = selectedNeighbors.has(node.id);

      const depthFactor = Math.max(0.4, 1 - depth / 200);
      const baseRadius = (12 * depthFactor) / camera.zoom;
      let radius = baseRadius;

      if (isHovered || isSelected) {
        radius = baseRadius * 1.5;
      } else if (isNeighborOfHovered || isNeighborOfSelected) {
        radius = baseRadius * 1.2;
      }

      // Glow for selected
      if (isSelected) {
        ctx.shadowBlur = 25 / camera.zoom;
        ctx.shadowColor = `rgba(220, 20, 60, ${0.8 * depthFactor})`;
      }

      // Node circle with depth-aware color
      const alpha = depthFactor;
      ctx.fillStyle = isHovered || isSelected
        ? `rgba(255, 23, 68, ${alpha})`
        : isNeighborOfHovered || isNeighborOfSelected
        ? `rgba(233, 30, 99, ${alpha})`
        : `rgba(220, 20, 60, ${alpha})`;

      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Ring for selected
      if (isSelected) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255, 23, 68, ${alpha})`;
        ctx.lineWidth = 2 / camera.zoom;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, radius + 4 / camera.zoom, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    });

    // Draw labels for selected/hovered
    const labelNodeData = nodesWithDepth.find(({ node }) => node.id === selectedNodeId || node.id === hoveredNodeId);
    if (labelNodeData) {
      const { node, projected, depth } = labelNodeData;
      const depthFactor = Math.max(0.4, 1 - depth / 200);
      const fontSize = (13 * depthFactor) / camera.zoom;
      ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const maxWidth = 140 / camera.zoom;
      let displayText = node.label;
      let textWidth = ctx.measureText(displayText).width;

      if (textWidth > maxWidth) {
        while (textWidth > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
          textWidth = ctx.measureText(displayText + '...').width;
        }
        displayText += '...';
      }

      const labelY = projected.y + 18 / camera.zoom;

      // Background
      const padding = 5 / camera.zoom;
      const bgWidth = ctx.measureText(displayText).width + padding * 2;
      const bgHeight = fontSize + padding * 2;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(
        projected.x - bgWidth / 2,
        labelY - padding,
        bgWidth,
        bgHeight
      );

      // Text
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(displayText, projected.x, labelY);
    }

    ctx.restore();
  }, [nodes, links, camera, dimensions, hoveredNodeId, selectedNodeId, project3D]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Screen to world coordinate transformation with 3D
  const screenToWorld = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const { width, height } = dimensions;
    return {
      x: (screenX - width / 2 - camera.x) / camera.zoom,
      y: (screenY - height / 2 - camera.y) / camera.zoom
    };
  }, [camera, dimensions]);

  // Hit testing
  const findNodeAtPosition = useCallback((screenX: number, screenY: number): GraphNode | null => {
    const hitRadius = 15 / camera.zoom;

    for (const node of nodes) {
      const projected = project3D(node.x || 0, node.y || 0, node.z || 0);
      const screenPos = {
        x: projected.x + dimensions.width / 2 + camera.x,
        y: projected.y + dimensions.height / 2 + camera.y
      };

      const dx = screenPos.x - screenX;
      const dy = screenPos.y - screenY;
      const distSq = dx * dx + dy * dy;

      if (distSq <= hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }, [nodes, camera, dimensions, project3D]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = findNodeAtPosition(x, y);

    if (rotationMode) {
      setDragState({
        isDragging: false,
        isPanning: false,
        isRotating: true,
        draggedNodeId: null,
        startX: x,
        startY: y
      });
    } else if (node) {
      setDragState({
        isDragging: true,
        isPanning: false,
        isRotating: false,
        draggedNodeId: node.id,
        startX: x,
        startY: y
      });
    } else {
      setDragState({
        isDragging: false,
        isPanning: true,
        isRotating: false,
        draggedNodeId: null,
        startX: x,
        startY: y
      });
    }
  }, [findNodeAtPosition, rotationMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragState.isRotating) {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;

      setCamera(prev => ({
        ...prev,
        rotationY: prev.rotationY + dx * 0.005,
        rotationX: prev.rotationX + dy * 0.005
      }));
      setDragState(prev => ({ ...prev, startX: x, startY: y }));
    } else if (dragState.isPanning) {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;

      setCamera(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setDragState(prev => ({ ...prev, startX: x, startY: y }));
    } else if (dragState.isDragging && dragState.draggedNodeId) {
      const world = screenToWorld(x, y);
      setNodes(prev => prev.map(n =>
        n.id === dragState.draggedNodeId
          ? { ...n, x: world.x, y: world.y }
          : n
      ));
    } else {
      const node = findNodeAtPosition(x, y);
      setHoveredNodeId(node?.id || null);
    }
  }, [dragState, screenToWorld, findNodeAtPosition]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isPanning: false,
      isRotating: false,
      draggedNodeId: null,
      startX: 0,
      startY: 0
    });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = findNodeAtPosition(x, y);

    if (node) {
      setSelectedNodeId(prev => prev === node.id ? null : node.id);
    } else {
      setSelectedNodeId(null);
    }
  }, [findNodeAtPosition]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, camera.zoom * zoomFactor));

    setCamera(prev => ({ ...prev, zoom: newZoom }));
  }, [camera]);

  // Fit all nodes
  const fitAll = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1, rotationX: 0, rotationY: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setCamera(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setCamera(prev => ({ ...prev, zoom: Math.max(0.3, prev.zoom / 1.2) }));
  }, []);

  const resetRotation = useCallback(() => {
    setCamera(prev => ({ ...prev, rotationX: 0, rotationY: 0 }));
  }, []);

  // Search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    const found = nodes.find(n =>
      n.label.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      setSelectedNodeId(found.id);
      setCamera(prev => ({ ...prev, x: 0, y: 0, zoom: 1.5 }));
    }
  }, [nodes]);

  const getCursor = () => {
    if (dragState.isPanning) return 'grabbing';
    if (dragState.isRotating) return 'grabbing';
    if (dragState.isDragging) return 'move';
    if (hoveredNodeId) return 'pointer';
    if (rotationMode) return 'grab';
    return 'grab';
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-white/10 p-1.5 shadow-lg">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-36 pl-7 pr-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#DC143C]/50 focus:ring-1 focus:ring-[#DC143C]/30 transition-all"
          />
        </div>

        <div className="h-5 w-px bg-white/10" />

        {/* Rotation Mode Toggle */}
        <button
          onClick={() => setRotationMode(!rotationMode)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
            rotationMode
              ? 'bg-[#DC143C]/20 text-[#DC143C]'
              : 'hover:bg-white/10 text-white/70'
          }`}
          title="Rotation Mode (R)"
        >
          <RotateCw size={16} />
        </button>

        {/* Reset Rotation */}
        <button
          onClick={resetRotation}
          className="w-8 h-8 rounded hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors group"
          title="Reset Rotation"
        >
          <Move size={16} className="text-white/70 group-hover:text-[#DC143C] transition-colors" />
        </button>

        {/* Controls */}
        <button
          onClick={fitAll}
          className="w-8 h-8 rounded hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors group"
          title="Recenter (F)"
        >
          <Crosshair size={16} className="text-white/70 group-hover:text-[#DC143C] transition-colors" />
        </button>
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors group"
          title="Zoom in"
        >
          <ZoomIn size={16} className="text-white/70 group-hover:text-[#DC143C] transition-colors" />
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors group"
          title="Zoom out"
        >
          <ZoomOut size={16} className="text-white/70 group-hover:text-[#DC143C] transition-colors" />
        </button>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">
        <div className="flex items-center gap-4">
          <span>{nodes.length} nodes</span>
          <span>{links.length} connections</span>
          <span className="text-[#DC143C]">
            {rotationMode ? 'Rotation Mode' : 'Pan Mode'}
          </span>
        </div>
      </div>
    </div>
  );
};
