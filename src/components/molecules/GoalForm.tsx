import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, Target, Calendar } from 'lucide-react';
import { Input } from '@/components/atoms/Input.tsx';
import { Label } from '@/components/atoms/Label.tsx';
import { TextArea } from '@/components/atoms/TextArea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select.tsx';
import { Button } from "@/components/atoms/Button.tsx";
import { Goal, GoalSchema } from "@/models/Goal";
import { Priority } from "@/models/Priority";
import { Status } from "@/models/Status";
import { z } from "zod";

const GoalFormSchema = z.object({
    name: z.string().min(1, "Goal name is required"),
    description: z.string().optional(),
    targetDate: z.string().min(1, "Target date is required"),
    priority: z.nativeEnum(Priority),
    status: z.nativeEnum(Status),
    completedDate: z.string().optional(),
    order: z.number().optional(),
    milestone_id: z.string().optional(),
});

type GoalFormInputs = z.infer<typeof GoalFormSchema>;

interface GoalFormProps {
    goal?: Goal;
    projectId: string;
    milestones?: any[]; // Array of milestones for the project
    onSubmit: (data: GoalFormInputs) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const GoalForm: React.FC<GoalFormProps> = ({
  goal,
  projectId,
  milestones = [], // Default to empty array
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with default values
    const {
        control,
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<GoalFormInputs>({
        resolver: zodResolver(GoalFormSchema),
        defaultValues: {
            name: goal?.name || '',
            description: goal?.description || '',
            priority: goal?.priority || Priority.Medium,
            status: goal?.status || Status.Planned,
            targetDate: goal?.targetDate ? goal.targetDate.split('T')[0] : '',
            completedDate: goal?.completedDate ? goal.completedDate.split('T')[0] : '',
            order: goal?.order || 1,
            milestone_id: '',
            project_id: (goal as any)?.project_id || projectId || ''
        }
    });

    // Watch priority and status for preview
    const watchedPriority = watch('priority');
    const watchedStatus = watch('status');

    const handleFormSubmit = async (data: GoalFormInputs) => {
        setIsSubmitting(true);
        
        try {
            await onSubmit(data);
        } catch (error) {
            console.error('Failed to save goal:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            {/* Goal Title */}
            <div className="space-y-2">
                <Label htmlFor="goal-title" className="text-sm text-white/80">Goal Title</Label>
                <Input
                    id="goal-title"
                    placeholder="What do you want to achieve?"
                    {...register('name')}
                    className="bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-500 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                />
                {errors.name && (
                    <p className="text-red-400 text-xs">{errors.name.message}</p>
                )}
            </div>

            {/* Priority and Status Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="goal-priority" className="text-sm text-white/80">Priority</Label>
                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => field.onChange(value as Priority)}>
                                <SelectTrigger className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value={Priority.Low} className="text-white hover:bg-slate-700">
                                        Low Priority
                                    </SelectItem>
                                    <SelectItem value={Priority.Medium} className="text-white hover:bg-slate-700">
                                        Medium Priority
                                    </SelectItem>
                                    <SelectItem value={Priority.High} className="text-white hover:bg-slate-700">
                                        High Priority
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.priority && (
                        <p className="text-red-400 text-xs">{errors.priority.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="goal-status" className="text-sm text-white/80">Status</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => field.onChange(value as Status)}>
                                <SelectTrigger className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value={Status.Planned} className="text-white hover:bg-slate-700">
                                        Planned
                                    </SelectItem>
                                    <SelectItem value={Status.InProgress} className="text-white hover:bg-slate-700">
                                        In Progress
                                    </SelectItem>
                                    <SelectItem value={Status.Completed} className="text-white hover:bg-slate-700">
                                        Completed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.status && (
                        <p className="text-red-400 text-xs">{errors.status.message}</p>
                    )}
                </div>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
                <Label htmlFor="goal-date" className="text-sm text-white/80 flex items-center gap-1">
                    <Calendar size={12}/>
                    Target Date
                </Label>
                <Input
                    id="goal-date"
                    type="date"
                    {...register('targetDate')}
                    className="bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-500 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                />
                {errors.targetDate && (
                    <p className="text-red-400 text-xs">{errors.targetDate.message}</p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="goal-description" className="text-sm text-white/80">
                    Description (Optional)
                </Label>
                <TextArea
                    id="goal-description"
                    placeholder="Describe your goal in detail..."
                    {...register('description')}
                    className="bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-500 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20 resize-none"
                    rows={3}
                />
            </div>

            {/* Completed Date (only show if status is Completed) */}
            {watch('status') === Status.Completed && (
                <div className="space-y-2">
                    <Label htmlFor="goal-completed-date" className="text-sm text-white/80 flex items-center gap-1">
                        <Calendar size={12}/>
                        Completed Date
                    </Label>
                    <Input
                        id="goal-completed-date"
                        type="date"
                        {...register('completedDate')}
                        className="bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-500 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    />
                </div>
            )}

            {/* Order */}
            <div className="space-y-2">
                <Label htmlFor="goal-order" className="text-sm text-white/80">
                    Priority Order
                </Label>
                <Input
                    id="goal-order"
                    type="number"
                    min="1"
                    placeholder="1"
                    {...register('order', { valueAsNumber: true })}
                    className="bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-500 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                />
                {errors.order && (
                    <p className="text-red-400 text-xs">{errors.order.message}</p>
                )}
            </div>

            {/* Milestone Selection */}
            <div className="space-y-2">
                <Label className="text-white/70 text-sm font-medium">Milestone (Optional)</Label>
                <Controller
                    name="milestone_id"
                    control={control}
                    render={({ field }) => (
                        <Select value={field.value || undefined} onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}>
                            <SelectTrigger className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20">
                                <SelectValue placeholder="Select a milestone" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="none" className="text-white hover:bg-slate-700">No milestone</SelectItem>
                                {milestones.map((milestone) => (
                                    <SelectItem key={milestone.id} value={milestone.id} className="text-white hover:bg-slate-700">
                                        {milestone.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            {/* Preview */}
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-white/60">Priority:</span>
                    <span className={`px-2 py-1 rounded-md border ${
                        watchedPriority === Priority.High ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        watchedPriority === Priority.Medium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                        {watchedPriority} Priority
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white/60">Status:</span>
                    <span className={`px-2 py-1 rounded-md border ${
                        watchedStatus === Status.Completed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        watchedStatus === Status.InProgress ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :

                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }`}>
                        {watchedStatus}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-500/70"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-[#FF7000] hover:bg-[#FF7000]/90 text-white font-medium px-6"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Target size={14} className="mr-2" />
                    )}
                    {goal ? 'Update Goal' : 'Add Goal'}
                </Button>
            </div>
        </form>
    );
};

export default GoalForm;
