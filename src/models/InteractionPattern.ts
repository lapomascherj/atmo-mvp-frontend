import {z} from "zod";

export interface InteractionPattern {
    totalSessions: number;
    avgSessionLength: number;
    preferredTime: string,
    mostActiveDay: string,
    aiGeneratedContent: number
}

export const InteractionPatternSchema = z.object({
    totalSessions: z.number(),
    avgSessionLength: z.number(),
    preferredTime: z.string(),
    mostActiveDay: z.string(),
    aiGeneratedContent: z.number(),
})
