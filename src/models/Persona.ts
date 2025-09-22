import { AvatarStyle } from "./AvatarStyle";
import { CommunicationStyle } from "./CommunicationStyle";
import { Focus } from "./Focus";
import { Integration } from "./Integration";
import { JobTitle } from "./JobTitle";
import { z } from "zod";
import { Project } from "./Project";
import { KnowledgeItem } from "./KnowledgeItem";

/**
 * The Persona model represents a user in the system.
 * It is used as the main collector for everything related to the user (settings, integrations, projects, etc.)
 * Works in combination with Casdoor to create a complete user profile. While
 * Casdoor information are related to the identity of a user in the system,
 * Persona contains information tuned for the ATMO app's profile that are used to
 * interact with the external AI services through the BunJS backend service
 */
export interface Persona {
  id: string;
  // The IAM(casdoor) user id
  iam: string;
  // The name used by ATMO to call the user
  nickname: string;
  avatar_url: string;
  email: string;
  job_title: JobTitle;
  bio: string;
  // The biggest challenge the user is usually facing
  biggest_challenge: string;
  email_notifications: boolean;
  push_notifications: boolean;
  onboarding_completed: boolean;
  focus: Focus;
  // The time ATMO use to deliver the daily roadmap suggestions
  delivery_time: Date;
  avatar_style: AvatarStyle;
  communication_style: CommunicationStyle;
  integrations: Integration[];
  items: KnowledgeItem[];
  projects: Project[];
}

export const PersonaSchema = z.object({
  iam: z.string(),
  nickname: z.string(),
  avatar_url: z.string(),
  job_title: z.enum([
    JobTitle.Entrepreneur,
    JobTitle.Manager,
    JobTitle.Creator,
    JobTitle.Executive,
    JobTitle.Developer,
    JobTitle.Student,
    JobTitle.Other,
  ]),
  biggest_challenge: z.string(),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  onboarding_completed: z.boolean(),
  focus: z.enum([
    Focus.ProjectExecution,
    Focus.BusinessGrowth,
    Focus.KnowledgeManagement,
    Focus.LearningAndDevelopment,
    Focus.TeamCoordination,
    Focus.PersonalDevelopment,
  ]),
  delivery_time: z.date(),
  avatar_style: z.enum([
    AvatarStyle.Analytical,
    AvatarStyle.Balanced,
    AvatarStyle.Creative,
    AvatarStyle.Motivational,
  ]),
  communication_style: z.enum([
    CommunicationStyle.Concise,
    CommunicationStyle.Detailed,
    CommunicationStyle.Encouraging,
    CommunicationStyle.Challenging,
  ]),
});
