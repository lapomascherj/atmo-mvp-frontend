import { UserInsights } from "@/models/UserInsights.ts";
import { InteractionType } from "@/models/InteractionType";

const userProfileMock: UserInsights = {
  topSkills: [
    {
      name: "Project Management",
      level: 92,
      source: "Derived from planning sessions and task organization",
    },
    {
      name: "Strategic Thinking",
      level: 88,
      source: "Analysis of goal-setting and roadmap discussions",
    },
    {
      name: "Research & Analysis",
      level: 85,
      source: "Document analysis and information synthesis patterns",
    },
    {
      name: "Communication",
      level: 82,
      source: "Chat interactions and voice session analysis",
    },
  ],
  topicsOfInterest: [
    { topic: "AI & Technology", frequency: 156, lastInteraction: 1705276800 },
    { topic: "Business Strategy", frequency: 134, lastInteraction: 1705276800 },
    {
      topic: "Education & Learning",
      frequency: 89,
      lastInteraction: 1705190400,
    },
    {
      topic: "Personal Development",
      frequency: 67,
      lastInteraction: 1705104000,
    },
    { topic: "Economics", frequency: 45, lastInteraction: 1705017600 },
  ],
  interactions: [
    {
      id: "1",
      name: "Avatar Assistant",
      usage: 89,
      lastUsed: 1705276800,
      type: InteractionType.AIConversations,
    },
    {
      id: "2",
      name: "Google Drive",
      usage: 72,
      lastUsed: 1705190400,
      type: InteractionType.DocumentStorage,
    },
    {
      id: "3",
      name: "Notion",
      usage: 58,
      lastUsed: 1705104000,
      type: InteractionType.KnowledgeBase,
    },
    {
      id: "4",
      name: "OneDrive",
      usage: 34,
      lastUsed: 1705017600,
      type: InteractionType.FileSync,
    },
  ],
  interactionPattern: {
    totalSessions: 245,
    avgSessionLength: 1122,
    preferredTime: "Morning (7-10 AM)",
    mostActiveDay: "Tuesday",
    aiGeneratedContent: 67,
  },
};

export default userProfileMock;
