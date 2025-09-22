import { z } from "zod";
import { KnowledgeType } from "./KnowledgeType";

export interface KnowledgeItem {
  id: string;
  name: string;
  type: KnowledgeType;
  date: string;
  size?: string;
  duration?: string;
  source?: string;
  starred?: boolean;
  content?: string; // AI-generated summary for context
  projects?: string[]; // Array of project IDs this knowledge item is associated with
  tags?: string[]; // Tags for categorization

  // PocketBase auto-generated fields
  created?: string;
  updated?: string;
}

export const KnowledgeItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum([
    KnowledgeType.Chat,
    KnowledgeType.File,
    KnowledgeType.Summary,
    KnowledgeType.Voice,
    KnowledgeType.Integration,
  ]),
  date: z.string(),
  size: z.string().optional(),
  duration: z.string().optional(),
  source: z.string().optional(),
  starred: z.boolean().optional().default(false),
  content: z.string().optional(),
  projects: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  created: z.string().optional(),
  updated: z.string().optional(),
});
