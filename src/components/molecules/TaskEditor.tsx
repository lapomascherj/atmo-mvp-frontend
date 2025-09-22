import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Input } from "@/components/atoms/Input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/atoms/Select.tsx";
import { colorOptions } from '../../utils/colorUtils.ts';
import {Task} from "@/models/Task.ts";

interface TaskEditorProps {
  activity: Task;
  onSave: (updates: Partial<Task>) => void;
  onCancel: () => void;
}

const TaskEditor: React.FC<TaskEditorProps> = ({
  activity,
  onSave,
  onCancel
}) => {
  const [editedTitle, setEditedTitle] = useState(activity.name);
  const [editedTime, setEditedTime] = useState(activity.time);
  const [editedDescription, setEditedDescription] = useState(activity.description);
  const [selectedColor, setSelectedColor] = useState(activity.color || 'orange');
  const [editedEstimatedTime, setEditedEstimatedTime] = useState(activity.estimatedTime || '30min');

  const handleSave = () => {
    onSave({
      name: editedTitle,
      time: editedTime,
      description: editedDescription,
      color: selectedColor,
      estimatedTime: editedEstimatedTime
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="time"
          value={editedTime}
          onChange={(e) => setEditedTime(e.target.value)}
          className="w-24 bg-black/20 border-white/10 text-white"
        />
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className="flex-1 bg-black/20 border-white/10 text-white"
        />
      </div>
      <Input
        value={editedDescription}
        onChange={(e) => setEditedDescription(e.target.value)}
        className="w-full bg-black/20 border-white/10 text-white"
        placeholder="Add a description..."
      />
      <Input
        value={editedEstimatedTime}
        onChange={(e) => setEditedEstimatedTime(e.target.value)}
        className="w-full bg-black/20 border-white/10 text-white"
        placeholder="Estimated time (e.g., 30min, 1h)"
      />
      <div className="flex gap-2">
        <Select
          value={selectedColor}
          onValueChange={setSelectedColor}
        >
          <SelectTrigger className="w-[120px] bg-black/20 border-white/10 text-white">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/10 text-white">
            {colorOptions.map((option) => (
              <SelectItem key={option.name} value={option.name} className="text-white hover:bg-white/10">
                <span className={option.value}>{option.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={handleSave}
          className="p-2 text-white hover:text-[#ff7000]"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TaskEditor;
