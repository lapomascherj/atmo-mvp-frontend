import React, { useState } from 'react';
import { Save, Loader2, Flag } from 'lucide-react';
import { Input } from '@/components/atoms/Input.tsx';
import { Label } from '@/components/atoms/Label.tsx';
import { TextArea } from '@/components/atoms/TextArea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select.tsx';
import { Button } from "@/components/atoms/Button.tsx";
import { Checkbox } from "@/components/atoms/Checkbox.tsx";
import { Task } from "@/models/Task";
import { Priority } from "@/models/Priority";

interface TaskFormProps {
    task?: Task;
    goalId: string;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, goalId, onSubmit, onCancel }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: task?.name || '',
        description: task?.description || '',
        priority: task?.priority || Priority.Low,
        completed: task?.completed || false,
        estimated_time: task?.estimated_time || undefined,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Name */}
            <div className="space-y-2">
                <Label className="text-sm text-white/80">Task Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter task name"
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                />
            </div>

            {/* Task Description */}
            <div className="space-y-2">
                <Label className="text-sm text-white/80">Description</Label>
                <TextArea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Enter task description"
                    rows={3}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    required
                />
            </div>

            {/* Priority and Completion Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm text-white/80">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => updateField('priority', value)}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value={Priority.Low} className="text-white hover:bg-slate-700">
                                <div className="flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-blue-400" />
                                    <span>Low</span>
                                </div>
                            </SelectItem>
                            <SelectItem value={Priority.Medium} className="text-white hover:bg-slate-700">
                                <div className="flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-[#FF5F1F]" />
                                    <span>Medium</span>
                                </div>
                            </SelectItem>
                            <SelectItem value={Priority.High} className="text-white hover:bg-slate-700">
                                <div className="flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-red-400" />
                                    <span>High</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-white/80">Estimated Time (minutes)</Label>
                    <Select 
                        value={formData.estimated_time?.toString() || "60"} 
                        onValueChange={(value) => updateField('estimated_time', parseInt(value))}
                    >
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="15" className="text-white hover:bg-slate-700">15 minutes</SelectItem>
                            <SelectItem value="30" className="text-white hover:bg-slate-700">30 minutes</SelectItem>
                            <SelectItem value="45" className="text-white hover:bg-slate-700">45 minutes</SelectItem>
                            <SelectItem value="60" className="text-white hover:bg-slate-700">1 hour</SelectItem>
                            <SelectItem value="90" className="text-white hover:bg-slate-700">1.5 hours</SelectItem>
                            <SelectItem value="120" className="text-white hover:bg-slate-700">2 hours</SelectItem>
                            <SelectItem value="180" className="text-white hover:bg-slate-700">3 hours</SelectItem>
                            <SelectItem value="240" className="text-white hover:bg-slate-700">4 hours</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-white/80">Completed</Label>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            checked={formData.completed}
                            onCheckedChange={(checked) => updateField('completed', checked)}
                            className="data-[state=checked]:bg-[#FF7000] data-[state=checked]:border-[#FF7000]"
                        />
                        <span className="text-sm text-white/80">
                            {formData.completed ? 'Task completed' : 'Task pending'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
                    className="flex-1 bg-[#FF7000] hover:bg-[#FF7000]/90 text-white"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} className="mr-2" />
                            {task ? 'Update Task' : 'Create Task'}
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default TaskForm;
