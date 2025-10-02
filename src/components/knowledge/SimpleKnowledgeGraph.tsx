import React, { useState } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { Brain, Maximize2, X } from 'lucide-react';

interface SimpleKnowledgeGraphProps {
  className?: string;
}

export const SimpleKnowledgeGraph: React.FC<SimpleKnowledgeGraphProps> = ({ className }) => {
  const [expandedGraph, setExpandedGraph] = useState(false);

  // Simple mock data for demonstration
  const mockNodes = [
    { id: '1', label: 'ATMO Platform', x: 150, y: 100, color: '#3B82F6' },
    { id: '2', label: 'AI Integration', x: 100, y: 150, color: '#10B981' },
    { id: '3', label: 'User Research', x: 200, y: 150, color: '#F59E0B' },
    { id: '4', label: 'Digital Brain', x: 150, y: 200, color: '#8B5CF6' },
  ];

  const mockConnections = [
    { from: '1', to: '2' },
    { from: '1', to: '3' },
    { from: '1', to: '4' },
    { from: '2', to: '4' },
  ];

  const CompactGraphPreview = () => (
    <div className="flex-1 bg-white/95 rounded-lg border border-blue-400/20 relative overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 300 250">
        {/* Connections */}
        {mockConnections.map((conn, index) => {
          const fromNode = mockNodes.find(n => n.id === conn.from);
          const toNode = mockNodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <line
              key={index}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="#3B82F6"
              strokeWidth="2"
              opacity="0.6"
            />
          );
        })}
        
        {/* Nodes */}
        {mockNodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="12"
              fill={node.color}
              opacity="0.8"
              className="hover:opacity-100 transition-opacity cursor-pointer"
            />
            <text
              x={node.x}
              y={node.y - 20}
              className="text-xs fill-slate-700 text-center pointer-events-none"
              textAnchor="middle"
            >
              {node.label}
            </text>
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

      {/* Simple Expanded Modal */}
      {expandedGraph && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="w-full h-full max-w-4xl max-h-3xl bg-slate-800 rounded-xl border border-blue-400/30 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Knowledge Graph</h2>
              <button
                onClick={() => setExpandedGraph(false)}
                className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>

            {/* Full Graph Area */}
            <div className="flex-1 bg-gradient-to-br from-white via-slate-50 to-blue-50 relative flex items-center justify-center">
              <div className="text-center">
                <Brain size={48} className="text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Knowledge Graph</h3>
                <p className="text-slate-600 mb-4">Your intelligent knowledge network visualization</p>
                <div className="bg-white/80 rounded-lg p-4 max-w-md">
                  <p className="text-sm text-slate-600">
                    This is a simplified version of the Knowledge Graph. 
                    The full version will show your projects, tasks, goals, and knowledge items 
                    with intelligent connections and AI-powered insights.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Graph Stats Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>4 nodes • 4 connections</span>
                <span>Enhanced version coming soon</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleKnowledgeGraph;
