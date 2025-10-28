import { z } from "zod";
import { Goal } from "./Goal";

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  due_date?: string;
  status: string;
  goals?: Goal[];
  progress?: number;  // Calculated progress 0-100
  created?: string;
  updated?: string;
}

export const MilestoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Milestone name is required"),
  description: z.string().optional(),
  due_date: z.string().optional(),
  status: z.string().default("active"),
  goals: z.array(z.any()).optional().default([]),
  progress: z.number().min(0).max(100).optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
});

export type MilestoneFormData = Omit<
  Milestone,
  "id" | "created" | "updated" | "goals"
>;
