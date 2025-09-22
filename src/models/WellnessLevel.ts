import { z } from "zod";

export interface WellnessLevel {
  id?: number;
  name?: string;
  color: string;
  status: string;
}

export const WellnessLevelSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  color: z.string(),
  status: z.string(),
});
