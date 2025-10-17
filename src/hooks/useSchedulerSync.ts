import { useAuth } from '@/hooks/useAuth';
import { fetchSchedulerEventsForDate, replaceSchedulerEventsForDate } from '@/services/schedulerService';
import type { SchedulerEvent } from '@/types/scheduler';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SYNC_EVENT = 'scheduler-sync';

interface UseSchedulerSyncResult {
  events: SchedulerEvent[];
  updateEvents: (events: SchedulerEvent[]) => void;
  refreshEvents: () => Promise<void>;
  loading: boolean;
  saving: boolean;
}

const formatDateKey = (value: Date): string => value.toISOString().split('T')[0];

export const useSchedulerSync = (selectedDate: Date): UseSchedulerSyncResult => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SchedulerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pendingRef = useRef<{ dateKey: string; events: SchedulerEvent[] } | null>(null);
  const timerRef = useRef<number | null>(null);
  const activeDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  const flushPendingUpdates = useCallback(async () => {
    if (!user || !pendingRef.current) return;

    const payload = pendingRef.current;
    pendingRef.current = null;

    try {
      setSaving(true);
      await replaceSchedulerEventsForDate(user.id, payload.dateKey, payload.events);
    } catch (error) {
      console.error('Failed to persist scheduler events', error);
      pendingRef.current = payload;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const loadEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      return;
    }

    setLoading(true);
    try {
      const nextEvents = await fetchSchedulerEventsForDate(user.id, activeDateKey);
      setEvents(nextEvents);
    } catch (error) {
      console.error('Failed to load scheduler events', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [activeDateKey, user]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      void flushPendingUpdates();
    }, 400);
  }, [flushPendingUpdates]);

  useEffect(() => {
    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ dateKey: string; events: SchedulerEvent[] }>;
      if (customEvent.detail?.dateKey !== activeDateKey) {
        return;
      }
      setEvents(customEvent.detail.events);
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
    };
  }, [activeDateKey]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!pendingRef.current) {
      return;
    }

    void flushPendingUpdates();
  }, [activeDateKey, flushPendingUpdates]);

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    void flushPendingUpdates();
  }, [flushPendingUpdates]);

  const updateEvents = useCallback(
    (nextEvents: SchedulerEvent[]) => {
      setEvents(nextEvents);
      pendingRef.current = { dateKey: activeDateKey, events: nextEvents };
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT, {
          detail: { dateKey: activeDateKey, events: nextEvents },
        }),
      );
      scheduleFlush();
    },
    [activeDateKey, scheduleFlush],
  );

  const refreshEvents = useCallback(async () => {
    await flushPendingUpdates();
    await loadEvents();
  }, [flushPendingUpdates, loadEvents]);

  return {
    events,
    updateEvents,
    refreshEvents,
    loading,
    saving,
  };
};
