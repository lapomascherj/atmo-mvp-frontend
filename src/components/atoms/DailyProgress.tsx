import React from 'react';
import { Progress } from "@/components/atoms/Progress.tsx";
import { CircleDot } from 'lucide-react';
import {useTasksStore} from "@/stores/useTasksStore.ts";
import {WellnessLevel} from "@/models/WellnessLevel.ts";

interface DailyProgressProps {
  wellnessLevel: WellnessLevel;
}

const DailyProgress: React.FC<DailyProgressProps> = ({ wellnessLevel }) => {
  const {completion} = useTasksStore()

  return (
    <div className="backdrop-blur-lg border border-white/10 rounded-xl p-4 shadow-lg hover:border-white/15 transition-all duration-300 bg-black/[0.43]">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-300">Daily Progress</p>
            <div className="flex items-center gap-1.5" title={`Wellness Level: ${wellnessLevel.status}`}>
              <CircleDot className={`h-3.5 w-3.5 ${wellnessLevel.color}`} />
              <span className="text-xs text-gray-400">Wellness</span>
            </div>
          </div>
          <p className="text-sm text-[#ff7000] font-medium">{completion}%</p>
        </div>
        <Progress value={completion} className="h-1.5 bg-white/5" />
      </div>
    </div>
  );
};

export default DailyProgress;
