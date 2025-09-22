import { create } from "zustand";
import { Task, Goal, Project, Status } from "@/models";
import { useTasksStore } from "./useTasksStore";
import { useGoalsStore } from "./useGoalsStore";
import { useProjectsStore } from "./useProjectsStore";

interface RoadmapState {
  // State for tracking current selections/filters
  selectedProject: Project | null;
  selectedGoal: Goal | null;
  filterCompleted: boolean | null;

  // Actions for state management
  setSelectedProject: (project: Project | null) => void;
  setSelectedGoal: (goal: Goal | null) => void;
  setFilterCompleted: (completed: boolean | null) => void;

  // Utility functions that use entity stores directly
  getCurrentTask: (goalId: string) => Task | null;
  getNextTask: (goalId: string) => Task | null;
  getCompletedTasks: (goalId: string) => Task[];
  getIncompleteTasks: (goalId: string) => Task[];
  calculateGoalProgress: (goalId: string) => number;
  calculateProjectProgress: (projectId: string) => number;
  getProjectNextSteps: (projectId: string) => { goal: Goal; task: Task }[];
  getTaskStatusText: (completed: boolean) => string;
  getTaskStatusColor: (completed: boolean) => string;

  // Enhanced store-specific functions that use entity stores
  getFilteredTasks: (goalId: string) => Task[];
  getProjectStats: (projectId: string) => {
    totalTasks: number;
    completedTasks: number;
    incompleteTasks: number;
    progress: number;
  };
  getGoalStats: (goalId: string) => {
    totalTasks: number;
    completedTasks: number;
    incompleteTasks: number;
    progress: number;
  };

  // Store accessors (simplified)
  getAllTasks: () => Task[];
  getAllGoals: () => Goal[];
  getAllProjects: () => Project[];
  getTasksByProject: (projectId: string) => Task[];
  getGoalsByProject: (projectId: string) => Goal[];
  getProjectById: (projectId: string) => Project | undefined;
  getGoalById: (goalId: string) => Goal | undefined;
  getTaskById: (taskId: string) => Task | undefined;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  // State
  selectedProject: null,
  selectedGoal: null,
  filterCompleted: null,

  // Actions
  setSelectedProject: (project) => set({ selectedProject: project }),
  setSelectedGoal: (goal) => set({ selectedGoal: goal }),
  setFilterCompleted: (completed) => set({ filterCompleted: completed }),

  // Store accessors
  getAllTasks: () => useTasksStore.getState().tasks,
  getAllGoals: () => useGoalsStore.getState().goals,
  getAllProjects: () => useProjectsStore.getState().projects,

  getTasksByProject: (projectId: string) => {
    const projects = useProjectsStore.getState().projects;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return [];

    // Get all tasks from all goals in the project
    return project.goals.flatMap((goal) => goal.tasks || []);
  },

  getGoalsByProject: (projectId: string) => {
    const goals = useGoalsStore.getState().goals;
    return goals.filter((goal) => (goal as any).projectId === projectId);
  },

  getProjectById: (projectId: string) => {
    const projects = useProjectsStore.getState().projects;
    return projects.find((project) => project.id === projectId);
  },

  getGoalById: (goalId: string) => {
    const goals = useGoalsStore.getState().goals;
    return goals.find((goal) => goal.id === goalId);
  },

  getTaskById: (taskId: string) => {
    const tasks = useTasksStore.getState().tasks;
    return tasks.find((task) => task.id === taskId);
  },

  // Utility functions that use entity stores directly

  /**
   * Get the current task for a goal (first incomplete task)
   */
  getCurrentTask: (goalId: string): Task | null => {
    const { getGoalById } = get();
    const goal = getGoalById(goalId);
    if (!goal) return null;

    const sortedTasks = [...goal.tasks].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return sortedTasks.find((task) => !task.completed) || null;
  },

  /**
   * Get the next task for a goal
   */
  getNextTask: (goalId: string): Task | null => {
    const { getGoalById } = get();
    const goal = getGoalById(goalId);
    if (!goal) return null;

    const sortedTasks = [...goal.tasks].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const currentIndex = sortedTasks.findIndex((task) => !task.completed);

    if (currentIndex === -1 || currentIndex === sortedTasks.length - 1) {
      return null;
    }

    return sortedTasks[currentIndex + 1] || null;
  },

