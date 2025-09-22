import React from 'react';
import { useToast } from "@/hooks/useToast.ts";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import WellnessTask from './WellnessTask.tsx';

interface RoadmapComponentProps {
  isEditable?: boolean;
}

const RoadmapComponent: React.FC<RoadmapComponentProps> = ({ isEditable = false }) => {
  const { toast } = useToast();
  const { activities, toggleActivityCompletion, updateActivity } = useGlobalStore();

  const handleComplete = (id: string, completed: boolean) => {
    toggleActivityCompletion(id);

    if (completed) {
      toast({
        title: "Activity completed! 🎯📈🔥",
        description: "Great progress on your daily goals",
        duration: 2000,
      });
    }
  };

  const handleEdit = (id: string, updates: Partial<Activity>) => {
    updateActivity(id, updates);

    toast({
      title: "Activity updated",
      description: "Your changes have been saved",
      duration: 2000,
    });
  };

  // Sort activities by time
  const sortedActivities = [...(activities || [])].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-1">
      {sortedActivities.map((activity) => (
        <WellnessActivity
          key={activity.id}
          activity={{
            id: activity.id,
            time: activity.time,
            title: activity.name,
            description: activity.description || '',
            completed: activity.completed,
            color: activity.color,
            project: activity.projectID
          }}
          onComplete={handleComplete}
          onEdit={handleEdit}
          isEditable={isEditable}
        />
      ))}
    </div>
  );
};

export default RoadmapComponent;
