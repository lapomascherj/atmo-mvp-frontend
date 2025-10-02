import React from 'react';
import { EnhancedKnowledgeGraph } from './EnhancedKnowledgeGraph';

/**
 * Demo component to showcase the Enhanced Knowledge Graph
 * This component demonstrates the knowledge graph with mock data
 */
export const KnowledgeGraphDemo: React.FC = () => {
  return (
    <div className="w-full h-96 bg-slate-900 rounded-lg p-4">
      <h3 className="text-white text-lg font-semibold mb-4">Enhanced Knowledge Graph Demo</h3>
      <div className="w-full h-80">
        <EnhancedKnowledgeGraph />
      </div>
      <div className="mt-4 text-sm text-white/60">
        <p>• Click nodes to interact with them</p>
        <p>• Right-click for context menu</p>
        <p>• Click "Expand" to see the full graph with AI insights</p>
        <p>• Search and filter nodes in expanded view</p>
      </div>
    </div>
  );
};

export default KnowledgeGraphDemo;
