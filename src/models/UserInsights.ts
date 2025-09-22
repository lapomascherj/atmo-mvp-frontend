import {
  InteractionPattern,
  InteractionPatternSchema,
} from "@/models/InteractionPattern.ts";
import { Interaction, InteractionSchema } from "@/models/Interaction";
import {
  TopicOfInterest,
  TopicOfInterestSchema,
} from "@/models/TopicOfInterest.ts";
import { UserSkill, UserSkillSchema } from "@/models/UserSkill.ts";
import { z } from "zod";

export interface UserInsights {
  topSkills: UserSkill[];
  topicsOfInterest: TopicOfInterest[];
  interactions: Interaction[];
  interactionPattern: InteractionPattern;
}

export const UserInsightsSchema = z.object({
  topSkills: z.array(UserSkillSchema),
  topicsOfInterest: z.array(TopicOfInterestSchema),
  interactions: z.array(InteractionSchema),
  interactionPattern: InteractionPatternSchema,
});
