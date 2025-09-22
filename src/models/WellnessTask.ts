// Define interface for wellness tasks
import {z} from "zod";

export interface WellnessTask {
    id: string;
    title: string;
    completed: boolean;
}

export const WellnessTaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
})
