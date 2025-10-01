import React from 'react';
import { generateTimeSlots, type TimeSlot } from '@/types/scheduler';

interface TimeRulerProps {
  currentTime?: string; // HH:MM format to highlight current time
  hourHeight?: number; // Height in pixels for each hour
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ currentTime, hourHeight = 60 }) => {
  const timeSlots = generateTimeSlots(true); // Include half-hours

  // Calculate if a time slot is the current hour/half-hour
  const isCurrentTime = (slot: TimeSlot): boolean => {
    if (!currentTime) return false;
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    return slot.hour === currentHour && slot.minute === currentMinute;
  };

  const isHalfHour = (slot: TimeSlot): boolean => slot.minute === 30;

  const START_HOUR = 8;
  const halfHourHeight = hourHeight / 2;
  const totalSlots = timeSlots.length - 1;
  const totalHeight = totalSlots * halfHourHeight;

  return (
    <div className="pr-3 border-r border-white/10 flex-shrink-0">
      {/* Timeline container with absolute positioning */}
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        {timeSlots.map((slot, index) => (
          <div
            key={slot.displayTime}
            className="absolute left-0 flex items-center"
            style={{ top: `${index * halfHourHeight}px` }}
          >
            {/* Time label */}
            <span
              className={`font-medium mr-3 transition-colors ${
                isHalfHour(slot)
                  ? 'text-[10px] text-white/40'
                  : 'text-xs text-white/60'
              } ${isCurrentTime(slot) ? 'text-orange-400' : ''}`}
            >
              {slot.displayTime}
            </span>

            {/* Circular node */}
            <div className="relative">
              <div
                className={`rounded-full transition-all ${
                  isHalfHour(slot)
                    ? 'w-1.5 h-1.5 bg-white/20'
                    : 'w-2 h-2 bg-white/30'
                } ${isCurrentTime(slot) ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' : ''}`}
              />

              {/* Connecting line (not for last item) */}
              {index < timeSlots.length - 1 && (
                <div
                  className="absolute left-1/2 top-1 -translate-x-1/2 w-px bg-white/10"
                  style={{ height: `${halfHourHeight}px` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
