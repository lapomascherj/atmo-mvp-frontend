import React, { useState } from 'react';
import { cn } from '@/utils/utils';
import { Menu, Grid3x3, Calendar, ChevronDown } from 'lucide-react';

interface PriorityStreamProps {
  compact?: boolean;
  className?: string;
  priorityOnly?: boolean;
}

export const PriorityStreamEnhanced: React.FC<PriorityStreamProps> = ({ className, priorityOnly }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'schedule' | 'priority'>('priority');
  const [milestonesCollapsed, setMilestonesCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 glass-card bg-black/60 backdrop-blur-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-white">Priority Stream</h3>
          <p className="text-xs text-white/40 mt-0.5">No tasks yet</p>
        </div>

        {/* Only show toggle buttons in Digital Brain, hide in Dashboard */}
        {!priorityOnly && (
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Menu size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                )}
              >
                <Grid3x3 size={16} />
              </button>
            </div>

            {/* Tab Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === 'schedule' ? 'priority' : 'schedule')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 transition-colors flex items-center gap-1.5"
            >
              <Calendar size={12} />
              {activeTab === 'schedule' ? 'Schedule' : 'Priority'}
            </button>
          </div>
        )}
      </div>

      {/* Empty State Placeholder */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex items-center justify-center">
        {/* Centered Placeholder Text */}
        <p className="text-sm text-white/40 text-center">
          Chat with avatar to populate this card
        </p>
      </div>

      {/* Cross-Project Balance - Now at bottom before End-of-Day Milestones */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            <span className="text-xs uppercase tracking-wide text-white/40">Cross-Project Balance</span>
          </div>
          <span className="text-xs text-white/50">0%</span>
        </div>
        {/* Balance Bar */}
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="h-full bg-blue-500/30" style={{ width: '33%' }}></div>
            <div className="h-full bg-purple-500/30" style={{ width: '33%' }}></div>
            <div className="h-full bg-orange-500/30" style={{ width: '34%' }}></div>
          </div>
        </div>
      </div>

      {/* End-of-Day Milestones Section - Now as Footer (Collapsible) */}
      <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50">
        <button
          onClick={() => setMilestonesCollapsed(!milestonesCollapsed)}
          className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            <h4 className="text-xs uppercase tracking-wide text-white/40">End-of-Day Milestones</h4>
          </div>
          <ChevronDown
            size={14}
            className={cn(
              'text-white/40 transition-transform',
              milestonesCollapsed && 'rotate-180'
            )}
          />
        </button>
        {!milestonesCollapsed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/30"></div>
              <span>Milestone 1 will appear here</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/30"></div>
              <span>Milestone 2 will appear here</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400/30"></div>
              <span>Milestone 3 will appear here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityStreamEnhanced;
