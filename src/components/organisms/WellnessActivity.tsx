import React, { useState } from 'react';
import { Clock, Edit } from 'lucide-react';
import { Checkbox } from "@/components/atoms/Checkbox.tsx";
import { getColorClass } from '../../utils/colorUtils.ts';
import TaskEditor from '../molecules/TaskEditor.tsx';
import {Task} from "@/models/Task.ts";

interface WellnessTaskProps {
  activity: Task;
  onComplete: (id: string, completed: boolean) => void;
  onEdit: (id: string, updates: Partial<Task>) => void;
  isEditable?: boolean;
}

const WellnessTask: React.FC<WellnessTaskProps> = ({
  activity,
  onComplete,
  onEdit,
  isEditable = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { id, time, name, description, completed = false, color = 'orange' } = activity;

  const handleSave = (updates: Partial<Task>) => {
    onEdit(id, updates);
    setIsEditing(false);
  };

  return (
    <div className={`group relative py-3 transition-all duration-300 ${completed ? 'opacity-60' : ''}`}>
      <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-[#ff7000]/30 to-[#ff7000]/10" />

      <div className="ml-10 relative">
        <div className="absolute -left-8 top-1">
          <Checkbox
            id={`complete-${id}`}
            checked={completed}
            onCheckedChange={(checked) => onComplete(id, checked as boolean)}
            className="bg-black/20 border-white/20 data-[state=checked]:bg-[#ff7000]"
          />
        </div>

        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">{time}</span>
              <h3 className={`text-sm font-medium ${getColorClass(color)}`}>{title}</h3>
            </div>

            {isEditable && (
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Edit className="w-4 h-4 text-gray-400 hover:text-[#ff7000]" />
              </button>
            )}
          </div>
        ) : (
          <TaskEditor
            activity={activity}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        )}

        {!isEditing && description && (
          <p className="text-xs text-gray-400 mt-1 ml-6">{description}</p>
        )}
      </div>
    </div>
  );
};

export default WellnessTask;
