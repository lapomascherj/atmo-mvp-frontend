import React, { useMemo, useCallback } from 'react';
import { AtmoCard } from '../molecules/AtmoCard.tsx';
import { CardHeader, CardContent } from '../atoms/Card.tsx';
import { Button } from '../atoms/Button.tsx';
import { CheckCircle, Target, Plus, AlertCircle } from 'lucide-react';
import { usePersonasStore } from '@/stores/usePersonasStore.ts';
import { Status } from '@/models/Status.ts';
import { Goal } from '@/models/Goal.ts';

interface LeftColumnProps {
  userName: string;
}

const LeftColumn: React.FC<LeftColumnProps> = ({ userName }) => {
  // Use PersonasStore as single source of truth (following README.md)
  // Subscribe to the actual state to ensure re-renders when data changes
  const currentPersona = usePersonasStore(state => state.currentPersona);
  const getProjects = usePersonasStore(state => state.getProjects);
  const getTasks = usePersonasStore(state => state.getTasks);
  const getGoals = usePersonasStore(state => state.getGoals);

  // Memoize data retrieval to prevent unnecessary recalculations
  const { tasks, goals, projects } = useMemo(() => {
    if (!currentPersona) {
      return { tasks: [], goals: [], projects: [] };
    }
    
    const tasks = getTasks();
    const goals = getGoals();
    const projects = getProjects();
    
    console.debug("👈 LEFT COLUMN: Data loaded:", {
      tasks: tasks.length,
      goals: goals.length,
      projects: projects.length
    });
    
    return { tasks, goals, projects };
  }, [currentPersona, getTasks, getGoals, getProjects]);

  // Memoize filtered data to prevent recalculation on every render
  const priorityData = useMemo(() => {
    const todayTasks = tasks.filter(task => !task.completed).slice(0, 3);
    const activeGoals = goals.filter(goal => goal.status === Status.InProgress).slice(0, 2);
    const activeProjects = projects.filter(project => project.active !== false).slice(0, 3);

    return {
      todayTasks,
      activeGoals,
      activeProjects
    };
  }, [tasks, goals, projects]);

  // Memoize goal progress calculation function
  const calculateGoalProgress = useCallback((goal: Goal): number => {
    if (!goal.tasks || goal.tasks.length === 0) return 0;
    const completedTasks = goal.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / goal.tasks.length) * 100);
  }, []);

  const { todayTasks, activeGoals, activeProjects } = priorityData;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Today's Focus Card */}
      <AtmoCard variant="orange" className="w-full" hover={true}>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF5F1F]/20">
              <Target className="w-4 h-4 text-[#FF5F1F]" />
            </div>
            <span className="text-sm font-semibold text-white">Today's Focus</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF5F1F]/20 text-[#FF5F1F] text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* <Clock className="w-3 h-3 text-slate-400" /> */}
                      <span className="text-xs text-slate-400">
                        {task.estimated_time ? `${task.estimated_time}min` : 'No time set'}
                      </span>
                      {/* <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          task.priority === Priority.High ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          task.priority === Priority.Medium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}
                      >
                        {task.priority}
                      </Badge> */}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white p-1 h-6 w-6"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm mb-3">No priority tasks set for today</p>
              <Button
                size="sm"
                className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
              >
                <Plus className="w-3 h-3" />
                Add Task
              </Button>
            </div>
          )}
        </CardContent>
      </AtmoCard>

      {/* Active Goals */}
      <AtmoCard variant="default" className="w-full" hover={true}>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-white">Active Goals</span>
            </div>
            <span className="text-xs text-white/60">{activeGoals.length} active</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {activeGoals.length > 0 ? (
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white text-sm font-medium truncate">{goal.name}</h4>
                    {/* <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        goal.priority === Priority.High ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        goal.priority === Priority.Medium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}
                    >
                      {goal.priority}
                    </Badge> */}
                  </div>
                  {goal.targetDate && (
                    <p className="text-xs text-slate-400 mb-2">
                      Due: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  )}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${calculateGoalProgress(goal)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{calculateGoalProgress(goal)}% complete</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm">No active goals</p>
            </div>
          )}
        </CardContent>
      </AtmoCard>

      {/* Quick Stats */}
      <AtmoCard variant="default" className="w-full" hover={true}>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-sm font-semibold text-white">Progress Today</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-black/20 rounded-lg">
              <div className="text-lg font-semibold text-white">{tasks.filter(t => t.completed).length}</div>
              <div className="text-xs text-slate-400">Tasks Done</div>
            </div>
            <div className="text-center p-2 bg-black/20 rounded-lg">
              <div className="text-lg font-semibold text-white">{activeProjects.length}</div>
              <div className="text-xs text-slate-400">Active Projects</div>
            </div>
          </div>
        </CardContent>
      </AtmoCard>
    </div>
  );
};

export default React.memo(LeftColumn);
