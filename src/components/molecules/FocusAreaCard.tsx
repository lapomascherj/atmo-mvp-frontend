import React, { useEffect, useRef, useState } from 'react';
import { X, TrendingUp, Activity, MessageSquare, Lightbulb } from 'lucide-react';
import type { FocusAreaInsight } from '@/utils/focusAreaInsights';

interface FocusAreaCardProps {
  insight: FocusAreaInsight;
  chipElement: HTMLElement | null;
  onClose: () => void;
}

export const FocusAreaCard: React.FC<FocusAreaCardProps> = ({ insight, chipElement, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' }>({
    top: 0,
    left: 0,
    placement: 'below',
  });

  // Calculate smart positioning
  useEffect(() => {
    if (!chipElement || !cardRef.current) return;

    const chipRect = chipElement.getBoundingClientRect();
    const cardHeight = 380; // Approximate card height
    const cardWidth = 320;
    const spacing = 12;

    // Calculate horizontal position (centered on chip)
    let left = chipRect.left + (chipRect.width / 2) - (cardWidth / 2);

    // Ensure card doesn't overflow left edge
    if (left < spacing) {
      left = spacing;
    }

    // Ensure card doesn't overflow right edge
    if (left + cardWidth > window.innerWidth - spacing) {
      left = window.innerWidth - cardWidth - spacing;
    }

    // Calculate vertical position (prefer above, fallback to below)
    const spaceAbove = chipRect.top;
    const spaceBelow = window.innerHeight - chipRect.bottom;

    let top: number;
    let placement: 'above' | 'below';

    if (spaceAbove >= cardHeight + spacing) {
      // Place above
      top = chipRect.top - cardHeight - spacing;
      placement = 'above';
    } else if (spaceBelow >= cardHeight + spacing) {
      // Place below
      top = chipRect.bottom + spacing;
      placement = 'below';
    } else {
      // Not enough space either way, place below and allow scrolling
      top = chipRect.bottom + spacing;
      placement = 'below';
    }

    setPosition({ top, left, placement });
  }, [chipElement]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node) &&
          chipElement && !chipElement.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chipElement, onClose]);

  // Sophistication badge color
  const sophisticationColor = {
    beginner: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    intermediate: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    advanced: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    expert: 'bg-green-500/20 text-green-300 border-green-400/30',
  }[insight.growthIndicators.sophisticationLevel];

  // Trajectory icon and text
  const trajectoryInfo = {
    learning: { icon: Lightbulb, label: 'Learning', color: 'text-blue-400' },
    applying: { icon: Activity, label: 'Applying', color: 'text-purple-400' },
    mastering: { icon: TrendingUp, label: 'Mastering', color: 'text-orange-400' },
    leading: { icon: TrendingUp, label: 'Leading', color: 'text-green-400' },
  }[insight.growthIndicators.trajectory];

  const TrajectoryIcon = trajectoryInfo.icon;

  return (
    <div
      ref={cardRef}
      className="fixed z-[9999] animate-in fade-in duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '320px',
        width: '320px',
      }}
    >
      {/* ATMO-styled card */}
      <div className="relative">
        {/* Gradient glow background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-purple-500/20 rounded-xl blur-xl"></div>

        {/* Main card */}
        <div className="relative bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden">
          {/* Purple accent border (left side) */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600"></div>

          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
              <h3 className="text-sm font-semibold text-white">{insight.focusArea}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X size={14} className="text-white/60 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3 space-y-3 max-h-[340px] overflow-y-auto">
            {/* Sophistication & Trajectory */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full border ${sophisticationColor}`}>
                {insight.growthIndicators.sophisticationLevel}
              </span>
              <div className="flex items-center gap-1">
                <TrajectoryIcon size={12} className={trajectoryInfo.color} />
                <span className={`text-[10px] font-medium ${trajectoryInfo.color}`}>
                  {trajectoryInfo.label}
                </span>
              </div>
            </div>

            {/* Current Application */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Activity size={12} className="text-purple-400" />
                <h4 className="text-xs font-semibold text-purple-200">Current Application</h4>
              </div>
              <div className="space-y-1.5 pl-5">
                {insight.currentApplication.projects.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60">Active in</span>
                      <span className="text-white/80 font-medium">
                        {insight.currentApplication.projects.length} {insight.currentApplication.projects.length === 1 ? 'project' : 'projects'}
                      </span>
                    </div>
                    {insight.currentApplication.projects.map((project, idx) => (
                      <div key={idx} className="text-[10px] text-white/50 truncate">
                        • {project.name}
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-[11px] text-white/40">No active projects detected</p>
                )}

                {insight.currentApplication.taskCount > 0 && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-white/60">Tasks completed</span>
                    <span className="text-purple-300 font-medium">
                      {insight.currentApplication.completionRate}%
                    </span>
                  </div>
                )}

                <div className="text-[10px] text-white/40 pt-0.5">
                  {insight.currentApplication.recentActivity}
                </div>
              </div>
            </div>

            {/* Chat Activity */}
            {insight.chatActivity.mentionCount > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare size={12} className="text-blue-400" />
                  <h4 className="text-xs font-semibold text-blue-200">Recent Conversations</h4>
                </div>
                <div className="space-y-1 pl-5">
                  <div className="text-[11px] text-white/60">
                    Mentioned {insight.chatActivity.mentionCount} {insight.chatActivity.mentionCount === 1 ? 'time' : 'times'} in recent chats
                  </div>
                  {insight.chatActivity.recentTopics.slice(0, 2).map((topic, idx) => (
                    <div key={idx} className="text-[10px] text-white/40 italic line-clamp-2">
                      "{topic}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Growth Opportunities */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp size={12} className="text-green-400" />
                <h4 className="text-xs font-semibold text-green-200">Growth Opportunities</h4>
              </div>
              <div className="space-y-1.5 pl-5">
                {insight.growthIndicators.opportunities.map((opportunity, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
                    <span className="text-[11px] text-white/70 leading-relaxed">{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
