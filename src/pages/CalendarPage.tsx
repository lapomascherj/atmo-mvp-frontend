import React, { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import CalendarGrid from "@/components/molecules/CalendarGrid";
import EventFormDialog from "@/components/molecules/EventFormDialog";
import { useAuth } from "@/hooks/useMockAuth";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { useIntegrationsStore } from "@/stores/useMockIntegrationsStore";
import { CalendarEvent } from "@/models/CalendarEvent";
import { CalendarViewMode } from "@/models/CalendarViewMode";
import { IntegrationProvider } from "@/models/IntegrationProvider";
import { Badge } from "@/components/atoms/Badge";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import { useToast } from "@/hooks/useToast";
import { Calendar as CalendarIcon, Layout, Plus, RefreshCw, Settings, Clock, Cloud, Link, Unlink, Link2, Trash2, X } from "lucide-react";
import { useKnowledgeItemsStore } from "@/stores/useKnowledgeItemsStore";
import { digitalBrainAPI } from "@/api/mockDigitalBrainApi";
import { KnowledgeOrganizerLayout } from "@/components/layouts/KnowledgeOrganizerLayout";
import PageHeader from "@/components/atoms/PageHeader";
import { Check, Award, BarChart3 } from "lucide-react";

const CalendarPage: React.FC = () => {
    const {user, token} = useAuth();
    const pb = usePocketBase();
    const {toast} = useToast();
    
    // Use calendar store instead of context
    const {events, loading, fetchEvents, addEvent, updateEvent, removeEvent, getTodayEvents} = useCalendarStore();
    
    // Integration store for Google Calendar connection
    const {integrations, fetchIntegrations, hasIntegration, getIntegrationByProvider, initiateOAuthFlow} = useIntegrationsStore();
    
    // Local state for UI
    const [formOpen, setFormOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isNewEvent, setIsNewEvent] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);

    const [viewMode, setViewMode] = useState<CalendarViewMode>(CalendarViewMode.Month);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Delete confirmation state
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Check if Google Calendar is connected
    const isGoogleConnected = hasIntegration(IntegrationProvider.Google);
    const googleIntegration = getIntegrationByProvider(IntegrationProvider.Google);

    // Fetch events and integrations on component mount
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (pb && user && mounted) {
                try {
                    console.log('📅 CALENDAR PAGE: Fetching calendar data...');
                    // Fetch both calendar events and integrations
                    await Promise.all([
                        fetchEvents(user.iam), // Use user.iam as token
                        fetchIntegrations(pb)
                    ]);
                    console.log('📅 CALENDAR PAGE: Data fetch completed');
                } catch (error) {
                    console.log('Calendar data fetch completed with potential auto-cancellations');
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [pb, user, fetchEvents, fetchIntegrations]);

    // Debug logging for events and view mode
    useEffect(() => {
        console.log('📅 CALENDAR PAGE: State update:', {
            eventsCount: events.length,
            viewMode,
            currentDate,
            isGoogleConnected,
            loading
        });
    }, [events, viewMode, currentDate, isGoogleConnected, loading]);

    // Test function to create sample events (for debugging)
    const createTestEvents = async () => {
        if (!pb) return;
        
        const testEvents = [
            {
                title: 'Test Meeting',
                description: 'A test meeting to verify calendar functionality',
                start_date: new Date(),
                start_time: new Date(),
                end_date: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
                end_time: new Date(Date.now() + 60 * 60 * 1000),
                all_day: false,
                location: 'Test Location',
                color: '#FF5F1F'
            },
            {
                title: 'Google Calendar Sync Test',
                description: 'Synced from Google Calendar',
                start_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
                end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
                end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
                all_day: false,
                synced: true, // Mark as synced from Google
                color: '#4169E1'
            }
        ];

        try {
            for (const event of testEvents) {
                await addEvent(event); // Remove pb parameter
            }
            toast({
                title: 'Test Events Created! 🎉',
                description: 'Created test events to verify calendar functionality.',
            });
        } catch (error) {
            console.error('Failed to create test events:', error);
        }
    };

    // Handle opening event form for creating a new event
    const handleAddEvent = (date?: Date, hour?: number) => {
        setIsNewEvent(true);
        setSelectedEvent(undefined);
        
        // If a specific date/hour is provided, we can pre-populate the event form
        if (date) {
            setCurrentDate(date);
        }
        
        setFormOpen(true);
    };

    // Handle opening event form for editing an existing event
    const handleSelectEvent = (event: CalendarEvent) => {
        setIsNewEvent(false);
        setSelectedEvent(event);
        setFormOpen(true);
    };

    // Close form handler
    const handleCloseForm = () => {
        setFormOpen(false);
    };

    // Save event (create or update)
    const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
        if (!pb) return;

        try {
            if (isNewEvent) {
                // Create new event using store
                await addEvent(eventData); // Remove pb parameter
                toast({
                    title: 'Event created! 📅',
                    description: `"${eventData.title}" has been added to your calendar`,
                    duration: 3000,
                });
            } else if (selectedEvent) {
                // Update existing event using store
                await updateEvent(selectedEvent.id, eventData); // Remove pb parameter
                toast({
                    title: 'Event updated! ✨',
                    description: `"${eventData.title}" has been updated`,
                    duration: 3000,
                });
            }

            // Close the form
            setFormOpen(false);
        } catch (error) {
            console.error('Error saving event:', error);
            toast({
                title: 'Error',
                description: 'Failed to save event',
                variant: 'destructive',
            });
        }
    };

    // Delete event
    const handleDeleteEvent = async () => {
        if (!selectedEvent || !pb) return;

        try {
            await removeEvent(pb, selectedEvent.id);

            toast({
                title: 'Event deleted',
                description: `"${selectedEvent.title}" has been removed`,
                duration: 3000,
            });

            setFormOpen(false);
        } catch (error) {
            console.error('Error deleting event:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete event',
                variant: 'destructive',
            });
        }
    };

    // Convert event to task
    const handleConvertToTask = async () => {
        if (!selectedEvent) return;

        try {
            // TODO: Implement task conversion logic when task store is available
            toast({
                title: 'Converted to task! 🎯',
                description: `"${selectedEvent.title}" is now in your daily tasks`,
                duration: 3000,
            });

            setFormOpen(false);
        } catch (error) {
            console.error('Error converting event to task:', error);
            toast({
                title: 'Error',
                description: 'Failed to convert event to task',
                variant: 'destructive',
            });
        }
    };

    // Quick delete functions for event list
    const handleQuickDelete = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event selection
        setEventToDelete(event);
        setShowDeleteConfirm(true);
    };

    const confirmQuickDelete = async () => {
        if (!eventToDelete || !pb) return;

        try {
            console.log(`🗑️ CALENDAR PAGE: Quick deleting event: ${eventToDelete.title} (${eventToDelete.id})`);
            
            await removeEvent(pb, eventToDelete.id);

            toast({
                title: 'Event deleted',
                description: `"${eventToDelete.title}" has been removed`,
                duration: 3000,
            });

            setShowDeleteConfirm(false);
            setEventToDelete(null);
        } catch (error) {
            console.error('Error deleting event:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete event',
                variant: 'destructive',
            });
        }
    };

    const cancelQuickDelete = () => {
        setShowDeleteConfirm(false);
        setEventToDelete(null);
    };

    // Handle Google Calendar connection
    const handleConnectGoogle = async () => {
        if (!pb || !user) {
            toast({
                title: 'Authentication Required',
                description: 'Please log in to connect Google Calendar.',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Initiate OAuth flow for Google Calendar
            const redirectUri = `${window.location.origin}/auth/google/callback`;
            const { authUrl, state } = await initiateOAuthFlow(pb, IntegrationProvider.Google, [], redirectUri);
            
            // Store OAuth state in localStorage for verification (CRITICAL FIX)
            console.log('🚀 CalendarPage: Storing OAuth state:', {
                state: state,
                provider: IntegrationProvider.Google,
                redirectUri: redirectUri
            });
            
            localStorage.setItem('oauth_state', state);
            localStorage.setItem('oauth_provider', IntegrationProvider.Google);
            
            console.log('✅ CalendarPage: OAuth state stored:', {
                storedState: localStorage.getItem('oauth_state'),
                storedProvider: localStorage.getItem('oauth_provider'),
                stateMatches: localStorage.getItem('oauth_state') === state
            });
            
            // Redirect to OAuth provider
            console.log('🔄 CalendarPage: Redirecting to:', authUrl);
            window.location.href = authUrl;
        } catch (error: any) {
            console.error('Failed to connect Google Calendar:', error);
            toast({
                title: 'Connection Failed',
                description: error.message || 'Failed to connect to Google Calendar. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Handle sync with tasks - create calendar events for tasks that don't have them
    const handleSyncWithTasks = async () => {
        if (!pb || !user) {
            toast({
                title: 'Authentication Required',
                description: 'Please log in to sync tasks with calendar.',
                variant: 'destructive',
            });
            return;
        }

        setIsSyncing(true);
        try {
            console.log('🔄 CALENDAR SYNC: Starting task-to-calendar sync...');
            
            // Import PersonasStore to get tasks
            const { usePersonasStore } = await import("@/stores/usePersonasStore");
            const personasStore = usePersonasStore.getState();
            
            // Ensure persona is loaded with full expand
            console.log('🔍 CALENDAR SYNC: Checking PersonasStore state:', {
                hasCurrentPersona: !!personasStore.currentPersona,
                personaId: personasStore.currentPersona?.id,
                personaIam: personasStore.currentPersona?.iam,
                loading: personasStore.loading
            });
            
            if (!personasStore.currentPersona || !personasStore.currentPersona.expand) {
                console.log('🔄 CALENDAR SYNC: Loading persona data...');
                await personasStore.fetchPersonaByIam(pb, user.iam, true); // Force refresh
            }
            
            // Debug the persona structure
            const currentPersona = personasStore.currentPersona;
            console.log('🔍 CALENDAR SYNC: Persona structure:', {
                hasPersona: !!currentPersona,
                hasExpand: !!currentPersona?.expand,
                projectsCount: currentPersona?.expand?.projects?.length || 0,
                projects: currentPersona?.expand?.projects?.map(p => ({
                    id: p.id,
                    name: p.name,
                    goalsCount: p.expand?.goals?.length || 0,
                    goals: p.expand?.goals?.map(g => ({
                        id: g.id,
                        name: g.name,
                        tasksCount: g.expand?.tasks?.length || 0
                    }))
                }))
            });
            
            // Get all tasks from PersonasStore
            const allTasks = personasStore.getTasks();
            console.log(`📋 CALENDAR SYNC: Found ${allTasks.length} tasks to check:`, 
                allTasks.map(t => ({ id: t.id, name: t.name, priority: t.priority }))
            );
            
            if (allTasks.length === 0) {
                toast({
                    title: 'No Tasks Found',
                    description: 'No tasks available to sync. Create some tasks first!',
                    variant: 'default',
                });
                return;
            }
            
            // Get existing calendar-related knowledge items to avoid duplicates
            console.log(`🔍 CALENDAR SYNC: Querying existing calendar knowledge items...`);
            
            const existingCalendarItems = await pb.collection("knowledge_items").getFullList({
                filter: `source = "calendar"`,
                sort: "-created",
            });
            
            console.log(`📅 CALENDAR SYNC: Found ${existingCalendarItems.length} existing calendar knowledge items:`);
            
            // Log detailed information about existing items for debugging
            const existingItemsDebug = existingCalendarItems.map(item => {
                let taskId = null;
                let contentType = typeof item.content;
                let contentPreview = null;
                
                if (item.content) {
                    if (typeof item.content === 'string') {
                        try {
                            const contentObj = JSON.parse(item.content);
                            taskId = contentObj.task_id;
                            contentPreview = { task_id: contentObj.task_id, event_id: contentObj.event_id };
                        } catch (e) {
                            contentPreview = `Parse error: ${e.message}`;
                        }
                    } else if (typeof item.content === 'object') {
                        taskId = (item.content as any).task_id;
                        contentPreview = { task_id: (item.content as any).task_id, event_id: (item.content as any).event_id };
                    }
                }
                
                return {
                    id: item.id,
                    name: item.name || item.title || 'No name',
                    taskId: taskId,
                    contentType: contentType,
                    contentPreview: contentPreview,
                    created: item.created || item.created_at,
                };
            });
            
            console.log(`📅 CALENDAR SYNC: Detailed existing items:`, existingItemsDebug);
            
            // Build a map of task IDs that already have calendar events
            const existingTaskIds = new Set();
            for (const item of existingCalendarItems) {
                if (item.content) {
                    let contentObj;
                    if (typeof item.content === 'string') {
                        try {
                            contentObj = JSON.parse(item.content);
                        } catch {
                            console.warn(`⚠️ CALENDAR SYNC: Failed to parse content for item ${item.id}:`, item.content);
                            continue;
                        }
                    } else if (typeof item.content === 'object') {
                        contentObj = item.content;
                    } else {
                        console.warn(`⚠️ CALENDAR SYNC: Unexpected content type for item ${item.id}:`, typeof item.content);
                        continue;
                    }
                    
                    if (contentObj.task_id) {
                        existingTaskIds.add(contentObj.task_id);
                        console.log(`✅ CALENDAR SYNC: Found existing calendar event for task ${contentObj.task_id}`);
                    }
                }
            }
            
            console.log(`📅 CALENDAR SYNC: Task IDs with existing calendar events (${existingTaskIds.size}):`, Array.from(existingTaskIds));
            
            // Find tasks without calendar events (UPSERT LOGIC - only create new ones)
            const tasksWithoutEvents = allTasks.filter(task => !existingTaskIds.has(task.id));
            console.log(`🆕 CALENDAR SYNC: Creating calendar events for ${tasksWithoutEvents.length} NEW tasks:`,
                tasksWithoutEvents.map(t => ({ id: t.id, name: t.name }))
            );
            
            if (tasksWithoutEvents.length === 0) {
                toast({
                    title: 'All Tasks Already Synced! ✅',
                    description: 'All your tasks already have calendar events. No new events needed.',
                });
                return;
            }
            
            let createdEvents = 0;
            
            for (const task of tasksWithoutEvents) {
                try {
                    console.log(`🔄 CALENDAR SYNC: Processing task: ${task.name} (${task.id})`);
                    
                    // Double-check: Query directly for this specific task to avoid any duplicates
                    console.log(`🔍 CALENDAR SYNC: Double-checking for existing calendar event for task ${task.id}...`);
                    const existingForTask = await pb.collection("knowledge_items").getFullList({
                        filter: `source = "calendar" && content ~ "${task.id}"`,
                    });
                    
                    if (existingForTask.length > 0) {
                        console.log(`⚠️ CALENDAR SYNC: Found ${existingForTask.length} existing calendar events for task ${task.id}, skipping...`);
                        continue;
                    }
                    
                    // Calculate event timing based on task priority
                    const now = new Date();
                    const startDate = new Date(now);
                    
                    if (task.priority === "high") {
                        startDate.setHours(startDate.getHours() + 1);
                    } else if (task.priority === "medium") {
                        startDate.setHours(startDate.getHours() + 4);
                    } else {
                        startDate.setDate(startDate.getDate() + 1);
                        startDate.setHours(9, 0, 0, 0);
                    }
                    
                    const estimatedMinutes = task.estimated_time || 60;
                    const endDate = new Date(startDate);
                    endDate.setMinutes(endDate.getMinutes() + estimatedMinutes);
                    
                    const calendarEventData = {
                        title: `📋 ${task.name}`,
                        description: task.description || "Task from project management",
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString(),
                        start_time: startDate.toISOString(),
                        end_time: endDate.toISOString(),
                        all_day: false,
                        location: "",
                        attendees: [],
                        color: task.priority === "high" ? "#ef4444" : 
                               task.priority === "medium" ? "#f59e0b" : "#3b82f6",
                        synced: false,
                    };
                    
                    console.log(`📅 CALENDAR SYNC: Creating calendar event:`, {
                        title: calendarEventData.title,
                        startDate: startDate.toLocaleString(),
                        endDate: endDate.toLocaleString(),
                        priority: task.priority
                    });
                    
                    // Create calendar event
                    const calendarEvent = await pb.collection("calendar_events").create(calendarEventData);
                    
                    // Create knowledge item
                    const knowledgeItemData = {
                        name: calendarEvent.title, // Use 'name' field like PersonasStore expects
                        type: "integration", // Use valid KnowledgeType enum value
                        content: JSON.stringify({
                            event_id: calendarEvent.id,
                            task_id: task.id,
                            description: calendarEventData.description,
                            start_date: calendarEventData.start_date,
                            end_date: calendarEventData.end_date,
                        }),
                        source: "calendar",
                        tags: ["task", "calendar", task.priority],
                        created_at: new Date().toISOString(), // Use created_at like PersonasStore
                        updated_at: new Date().toISOString(), // Use updated_at like PersonasStore
                    };
                    
                    console.log(`📝 CALENDAR SYNC: Creating knowledge item for task ${task.name}:`, {
                        name: knowledgeItemData.name,
                        type: knowledgeItemData.type,
                        source: knowledgeItemData.source,
                        content: knowledgeItemData.content,
                        tags: knowledgeItemData.tags
                    });
                    
                    const knowledgeItem = await pb.collection("knowledge_items").create(knowledgeItemData);
                    
                    console.log(`✅ CALENDAR SYNC: Knowledge item created:`, {
                        id: knowledgeItem.id,
                        name: knowledgeItem.name,
                        contentType: typeof knowledgeItem.content,
                        content: knowledgeItem.content
                    });
                    
                    // Add to persona's items array
                    if (personasStore.currentPersona) {
                        console.log(`🔗 CALENDAR SYNC: Adding knowledge item ${knowledgeItem.id} to persona ${personasStore.currentPersona.id}`);
                        
                        await pb.collection("personas").update(personasStore.currentPersona.id, {
                            "items+": knowledgeItem.id,
                        });
                        
                        console.log(`✅ CALENDAR SYNC: Knowledge item added to persona's items array`);
                    } else {
                        console.error(`❌ CALENDAR SYNC: No current persona found - knowledge item ${knowledgeItem.id} not linked to persona`);
                    }
                    
                    createdEvents++;
                    console.log(`✅ CALENDAR SYNC: Created calendar event for task: ${task.name} (Event ID: ${calendarEvent.id})`);
                    
                } catch (error) {
                    console.error(`❌ CALENDAR SYNC: Failed to create calendar event for task ${task.name}:`, error);
                }
            }
            
            toast({
                title: 'Tasks Synced! 📅',
                description: `Created ${createdEvents} calendar events from your tasks.`,
            });

            console.log('🔄 CALENDAR SYNC: Refreshing calendar events...');
            
            // Add small delay to ensure PocketBase has processed the new knowledge items
            console.log('⏱️ CALENDAR SYNC: Waiting for PocketBase to process changes...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Force refresh PersonasStore with expand to get the new knowledge items
            console.log('🔄 CALENDAR SYNC: Force refreshing PersonasStore...');
            await personasStore.fetchPersonaByIam(pb, user.iam, true); // Force refresh
            
            // Check what PersonasStore has after refresh
            const refreshedPersona = personasStore.currentPersona;
            console.log('🔍 CALENDAR SYNC: PersonasStore after refresh:', {
                hasPersona: !!refreshedPersona,
                knowledgeItemsCount: refreshedPersona?.expand?.items?.length || 0,
                calendarItemsCount: refreshedPersona?.expand?.items?.filter(item => item?.source === 'calendar').length || 0
            });
            
            // Add another small delay to ensure PersonasStore has updated
            console.log('⏱️ CALENDAR SYNC: Waiting for PersonasStore to update...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Force refresh CalendarStore to get the events
            console.log('🔄 CALENDAR SYNC: Force refreshing CalendarStore...');
            await fetchEvents(user.iam, true);
            
            console.log('✅ CALENDAR SYNC: Task-to-calendar sync completed');
        } catch (error: any) {
            console.error('❌ CALENDAR SYNC: Failed to sync tasks with calendar:', error);
            toast({
                title: 'Sync Failed',
                description: error.message || 'Failed to sync tasks with calendar. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Handle "Today" button click
    const handleTodayClick = () => {
        setCurrentDate(new Date());
    };

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get today's events from store
    const todayEvents = getTodayEvents();

    return (
        <>
            <KnowledgeOrganizerLayout
                sidebar={
                    <div className="space-y-6">
                        {/* Calendar Overview */}
                        <div className="bg-transparent border border-white/10 backdrop-blur-xl overflow-hidden rounded-xl hover:bg-white/[0.02] transition-all duration-300">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-lg bg-[#FF5F1F]/15">
                                        <Layout className="w-5 h-5 text-[#FF5F1F]"/>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white/90">Calendar Overview</h3>
                                    </div>
                                </div>

                                {/* Events & Schedule */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 rounded-lg bg-[#FF5F1F]/10">
                                            <Clock className="w-3 h-3 text-[#FF5F1F]"/>
                                        </div>
                                        <h4 className="text-sm font-medium text-white/80">Events & Schedule</h4>
                                    </div>

                                    <div className="space-y-2">
                                        {events.length > 0 ? (
                                            // Show today's events first, then recent events
                                            [...todayEvents, ...events.filter(e => !todayEvents.includes(e)).slice(0, 3 - todayEvents.length)]
                                                .slice(0, 5)
                                                .map((event, index) => {
                                                    const isToday = todayEvents.includes(event);
                                                    const duration = Math.round((event.end_date.getTime() - event.start_date.getTime()) / (1000 * 60));
                                                    const hours = Math.floor(duration / 60);
                                                    const minutes = duration % 60;
                                                    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                                                    
                                                    return (
                                                        <div key={event.id} className="group p-3 bg-black/20 rounded-lg border border-white/5 hover:border-[#FF5F1F]/20 hover:bg-white/[0.02] transition-all duration-200 cursor-pointer"
                                                             onClick={() => handleSelectEvent(event)}>
                                                            <div className="flex items-start gap-3">
                                                                <div
                                                                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                                                                    style={{backgroundColor: event.color}}
                                                                ></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="text-sm font-medium text-white">{event.title}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="text-right">
                                                                                <span className="text-xs text-white/50">
                                                                                    {isToday ? 'Today' : new Date(event.start_date).toLocaleDateString()}
                                                                                </span>
                                                                                <div className="text-xs text-white/40">
                                                                                    {durationText}
                                                                                </div>
                                                                            </div>
                                                                            {/* Quick delete button */}
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                                                onClick={(e) => handleQuickDelete(event, e)}
                                                                                title="Delete event"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-white/50 mb-2">
                                                                        {event.start_date.toLocaleTimeString('en-US', {
                                                                            hour: 'numeric',
                                                                            minute: '2-digit',
                                                                            hour12: true
                                                                        })} - {event.end_date.toLocaleTimeString('en-US', {
                                                                            hour: 'numeric',
                                                                            minute: '2-digit',
                                                                            hour12: true
                                                                        })}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-1">
                                                                            {event.synced && (
                                                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <div className="p-4 bg-black/20 rounded-lg border border-white/5 text-center">
                                                <CalendarIcon className="w-8 h-8 text-white/15 mx-auto mb-2"/>
                                                <p className="text-xs text-white/60">No events scheduled</p>
                                                <p className="text-xs text-white/50 mt-1">Start by adding your first event!</p>
                                                <Button
                                                    onClick={() => handleAddEvent()}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="mt-2 text-[#FF5F1F] hover:bg-[#FF5F1F]/10 text-xs h-6"
                                                >
                                                    <Plus size={10} className="mr-1"/>
                                                    Add Event
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Google Calendar Sync Status */}
                        <div className="bg-transparent border border-white/10 backdrop-blur-xl overflow-hidden rounded-xl hover:bg-white/[0.02] transition-all duration-300">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/15">
                                            <Cloud className="w-4 h-4 text-blue-400"/>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white/90">Google Calendar</h3>
                                            <p className="text-sm text-white/50">
                                                {isGoogleConnected ? 'Connected and syncing' : 'Not connected'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Connection Status Icon */}
                                    <div className={`p-2 rounded-lg ${isGoogleConnected ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                                        {isGoogleConnected ? (
                                            <Link className="w-4 h-4 text-green-400"/>
                                        ) : (
                                            <Unlink className="w-4 h-4 text-red-400"/>
                                        )}
                                    </div>
                                </div>

                                {isGoogleConnected ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/60">Synced Events</span>
                                            <span className="text-green-400">
                                                {events.filter(e => e.synced).length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/60">Local Events</span>
                                            <span className="text-blue-400">
                                                {events.filter(e => !e.synced).length}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-white/50">
                                            Connect your Google Calendar to automatically sync events and keep everything in one place.
                                        </p>
                                        
                                        <Button
                                            onClick={handleConnectGoogle}
                                            size="sm"
                                            className="w-full bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
                                        >
                                            <Link2 className="w-3 h-3"/>
                                            Connect Google Calendar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                }
            >
                {/* Clean Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <PageHeader 
                            title="Calendar" 
                            subTitle="Manage your schedule and synchronize with tasks"
                            icon={<CalendarIcon className="w-7 h-7 text-[#FF7000]"/>}
                        />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleSyncWithTasks}
                                disabled={isSyncing}
                                className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
                            >
                                {isSyncing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin"/>
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4"/>
                                        Sync with tasks
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Calendar Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-[#FF7000]"/>
                            <span className="text-white/70 text-sm">Total Events</span>
                        </div>
                        <div className="text-white text-2xl font-light">{events.length}</div>
                    </div>

                    <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-green-400"/>
                            <span className="text-white/70 text-sm">Today's Events</span>
                        </div>
                        <div className="text-white text-2xl font-light">{todayEvents.length}</div>
                    </div>

                    <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-blue-400"/>
                            <span className="text-white/70 text-sm">This Week</span>
                        </div>
                        <div className="text-white text-2xl font-light">
                            {events.filter(event => {
                                const eventDate = new Date(event.start_date);
                                const today = new Date();
                                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                                const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                                return eventDate >= weekStart && eventDate <= weekEnd;
                            }).length}
                        </div>
                    </div>

                    <div className="bg-slate-800/20 rounded-xl border border-slate-700/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5 text-amber-400"/>
                            <span className="text-white/70 text-sm">This Month</span>
                        </div>
                        <div className="text-white text-2xl font-light">
                            {events.filter(event => {
                                const eventDate = new Date(event.start_date);
                                const today = new Date();
                                return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
                            }).length}
                        </div>
                    </div>
                </div>

                {/* Main Calendar Content */}
                <div className="bg-transparent border border-white/10 backdrop-blur-xl overflow-hidden rounded-xl hover:bg-white/[0.02] transition-all duration-300">
                    {/* Calendar Body */}
                    <div className="p-6">
                        <CalendarGrid
                            events={events}
                            viewMode={viewMode}
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            onAddEvent={handleAddEvent}
                            onSelectEvent={handleSelectEvent}
                            onViewModeChange={setViewMode}
                            isLoading={loading}
                        />
                    </div>
                </div>
            </KnowledgeOrganizerLayout>

            {/* Event Form Dialog */}
            {formOpen && (
                <EventFormDialog
                    isOpen={formOpen}
                    onClose={handleCloseForm}
                    event={!isNewEvent ? selectedEvent : undefined}
                    onSave={handleSaveEvent}
                    onDelete={!isNewEvent ? handleDeleteEvent : undefined}
                    onConvertToTask={!isNewEvent ? handleConvertToTask : undefined}
                />
            )}

            {/* Quick Delete Confirmation Dialog */}
            {showDeleteConfirm && eventToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-red-500/15">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Delete Event</h3>
                                <p className="text-sm text-white/60">This action cannot be undone</p>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-white/80 mb-2">Are you sure you want to delete this event?</p>
                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{backgroundColor: eventToDelete.color || '#FF5F1F'}}
                                    ></div>
                                    <span className="text-sm font-medium text-white">{eventToDelete.title}</span>
                                </div>
                                <p className="text-xs text-white/50">
                                    {eventToDelete.start_date.toLocaleString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={cancelQuickDelete}
                                className="bg-transparent border-white/20 text-white/80 hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmQuickDelete}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Event
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CalendarPage;
