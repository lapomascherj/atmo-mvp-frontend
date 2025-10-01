import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { TimeRuler } from './TimeRuler';
import { EventCard } from './EventCard';
import { EditEventModal } from './EditEventModal';
import { MonthPicker } from './MonthPicker';
import {
  type SchedulerEvent,
  timeToMinutes,
  minutesToTime,
  snapTo30Minutes,
} from '@/types/scheduler';

interface SchedulerViewProps {
  events: SchedulerEvent[];
  onEventsChange: (events: SchedulerEvent[]) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  events,
  onEventsChange,
  selectedDate,
  onDateChange,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    eventId: string | null;
    startY: number;
    originalStartTime: string;
  }>({
    isDragging: false,
    eventId: null,
    startY: 0,
    originalStartTime: '',
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const [focusedEventIndex, setFocusedEventIndex] = useState<number>(-1);

  // Constants for layout calculations
  const HOUR_HEIGHT = 60; // pixels per hour
  const START_HOUR = 8;
  const END_HOUR = 17;
  const TOTAL_HOURS = END_HOUR - START_HOUR;

  // Get current time for highlighting
  const getCurrentTime = (): string => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Calculate position (top offset) for an event based on its start time
  const calculateEventPosition = (startTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    const baseMinutes = START_HOUR * 60;
    const offsetMinutes = startMinutes - baseMinutes;
    return (offsetMinutes / 60) * HOUR_HEIGHT;
  };

  // Calculate height for an event based on its duration
  const calculateEventHeight = (duration: number): number => {
    return (duration / 60) * HOUR_HEIGHT;
  };

  // Handle drag start
  const handleDragStart = (eventId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    setDragState({
      isDragging: true,
      eventId,
      startY: e.clientY,
      originalStartTime: event.startTime,
    });
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.eventId) return;

      const deltaY = e.clientY - dragState.startY;
      const deltaMinutes = (deltaY / HOUR_HEIGHT) * 60;

      const originalMinutes = timeToMinutes(dragState.originalStartTime);
      let newMinutes = originalMinutes + deltaMinutes;

      // Snap to 30-minute intervals
      newMinutes = snapTo30Minutes(newMinutes);

      // Constrain to schedule bounds (08:00 - 17:00)
      const minMinutes = START_HOUR * 60;
      const maxMinutes = END_HOUR * 60;
      newMinutes = Math.max(minMinutes, Math.min(maxMinutes - 30, newMinutes));

      const newStartTime = minutesToTime(newMinutes);

      // Update event
      const updatedEvents = events.map((ev) =>
        ev.id === dragState.eventId ? { ...ev, startTime: newStartTime } : ev
      );
      onEventsChange(updatedEvents);

      // Auto-scroll during drag
      if (scrollContainerRef.current) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const scrollThreshold = 50;

        if (e.clientY < containerRect.top + scrollThreshold) {
          scrollContainerRef.current.scrollTop -= 5;
        } else if (e.clientY > containerRect.bottom - scrollThreshold) {
          scrollContainerRef.current.scrollTop += 5;
        }
      }
    };

    const handleMouseUp = () => {
      setDragState({
        isDragging: false,
        eventId: null,
        startY: 0,
        originalStartTime: '',
      });
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, events, onEventsChange]);

  // Handle event click to edit
  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsEditModalOpen(true);
  };

  // Handle add new event
  const handleAddEvent = () => {
    setSelectedEventId(null);
    setIsEditModalOpen(true);
  };

  // Handle save event (create or update)
  const handleSaveEvent = (event: SchedulerEvent) => {
    if (selectedEventId) {
      // Update existing event
      const updatedEvents = events.map((ev) =>
        ev.id === selectedEventId ? event : ev
      );
      onEventsChange(updatedEvents);
    } else {
      // Add new event
      onEventsChange([...events, event]);
    }
  };

  // Handle delete event
  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter((ev) => ev.id !== eventId);
    onEventsChange(updatedEvents);
  };

  // Format selected date for display
  const formatDate = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const selectedEvent = selectedEventId ? events.find((ev) => ev.id === selectedEventId) : null;

  // Keyboard navigation for event list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (events.length === 0) return;

      // Focus on first event with Tab when no event is focused
      if (e.key === 'Tab' && focusedEventIndex === -1) {
        e.preventDefault();
        setFocusedEventIndex(0);
        return;
      }

      // Navigate events with arrow keys
      if (e.key === 'ArrowDown' && focusedEventIndex < events.length - 1) {
        e.preventDefault();
        setFocusedEventIndex(focusedEventIndex + 1);
      } else if (e.key === 'ArrowUp' && focusedEventIndex > 0) {
        e.preventDefault();
        setFocusedEventIndex(focusedEventIndex - 1);
      }
    };

    if (focusedEventIndex >= 0) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [focusedEventIndex, events.length]);

  return (
    <div
      className="h-full flex flex-col bg-gradient-to-br from-slate-950/40 via-slate-900/40 to-slate-950/40"
      role="application"
      aria-label="Event scheduler"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Schedule</h2>
          <p className="text-xs text-white/60 mt-0.5">{formatDate(selectedDate)}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Calendar button */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            aria-label="Select date"
          >
            <Calendar size={16} className="text-white/70" />
          </button>

          {/* Add event button */}
          <button
            onClick={handleAddEvent}
            className="w-9 h-9 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors shadow-lg shadow-orange-500/20"
            aria-label="Add event"
          >
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Scheduler Content - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-4">
          {/* Time Ruler */}
          <TimeRuler currentTime={getCurrentTime()} hourHeight={HOUR_HEIGHT} />

          {/* Events Column */}
          <div
            ref={eventsContainerRef}
            className="flex-1 relative"
            style={{ minHeight: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
          >
            {/* Hour lines */}
            {Array.from({ length: TOTAL_HOURS + 1 }).map((_, index) => (
              <div
                key={index}
                className="absolute left-0 right-0 border-t border-white/5"
                style={{ top: `${index * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* "No events" message */}
            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-white/40">No events scheduled</p>
              </div>
            )}

            {/* Event Cards */}
            {events.map((event) => (
              <div
                key={event.id}
                className="absolute left-0 right-0 px-2"
                style={{
                  top: `${calculateEventPosition(event.startTime)}px`,
                  height: `${calculateEventHeight(event.duration)}px`,
                }}
              >
                <EventCard
                  event={event}
                  onClick={() => handleEventClick(event.id)}
                  onDragStart={(e) => handleDragStart(event.id, e)}
                  isDragging={dragState.isDragging && dragState.eventId === event.id}
                  isSelected={selectedEventId === event.id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEventId(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
      />

      <MonthPicker
        selectedDate={selectedDate}
        onDateSelect={onDateChange}
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </div>
  );
};
