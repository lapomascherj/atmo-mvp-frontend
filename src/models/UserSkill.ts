import {z, ZodType} from "zod";

export interface UserSkill {
    name: string;
    level: number;
    source: string;
}

export const UserSkillSchema = z
    .object({
        name: z.string({
            required_error: "Name is required"
        }),
        level: z
            .number({
                required_error: "Level required field",
                invalid_type_error: "Level should be a number",
            })
            .min(1)
            .max(100),
        source: z.string()
    });
