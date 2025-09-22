import { KnowledgeItem, KnowledgeItemSchema } from "@/models/KnowledgeItem.ts";
import { z } from "zod";
import { Goal, GoalSchema } from "@/models/Goal.ts";
import { Status } from "@/models/Status.ts";
import { Milestone, MilestoneSchema } from "./Milestone";
import { WellnessLevel } from "./WellnessLevel";

export interface Project {
  id: string;
  name: string;
  goals: Goal[];
  items: KnowledgeItem[];
  active?: boolean;
  description?: string;
  status?: Status;
  priority?: string;
  color?: string;
  milestones?: Milestone[];
  progress?: number;
  timeInvested?: number;
  lastUpdate?: string;
  startDate?: string;
  targetDate?: string;
  tags?: string[];
  notes?: string;
  wellness_level?: WellnessLevel;
}

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  active: z.boolean().optional().default(true),
  description: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  priority: z.string().optional(),
  color: z.string().optional(),
  goals: z.array(GoalSchema).default([]),
  items: z.array(KnowledgeItemSchema).default([]),
  milestones: z.array(MilestoneSchema).optional().default([]),
  progress: z.number().min(0).max(100).optional(),
  timeInvested: z.number().min(0).optional(),
  lastUpdate: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
