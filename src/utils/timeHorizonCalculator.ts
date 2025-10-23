import type { Goal } from '@/models/Goal';

/**
 * Time horizon categories for goals based on target dates
 */
export enum TimeHorizon {
  ShortTerm = 'short-term',
  MediumTerm = 'medium-term',
  LongTerm = 'long-term',
  NoDate = 'no-date',
}

export interface TimeHorizonLabel {
  label: string;
  emoji: string;
  description: string;
  monthRange: string;
}

export const TIME_HORIZON_LABELS: Record<TimeHorizon, TimeHorizonLabel> = {
  [TimeHorizon.ShortTerm]: {
    label: 'Short-term',
    emoji: '🎯',
    description: 'Immediate objectives',
    monthRange: '0-3 months',
  },
  [TimeHorizon.MediumTerm]: {
    label: 'Medium-term',
    emoji: '📅',
    description: 'Quarterly milestones',
    monthRange: '3-12 months',
  },
  [TimeHorizon.LongTerm]: {
    label: 'Long-term',
    emoji: '🚀',
    description: 'Strategic vision',
    monthRange: '12+ months',
  },
  [TimeHorizon.NoDate]: {
    label: 'No target date',
    emoji: '📝',
    description: 'Goals without deadlines',
    monthRange: 'Ongoing',
  },
};

export interface GoalsByTimeHorizon {
  [TimeHorizon.ShortTerm]: Goal[];
  [TimeHorizon.MediumTerm]: Goal[];
  [TimeHorizon.LongTerm]: Goal[];
  [TimeHorizon.NoDate]: Goal[];
}

/**
 * Calculate time horizon for a goal based on its target date
 */
export const calculateTimeHorizon = (targetDate: string | undefined): TimeHorizon => {
  if (!targetDate) {
    return TimeHorizon.NoDate;
  }

  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month

  if (diffMonths < 0) {
    // Past due goals count as short-term (need immediate attention)
    return TimeHorizon.ShortTerm;
  } else if (diffMonths <= 3) {
    return TimeHorizon.ShortTerm;
  } else if (diffMonths <= 12) {
    return TimeHorizon.MediumTerm;
  } else {
    return TimeHorizon.LongTerm;
  }
};

/**
 * Group goals by time horizon
 */
export const categorizeGoalsByTimeHorizon = (goals: Goal[]): GoalsByTimeHorizon => {
  const categorized: GoalsByTimeHorizon = {
    [TimeHorizon.ShortTerm]: [],
    [TimeHorizon.MediumTerm]: [],
    [TimeHorizon.LongTerm]: [],
    [TimeHorizon.NoDate]: [],
  };

  goals.forEach(goal => {
    const horizon = calculateTimeHorizon(goal.targetDate);
    categorized[horizon].push(goal);
  });

  // Sort each category by target date (earliest first)
  Object.keys(categorized).forEach(key => {
    const horizon = key as TimeHorizon;
    categorized[horizon].sort((a, b) => {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
  });

  return categorized;
};

/**
 * Get a summary string of time horizons with counts
 * Example: "3 short-term • 5 medium-term • 2 long-term"
 */
export const getTimeHorizonSummary = (goals: Goal[]): string => {
  const categorized = categorizeGoalsByTimeHorizon(goals);

  const parts: string[] = [];

  if (categorized[TimeHorizon.ShortTerm].length > 0) {
    parts.push(`${categorized[TimeHorizon.ShortTerm].length} short`);
  }
  if (categorized[TimeHorizon.MediumTerm].length > 0) {
    parts.push(`${categorized[TimeHorizon.MediumTerm].length} medium`);
  }
  if (categorized[TimeHorizon.LongTerm].length > 0) {
    parts.push(`${categorized[TimeHorizon.LongTerm].length} long`);
  }

  if (parts.length === 0) {
    if (categorized[TimeHorizon.NoDate].length > 0) {
      return `${categorized[TimeHorizon.NoDate].length} ongoing`;
    }
    return 'No goals';
  }

  return parts.join(' • ');
};

/**
 * Get active horizons (those with goals)
 */
export const getActiveHorizons = (goals: Goal[]): TimeHorizon[] => {
  const categorized = categorizeGoalsByTimeHorizon(goals);
  return Object.keys(categorized).filter(
    key => categorized[key as TimeHorizon].length > 0
  ) as TimeHorizon[];
};
