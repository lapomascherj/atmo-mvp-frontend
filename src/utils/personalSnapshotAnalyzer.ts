import type { Project } from '@/models/Project';
import type { Goal } from '@/models/Goal';

export interface CoreAmbition {
  title: string;
  description: string;
  source: 'northStar' | 'highPriorityGoal' | 'project';
  relatedProjects?: string[];
}

export interface PersonalStats {
  projectsCompleted: number;
  activeProjects: number;
  totalGoals: number;
  completedGoals: number;
  focusAreas: string[];
  activityLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  userLevel: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  completedDate: string;
  projectName?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  priority: string;
  deadline?: string;
  projectName?: string;
  urgency: 'overdue' | 'urgent' | 'upcoming' | 'planned';
}

/**
 * Extract core ambitions from onboarding data and high-priority goals
 */
export const extractCoreAmbitions = (
  onboardingData: any,
  goals: Array<Goal & { projectName?: string }>,
  projects: Project[]
): CoreAmbition[] => {
  const ambitions: CoreAmbition[] = [];

  // 1. North Star from onboarding (primary ambition)
  const northStar = onboardingData?.performance?.northStar ||
                    onboardingData?.warmup?.northStar ||
                    onboardingData?.identity?.purpose;

  if (northStar && typeof northStar === 'string' && northStar.trim()) {
    ambitions.push({
      title: 'North Star Goal',
      description: northStar,
      source: 'northStar',
    });
  }

  // 2. High-priority goals with upcoming deadlines (next 6 months)
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const highPriorityGoals = goals
    .filter(g => {
      const isHighPriority = g.priority === 'High' || g.priority === 'high';
      const hasDeadline = g.targetDate;
      const isUpcoming = hasDeadline && new Date(g.targetDate) <= sixMonthsFromNow;
      const isActive = g.status !== 'Completed' && g.status !== 'deleted';
      return isHighPriority && isUpcoming && isActive;
    })
    .slice(0, 3);

  highPriorityGoals.forEach(goal => {
    ambitions.push({
      title: goal.name,
      description: goal.description || `High-priority goal from ${goal.projectName || 'project'}`,
      source: 'highPriorityGoal',
      relatedProjects: goal.projectName ? [goal.projectName] : [],
    });
  });

  // 3. Major active projects as ambitions
  const majorProjects = projects
    .filter(p => {
      const isActive = p.active !== false && p.status !== 'completed' && p.status !== 'deleted';
      const hasSignificantWork = (p.goals || []).length >= 3;
      return isActive && hasSignificantWork;
    })
    .slice(0, 2);

  majorProjects.forEach(project => {
    ambitions.push({
      title: project.name,
      description: project.description || `Building and growing ${project.name}`,
      source: 'project',
      relatedProjects: [project.name],
    });
  });

  // Return top 5 ambitions
  return ambitions.slice(0, 5);
};

/**
 * Calculate personal stats from projects, goals, and user data
 */
export const calculatePersonalStats = (
  projects: Project[],
  allGoals: Array<Goal & { projectName?: string }>,
  focusAreas: string[],
  userLevel: number
): PersonalStats => {
  const projectsCompleted = projects.filter(p =>
    p.status === 'completed'
  ).length;

  const activeProjects = projects.filter(p =>
    p.active !== false && p.status !== 'completed' && p.status !== 'deleted'
  ).length;

  const completedGoals = allGoals.filter(g =>
    g.status === 'Completed'
  ).length;

  const totalGoals = allGoals.filter(g =>
    g.status !== 'deleted'
  ).length;

  // Determine activity level based on user level and completed work
  let activityLevel: PersonalStats['activityLevel'] = 'beginner';
  if (userLevel >= 10 || completedGoals >= 20) {
    activityLevel = 'expert';
  } else if (userLevel >= 5 || completedGoals >= 10) {
    activityLevel = 'advanced';
  } else if (userLevel >= 2 || completedGoals >= 5) {
    activityLevel = 'intermediate';
  }

  return {
    projectsCompleted,
    activeProjects,
    totalGoals,
    completedGoals,
    focusAreas,
    activityLevel,
    userLevel,
  };
};

/**
 * Extract recent achievements (last 5 completed goals)
 */
export const extractRecentAchievements = (
  allGoals: Array<Goal & { projectName?: string }>
): Achievement[] => {
  const completedGoals = allGoals
    .filter(g => g.status === 'Completed' && g.completedDate)
    .sort((a, b) => {
      if (!a.completedDate) return 1;
      if (!b.completedDate) return -1;
      return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
    })
    .slice(0, 5);

  return completedGoals.map(goal => {
    // Determine impact based on priority and task count
    let impact: Achievement['impact'] = 'low';
    if (goal.priority === 'High' || goal.priority === 'high') {
      impact = 'high';
    } else if (goal.priority === 'Medium' || goal.priority === 'medium') {
      impact = 'medium';
    }

    return {
      id: goal.id,
      title: goal.name,
      description: goal.description || `Completed ${goal.projectName || 'goal'}`,
      completedDate: goal.completedDate!,
      projectName: goal.projectName,
      impact,
    };
  });
};

/**
 * Extract current challenges (high-priority active goals)
 */
export const extractCurrentChallenges = (
  allGoals: Array<Goal & { projectName?: string }>,
  projects: Project[]
): Challenge[] => {
  const now = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  const activeGoals = allGoals.filter(g =>
    g.status !== 'Completed' && g.status !== 'deleted'
  );

  const challenges: Challenge[] = activeGoals.map(goal => {
    // Determine urgency
    let urgency: Challenge['urgency'] = 'planned';

    if (goal.targetDate) {
      const deadline = new Date(goal.targetDate);
      if (deadline < now) {
        urgency = 'overdue';
      } else if (deadline <= twoWeeksFromNow) {
        urgency = 'urgent';
      } else {
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        if (deadline <= oneMonthFromNow) {
          urgency = 'upcoming';
        }
      }
    }

    return {
      id: goal.id,
      title: goal.name,
      description: goal.description || `Active goal from ${goal.projectName || 'project'}`,
      priority: goal.priority || 'Low',
      deadline: goal.targetDate,
      projectName: goal.projectName,
      urgency,
    };
  });

  // Sort by urgency and priority
  const urgencyOrder = { overdue: 0, urgent: 1, upcoming: 2, planned: 3 };
  const priorityOrder = { High: 0, high: 0, Medium: 1, medium: 1, Low: 2, low: 2 };

  challenges.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
    return aPriority - bPriority;
  });

  // Return top 8 challenges
  return challenges.slice(0, 8);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

/**
 * Format deadline for display
 */
export const formatDeadline = (dateString: string | undefined): string => {
  if (!dateString) return 'No deadline';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Due in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};
