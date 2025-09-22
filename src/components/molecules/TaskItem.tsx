import React from 'react';
import { Checkbox } from "@/components/atoms/Checkbox.tsx";
import {Task} from "@/models";


interface TaskItemProps {
  activity: Task;
  handleTaskCompletion: (id: string, completed: boolean) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ activity, handleTaskCompletion, updateTask }) => {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/20">
      <Checkbox
        id={`task-${activity.id}`}
        checked={activity.completed}
        onCheckedChange={checked => handleTaskCompletion(activity.id, checked === true)}
        className="h-4 w-4 border-white/20 data-[state=checked]:bg-[#ff7000] data-[state=checked]:border-[#ff7000]"
      />
      <div className="flex flex-col w-full">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{activity.time}</span>
            <span className={`text-sm ${activity.completed ? 'line-through text-white/50' : 'text-white/90'}`}>
              {activity.name}
            </span>
          </div>
          <button
            onClick={() => {
              const updatedDescription = prompt("Update task description:", activity.description || "");
              if (updatedDescription !== null) {
                updateTask(activity.id, {
                  description: updatedDescription
                });
              }
            }}
            className="opacity-0 hover:opacity-100 transition-opacity text-white/60 hover:text-[#ff7000]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        {activity.description && <p className="text-xs text-gray-400 ml-6">{activity.description}</p>}
      </div>
    </div>
  );
};

export default TaskItem;
