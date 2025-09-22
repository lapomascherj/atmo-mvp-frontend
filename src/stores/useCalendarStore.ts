import { create } from "zustand";
import { CalendarEvent } from "@/models/CalendarEvent";
import { CalendarViewMode } from "@/models/CalendarViewMode";
import { getPocketBase } from "@/hooks/useMockPocketBase";
import { usePersonasStore } from "./usePersonasStore";

interface CalendarStoreState {
  events: CalendarEvent[];
  currentDate: Date;
  viewMode: CalendarViewMode;
  selectedEvent: CalendarEvent | null;
  loading: boolean;
  error: string | null;
  lastFetchTime: number;

  // Data access methods - work with centralized Persona data
  fetchEvents: (token: string, force?: boolean) => Promise<void>;
  getEvents: () => CalendarEvent[];
  getEventsByDate: (date: Date) => CalendarEvent[];
  getEventsByDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  getTodayEvents: () => CalendarEvent[];

  // CRUD operations - delegate to PersonasStore for knowledge items
  addEvent: (eventData: Partial<CalendarEvent>) => Promise<boolean>;
  updateEvent: (
    id: string,
    updates: Partial<CalendarEvent>
  ) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  removeEvent: (pb: any, id: string) => Promise<boolean>; // Legacy alias

  // View state management
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;

