import React from "react";
import {CalendarEvent} from "@/models/CalendarEvent.ts";

interface CalendarStatsProps {
    events: CalendarEvent[]
    todayEvents: CalendarEvent[]
}

const CalendarStats: React.FC<CalendarStatsProps> = ({events, todayEvents}) => {
    return (
        <div
            className="bg-transparent border border-white/10 backdrop-blur-xl overflow-hidden rounded-xl hover:bg-white/[0.02] transition-all duration-300">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-white/90 mb-4">Calendar Stats</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Total Events</span>
                        <span className="text-sm font-medium text-[#FF5F1F]">{events.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Today's Events</span>
                        <span className="text-sm font-medium text-[#FF5F1F]">{todayEvents.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">This Week</span>
                        <span className="text-sm font-medium text-[#FF5F1F]">
                      {events.filter(event => {
                          const eventDate = new Date(event.startDate);
                          const today = new Date();
                          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                          const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                          return eventDate >= weekStart && eventDate <= weekEnd;
                      }).length}
                    </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CalendarStats;
