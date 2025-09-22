import {Activity, Priority, Project, Status, WellnessTask} from "@/models";

/**
 * Scientific Wellness Calculator
 *
 * Based on research in psychology, productivity, and wellbeing:
 * - Progress Theory (Teresa Amabile): Small wins boost motivation
 * - Flow State Theory (Mihaly Csikszentmihalyi): Balance of challenge and skill
 * - Self-Determination Theory (Deci & Ryan): Autonomy, competence, mastery
 * - Stress vs Performance (Yerkes-Dodson Law): Optimal challenge level
 */

interface WellnessFactors {
    // 0-100: Recent completion rate
    progressMomentum: number;
    // 0-100: Working on meaningful goals
    goalAlignment: number;
    // 0-100: Sustainable pace
    workloadBalance: number;
    // 0-100: Optimal difficulty level
    challengeFlow: number;
    // 0-100: How blocked you feel
    blockerFrustration: number;
    // 0-100: Diverse activities
    varietyEngagement: number;
    // 0-100: Realistic time estimates
    timeRealism: number;
    // 0-100: Regular progress pattern
    consistencyRhythm: number;
}

interface WellnessMetrics {
    // 0-100 overall wellness
    score: number;
    factors: WellnessFactors;
    // Actionable insights
    insights: string[];
    trend: 'improving' | 'stable' | 'declining';
    riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Calculate wellness based on project task and goals
 */
export function calculateWellness(
    projects: Project[],
    recentActivities: Activity[] = [],
    wellnessTasks: WellnessTask[] = [],
    timeframe: number = 7 // days
): WellnessMetrics {

    const allActivities = projects.flatMap(p => p.goals.flatMap(g => g.activities));
    const recentCompletions = getRecentCompletions(allActivities, timeframe);

    const factors: WellnessFactors = {
        progressMomentum: calculateProgressMomentum(recentCompletions, timeframe),
        goalAlignment: calculateGoalAlignment(projects),
        workloadBalance: calculateWorkloadBalance(allActivities),
        challengeFlow: calculateChallengeFlow(allActivities),
        blockerFrustration: calculateBlockerFrustration(allActivities),
        varietyEngagement: calculateVarietyEngagement(allActivities),
        timeRealism: calculateTimeRealism(allActivities),
        consistencyRhythm: calculateConsistencyRhythm(recentCompletions, timeframe)
    };

    // Weighted average based on research importance
    const weights = {
        progressMomentum: 0.20,
        goalAlignment: 0.15,
        workloadBalance: 0.20,
        challengeFlow: 0.15,
        blockerFrustration: 0.10,
        varietyEngagement: 0.05,
        timeRealism: 0.10,
        consistencyRhythm: 0.05
    };

    const score = Math.round(
        Object.entries(factors).reduce((sum, [key, value]) => {
            return sum + (value * weights[key as keyof typeof weights]);
        }, 0)
    );

    const insights = generateInsights(factors, score);
    const trend = calculateTrend(recentCompletions);
    const riskLevel = calculateRiskLevel(factors, score);

    return {
        score,
        factors,
        insights,
        trend,
        riskLevel
    };
}

/**
 * Progress Momentum: Recent completion rate indicates flow state
 * Research: Teresa Amabile's "Progress Principle"
 */
function calculateProgressMomentum(recentCompletions: Activity[], timeframe: number): number {
    if (recentCompletions.length === 0) return 20; // Base score for no recent task

    const avgCompletionsPerDay = recentCompletions.length / timeframe;

    // Optimal range: 1-3 completions per day
    if (avgCompletionsPerDay >= 1 && avgCompletionsPerDay <= 3) return 100;
    if (avgCompletionsPerDay >= 0.5 && avgCompletionsPerDay < 1) return 80;
    if (avgCompletionsPerDay > 3 && avgCompletionsPerDay <= 5) return 70; // Too much?
    if (avgCompletionsPerDay > 5) return 40; // Definitely too much

    return Math.max(20, avgCompletionsPerDay * 60); // Scale for low task
}

/**
 * Goal Alignment: Working on high-priority, meaningful goals
 * Research: Self-Determination Theory
 */
function calculateGoalAlignment(projects: Project[]): number {
    const activeProjects = projects.filter(p => p.active);
    if (activeProjects.length === 0) return 30;

    const highPriorityProjects = activeProjects.filter(p => p.priority === Priority.High);
    const alignmentRatio = highPriorityProjects.length / activeProjects.length;

    // Having clear priorities is important
    if (alignmentRatio >= 0.3) return 100; // 30%+ high priority is good
    if (alignmentRatio >= 0.2) return 80;
    if (alignmentRatio >= 0.1) return 60;

    return 40; // Too scattered priorities
}

/**
 * Workload Balance: Sustainable pace without burnout
 * Research: Yerkes-Dodson Law (Stress vs Performance)
 */
function calculateWorkloadBalance(activities: Activity[]): number {
    const inProgressCount = activities.filter(a => a.status === Status.InProgress).length;
    const plannedCount = activities.filter(a => a.status === Status.Planned).length;

    // Optimal: 2-4 in progress, reasonable backlog
    if (inProgressCount >= 2 && inProgressCount <= 4) {
        if (plannedCount <= 10) return 100; // Perfect balance
        if (plannedCount <= 20) return 80;  // Manageable backlog
        return 60; // Heavy backlog creates pressure
    }

    if (inProgressCount === 1) return 70; // Could take on more
    if (inProgressCount === 5) return 60; // Getting busy
    if (inProgressCount >= 6) return 30;  // Overloaded

    return 50; // No active work
}

/**
 * Challenge Flow: Optimal difficulty level for engagement
 * Research: Mihaly Csikszentmihalyi's Flow Theory
 */
function calculateChallengeFlow(activities: Activity[]): number {
    const activeActivities = activities.filter(a => a.status === Status.InProgress);
    if (activeActivities.length === 0) return 60;

    const estimatedHours = activeActivities
        .map(a => a.estimatedTime || 2) // Default to 2 hours if not estimated
        .reduce((sum, hours) => sum + hours, 0);

    const avgHoursPerActivity = estimatedHours / activeActivities.length;

    // Sweet spot: 1-4 hours per task (not too easy, not overwhelming)
    if (avgHoursPerActivity >= 1 && avgHoursPerActivity <= 4) return 100;
    if (avgHoursPerActivity >= 0.5 && avgHoursPerActivity < 1) return 70; // Too easy
    if (avgHoursPerActivity > 4 && avgHoursPerActivity <= 8) return 60;   // Challenging
    if (avgHoursPerActivity > 8) return 30; // Overwhelming

    return 50; // No estimates available
}

/**
 * Blocker Frustration: How many activities are blocked
 * Research: Frustration kills intrinsic motivation
 */
function calculateBlockerFrustration(activities: Activity[]): number {
    const activeActivities = activities.filter(a =>
        a.status === Status.InProgress || a.status === Status.Planned
    );

    if (activeActivities.length === 0) return 80;

    const blockedCount = activeActivities.filter(a =>
        a.blockers && a.blockers.length > 0
    ).length;

    const blockerRatio = blockedCount / activeActivities.length;

    // Lower is better for this metric
    if (blockerRatio === 0) return 100;    // No blockers
    if (blockerRatio <= 0.1) return 90;   // Minimal blockers
    if (blockerRatio <= 0.2) return 70;   // Some blockers
    if (blockerRatio <= 0.3) return 50;   // Noticeable blockers

    return 20; // High frustration
}

/**
 * Variety Engagement: Diverse activities prevent boredom
 * Research: Variety maintains engagement
 */
function calculateVarietyEngagement(activities: Activity[]): number {
    const recentActivities = activities.filter(a => a.status === Status.InProgress);

    if (recentActivities.length <= 1) return 60; // Limited variety
    if (recentActivities.length >= 2 && recentActivities.length <= 5) return 100;
    if (recentActivities.length <= 8) return 80;

    return 50; // Too much variety can be scattered
}

/**
 * Time Realism: How realistic are time estimates
 * Research: Realistic expectations reduce stress
 */
function calculateTimeRealism(activities: Activity[]): number {
    const completedWithTimes = activities.filter(a =>
        a.status === Status.Completed &&
        a.estimatedTime &&
        a.actualTime
    );

    if (completedWithTimes.length === 0) return 70; // No data yet

    const accuracyRatios = completedWithTimes.map(a => {
        const ratio = Math.min(a.actualTime!, a.estimatedTime!) / Math.max(a.actualTime!, a.estimatedTime!);
        return ratio;
    });

    const avgAccuracy = accuracyRatios.reduce((sum, ratio) => sum + ratio, 0) / accuracyRatios.length;

    // 80%+ accuracy is excellent
    if (avgAccuracy >= 0.8) return 100;
    if (avgAccuracy >= 0.6) return 80;
    if (avgAccuracy >= 0.4) return 60;

    return 40; // Poor time estimation
}

/**
 * Consistency Rhythm: Regular progress pattern
 * Research: Consistency builds momentum
 */
function calculateConsistencyRhythm(recentCompletions: Activity[], timeframe: number): number {
    if (recentCompletions.length === 0) return 40;

    // Group completions by day
    const dailyCompletions = new Map<string, number>();
    recentCompletions.forEach(activity => {
        if (activity.completedDate) {
            const day = activity.completedDate.split('T')[0]; // Get date part
            dailyCompletions.set(day, (dailyCompletions.get(day) || 0) + 1);
        }
    });

    const activeDays = dailyCompletions.size;
    const consistency = activeDays / timeframe;

    // 50%+ of days with task is good rhythm
    if (consistency >= 0.5) return 100;
    if (consistency >= 0.3) return 80;
    if (consistency >= 0.2) return 60;

    return 40; // Inconsistent pattern
}

/**
 * Generate actionable insights based on wellness factors
 */
function generateInsights(factors: WellnessFactors, score: number): string[] {
    const insights: string[] = [];

    if (factors.progressMomentum < 60) {
        insights.push("🎯 Try completing 1-2 small tasks today to build momentum");
    }

    if (factors.workloadBalance < 50) {
        insights.push("⚖️ Consider reducing work-in-progress to 2-4 active tasks");
    }

    if (factors.blockerFrustration < 60) {
        insights.push("🚧 Focus on resolving blockers to reduce frustration");
    }

    if (factors.challengeFlow < 60) {
        insights.push("🌊 Break down large tasks into 1-4 hour chunks for better flow");
    }

    if (factors.goalAlignment < 60) {
        insights.push("🎪 Prioritize high-impact goals to increase sense of purpose");
    }

    if (factors.timeRealism < 60) {
        insights.push("⏰ Track actual vs estimated time to improve planning");
    }

    if (score >= 80) {
        insights.push("🔥 You're in an excellent flow state! Keep this rhythm going");
    } else if (score >= 60) {
        insights.push("👍 Good productivity momentum - small tweaks can get you to optimal");
    } else if (score >= 40) {
        insights.push("⚠️ Moderate wellness - focus on the top 1-2 improvement areas");
    } else {
        insights.push("🆘 High stress indicators - consider reducing scope and taking breaks");
    }

    return insights;
}

/**
 * Helper functions
 */
function getRecentCompletions(activities: Activity[], days: number): Activity[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return activities.filter(activity => {
        if (!activity.completedDate || activity.status !== Status.Completed) return false;

        const completedDate = new Date(activity.completedDate);
        return completedDate >= cutoffDate;
    });
}

function calculateTrend(recentCompletions: Activity[]): 'improving' | 'stable' | 'declining' {
    if (recentCompletions.length < 4) return 'stable';

    // Compare first half vs second half of recent period
    const midpoint = Math.floor(recentCompletions.length / 2);
    const firstHalf = recentCompletions.slice(0, midpoint);
    const secondHalf = recentCompletions.slice(midpoint);

    if (secondHalf.length > firstHalf.length * 1.2) return 'improving';
    if (secondHalf.length < firstHalf.length * 0.8) return 'declining';

    return 'stable';
}

function calculateRiskLevel(factors: WellnessFactors, score: number): 'low' | 'medium' | 'high' {
    // High risk indicators
    if (score < 40) return 'high';
    if (factors.blockerFrustration < 40) return 'high';
    if (factors.workloadBalance < 30) return 'high';

    // Medium risk indicators
    if (score < 60) return 'medium';
    if (factors.progressMomentum < 50) return 'medium';

    return 'low';
}

export type {WellnessFactors, WellnessMetrics};
