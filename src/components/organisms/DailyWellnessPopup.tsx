import React, { useEffect } from 'react';
import { HeartIcon, X } from 'lucide-react';
import { ScrollArea } from "@/components/atoms/ScrollArea.tsx";
import { Checkbox } from "@/components/atoms/Checkbox.tsx";
import { AtmoCard } from "@/components/molecules/AtmoCard.tsx";
import {WellnessTask} from "@/models";

interface DailyWellnessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksChange?: (tasks: WellnessTask[]) => void;
}

const DailyWellnessPopup: React.FC<DailyWellnessPopupProps> = ({ isOpen, onClose, onTasksChange }) => {
  const [wellnessTasks, setWellnessTasks] = React.useState<WellnessTask[]>([
    { id: 'w1', title: 'Morning meditation', completed: false },
    { id: 'w2', title: 'Drink 2L of water', completed: false },
    { id: 'w3', title: 'Take a walking break', completed: false },
    { id: 'w4', title: 'Practice deep breathing', completed: false },
    { id: 'w5', title: 'Stretch for 5 minutes', completed: false },
  ]);

  // Effect to notify parent component when tasks change
  useEffect(() => {
    if (onTasksChange) {
      onTasksChange(wellnessTasks);
    }
  }, [wellnessTasks, onTasksChange]);

  const toggleWellnessTask = (id: string) => {
    setWellnessTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <AtmoCard variant="purple" glow className="p-6 space-y-4 w-full max-h-[80vh] overflow-hidden bg-[#1A1F2C]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartIcon size={16} className="text-[#ff7000]" />
              <h2 className="text-[#ff7000] font-medium text-lg">Daily Wellness</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-[#ff7000] mb-4">Take care of yourself to stay centered and focused</p>

          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {wellnessTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 bg-black/70 p-3 rounded-lg backdrop-blur-lg border border-[#6E59A5]/30 hover:bg-black/80 hover:border-[#6E59A5]/50 transition-all shadow-lg"
                >
                  <Checkbox
                    id={`wellness-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleWellnessTask(task.id)}
                    className="h-4 w-4 mt-0.5 border-[#9b87f5] data-[state=checked]:bg-[#ff7000] data-[state=checked]:border-[#ff7000]"
                  />
                  <label
                    htmlFor={`wellness-${task.id}`}
                    className={`text-sm ${task.completed ? 'line-through text-[#9b87f5]/50' : 'text-[#d6bcfa]'}`}
                  >
                    {task.title}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </AtmoCard>
      </div>
    </div>
  );
};

export default DailyWellnessPopup;
