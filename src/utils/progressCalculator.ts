/**
 * Progress Calculator Utility
 *
 * Provides centralized logic for calculating progress across different entity types:
 * - Projects: Based on task completion across all goals
 * - Milestones: Based on completed goals
 * - Goals: Based on task completion
 * - Tasks: Binary completed status
 */

import { Project } from "@/models/Project";
import { Goal } from "@/models/Goal";
import { Milestone } from "@/models/Milestone";
import { Task } from "@/models/Task";
import { Status } from "@/models/Status";

/**
 * Calculate project progress based on all tasks within project goals
 * @param project The project to calculate progress for
 * @returns Progress percentage (0-100)
 */
export function calculateProjectProgress(project: Project): number {
  if (!project.goals || project.goals.length === 0) {
    return 0;
  }

  // Get all tasks from all goals
  const allTasks = project.goals.flatMap(goal => goal.tasks || []);

  if (allTasks.length === 0) {
    return 0;
  }

  // Count completed tasks
  const completedTasks = allTasks.filter(task => task.completed || task.status === "completed");

  // Calculate and round to nearest integer
  return Math.round((completedTasks.length / allTasks.length) * 100);
}

/**
 * Calculate goal progress based on task completion
 * @param goal The goal to calculate progress for
 * @returns Progress percentage (0-100)
 */
export function calculateGoalProgress(goal: Goal): number {
  if (!goal.tasks || goal.tasks.length === 0) {
    return 0;
  }

  const completedTasks = goal.tasks.filter(task => task.completed || task.status === "completed");

  return Math.round((completedTasks.length / goal.tasks.length) * 100);
}

/**
 * Calculate milestone progress based on completed goals
 * @param milestone The milestone to calculate progress for
 * @returns Progress percentage (0-100)
 */
export function calculateMilestoneProgress(milestone: Milestone): number {
  if (!milestone.goals || milestone.goals.length === 0) {
    return 0;
  }

  const completedGoals = milestone.goals.filter(
    goal => goal.status === Status.Completed || goal.completedDate
  );

  return Math.round((completedGoals.length / milestone.goals.length) * 100);
}

/**
 * Calculate milestone progress based on all tasks within milestone goals
 * Alternative method that looks at task-level completion
 * @param milestone The milestone to calculate progress for
 * @returns Progress percentage (0-100)
 */
export function calculateMilestoneProgressByTasks(milestone: Milestone): number {
  if (!milestone.goals || milestone.goals.length === 0) {
    return 0;
  }

  // Get all tasks from all goals in the milestone
  const allTasks = milestone.goals.flatMap(goal => goal.tasks || []);

  if (allTasks.length === 0) {
    return 0;
  }

  const completedTasks = allTasks.filter(task => task.completed || task.status === "completed");

  return Math.round((completedTasks.length / allTasks.length) * 100);
}

/**
 * Get completion statistics for a project
 * @param project The project to analyze
 * @returns Detailed completion statistics
 */
export function getProjectCompletionStats(project: Project): {
  totalTasks: number;
  completedTasks: number;
  totalGoals: number;
  completedGoals: number;
  progress: number;
  isComplete: boolean;
} {
  const goals = project.goals || [];
  const allTasks = goals.flatMap(goal => goal.tasks || []);
  const completedTasks = allTasks.filter(task => task.completed || task.status === "completed");
  const completedGoals = goals.filter(goal => goal.status === Status.Completed);

  const progress = allTasks.length > 0
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0;

  return {
    totalTasks: allTasks.length,
    completedTasks: completedTasks.length,
    totalGoals: goals.length,
    completedGoals: completedGoals.length,
    progress,
    isComplete: progress === 100
  };
}

/**
 * Get completion statistics for a goal
 * @param goal The goal to analyze
 * @returns Detailed completion statistics
 */
export function getGoalCompletionStats(goal: Goal): {
  totalTasks: number;
  completedTasks: number;
  progress: number;
  isComplete: boolean;
} {
  const tasks = goal.tasks || [];
  const completedTasks = tasks.filter(task => task.completed || task.status === "completed");

  const progress = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    progress,
    isComplete: progress === 100
  };
}

/**
 * Get completion statistics for a milestone
 * @param milestone The milestone to analyze
 * @returns Detailed completion statistics
 */
export function getMilestoneCompletionStats(milestone: Milestone): {
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  progressByGoals: number;
  progressByTasks: number;
  isComplete: boolean;
} {
  const goals = milestone.goals || [];
  const completedGoals = goals.filter(goal => goal.status === Status.Completed);
  const allTasks = goals.flatMap(goal => goal.tasks || []);
  const completedTasks = allTasks.filter(task => task.completed || task.status === "completed");

  const progressByGoals = goals.length > 0
    ? Math.round((completedGoals.length / goals.length) * 100)
    : 0;

  const progressByTasks = allTasks.length > 0
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0;

  return {
    totalGoals: goals.length,
    completedGoals: completedGoals.length,
    totalTasks: allTasks.length,
    completedTasks: completedTasks.length,
    progressByGoals,
    progressByTasks,
    isComplete: progressByGoals === 100
  };
}

/**
 * Update project with calculated progress
 * Mutates the project object by updating its progress field
 * @param project The project to update
 * @returns The updated project with calculated progress
 */
export function updateProjectProgress(project: Project): Project {
  project.progress = calculateProjectProgress(project);
  return project;
}

/**
 * Update multiple projects with calculated progress
 * Calculates progress for projects AND their milestones
 * @param projects Array of projects to update
 * @returns Array of projects with calculated progress
 */
export function updateProjectsProgress(projects: Project[]): Project[] {
  return projects.map(project => {
    // Calculate progress for milestones in this project
    const milestonesWithProgress = project.milestones?.map(milestone => ({
      ...milestone,
      progress: calculateMilestoneProgressByTasks(milestone)
    }));

    return {
      ...project,
      progress: calculateProjectProgress(project),
      milestones: milestonesWithProgress
    };
  });
}

/**
 * Check if a project should be marked as complete
 * A project is complete if all its tasks are completed
 * @param project The project to check
 * @returns Whether the project should be marked complete
 */
export function shouldMarkProjectComplete(project: Project): boolean {
  const progress = calculateProjectProgress(project);
  return progress === 100 && (project.goals?.length || 0) > 0;
}

/**
 * Check if a goal should be marked as complete
 * A goal is complete if all its tasks are completed
 * @param goal The goal to check
 * @returns Whether the goal should be marked complete
 */
export function shouldMarkGoalComplete(goal: Goal): boolean {
  const progress = calculateGoalProgress(goal);
  return progress === 100 && (goal.tasks?.length || 0) > 0;
}

/**
 * Get human-readable progress description
 * @param progress Progress percentage (0-100)
 * @returns Human-readable description
 */
export function getProgressDescription(progress: number): string {
  if (progress === 0) return "Not started";
  if (progress < 25) return "Just beginning";
  if (progress < 50) return "Making progress";
  if (progress < 75) return "More than halfway";
  if (progress < 100) return "Almost complete";
  return "Complete";
}

/**
 * Get progress color based on percentage
 * @param progress Progress percentage (0-100)
 * @returns Tailwind color class
 */
export function getProgressColor(progress: number): string {
  if (progress === 0) return "bg-gray-500";
  if (progress < 25) return "bg-red-500";
  if (progress < 50) return "bg-orange-500";
  if (progress < 75) return "bg-yellow-500";
  if (progress < 100) return "bg-blue-500";
  return "bg-green-500";
}
