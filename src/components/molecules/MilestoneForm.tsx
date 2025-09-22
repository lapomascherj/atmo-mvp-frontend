import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, Target, Calendar } from 'lucide-react';
import { Input } from '@/components/atoms/Input.tsx';
import { Label } from '@/components/atoms/Label.tsx';
import { TextArea } from '@/components/atoms/TextArea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select.tsx';
import { Button } from "@/components/atoms/Button.tsx";
import { Milestone, MilestoneFormData } from "@/models/Milestone";
import { z } from "zod";

const MilestoneFormSchema = z.object({
    name: z.string().min(1, "Milestone name is required"),
    description: z.string().optional(),
    due_date: z.string().optional(),
    status: z.string().default('active'),
});

type MilestoneFormInputs = z.infer<typeof MilestoneFormSchema>;

interface MilestoneFormProps {
    milestone?: Milestone;
    projectId: string;
    onSubmit: (data: MilestoneFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({
  projectId,
  milestone,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<MilestoneFormInputs>({
        resolver: zodResolver(MilestoneFormSchema),
        defaultValues: {
            name: milestone?.name || '',
            description: milestone?.description || '',
            due_date: milestone?.due_date ? milestone.due_date.split('T')[0] : '',
            status: milestone?.status || 'active',
        }
    });

    const handleFormSubmit = async (data: MilestoneFormInputs) => {
        console.log("🚀 MILESTONE FORM: handleFormSubmit called with:", data);
        setIsSubmitting(true);
        
        try {
            const milestoneData: MilestoneFormData = {
                name: data.name,
                description: data.description || '',
                due_date: data.due_date || '',
                status: data.status,
            };
            
            console.log("📝 MILESTONE FORM: Prepared milestone data:", milestoneData);
            console.log("📞 MILESTONE FORM: Calling onSubmit with data");
            
            await onSubmit(milestoneData);
            
            console.log("✅ MILESTONE FORM: onSubmit completed successfully");
        } catch (error) {
            console.error('❌ MILESTONE FORM: Failed to save milestone:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm text-white/80">Milestone Name *</Label>
                <Input
                    placeholder="Enter milestone name"
                    {...register('name')}
                    className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                />
                {errors.name && (
                    <p className="text-red-400 text-xs">{errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-sm text-white/80">Description</Label>
                <TextArea
                    placeholder="Describe this milestone and its objectives"
                    {...register('description')}
                    className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm text-white/80">Due Date</Label>
                    <Input
                        type="date"
                        {...register('due_date')}
                        className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-white/80">Status</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="bg-slate-800/30 border-slate-700/30 text-white">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.status && (
                        <p className="text-red-400 text-xs">{errors.status.message}</p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="bg-slate-800/30 border-slate-700/30 text-white hover:bg-slate-700/30"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="bg-[#FF7000] hover:bg-[#FF7000]/90 disabled:opacity-50"
                >
                    {isSubmitting || isLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin"/>
                    ) : (
                        <Save className="w-4 h-4 mr-1"/>
                    )}
                    {isSubmitting || isLoading
                        ? 'Saving...'
                        : (milestone ? 'Update Milestone' : 'Create Milestone')
                    }
                </Button>
            </div>
        </form>
    );
};

export default MilestoneForm; 
