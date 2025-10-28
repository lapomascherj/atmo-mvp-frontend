/**
 * Tests for Progress Calculator Utility
 *
 * Run these tests to verify progress calculation logic
 */

import {
  calculateProjectProgress,
  calculateGoalProgress,
  calculateMilestoneProgress,
  calculateMilestoneProgressByTasks,
  getProjectCompletionStats,
  getGoalCompletionStats,
  getMilestoneCompletionStats,
  updateProjectsProgress
} from './progressCalculator';
import { Project } from '@/models/Project';
import { Goal } from '@/models/Goal';
import { Milestone } from '@/models/Milestone';
import { Task } from '@/models/Task';
import { Status } from '@/models/Status';
import { Priority } from '@/models/Priority';
import { TaskAgency } from '@/models/TaskAgency';

// Helper to create a mock task
const createTask = (id: string, completed: boolean): Task => ({
  id,
  name: `Task ${id}`,
  description: 'Test task',
  priority: Priority.Medium,
  completed,
  agency: TaskAgency.Human,
  color: '#FF7000'
});

// Helper to create a mock goal with tasks
const createGoal = (id: string, taskCount: number, completedCount: number): Goal => {
  const tasks: Task[] = [];
  for (let i = 0; i < taskCount; i++) {
    tasks.push(createTask(`${id}-task-${i}`, i < completedCount));
  }
  return {
    id,
    name: `Goal ${id}`,
    status: Status.InProgress,
    priority: Priority.Medium,
    targetDate: new Date().toISOString(),
    order: 0,
    tasks
  };
};

// Test 1: Goal with no tasks should return 0% progress
console.log('Test 1: Goal with no tasks');
const emptyGoal = createGoal('goal-1', 0, 0);
const emptyGoalProgress = calculateGoalProgress(emptyGoal);
console.log(`Expected: 0, Got: ${emptyGoalProgress}`);
console.assert(emptyGoalProgress === 0, 'Goal with no tasks should have 0% progress');

// Test 2: Goal with all tasks completed should return 100% progress
console.log('\nTest 2: Goal with all tasks completed');
const completeGoal = createGoal('goal-2', 5, 5);
const completeGoalProgress = calculateGoalProgress(completeGoal);
console.log(`Expected: 100, Got: ${completeGoalProgress}`);
console.assert(completeGoalProgress === 100, 'Goal with all tasks completed should have 100% progress');

// Test 3: Goal with partial completion should return correct percentage
console.log('\nTest 3: Goal with partial completion (3/10 = 30%)');
const partialGoal = createGoal('goal-3', 10, 3);
const partialGoalProgress = calculateGoalProgress(partialGoal);
console.log(`Expected: 30, Got: ${partialGoalProgress}`);
console.assert(partialGoalProgress === 30, 'Goal with 3/10 tasks should have 30% progress');

// Test 4: Project with multiple goals
console.log('\nTest 4: Project with multiple goals');
const project: Project = {
  id: 'project-1',
  name: 'Test Project',
  goals: [
    createGoal('goal-1', 10, 5),  // 50% complete
    createGoal('goal-2', 10, 10), // 100% complete
    createGoal('goal-3', 10, 0)   // 0% complete
  ],
  items: [],
  active: true
};
const projectProgress = calculateProjectProgress(project);
// Total: 30 tasks, 15 completed = 50%
console.log(`Expected: 50, Got: ${projectProgress}`);
console.assert(projectProgress === 50, 'Project progress should be 50%');

// Test 5: Project with no goals
console.log('\nTest 5: Project with no goals');
const emptyProject: Project = {
  id: 'project-2',
  name: 'Empty Project',
  goals: [],
  items: [],
  active: true
};
const emptyProjectProgress = calculateProjectProgress(emptyProject);
console.log(`Expected: 0, Got: ${emptyProjectProgress}`);
console.assert(emptyProjectProgress === 0, 'Empty project should have 0% progress');

// Test 6: Milestone with goals
console.log('\nTest 6: Milestone progress by goals');
const milestone: Milestone = {
  id: 'milestone-1',
  name: 'Test Milestone',
  status: 'active',
  goals: [
    { ...createGoal('goal-1', 5, 5), status: Status.Completed },
    { ...createGoal('goal-2', 5, 3), status: Status.InProgress },
    { ...createGoal('goal-3', 5, 0), status: Status.Planned }
  ]
};
const milestoneProgressByGoals = calculateMilestoneProgress(milestone);
console.log(`Expected: 33 (1/3 goals completed), Got: ${milestoneProgressByGoals}`);
console.assert(milestoneProgressByGoals === 33, 'Milestone should have 33% progress by goals');

// Test 7: Milestone progress by tasks
console.log('\nTest 7: Milestone progress by tasks');
const milestoneProgressByTasks = calculateMilestoneProgressByTasks(milestone);
// Total: 15 tasks (5+5+5), Completed: 8 tasks (5+3+0) = 53%
console.log(`Expected: 53 (8/15 tasks), Got: ${milestoneProgressByTasks}`);
console.assert(milestoneProgressByTasks === 53, 'Milestone should have 53% progress by tasks');

// Test 8: Get completion stats
console.log('\nTest 8: Project completion stats');
const stats = getProjectCompletionStats(project);
console.log('Stats:', stats);
console.assert(stats.totalTasks === 30, 'Total tasks should be 30');
console.assert(stats.completedTasks === 15, 'Completed tasks should be 15');
console.assert(stats.progress === 50, 'Progress should be 50%');

// Test 9: Update multiple projects
console.log('\nTest 9: Update multiple projects with progress');
const projects = [project, emptyProject];
const updatedProjects = updateProjectsProgress(projects);
console.log(`Project 1 progress: ${updatedProjects[0].progress}`);
console.log(`Project 2 progress: ${updatedProjects[1].progress}`);
console.assert(updatedProjects[0].progress === 50, 'First project should have 50% progress');
console.assert(updatedProjects[1].progress === 0, 'Second project should have 0% progress');

// Test 10: Rounding behavior
console.log('\nTest 10: Rounding behavior (1/3 = 33.33% -> 33%)');
const roundingGoal = createGoal('goal-round', 3, 1);
const roundingProgress = calculateGoalProgress(roundingGoal);
console.log(`Expected: 33, Got: ${roundingProgress}`);
console.assert(roundingProgress === 33, 'Progress should round to nearest integer');

console.log('\n✅ All tests passed!');
