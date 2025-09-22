import { z } from "zod";
import { Status } from "@/models/Status.ts";
import { Priority } from "@/models/Priority.ts";
import { Task, TaskSchema } from "@/models/Task.ts";

export interface Goal {
  id: string;
  name: string;
  status: Status;
  priority: Priority;
  targetDate: string;
  completedDate?: string;
  description?: string;
  order: number;
  tasks: Task[];
}

export const GoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(Status).default(Status.Planned),
  priority: z
    .enum([Priority.High, Priority.Medium, Priority.Low])
    .default(Priority.Low),
  targetDate: z.string(),
  completedDate: z.string().optional(),
  order: z.number().min(1),
  tasks: z.array(TaskSchema).default([]),
});
