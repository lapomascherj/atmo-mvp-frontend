import { supabase } from '@/lib/supabase';
import type { SchedulerEvent } from '@/types/scheduler';
import type { PostgrestError } from '@supabase/supabase-js';

interface SchedulerEventRow {
  id: string;
  owner_id: string;
  scheduled_for: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  description: string | null;
  category: string | null;
}

const toError = (error: PostgrestError | Error | null | undefined): Error | null => {
  if (!error) return null;
  if (error instanceof Error) return error;
  return new Error(error.message ?? 'Unknown Supabase error');
};

const formatTimeForInsert = (time: string): string => {
  return `${time.padStart(5, '0')}:00`;
};

const parseSchedulerRow = (row: SchedulerEventRow): SchedulerEvent => ({
  id: row.id,
  title: row.title,
  startTime: row.start_time.slice(0, 5),
  duration: row.duration_minutes,
  description: row.description ?? undefined,
  category: row.category ?? undefined,
});

export const fetchSchedulerEventsForDate = async (
  ownerId: string,
  date: string,
): Promise<SchedulerEvent[]> => {
  const { data, error } = await supabase
    .from<SchedulerEventRow>('scheduler_events')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('scheduled_for', date)
    .order('start_time', { ascending: true });

  const normalised = toError(error);
  if (normalised) {
    throw normalised;
  }

  return (data ?? []).map(parseSchedulerRow);
};

export const replaceSchedulerEventsForDate = async (
  ownerId: string,
  date: string,
  events: SchedulerEvent[],
): Promise<void> => {
  const { error: deleteError } = await supabase
    .from('scheduler_events')
    .delete()
    .eq('owner_id', ownerId)
    .eq('scheduled_for', date);

  const normalisedDelete = toError(deleteError);
  if (normalisedDelete) {
    throw normalisedDelete;
  }

  if (!events.length) {
    return;
  }

  const insertPayload = events.map((event) => ({
    owner_id: ownerId,
    scheduled_for: date,
    title: event.title,
    start_time: formatTimeForInsert(event.startTime),
    duration_minutes: event.duration,
    description: event.description ?? null,
    category: event.category ?? null,
  }));

  const { error: insertError } = await supabase
    .from('scheduler_events')
    .insert(insertPayload);

  const normalisedInsert = toError(insertError);
  if (normalisedInsert) {
    throw normalisedInsert;
  }
};
