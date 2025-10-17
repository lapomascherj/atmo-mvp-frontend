import { Priority } from "@/models/Priority.ts";
import { z } from "zod";
import { CalendarEvent } from "./CalendarEvent";
import { TaskAgency } from "./TaskAgency";

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  completed: boolean;
  agency: TaskAgency;
  color: string;
  // Estimated time in minutes
  estimated_time?: number;
  events?: CalendarEvent[];
  goal_id?: string;
  projectId?: string;
  created_at?: string;
  updated_at?: string;
  rollover_count?: number;
  rolled_over_from_date?: string | null;
  archived_at?: string | null;
}

export const TaskSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Task name is required")
    .max(50, "Task name is too long"),
  description: z
    .string()
    .min(1, "Task description is required")
    .max(200, "Task description is too long"),
  priority: z
    .enum([Priority.Low, Priority.Medium, Priority.High])
    .default(Priority.Low),
  completed: z.boolean().default(false),
  agency: z.enum([TaskAgency.Human, TaskAgency.AI]).default(TaskAgency.Human),
  color: z.number().default(30),
  estimated_time: z.string().optional(),
  projectId: z.string().optional(),
  created_at: z.string().optional(),
  rollover_count: z.number().optional(),
  rolled_over_from_date: z.string().nullable().optional(),
  archived_at: z.string().nullable().optional(),
  updated_at: z.string().optional(),
});
