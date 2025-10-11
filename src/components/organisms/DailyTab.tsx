import React, { useEffect } from 'react';
import StatsSection from '../atoms/StatsSection.tsx';
import MorningPodcast from '../molecules/MorningPodcast.tsx';
// import { useCalendarStore } from '@/stores/useCalendarStore.ts'; // Temporarily disabled
import { useTasksStore } from '@/stores/useTasksStore.ts';
import { usePocketBase } from "@/hooks/useMockPocketBase";
import useMockAuth from '@/hooks/useMockAuth';

interface DailyTabProps {
  flippedCard: string | null;
  toggleCardFlip: (id: string) => void;
}

const DailyTab: React.FC<DailyTabProps> = ({ flippedCard, toggleCardFlip }) => {
  // const { events, fetchEvents } = useCalendarStore(); // Temporarily disabled
  const { tasks } = useTasksStore();
  const pb = usePocketBase();
  const { user } = useMockAuth();

  // Force fresh calendar data fetch when component mounts
  useEffect(() => {
    if (pb && user) {
      console.log('🔄 DAILY TAB: Forcing fresh calendar data fetch for today');
      // fetchEvents(pb, true); // Temporarily disabled - Force fresh fetch
    }
  }, [pb, user]); // Removed fetchEvents dependency

  // Calculate real stats from calendar and tasks
  const calculateDailyStats = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const events = []; // Temporarily empty - calendar store disabled
    
    console.log('📊 DAILY TAB: Calculating stats for today:', {
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString(),
      totalEvents: events.length,
      eventsData: events.map(e => ({ 
        title: e.title, 
        start_date: e.start_date, 
        start_time: e.start_time 
      }))
    });

    // Get today's events using correct property names
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.start_date);
      const isToday = eventDate >= todayStart && eventDate < todayEnd;
      console.log('📅 Event check:', {
        title: event.title,
        eventDate: eventDate.toISOString(),
        isToday
      });
      return isToday;
    });

    console.log('📅 DAILY TAB: Today\'s events:', todayEvents.length, todayEvents.map(e => e.title));

    // Calculate total allocated time from events (assuming each event has duration)
    const allocatedHours = todayEvents.reduce((total, event) => {
      if (event.start_time && event.end_time) {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + durationHours;
      }
      return total + 1; // Default 1 hour if no end time
    }, 0);

    // Standard work day hours
    const totalHours = 8;
    const freeHours = Math.max(0, totalHours - allocatedHours);

    // Calculate automation percentage based on completed tasks vs total tasks
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const automationPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const stats = {
      totalHours: totalHours,
      allocatedHours: Math.round(allocatedHours * 10) / 10, // Round to 1 decimal
      freeHours: Math.round(freeHours * 10) / 10,
      automationPercentage: Math.min(automationPercentage, 100)
    };

    console.log('📊 DAILY TAB: Calculated stats:', stats);
    return stats;
  };

  const stats = calculateDailyStats();

  return (
    <div className="space-y-4 animate-in fade-in-0 zoom-in-95 duration-300">
      {/* Stats Section */}
      <StatsSection {...stats} />

      {/* Morning Podcast */}
      <MorningPodcast />
    </div>
  );
};

export default DailyTab;
