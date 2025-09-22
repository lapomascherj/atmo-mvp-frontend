import React, {useContext, useState} from 'react';
import { ScrollArea } from "@/components/atoms/ScrollArea.tsx";
import {DailyMapCtx} from "@/context/DailyMapCtx.tsx";
import {Task} from "@/models/Task.ts";
import {Goal} from "@/models/Goal.ts";
import {Project} from "@/models/Project.ts";
import GoalItem from "@/components/organisms/GoalItem.tsx";

interface ProjectWithGoals {
  project: Project;
  goals: Goal[];
}

const ProjectsList: React.FC = () => {
  const dailyMapCtx = useContext(DailyMapCtx);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  
  if (!dailyMapCtx) {
    return (
      <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-4 shadow-lg">
        <p className="text-white/60 text-center">Loading projects...</p>
      </div>
    );
  }

  // Organize goals by project
  const projectsWithGoals: ProjectWithGoals[] = [];
  
  // Add goals from projects with activities
  if (dailyMapCtx.groupedProjects) {
    dailyMapCtx.groupedProjects.forEach(project => {
      if (project.goals && project.goals.length > 0) {
        const goalsWithTasks = project.goals.filter(goal => goal.tasks && goal.tasks.length > 0);
        if (goalsWithTasks.length > 0) {
          projectsWithGoals.push({
            project,
            goals: goalsWithTasks
          });
        }
      }
    });
  }

  // Add goals from empty projects (goals without tasks)
  const emptyProjectsWithGoals: ProjectWithGoals[] = [];
  if (dailyMapCtx.emptyProjects) {
    dailyMapCtx.emptyProjects.forEach(project => {
      if (project.goals && project.goals.length > 0) {
        emptyProjectsWithGoals.push({
          project,
          goals: project.goals
        });
      }
    });
  }

  const handleGoalToggle = (goalId: string) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  const hasActiveProjects = projectsWithGoals.length > 0;
  const hasEmptyProjects = emptyProjectsWithGoals.length > 0;
  const totalGoals = projectsWithGoals.reduce((sum, {goals}) => sum + goals.length, 0) + 
                    emptyProjectsWithGoals.reduce((sum, {goals}) => sum + goals.length, 0);
  const totalTasks = projectsWithGoals.reduce((sum, {goals}) => 
    sum + goals.reduce((taskSum, goal) => taskSum + (goal.tasks?.length || 0), 0), 0);

  return (
    <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-4 shadow-lg hover:border-white/15 transition-all duration-300 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">Today's Goals</h2>
        <span className="text-xs text-white/60">
          {totalGoals > 0 ? `${totalGoals} goals • ${totalTasks} tasks` : 'No goals yet'}
        </span>
      </div>

      <ScrollArea className="h-[500px] pr-2">
        <div className="space-y-4 pb-4 w-full overflow-hidden">
          {hasActiveProjects ? (
            <>
              {/* Projects with goals that have tasks */}
              {projectsWithGoals.map(({project, goals}) => (
                <div key={project.id} className="space-y-2">
                  {/* Project Header */}
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs font-medium text-white/70">{project.name}</span>
                    <span className="text-xs text-white/50">
                      {goals.length} goal{goals.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Goals as accordions */}
                  <div className="space-y-1 ml-2 w-full overflow-hidden">
                    {goals.map((goal) => (
                      <div key={goal.id} className="w-full overflow-hidden">
                        <GoalItem 
                          goal={goal}
                          projectName={project.name}
                          isOpen={expandedGoals[goal.id] || false}
                          onToggle={handleGoalToggle}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Empty projects (goals without tasks) */}
              {hasEmptyProjects && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/50 mb-3">Goals without tasks:</p>
                  <div className="space-y-4">
                    {emptyProjectsWithGoals.map(({project, goals}) => (
                      <div key={project.id} className="space-y-2">
                        {/* Project Header */}
                        <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span className="text-xs font-medium text-white/70">{project.name}</span>
                          <span className="text-xs text-white/50">
                            {goals.length} goal{goals.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Goals as accordions */}
                        <div className="space-y-1 ml-2 w-full overflow-hidden">
                          {goals.map((goal) => (
                            <div key={goal.id} className="w-full overflow-hidden">
                              <GoalItem 
                                goal={goal}
                                projectName={project.name}
                                isOpen={expandedGoals[goal.id] || false}
                                onToggle={handleGoalToggle}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60 mb-2">No goals with tasks yet</p>
              <p className="text-xs text-white/40">
                Create goals and tasks in your projects to see them here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectsList;
