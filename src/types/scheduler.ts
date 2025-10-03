// Scheduler Event Types

export interface SchedulerEvent {
  id: string;
  title: string;
  startTime: string; // HH:MM format (24-hour)
  duration: number; // in minutes
  description?: string;
  category?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  displayTime: string; // "08:00", "09:00", etc.
}

export interface DragState {
  isDragging: boolean;
  eventId: string | null;
  startY: number;
  originalStartTime: string;
}

export interface CalendarDate {
  year: number;
  month: number; // 0-11 (JavaScript Date month)
  day: number;
}

// Helper function to convert time string to minutes since midnight
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes since midnight to time string
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to calculate end time
export const calculateEndTime = (startTime: string, duration: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  return minutesToTime(endMinutes);
};

// Helper function to snap to 15-minute intervals
export const snapTo15Minutes = (minutes: number): number => {
  return Math.round(minutes / 15) * 15;
};

// Helper function to snap to 30-minute intervals
export const snapTo30Minutes = (minutes: number): number => {
  return Math.round(minutes / 30) * 30;
};

// Helper function to generate time slots for the day (01:00 - 24:00/00:00) with 30-min intervals
export const generateTimeSlots = (includeHalfHours: boolean = false): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 1; hour <= 24; hour++) {
    const displayHour = hour === 24 ? 0 : hour; // Display 24 as 00
    slots.push({
      hour: displayHour,
      minute: 0,
      displayTime: `${displayHour.toString().padStart(2, '0')}:00`,
    });

    if (includeHalfHours && hour < 24) {
      slots.push({
        hour: displayHour,
        minute: 30,
        displayTime: `${displayHour.toString().padStart(2, '0')}:30`,
      });
    }
  }
  return slots;
};

// Helper function to format duration for display
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
};
