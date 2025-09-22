import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Cloud } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, startOfDay } from 'date-fns';
import { Button } from '@/components/atoms/Button.tsx';
import { Badge } from '@/components/atoms/Badge.tsx';
import {CalendarEvent} from "@/models/CalendarEvent";
import {CalendarViewMode} from "@/models/CalendarViewMode";

interface CalendarGridProps {
  events: CalendarEvent[];
  viewMode: CalendarViewMode;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddEvent: (date?: Date, hour?: number) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  isLoading?: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  viewMode,
  currentDate,
  onDateChange,
  onAddEvent,
  onSelectEvent,
  onViewModeChange,
  isLoading = false
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Debug logging
  useEffect(() => {
    console.log('🗓️ CALENDAR GRID: Props received:', {
      eventsCount: events.length,
      viewMode,
      currentDate,
      isLoading
    });
    console.log('🗓️ CALENDAR GRID: Events data:', events);
  }, [events, viewMode, currentDate, isLoading]);

  // Get date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case CalendarViewMode.Week:
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return { start: weekStart, end: weekEnd, days: eachDayOfInterval({ start: weekStart, end: weekEnd }) };
      case CalendarViewMode.Day:
        const dayStart = startOfDay(currentDate);
        return { start: dayStart, end: dayStart, days: [dayStart] };
      case CalendarViewMode.Month:
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return { start: monthStart, end: monthEnd, days: eachDayOfInterval({ start: monthStart, end: monthEnd }) };
    }
  };

  const { start: periodStart, end: periodEnd, days: periodDays } = getDateRange();

  // Navigation functions
  const navigatePrevious = () => {
    switch (viewMode) {
      case CalendarViewMode.Week:
        onDateChange(subWeeks(currentDate, 1));
        break;
      case CalendarViewMode.Day:
        onDateChange(subDays(currentDate, 1));
        break;
      case CalendarViewMode.Month:
      default:
        onDateChange(subMonths(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case CalendarViewMode.Week:
        onDateChange(addWeeks(currentDate, 1));
        break;
      case CalendarViewMode.Day:
        onDateChange(addDays(currentDate, 1));
        break;
      case CalendarViewMode.Month:
      default:
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
    setSelectedDate(new Date());
  };

  // Filter events for the selected date
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.start_date);
    return isSameDay(eventDate, selectedDate);
  });

  // Get header title based on view mode
  const getHeaderTitle = () => {
    switch (viewMode) {
      case CalendarViewMode.Week:
        return `${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d, yyyy')}`;
      case CalendarViewMode.Day:
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case CalendarViewMode.Month:
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const getPreviousLabel = () => {
    switch (viewMode) {
      case CalendarViewMode.Week: return 'Previous week';
      case CalendarViewMode.Day: return 'Previous day';
      case CalendarViewMode.Month:
      default: return 'Previous month';
    }
  };

  const getNextLabel = () => {
    switch (viewMode) {
      case CalendarViewMode.Week: return 'Next week';
      case CalendarViewMode.Day: return 'Next day';
      case CalendarViewMode.Month:
      default: return 'Next month';
    }
  };

  // Render calendar view based on mode
  const renderCalendarView = () => {
    switch (viewMode) {
      case CalendarViewMode.Week:
        return renderWeekView();
      case CalendarViewMode.Day:
        return renderDayView();
      case CalendarViewMode.Month:
      default:
        return renderMonthView();
    }
  };

  // Render month view
  const renderMonthView = () => {
    console.log('🗓️ CALENDAR GRID: Rendering month view');
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="rounded-xl overflow-hidden border border-white/10 bg-transparent">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center border-b border-white/10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-4 text-sm font-medium text-white/80 border-r border-white/5 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {Array.from({ length: monthStart.getDay() }, (_, i) => (
            <div
              key={`empty-start-${i}`}
              className="border-b border-r border-white/5 last:border-r-0 p-3 min-h-[120px] bg-transparent"
            ></div>
          ))}

          {monthDays.map((day) => {
            const dayEvents = events.filter(event => {
              const eventStart = new Date(event.start_date);
              return isSameDay(eventStart, day);
            });

            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`border-b border-r border-white/5 last:border-r-0 p-3 min-h-[120px] cursor-pointer transition-all duration-200 group relative ${
                  isSelected ? 'bg-white/5 border-[#FF5F1F]/20' : 'bg-transparent hover:bg-white/[0.02] hover:border-[#FF7000]/20'
                }`}
                onClick={(e) => {
                  // If clicking on empty space (not an event), create new event
                  if (e.target === e.currentTarget) {
                    onAddEvent(day);
                  } else {
                    setSelectedDate(day);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                      isToday 
                        ? 'bg-[#FF5F1F] text-white shadow-lg' 
                        : isSelected
                        ? 'bg-[#FF5F1F]/20 text-[#FF5F1F] border border-[#FF5F1F]/30'
                        : isCurrentMonth 
                        ? 'text-white hover:bg-white/10' 
                        : 'text-white/30'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Add Event Indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-[#FF7000]/20 border border-[#FF7000]/30 rounded-lg p-2">
                    <Plus className="w-4 h-4 text-[#FF7000]" />
                  </div>
                </div>

                <div className="space-y-1 overflow-hidden max-h-[calc(100%-40px)] relative z-10">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-[10px] px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 border border-white/10 hover:border-[#FF5F1F]/30 bg-white/5 hover:bg-white/10"
                      style={{
                        borderLeftColor: event.color || '#FF5F1F',
                        borderLeftWidth: '3px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div className="text-white/90 font-medium truncate flex-1">
                          {event.title}
                        </div>
                        {event.is_synced && (
                          <Cloud className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      {!event.is_all_day && (
                        <div className="text-white/50 text-[9px] mt-0.5">
                          {format(new Date(event.start_date), 'h:mm a')}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-center text-white/40 bg-white/5 rounded-md py-1 border border-white/10">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {Array.from(
            { length: (7 - ((monthStart.getDay() + monthDays.length) % 7)) % 7 },
            (_, i) => (
              <div
                key={`empty-end-${i}`}
                className="border-b border-r border-white/5 last:border-r-0 p-3 min-h-[120px] bg-transparent"
              ></div>
            )
          )}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });

    return (
      <div className="rounded-xl overflow-hidden border border-white/10 bg-transparent">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center border-b border-white/10">
          {weekDays.map((day) => (
            <div key={day.toString()} className="py-4 text-sm font-medium text-white/80 border-r border-white/5 last:border-r-0">
              <div>{format(day, 'EEE')}</div>
              <div className="text-xs text-white/60 mt-1">{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Week days grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {weekDays.map((day) => {
            const dayEvents = events.filter(event => {
              const eventStart = new Date(event.start_date);
              return isSameDay(eventStart, day);
            });

            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`border-b border-r border-white/5 last:border-r-0 p-3 min-h-[200px] cursor-pointer transition-all duration-200 group relative ${
                  isSelected ? 'bg-white/5 border-[#FF5F1F]/20' : 'bg-transparent hover:bg-white/[0.02] hover:border-[#FF7000]/20'
                }`}
                onClick={(e) => {
                  // If clicking on empty space (not an event), create new event
                  if (e.target === e.currentTarget) {
                    onAddEvent(day);
                  } else {
                    setSelectedDate(day);
                  }
                }}
              >
                {/* Add Event Indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-[#FF7000]/20 border border-[#FF7000]/30 rounded-lg p-2">
                    <Plus className="w-4 h-4 text-[#FF7000]" />
                  </div>
                </div>

                <div className="relative z-10" style={{ minHeight: `${Math.max(dayEvents.length * 28, 40)}px` }}>
                  {(() => {
                    // Calculate layout for overlapping events
                    const eventLayouts = calculateEventLayout(dayEvents);
                    
                    return eventLayouts.map((layout) => {
                      const { event, width, left } = layout;
                      return (
                        <div
                          key={event.id}
                          className="absolute text-xs px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 border border-white/10 hover:border-[#FF5F1F]/30 bg-white/5 hover:bg-white/10"
                          style={{
                            borderLeftColor: event.color || '#FF5F1F',
                            borderLeftWidth: '3px',
                            width: `${width}%`,
                            left: `${left}%`,
                            top: `${layout.column * 28}px`, // Stack overlapping events vertically
                            height: '24px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <div className="text-white/90 font-medium truncate flex-1">
                              {event.title}
                            </div>
                            {event.is_synced && (
                              <Cloud className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            )}
                          </div>
                          {!event.is_all_day && (
                            <div className="text-white/50 text-[10px] mt-0.5">
                              {format(new Date(event.start_date), 'h:mm a')}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start_date);
      return isSameDay(eventStart, currentDate);
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Calculate layout for all day events once
    const allDayEventLayouts = calculateEventLayout(dayEvents);

    return (
      <div className="rounded-xl overflow-hidden border border-white/10 bg-transparent">
        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => {
            // Only get events that START in this hour (to prevent duplication)
            const hourStartingEvents = dayEvents.filter(event => {
              const eventStart = new Date(event.start_date);
              return eventStart.getHours() === hour;
            });

            // Get the layouts for events that start in this hour
            const hourEventLayouts = allDayEventLayouts.filter(layout =>
              hourStartingEvents.some(event => event.id === layout.event.id)
            );

            return (
              <div key={hour} className="flex border-b border-white/5">
                <div className="w-16 p-3 text-xs text-white/50 border-r border-white/5">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </div>
                <div 
                  className="flex-1 p-3 min-h-[60px] cursor-pointer hover:bg-white/[0.02] transition-all duration-200 group relative"
                  onClick={(e) => {
                    // If clicking on empty space (not an event), create new event at this hour
                    if (e.target === e.currentTarget) {
                      onAddEvent(currentDate, hour);
                    }
                  }}
                >
                  {/* Add Event Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-[#FF7000]/20 border border-[#FF7000]/30 rounded-lg p-2">
                      <Plus className="w-4 h-4 text-[#FF7000]" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    {hourEventLayouts.map((layout) => {
                      const { event, width, left } = layout;
                      const eventStart = new Date(event.start_date);
                      const eventEnd = new Date(event.end_date);
                      const eventDurationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                      const eventHeight = Math.max(eventDurationMinutes / 60 * 60, 30); // Minimum 30px height
                      
                      // Calculate top position based on start time within the hour
                      const minuteOffset = eventStart.getMinutes();
                      const topOffset = (minuteOffset / 60) * 60; // Scale to hour height
                      
                      return (
                        <div
                          key={event.id}
                          className="absolute p-2 rounded-md cursor-pointer transition-all duration-200 border border-white/10 hover:border-[#FF5F1F]/30 bg-white/5 hover:bg-white/10 overflow-hidden"
                          style={{
                            borderLeftColor: event.color || '#FF5F1F',
                            borderLeftWidth: '4px',
                            width: `${width}%`,
                            left: `${left}%`,
                            height: `${eventHeight}px`,
                            top: `${topOffset}px`,
                            minHeight: '30px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                        >
                          <div className="flex items-start gap-2 h-full">
                            <div className="flex-1 min-w-0">
                              <div className="text-white/90 font-medium text-xs truncate">
                                {event.title}
                              </div>
                              {!event.is_all_day && (
                                <div className="text-white/60 text-[10px] mt-0.5">
                                  {format(new Date(event.start_date), 'h:mm a')} - {format(new Date(event.end_date), 'h:mm a')}
                                </div>
                              )}
                              {event.location && (
                                <div className="text-white/50 text-[10px] mt-0.5 truncate">
                                  📍 {event.location}
                                </div>
                              )}
                            </div>
                            {event.is_synced && (
                              <Cloud className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Utility functions for handling overlapping events
  const eventsOverlap = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
    const start1 = new Date(event1.start_date).getTime();
    const end1 = new Date(event1.end_date).getTime();
    const start2 = new Date(event2.start_date).getTime();
    const end2 = new Date(event2.end_date).getTime();
    
    return start1 < end2 && start2 < end1;
  };

  const calculateEventLayout = (events: CalendarEvent[]) => {
    if (events.length === 0) return [];
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    const eventLayout: Array<{
      event: CalendarEvent;
      column: number;
      width: number;
      left: number;
      totalColumns: number;
    }> = [];
    
    // Group overlapping events
    const groups: CalendarEvent[][] = [];
    
    for (const event of sortedEvents) {
      let placed = false;
      
      // Try to place in existing group
      for (const group of groups) {
        const overlapsWithGroup = group.some(groupEvent => eventsOverlap(event, groupEvent));
        if (overlapsWithGroup) {
          group.push(event);
          placed = true;
          break;
        }
      }
      
      // Create new group if no overlap found
      if (!placed) {
        groups.push([event]);
      }
    }
    
    // Calculate layout for each group
    groups.forEach(group => {
      const groupSize = group.length;
      
      group.forEach((event, index) => {
        // Find the optimal column for this event
        let column = 0;
        const occupiedColumns = new Set<number>();
        
        // Check what columns are occupied by overlapping events
        group.forEach((otherEvent, otherIndex) => {
          if (otherIndex < index && eventsOverlap(event, otherEvent)) {
            const otherLayout = eventLayout.find(layout => layout.event.id === otherEvent.id);
            if (otherLayout) {
              occupiedColumns.add(otherLayout.column);
            }
          }
        });
        
        // Find first available column
        while (occupiedColumns.has(column)) {
          column++;
        }
        
        const width = 100 / groupSize;
        const left = (100 / groupSize) * column;
        
        eventLayout.push({
          event,
          column,
          width,
          left,
          totalColumns: groupSize
        });
      });
    });
    
    return eventLayout;
  };

  return (
    <div className="w-full space-y-4">
      {/* CalendarPage header */}
      <div className="p-4 border-b border-white/10 bg-white/5 rounded-t-xl mb-6">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Column 1: Info Label Container */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-white/70 hover:text-[#FF7000] flex items-center justify-center"
              onClick={navigatePrevious}
            >
              <ChevronLeft size={16} />
              <span className="sr-only">{getPreviousLabel()}</span>
            </Button>
            <h2 className="text-lg font-medium text-white/90 px-4 flex items-center">
              {getHeaderTitle()}
            </h2>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-white/70 hover:text-[#FF7000] flex items-center justify-center"
              onClick={navigateNext}
            >
              <ChevronRight size={16} />
              <span className="sr-only">{getNextLabel()}</span>
            </Button>
          </div>

          {/* Column 2: Empty - Events created by clicking grid */}
          <div className="flex justify-center items-center">
            {/* Events can be created by clicking on the calendar grid */}
          </div>

          {/* Column 3: View Buttons and Today Button */}
          <div className="flex items-center gap-2 justify-end">
            {/* View Mode Selector */}
            <div className="flex bg-slate-800/30 rounded-lg p-1 border border-slate-700/30 h-9 items-center">
              {Object.values(CalendarViewMode).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode as CalendarViewMode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center min-w-[60px] h-7 ${
                    viewMode === mode
                      ? 'bg-[#FF7000]/20 text-[#FF7000] border border-[#FF7000]/30'
                      : 'text-white/70 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            <Button
              variant="outline"
              className="h-9 px-4 text-xs font-medium bg-slate-800/30 border-slate-700/30 text-white hover:bg-slate-800/40 hover:border-[#FF7000]/30 hover:text-[#FF7000] flex items-center justify-center min-w-[60px]"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      {renderCalendarView()}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#010024]/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-[#4169E1] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-[#E3E3E3]/70">Loading calendar events...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarGrid;