  // Utility methods
  clearEvents: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const FETCH_DEBOUNCE_MS = 2000;

export const useCalendarStore = create<CalendarStoreState>((set, get) => ({
  events: [],
  currentDate: new Date(),
  viewMode: CalendarViewMode.Month,
  selectedEvent: null,
  loading: false,
  error: null,
  lastFetchTime: 0,

  // Fetch calendar events from centralized Persona data (knowledge items with source="calendar")
  fetchEvents: async (token: string, force = false) => {
    const state = get();
    const now = Date.now();

    // Debounce: Skip if recently fetched (unless forced)
    if (
      !force &&
      state.events.length > 0 &&
      now - state.lastFetchTime < FETCH_DEBOUNCE_MS
    ) {
      console.debug("⏭️ CALENDAR STORE: Skipping fetch - recently fetched");
      return;
    }

    // Skip if already loading (unless forced)
    if (!force && state.loading) {
      console.debug("⏭️ CALENDAR STORE: Skipping fetch - already loading");
      return;
    }

    try {
      set({ loading: true, error: null, lastFetchTime: now });

      // Get calendar events from PersonasStore knowledge items (no additional fetching)
      const { usePersonasStore } = await import("./usePersonasStore");
      const personasStore = usePersonasStore.getState();
      const knowledgeItems = personasStore.getKnowledgeItems();

      console.debug(
        `📅 CALENDAR STORE: Found ${knowledgeItems.length} total knowledge items from PersonasStore`
      );
      console.debug(
        `📅 CALENDAR STORE: Knowledge items:`,
        knowledgeItems.map((item) => ({
          id: item.id,
          title: item.title || item.name,
          source: item.source,
          hasContent: !!item.content,
          contentType: typeof item.content,
        }))
      );

      // Transform knowledge items with source="calendar" to calendar events
      const calendarKnowledgeItems = knowledgeItems.filter(
        (item) => item.source === "calendar"
      );
      console.debug(
        `📅 CALENDAR STORE: Found ${calendarKnowledgeItems.length} calendar knowledge items:`
      );
      console.debug(
        `📅 CALENDAR STORE: Calendar items details:`,
        calendarKnowledgeItems.map((item) => ({
          id: item.id,
          name: item.name || item.title,
          contentType: typeof item.content,
          content: item.content,
          source: item.source,
        }))
      );

      const calendarEvents = calendarKnowledgeItems.map((item) => {
        // Extract proper dates from content object
        let startDate = new Date();
        let endDate = new Date();
        let description = "";

        if (item.content) {
          if (typeof item.content === "object") {
            const contentObj = item.content as any;
            if (contentObj.start_date)
              startDate = new Date(contentObj.start_date);
            if (contentObj.end_date) endDate = new Date(contentObj.end_date);
            if (contentObj.description) description = contentObj.description;
          } else if (typeof item.content === "string") {
            try {
              const contentObj = JSON.parse(item.content);
              if (contentObj.start_date)
                startDate = new Date(contentObj.start_date);
              if (contentObj.end_date) endDate = new Date(contentObj.end_date);
              if (contentObj.description) description = contentObj.description;
            } catch {
              // Use fallback dates
            }
          }
        }

        return {
          id: item.id,
          title: item.title || item.name || "Untitled Event", // Handle both title and name
          start_date: startDate,
          end_date: endDate,
          start_time: startDate,
          end_time: endDate,
          all_day: false,
          description:
            description ||
            (typeof item.content === "string" ? item.content : ""),
          location: "",
          attendees: [],
          synced: false, // These are local events, not synced from external calendar
        };
      });

      console.debug(
        `📅 CALENDAR STORE: Using ${calendarEvents.length} events from PersonasStore`
      );

      // Get current events to preserve any that aren't from knowledge items
      const currentEvents = get().events || [];

      // Filter out old knowledge-item-based events and merge with new ones
      const nonKnowledgeItemEvents = currentEvents.filter(
        (event) => !calendarKnowledgeItems.some((item) => item.id === event.id)
      );

      const mergedEvents = [...nonKnowledgeItemEvents, ...calendarEvents];

      console.debug(
        `📅 CALENDAR STORE: Merging ${nonKnowledgeItemEvents.length} existing events with ${calendarEvents.length} knowledge item events`
      );

      set({ events: mergedEvents, loading: false });
    } catch (error: any) {
      console.error(
        "❌ CALENDAR STORE: Error getting calendar events:",
        error?.message
      );
      set({
        error: error.message || "Failed to get calendar events",
        loading: false,
      });
    }
  },

  // Get all events from local state
  getEvents: () => {
    return get().events;
  },

  // Get events for a specific date
  getEventsByDate: (date: Date) => {
    const { events } = get();
    const targetDate = date.toISOString().split("T")[0];

    return events.filter((event) => {
      // Validate that start_date exists and is not null/undefined
      if (!event.start_date) {
        return false;
      }

      try {
        const eventDate = new Date(event.start_date);
        // Check if the date is valid
        if (isNaN(eventDate.getTime())) {
          return false;
        }
        const eventDateStr = eventDate.toISOString().split("T")[0];
        return eventDateStr === targetDate;
      } catch (error) {
        console.error(
          "Invalid date in calendar event:",
          event.start_date,
          error
        );
        return false;
      }
    });
  },

  // Get events within a date range
  getEventsByDateRange: (startDate: Date, endDate: Date) => {
    const { events } = get();

    return events.filter((event) => {
      // Validate that start_date exists and is not null/undefined
      if (!event.start_date) {
        return false;
      }

      try {
        const eventStart = new Date(event.start_date);
        // Check if the date is valid
        if (isNaN(eventStart.getTime())) {
          return false;
        }
        return eventStart >= startDate && eventStart <= endDate;
      } catch (error) {
        console.error(
          "Invalid date in calendar event:",
          event.start_date,
          error
        );
        return false;
      }
    });
  },

  // Get today's events
  getTodayEvents: () => {
    const { events } = get();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    return events.filter((event) => {
      // Validate that start_date exists and is not null/undefined
      if (!event.start_date) {
        return false;
      }

      try {
        const eventDate = new Date(event.start_date);
        // Check if the date is valid
        if (isNaN(eventDate.getTime())) {
          return false;
        }
        const eventDateStr = eventDate.toISOString().split("T")[0];
        return eventDateStr === todayStr;
      } catch (error) {
        console.error(
          "Invalid date in calendar event:",
          event.start_date,
          error
        );
        return false;
      }
    });
  },

  // Add new calendar event - delegates to PersonasStore as knowledge item
  addEvent: async (eventData: Partial<CalendarEvent>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Transform calendar event to knowledge item format
      const knowledgeItemData = {
        title: eventData.title,
        content: eventData.description,
        type: "event",
        source: "calendar",
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        all_day: eventData.all_day,
        location: eventData.location,
        attendees: eventData.attendees,
        recurring_event_id: eventData.recurring_event_id,
        color: eventData.color,
      };

      // Delegate to centralized Persona store
      const success = await personasStore.addKnowledgeItem(
        pb,
        knowledgeItemData
      );

      if (success) {
        // Update local events from refreshed Persona data
        await get().fetchEvents("", true); // Force refresh

        console.log("✅ CALENDAR STORE: Calendar event created successfully");
        return true;
      } else {
        set({ error: "Failed to create calendar event", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to create calendar event:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to create calendar event",
        loading: false,
      });
      return false;
    }
  },

  // Update calendar event - delegates to PersonasStore
  updateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Transform calendar event updates to knowledge item format
      const knowledgeItemUpdates = {
        title: updates.title,
        content: updates.description,
        start_date: updates.start_date,
        end_date: updates.end_date,
        all_day: updates.all_day,
        location: updates.location,
        attendees: updates.attendees,
        recurring_event_id: updates.recurring_event_id,
        color: updates.color,
      };

      // Delegate to centralized Persona store
      const success = await personasStore.updateKnowledgeItem(
        pb,
        id,
        knowledgeItemUpdates
      );

      if (success) {
        // Update local events from refreshed Persona data
        await get().fetchEvents("", true); // Force refresh

        console.log("✅ CALENDAR STORE: Calendar event updated successfully");
        return true;
      } else {
        set({ error: "Failed to update calendar event", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to update calendar event:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to update calendar event",
        loading: false,
      });
      return false;
    }
  },

  // Delete calendar event - delegates to PersonasStore
  deleteEvent: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const pb = getPocketBase();
      const personasStore = usePersonasStore.getState();

      // Delegate to centralized Persona store
      const success = await personasStore.removeKnowledgeItem(pb, id);

      if (success) {
        // Update local events from refreshed Persona data
        await get().fetchEvents("", true); // Force refresh

        console.log("✅ CALENDAR STORE: Calendar event deleted successfully");
        return true;
      } else {
        set({ error: "Failed to delete calendar event", loading: false });
        return false;
      }
    } catch (error: any) {
      console.error("Failed to delete calendar event:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      set({
        error: error.message || "Failed to delete calendar event",
        loading: false,
      });
      return false;
    }
  },

  // View state management
  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
  },

  setViewMode: (mode: CalendarViewMode) => {
    set({ viewMode: mode });
  },

  setSelectedEvent: (event: CalendarEvent | null) => {
    set({ selectedEvent: event });
  },

  // Utility methods
  clearEvents: () => {
    console.log("🧹 CALENDAR STORE: Clearing calendar events data");
    set({
      events: [],
      selectedEvent: null,
      loading: false,
      error: null,
      lastFetchTime: 0,
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  // Legacy alias for backward compatibility
  removeEvent: async (pb: any, id: string) => {
    return await get().deleteEvent(id);
  },
}));
