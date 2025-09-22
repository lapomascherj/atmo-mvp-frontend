import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, Palette, Target, Calendar, Tag } from 'lucide-react';
import { Input } from '@/components/atoms/Input.tsx';
import { Label } from '@/components/atoms/Label.tsx';
import { TextArea } from '@/components/atoms/TextArea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select.tsx';
import { Button } from "@/components/atoms/Button.tsx";
import { useToast } from "@/hooks/useToast.ts";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import { Project } from "@/models/Project.ts";
import { Status } from "@/models/Status.ts";
import { useAuth } from "@/hooks/useMockAuth";
import { useProjectsStore } from "@/stores/useProjectsStore.ts";
import { z } from "zod";

const ProjectFormSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    status: z.nativeEnum(Status).optional(),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    active: z.boolean().default(true),
    color: z.string().optional(),
    startDate: z.string().optional(),
    targetDate: z.string().optional(),
    progress: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional().default([]),
    notes: z.string().optional(),
});

// Interface for project data that gets sent to PocketBase (without relations)
interface ProjectCreateData {
    name: string;
    description?: string;
    status?: Status;
    priority?: 'high' | 'medium' | 'low';
    active?: boolean;
    color?: string;
    startDate?: string;
    targetDate?: string;
    progress?: number;
    tags?: string[];
    notes?: string;
}

type ProjectFormData = z.infer<typeof ProjectFormSchema>;

interface ProjectFormProps {
    project?: Project;
    onSubmit?: () => void;
    onCancel?: () => void;
    onSave?: (project: Omit<Project, 'id'>) => void;
    // Add callback props for backward compatibility
    submitCallback?: () => void;
    cancelCallback?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  onSave,
  submitCallback,
  cancelCallback
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const pb = usePocketBase();
  const { createProject, updateProject, loading } = useProjectsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProjectFormData>({
        resolver: zodResolver(ProjectFormSchema),
        defaultValues: {
            name: project?.name || '',
            description: project?.description || '',
            status: project?.status,
            priority: (project?.priority as 'high' | 'medium' | 'low') || 'medium',
            active: project?.active !== undefined ? project.active : true,
            color: project?.color || '#FF7000',
            startDate: project?.startDate ? project.startDate.split('T')[0] : '',
            targetDate: project?.targetDate ? project.targetDate.split('T')[0] : '',
            progress: project?.progress || 0,
            tags: project?.tags || [],
            notes: project?.notes || '',
        }
    });

    const handleFormSubmit = async (data: ProjectFormData) => {
        if (!pb || !user) {
            toast({
                title: 'Authentication required',
                description: 'Please log in to save projects',
                variant: 'destructive',
            });
            return;
        }

        console.log("🚀 PROJECT FORM: Starting project creation/update", {
            isUpdate: !!project?.id,
            projectName: data.name,
            userId: user.id,
            userIam: user.iam,
            pbAuthValid: pb.authStore.isValid,
            pbToken: pb.authStore.token ? "present" : "missing",
            pbModel: pb.authStore.model ? "present" : "missing"
        });

        setIsSubmitting(true);

        try {
            const projectData: ProjectCreateData = {
                name: data.name,
                description: data.description,
                status: data.status,
                priority: data.priority,
                active: data.active !== undefined ? data.active : true,
                color: data.color,
                startDate: data.startDate,
                targetDate: data.targetDate,
                progress: data.progress,
                tags: data.tags || [],
                notes: data.notes,
                // Don't include goals, items, milestones - these are relations managed separately
            };

            console.log("📝 PROJECT FORM: Project data to be saved:", projectData);

            if (project?.id) {
                console.log("🔄 PROJECT FORM: Updating existing project:", project.id);
                await updateProject(project.id, projectData);
                toast({
                    title: 'Project updated',
                    description: `${data.name} has been updated successfully`,
                });
            } else {
                console.log("🆕 PROJECT FORM: Creating new project");
                await createProject(projectData);
                toast({
                    title: 'Project created',
                    description: `${data.name} has been created successfully`,
                });
            }

            onSave?.(projectData);
            
            // Handle both new and legacy callback props
            onSubmit?.();
            submitCallback?.();
        } catch (error) {
            console.error('❌ PROJECT FORM: Error saving project:', error);
            toast({
                title: 'Error saving project',
                description: 'There was an error saving your project. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Handle both new and legacy callback props
        onCancel?.();
        cancelCallback?.();
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm text-white/80">Project Name *</Label>
                <Input
                    placeholder="Enter project name"
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
                    placeholder="Describe your project goals and objectives"
                    {...register('description')}
                    className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-white/80">Priority Level</Label>
                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="bg-slate-800/30 border-slate-700/30 text-white">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="high" className="text-white hover:bg-slate-700">High Priority</SelectItem>
                                    <SelectItem value="medium" className="text-white hover:bg-slate-700">Medium Priority</SelectItem>
                                    <SelectItem value="low" className="text-white hover:bg-slate-700">Low Priority</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.priority && (
                        <p className="text-red-400 text-xs">{errors.priority.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm text-white/80 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Start Date
                    </Label>
                    <Input
                        type="date"
                        {...register('startDate')}
                        className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-white/80 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Target Date
                    </Label>
                    <Input
                        type="date"
                        {...register('targetDate')}
                        className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm text-white/80">Progress (%)</Label>
                <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    {...register('progress', { valueAsNumber: true })}
                    className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                />
                {errors.progress && (
                    <p className="text-red-400 text-xs">{errors.progress.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-sm text-white/80 flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Tags (comma-separated)
                </Label>
                <Input
                    placeholder="planning, urgent, research"
                    onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                        setValue('tags', tags);
                    }}
                    defaultValue={project?.tags?.join(', ') || ''}
                    className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-sm text-white/80">Notes</Label>
                <TextArea
                    placeholder="Additional notes and observations about this project"
                    {...register('notes')}
                    className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    rows={3}
                />
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
                    disabled={isSubmitting || loading}
                    className="bg-[#FF7000] hover:bg-[#FF7000]/90 disabled:opacity-50"
                >
                    {isSubmitting || loading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin"/>
                    ) : (
                        <Save className="w-4 h-4 mr-1"/>
                    )}
                    {isSubmitting || loading
                        ? 'Saving...'
                        : (project ? 'Update Project' : 'Create Project')
                    }
                </Button>
            </div>
        </form>
    );
};

export default ProjectForm;
