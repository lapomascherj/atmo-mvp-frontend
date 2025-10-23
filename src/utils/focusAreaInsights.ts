import type { Project } from '@/models/Project';
import type { ChatSessionMessage } from '@/services/chatSessionService';

export interface FocusAreaInsight {
  focusArea: string;
  currentApplication: {
    projects: Array<{ name: string; relevance: number }>;
    recentActivity: string;
    taskCount: number;
    completionRate: number;
  };
  chatActivity: {
    mentionCount: number;
    recentTopics: string[];
    lastMentioned: string | null;
  };
  growthIndicators: {
    sophisticationLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    trajectory: 'learning' | 'applying' | 'mastering' | 'leading';
    opportunities: string[];
  };
}

/**
 * Calculate relevance score between text and focus area
 */
const calculateRelevance = (text: string, focusArea: string): number => {
  const textLower = text.toLowerCase();
  const areaLower = focusArea.toLowerCase();
  const areaWords = areaLower.split(/[\s/]+/);

  let score = 0;

  // Exact match
  if (textLower.includes(areaLower)) {
    score += 10;
  }

  // Partial word matches
  areaWords.forEach(word => {
    if (word.length > 2 && textLower.includes(word)) {
      score += 3;
    }
  });

  return score;
};

/**
 * Analyze projects related to focus area
 */
const analyzeProjectRelevance = (
  projects: Project[],
  focusArea: string
): Array<{ name: string; relevance: number }> => {
  return projects
    .map(project => {
      const projectText = `${project.name} ${project.description || ''}`;
      const taskText = project.goals
        ?.flatMap(g => g.tasks?.map(t => t.name) || [])
        .join(' ') || '';

      const relevance = calculateRelevance(projectText + ' ' + taskText, focusArea);

      return { name: project.name, relevance };
    })
    .filter(p => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
};

/**
 * Analyze chat mentions of focus area
 */
const analyzeChatActivity = (
  messages: ChatSessionMessage[],
  focusArea: string
): { mentionCount: number; recentTopics: string[]; lastMentioned: string | null } => {
  const relevantMessages = messages.filter(msg =>
    calculateRelevance(msg.content, focusArea) > 0
  );

  const mentionCount = relevantMessages.length;

  // Extract recent topics (sentences mentioning the focus area)
  const recentTopics: string[] = [];
  relevantMessages.slice(0, 5).forEach(msg => {
    const sentences = msg.content.split(/[.!?]+/);
    sentences.forEach(sentence => {
      if (calculateRelevance(sentence, focusArea) > 0 && sentence.length > 20 && sentence.length < 120) {
        recentTopics.push(sentence.trim());
      }
    });
  });

  const lastMentioned = relevantMessages.length > 0
    ? relevantMessages[0].createdAt
    : null;

  return {
    mentionCount,
    recentTopics: recentTopics.slice(0, 3),
    lastMentioned,
  };
};

/**
 * Infer sophistication level from task complexity and chat patterns
 */
const inferSophisticationLevel = (
  projectRelevance: Array<{ name: string; relevance: number }>,
  chatActivity: { mentionCount: number; recentTopics: string[] }
): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  const projectCount = projectRelevance.length;
  const chatMentions = chatActivity.mentionCount;
  const totalActivity = projectCount * 3 + chatMentions;

  // Check for leadership/strategic keywords in chat
  const strategicKeywords = /strateg|architect|lead|design|scale|optimize|innovate/i;
  const hasStrategicThinking = chatActivity.recentTopics.some(topic =>
    strategicKeywords.test(topic)
  );

  if (totalActivity >= 15 && hasStrategicThinking) return 'expert';
  if (totalActivity >= 10 || (projectCount >= 2 && hasStrategicThinking)) return 'advanced';
  if (totalActivity >= 5 || projectCount >= 2) return 'intermediate';
  return 'beginner';
};

/**
 * Determine growth trajectory
 */
const determineTrajectory = (
  sophisticationLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
  recentActivityDays: number
): 'learning' | 'applying' | 'mastering' | 'leading' => {
  if (sophisticationLevel === 'expert') return 'leading';
  if (sophisticationLevel === 'advanced') return 'mastering';
  if (recentActivityDays <= 7) return 'applying';
  return 'learning';
};

/**
 * Generate growth opportunities based on current level
 */
