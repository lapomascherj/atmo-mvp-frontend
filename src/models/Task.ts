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
});
