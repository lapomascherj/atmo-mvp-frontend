import React from 'react';
import { GripVertical } from 'lucide-react';
import { type SchedulerEvent, formatDuration } from '@/types/scheduler';

interface EventCardProps {
  event: SchedulerEvent;
  onClick?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isSelected = false,
}) => {
  return (
    <div
      className={`
        relative w-full px-3 py-2 rounded-lg
        bg-gradient-to-r from-slate-800/90 to-slate-800/70
        border transition-all cursor-pointer
        hover:border-orange-500/50 hover:shadow-[0_0_12px_rgba(251,146,60,0.2)]
        ${isSelected
          ? 'border-orange-500 shadow-[0_0_12px_rgba(251,146,60,0.3)]'
          : 'border-slate-700/60'
        }
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Event: ${event.title} at ${event.startTime}, duration ${formatDuration(event.duration)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Drag Handle */}
      <div
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
        role="button"
        aria-label="Drag to reschedule"
      >
        <GripVertical size={14} className="text-white/40 hover:text-orange-400 transition-colors" />
      </div>

      {/* Event Content */}
      <div className="ml-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {event.title}
          </h4>
        </div>

        {/* Duration Badge */}
        <div className="ml-3 flex-shrink-0">
          <span className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            [ {formatDuration(event.duration)} ]
          </span>
        </div>
      </div>

      {/* Optional category indicator dot */}
      {event.category && (
        <div className="absolute left-3 bottom-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
        </div>
      )}
    </div>
  );
};
