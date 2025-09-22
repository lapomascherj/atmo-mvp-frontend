import React from 'react';
import { ArrowUpRight, ListTodo } from 'lucide-react';

interface DailyCardProps {
  completionPercentage: number;
  taskCount: number;
}

const DailyCard: React.FC<DailyCardProps> = ({ completionPercentage, taskCount }) => {
  return (
    <div className="w-full max-w-[320px] rounded-xl p-3 text-left transition-all duration-300 bg-[#010000]/80 border border-white/5 group hover:border-[#D04907]/20 shadow-md hover:shadow-[0_4px_12px_rgba(208,73,7,0.15)] relative overflow-hidden">
      {/* Background subtle glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#D04907]/5 blur-xl opacity-70 transition-opacity group-hover:opacity-100"></div>

      <div className="relative">
        {/* Title with icon */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <ListTodo size={14} className="text-[#D04907]" />
            <h3 className="text-sm font-medium text-[#E3E3E3]">DAILY WARM-UP</h3>
          </div>
          {taskCount > 0 && (
            <div className="px-2 py-0.5 rounded-full text-[10px] border border-white/5 bg-[#010000]/60 text-[#E3E3E3]/80">
              {completionPercentage}%
            </div>
          )}
        </div>

        {/* Progress bar */}
        {taskCount > 0 && (
          <div className="mb-2">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D04907] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Tasks summary */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-[#E3E3E3]/70">
            {taskCount > 0
              ? `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} to complete today`
              : "Plan your day for optimal productivity"}
          </p>

          <div className="flex items-center gap-1.5 text-[10px] text-[#D04907] group-hover:text-[#E3E3E3] transition-colors ml-2">
            <span>Details in roadmap</span>
            <ArrowUpRight size={12} className="transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyCard;