  /**
   * Get all completed tasks for a goal
   */
  getCompletedTasks: (goalId: string): Task[] => {
    const { getGoalById } = get();
    const goal = getGoalById(goalId);
    if (!goal) return [];

    return goal.tasks
      .filter((task) => task.completed)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Get all incomplete tasks for a goal
   */
  getIncompleteTasks: (goalId: string): Task[] => {
    const { getGoalById } = get();
    const goal = getGoalById(goalId);
    if (!goal) return [];

    return goal.tasks
      .filter((task) => !task.completed)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Calculate goal progress based on completed tasks
   */
  calculateGoalProgress: (goalId: string): number => {
    const { getGoalById } = get();
    const goal = getGoalById(goalId);
    if (!goal || !goal.tasks || goal.tasks.length === 0) return 0;

    const completedCount = goal.tasks.filter((task) => task.completed).length;
    return Math.round((completedCount / goal.tasks.length) * 100);
  },

  /**
   * Calculate project progress based on all goals and tasks
   */
  calculateProjectProgress: (projectId: string): number => {
    const { getProjectById } = get();
    const project = getProjectById(projectId);
    if (!project) return 0;

    const allTasks = project.goals.flatMap((goal) => goal.tasks);
    if (allTasks.length === 0) return 0;

    const completedCount = allTasks.filter((task) => task.completed).length;
    return Math.round((completedCount / allTasks.length) * 100);
  },

  /**
   * Get the next tasks across all goals in a project
   */
  getProjectNextSteps: (projectId: string): { goal: Goal; task: Task }[] => {
    const { getProjectById, getCurrentTask } = get();
    const project = getProjectById(projectId);
    if (!project) return [];

    return project.goals
      .map((goal) => {
        const nextTask = getCurrentTask(goal.id);
        return nextTask ? { goal, task: nextTask } : null;
      })
      .filter(Boolean) as { goal: Goal; task: Task }[];
  },

  /**
   * Get task status display text
   */
  getTaskStatusText: (completed: boolean): string => {
    return completed ? "Completed" : "Incomplete";
  },

  /**
   * Get task status color
   */
  getTaskStatusColor: (completed: boolean): string => {
    return completed ? "text-green-500" : "text-slate-400";
  },

  // Enhanced store-specific functions

  /**
   * Get filtered tasks based on current filter
   */
  getFilteredTasks: (goalId: string): Task[] => {
    const { getGoalById, filterCompleted } = get();
    const goal = getGoalById(goalId);
    if (!goal) return [];

    if (filterCompleted === null) {
      return goal.tasks.sort((a, b) => a.name.localeCompare(b.name));
    }

    return goal.tasks
      .filter((task) => task.completed === filterCompleted)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Get comprehensive project statistics
   */
  getProjectStats: (projectId: string) => {
    const { getProjectById } = get();
    const project = getProjectById(projectId);
    if (!project)
      return {
        totalTasks: 0,
        completedTasks: 0,
        incompleteTasks: 0,
        progress: 0,
      };

    const allTasks = project.goals.flatMap((goal) => goal.tasks);

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task) => task.completed).length;
    const incompleteTasks = allTasks.filter((task) => !task.completed).length;

    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      incompleteTasks,
      progress,
    };
  },

  /**
   * Get comprehensive goal statistics
   */
  getGoalStats: (goalId: string) => {
    const { getGoalById } = get();
    const goal = getGoalById(goalId);
    if (!goal)
      return {
        totalTasks: 0,
        completedTasks: 0,
        incompleteTasks: 0,
        progress: 0,
      };

    const totalTasks = goal.tasks?.length || 0;
    const completedTasks =
      goal.tasks?.filter((task) => task.completed).length || 0;
    const incompleteTasks =
      goal.tasks?.filter((task) => !task.completed).length || 0;

    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      incompleteTasks,
      progress,
    };
  },
}));
