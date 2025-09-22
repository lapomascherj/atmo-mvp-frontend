import { InteractionType } from "@/models/InteractionType";
import { z } from "zod";

export interface Interaction {
  id: string;
  name: string;
  usage: number;
  lastUsed: number;
  type: InteractionType;
}

export const InteractionSchema = z.object({
  name: z.string(),
  usage: z.number(),
  lastUsed: z.number().min(1762387200),
  type: z.enum([
    InteractionType.AIConversations,
    InteractionType.DocumentStorage,
    InteractionType.KnowledgeBase,
    InteractionType.FileSync,
  ]),
});
