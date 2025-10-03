import { useState, useEffect } from 'react';
import { type SchedulerEvent } from '@/types/scheduler';

const STORAGE_KEY = 'atmo_roadmap_tasks';
const SYNC_EVENT = 'scheduler-sync';

// Default tasks if nothing in storage
const getDefaultTasks = (): SchedulerEvent[] => [
  {
    id: 'task-1',
    title: 'Morning Routine',
    startTime: '07:00',
    duration: 60,
  },
  {
    id: 'task-2',
    title: 'Morning Meeting',
    startTime: '09:00',
    duration: 30,
  },
  {
    id: 'task-3',
    title: 'Deep Work',
    startTime: '10:00',
    duration: 120,
  },
  {
    id: 'task-4',
    title: 'Lunch Break',
    startTime: '12:30',
    duration: 60,
  },
  {
    id: 'task-5',
    title: 'Afternoon Session',
    startTime: '14:00',
    duration: 90,
  },
  {
    id: 'task-6',
    title: 'Wrap Up & Planning',
    startTime: '17:00',
    duration: 60,
  },
];

const loadTasksFromStorage = (): SchedulerEvent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
  }
  return getDefaultTasks();
};

/**
 * Hook to sync scheduler events across dashboard and digital brain
 * Uses localStorage and custom events for real-time sync
 */
export const useSchedulerSync = () => {
  const [events, setEvents] = useState<SchedulerEvent[]>(loadTasksFromStorage());

  // Save to localStorage and dispatch sync event
  const updateEvents = (newEvents: SchedulerEvent[]) => {
    setEvents(newEvents);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: newEvents }));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  };

  // Listen for sync events from other components
  useEffect(() => {
    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<SchedulerEvent[]>;
      setEvents(customEvent.detail);
    };

    window.addEventListener(SYNC_EVENT, handleSync);

    // Also listen for storage events (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newEvents = JSON.parse(e.newValue);
          setEvents(newEvents);
        } catch (error) {
          console.error('Failed to parse storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { events, updateEvents };
};
