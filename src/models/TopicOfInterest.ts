import {z} from "zod";

export interface TopicOfInterest {
    topic: string;
    frequency: number;
    lastInteraction: number;
}

export const TopicOfInterestSchema = z.object({
    topic: z.string(),
    frequency: z.number(),
    lastInteraction: z.number().min(1762387200),
})
