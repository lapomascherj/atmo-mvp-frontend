import { z } from "zod";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: Date;
  start_time: Date;
  end_date: Date;
  end_time: Date;
  all_day: boolean;
  location?: string;
  attendees?: string[];
  color?: string;
  recurring_event_id?: string;
  synced?: boolean;
}

export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(200, "Description is too long").optional(),
  start_date: z.date(),
  start_time: z.date(),
  end_date: z.date(),
  end_time: z.date(),
  all_day: z.boolean().default(false),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  color: z.string().optional(),
  recurring_event_id: z.string().optional(),
  synced: z.boolean().optional().default(false),
});