const generateOpportunities = (
  focusArea: string,
  sophisticationLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
  trajectory: 'learning' | 'applying' | 'mastering' | 'leading'
): string[] => {
  const opportunities: string[] = [];

  const domainMap: Record<string, { beginner: string[]; intermediate: string[]; advanced: string[]; expert: string[] }> = {
    'AI/ML Products': {
      beginner: ['Explore prompt engineering techniques', 'Build simple AI integrations'],
      intermediate: ['Implement RAG systems', 'Fine-tune models for specific use cases'],
      advanced: ['Design AI product architecture', 'Lead AI strategy and roadmap'],
      expert: ['Mentor AI teams', 'Define industry best practices'],
    },
    'SaaS Development': {
      beginner: ['Learn SaaS architecture patterns', 'Build MVP features'],
      intermediate: ['Implement multi-tenancy', 'Design scalable APIs'],
      advanced: ['Architect enterprise SaaS platform', 'Lead technical roadmap'],
      expert: ['Establish SaaS best practices', 'Mentor engineering teams'],
    },
    'Product Strategy': {
      beginner: ['Study product frameworks', 'Conduct user interviews'],
      intermediate: ['Define product roadmap', 'Prioritize features with data'],
      advanced: ['Lead product vision', 'Drive cross-functional alignment'],
      expert: ['Shape company strategy', 'Mentor product leaders'],
    },
    'Team Leadership': {
      beginner: ['Practice 1:1 conversations', 'Learn delegation techniques'],
      intermediate: ['Build team processes', 'Develop coaching skills'],
      advanced: ['Scale team culture', 'Drive organizational change'],
      expert: ['Build leadership pipeline', 'Shape company culture'],
    },
  };

  // Match focus area to domain map (case-insensitive partial match)
  for (const [domain, levels] of Object.entries(domainMap)) {
    if (focusArea.toLowerCase().includes(domain.toLowerCase()) ||
        domain.toLowerCase().includes(focusArea.toLowerCase())) {
      opportunities.push(...(levels[sophisticationLevel] || levels.intermediate));
      break;
    }
  }

  // Generic opportunities if no specific match
  if (opportunities.length === 0) {
    const generic: Record<typeof sophisticationLevel, string[]> = {
      beginner: [`Learn ${focusArea} fundamentals`, `Build first ${focusArea} project`],
      intermediate: [`Deepen ${focusArea} expertise`, `Lead ${focusArea} initiatives`],
      advanced: [`Architect ${focusArea} solutions`, `Mentor others in ${focusArea}`],
      expert: [`Define ${focusArea} best practices`, `Share ${focusArea} thought leadership`],
    };
    opportunities.push(...generic[sophisticationLevel]);
  }

  return opportunities.slice(0, 2);
};

/**
 * Calculate days since last activity
 */
const daysSinceActivity = (lastMentioned: string | null, projects: Array<{ name: string }>): number => {
  if (projects.length > 0) return 0; // Active in projects

  if (!lastMentioned) return 30;

  const days = Math.floor((Date.now() - new Date(lastMentioned).getTime()) / (1000 * 60 * 60 * 24));
  return days;
};

/**
 * Generate insights for a specific focus area
 */
export const analyzeFocusAreaInsights = (
  focusArea: string,
  projects: Project[],
  chatMessages: ChatSessionMessage[]
): FocusAreaInsight => {
  // Analyze project relevance
  const relevantProjects = analyzeProjectRelevance(projects, focusArea);

  // Calculate task count and completion rate
  const taskCount = projects
    .flatMap(p => p.goals?.flatMap(g => g.tasks || []) || [])
    .filter(task => calculateRelevance(task.name, focusArea) > 0)
    .length;

  const completedTasks = projects
    .flatMap(p => p.goals?.flatMap(g => g.tasks || []) || [])
    .filter(task =>
      calculateRelevance(task.name, focusArea) > 0 && task.completed
    )
    .length;

  const completionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  // Analyze chat activity
  const chatActivity = analyzeChatActivity(chatMessages, focusArea);

  // Calculate recent activity
  const daysSince = daysSinceActivity(chatActivity.lastMentioned, relevantProjects);
  const recentActivity = daysSince === 0
    ? 'Active today'
    : daysSince === 1
    ? 'Active yesterday'
    : daysSince <= 7
    ? `Active ${daysSince} days ago`
    : daysSince <= 30
    ? 'Active this month'
    : 'No recent activity';

  // Determine sophistication and trajectory
  const sophisticationLevel = inferSophisticationLevel(relevantProjects, chatActivity);
  const trajectory = determineTrajectory(sophisticationLevel, daysSince);

  // Generate opportunities
  const opportunities = generateOpportunities(focusArea, sophisticationLevel, trajectory);

  return {
    focusArea,
    currentApplication: {
      projects: relevantProjects,
      recentActivity,
      taskCount,
      completionRate,
    },
    chatActivity: {
      mentionCount: chatActivity.mentionCount,
      recentTopics: chatActivity.recentTopics,
      lastMentioned: chatActivity.lastMentioned,
    },
    growthIndicators: {
      sophisticationLevel,
      trajectory,
      opportunities,
    },
  };
};
