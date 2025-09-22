import React from 'react';
import { Button } from '@/components/atoms/Button.tsx';
import { Calendar, Edit, Target, Trash2 } from 'lucide-react';
import { Milestone } from '@/models/Milestone.ts';

interface MilestoneCardProps {
  milestone: Milestone;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestoneId: string) => void;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onEdit,
  onDelete
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-[#FF7000]';
      case 'paused': return 'bg-gray-500';
      default: return 'bg-[#FF7000]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Done';
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      default: return 'Active';
    }
  };

  return (
    <div className="flex-shrink-0 w-32 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors group relative">
      {/* Status indicator and title */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(milestone.status)}`}></div>
        <h4 className="text-white text-xs font-medium truncate flex-1">{milestone.name}</h4>
      </div>

      {/* Status text */}
      <div className="text-xs text-[#FF7000] font-medium mb-2">
        {getStatusText(milestone.status)}
      </div>

      {/* Due date if available */}
      {milestone.due_date && (
        <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Calendar size={10} />
          {new Date(milestone.due_date).toLocaleDateString()}
        </div>
      )}

      {/* Description if available */}
      {milestone.description && (
        <p className="text-xs text-slate-500 truncate mb-2">{milestone.description}</p>
      )}

      {/* Action buttons - show on hover */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          onClick={() => onEdit(milestone)}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white p-0.5 h-auto w-auto"
        >
          <Edit size={10} />
        </Button>
        <Button
          onClick={() => onDelete(milestone.id)}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-red-400 p-0.5 h-auto w-auto"
        >
          <Trash2 size={10} />
        </Button>
      </div>
    </div>
  );
};

export default MilestoneCard; 