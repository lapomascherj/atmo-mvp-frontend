import React, {useEffect, useState} from 'react';
import {format, set} from 'date-fns';
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {DialogFooter} from '@/components/atoms/Dialog.tsx';
import {Button} from '@/components/atoms/Button.tsx';
import {Input} from '@/components/atoms/Input.tsx';
import {Label} from '@/components/atoms/Label.tsx';
import {TextArea} from '@/components/atoms/TextArea.tsx';
import {Switch} from '@/components/atoms/Switch.tsx';
import {Calendar as CalendarPicker} from '@/components/atoms/Calendar.tsx';
import {PopOver, PopoverContent, PopoverTrigger} from '@/components/atoms/PopOver.tsx';
import {Calendar, CheckSquare, MapPin, Pencil, Trash2, Users, X} from 'lucide-react';
import {CalendarEvent, CalendarEventSchema} from "@/models/CalendarEvent.ts";
import {useEventsStore} from "@/stores/useEventsStore.ts";
import {z} from "zod";

// Create a form schema that matches what we need for the form
const EventFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    isAllDay: z.boolean().default(false),
    location: z.string().optional(),
    attendees: z.array(z.string()).optional(),
});

type EventFormData = z.infer<typeof EventFormSchema>;

interface EventFormDialogProps {
    event?: CalendarEvent;
    cancelCallback?: () => void;
    submitCallback?: () => void;
    onSave?: (event: Omit<CalendarEvent, 'id'>) => void;
    onClose?: () => void;
    onDelete?: () => void;
    onConvertToTask?: () => void;
}

const EventForm: React.FC<EventFormDialogProps> = ({
    event,
    cancelCallback,
    submitCallback,
    onSave,
    onClose,
    onDelete,
    onConvertToTask
}) => {
    // State for UI interactions
    const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
    const [attendeeInput, setAttendeeInput] = useState('');
    const [attendees, setAttendees] = useState<string[]>(event?.attendees || []);

    // Initialize form with default values
    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: {
            title: event?.title || '',
            description: event?.description || '',
            startDate: event?.startDate || new Date(),
            endDate: event?.endDate || new Date(),
            startTime: event?.startTime ? format(event.startTime, 'HH:mm') : '09:00',
            endTime: event?.endTime ? format(event.endTime, 'HH:mm') : '10:00',
            isAllDay: event?.isAllDay || false,
            location: event?.location || '',
            attendees: event?.attendees || [],
        }
    });

    // Watch form values
    const watchedValues = watch();
    const isAllDay = watch('isAllDay');

    // Update attendees in form when local state changes
    useEffect(() => {
        setValue('attendees', attendees);
    }, [attendees, setValue]);

    // Handle attendee management
    const addAttendee = () => {
        if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
            const newAttendees = [...attendees, attendeeInput.trim()];
            setAttendees(newAttendees);
            setAttendeeInput('');
        }
    };

    const removeAttendeeLocal = (email: string) => {
        const newAttendees = attendees.filter(attendee => attendee !== email);
        setAttendees(newAttendees);
    };

    // Handle form submission
    const onSubmit = (data: EventFormData) => {
        let start: Date;
        let end: Date;

        if (data.isAllDay) {
            // For all-day events, use the date only
            start = data.startDate;
            end = data.endDate;
        } else {
            // For timed events, combine date and time
            const [startHours, startMinutes] = (data.startTime || '09:00').split(':').map(Number);
            const [endHours, endMinutes] = (data.endTime || '10:00').split(':').map(Number);

            start = set(data.startDate, {hours: startHours, minutes: startMinutes});
            end = set(data.endDate, {hours: endHours, minutes: endMinutes});
        }

        const newEvent: Omit<CalendarEvent, 'id'> = {
            title: data.title,
            description: data.description || '',
            startDate: start,
            startTime: start,
            endDate: end,
            endTime: end,
            isAllDay: data.isAllDay,
            location: data.location || '',
            attendees: attendees.length > 0 ? attendees : undefined,
        };

        onSave?.(newEvent);
        submitCallback?.();
    };

    const handleCancel = () => {
        cancelCallback?.();
        onClose?.();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title" className="text-sm text-white/80">Event Title</Label>
                <Input
                    id="event-title"
                    className="bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-500 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                    {...register('title')}
                />
                {errors.title && (
                    <p className="text-red-400 text-xs">{errors.title.message}</p>
                )}
            </div>

            {/* All Day Switch */}
            <div className="flex items-center justify-between py-2">
                <Label htmlFor="allDay" className="text-sm text-white/80">All Day Event</Label>
                <Controller
                    name="isAllDay"
                    control={control}
                    render={({ field }) => (
                        <Switch
                            id="event-all-day"
                            className="data-[state=checked]:bg-[#FF7000]"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                    <Label className="text-white/90 font-medium">Start</Label>
                    <div className="flex flex-col space-y-2">
                        <Controller
                            name="startDate"
                            control={control}
                            render={({ field }) => (
                                <PopOver open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left font-normal bg-slate-200 border border-slate-300/50 text-slate-800 hover:bg-slate-100 w-full"
                                        >
                                            <Calendar className="mr-2 h-4 w-4 text-[#FF5F1F]"/>
                                            {format(field.value, 'MMM d, yyyy')}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-slate-100 border border-slate-300/50 shadow-xl">
                                        <CalendarPicker
                                            id="event-start-date"
                                            className="rounded-md border-0"
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    field.onChange(date);
                                                    setIsStartDatePickerOpen(false);
                                                }
                                            }}
                                        />
                                    </PopoverContent>
                                </PopOver>
                            )}
                        />

                        {!isAllDay && (
                            <Input
                                id="event-start-time"
                                type="time"
                                {...register('startTime')}
                                className="bg-slate-200 border border-slate-300/50 text-slate-800 focus:border-[#FF5F1F] focus:ring-[#FF5F1F]/20"
                            />
                        )}
                    </div>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                    <Label className="text-white/90 font-medium">End</Label>
                    <div className="flex flex-col space-y-2">
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => (
                                <PopOver open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="justify-start text-left font-normal bg-slate-200 border border-slate-300/50 text-slate-800 hover:bg-slate-100 w-full"
                                        >
                                            <Calendar className="mr-2 h-4 w-4 text-[#FF5F1F]"/>
                                            {format(field.value, 'MMM d, yyyy')}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-slate-100 border border-slate-300/50 shadow-xl">
                                        <CalendarPicker
                                            id="event-end-date"
                                            className="rounded-md border-0"
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    field.onChange(date);
                                                    setIsEndDatePickerOpen(false);
                                                }
                                            }}
                                        />
                                    </PopoverContent>
                                </PopOver>
                            )}
                        />

                        {!isAllDay && (
                            <Input
                                id="event-end-time"
                                type="time"
                                {...register('endTime')}
                                className="bg-slate-200 border border-slate-300/50 text-slate-800 focus:border-[#FF5F1F] focus:ring-[#FF5F1F]/20"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label htmlFor="location" className="text-white/90 font-medium">Location</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-600"/>
                    <Input
                        id="event-location"
                        className="pl-10 bg-slate-200 border border-slate-300/50 text-slate-800 placeholder:text-slate-500 focus:border-[#FF5F1F] focus:ring-[#FF5F1F]/20"
                        {...register('location')}
                    />
                </div>
            </div>

            {/* Attendees */}
            <div className="space-y-2">
                <Label htmlFor="attendees" className="text-white/90 font-medium">Attendees</Label>
                <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-600"/>
                    <Input
                        id="event-attendees"
                        value={attendeeInput}
                        onChange={(e) => setAttendeeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                        className="pl-10 pr-16 bg-slate-200 border border-slate-300/50 text-slate-800 placeholder:text-slate-500 focus:border-[#FF5F1F] focus:ring-[#FF5F1F]/20"
                        placeholder="Enter email address"
                    />
                    <Button
                        type="button"
                        onClick={addAttendee}
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 text-[#FF5F1F] hover:bg-[#FF5F1F]/10"
                    >
                        Add
                    </Button>
                </div>

                {attendees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {attendees.map((email) => (
                            <div
                                key={email}
                                className="bg-[#FF5F1F]/10 text-[#FF5F1F] px-2 py-1 rounded-md text-xs flex items-center border border-[#FF5F1F]/20"
                            >
                                {email}
                                <button
                                    type="button"
                                    onClick={() => removeAttendeeLocal(email)}
                                    className="ml-1 text-[#FF5F1F]/70 hover:text-[#FF5F1F]"
                                >
                                    <X size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="text-white/90 font-medium">Description</Label>
                <TextArea
                    id="event-description"
                    {...register('description')}
                    className="min-h-[100px] bg-slate-200 border border-slate-300/50 text-slate-800 placeholder:text-slate-500 focus:border-[#FF5F1F] focus:ring-[#FF5F1F]/20 resize-none"
                    placeholder="Add event description..."
                />
            </div>

            {/* Convert to Activity (visible only for existing events) */}
            {event && onConvertToTask && (
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onConvertToTask}
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                    >
                        <CheckSquare className="mr-2 h-4 w-4"/>
                        Convert to Task
                    </Button>
                </div>
            )}

            <DialogFooter className="gap-2 pt-4">
                {event && onDelete && (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onDelete}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    >
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Delete
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-[#FF5F1F] hover:bg-[#FF5F1F]/90 text-white"
                >
                    {event ? <><Pencil className="mr-2 h-4 w-4"/>Update</> : 'Save Event'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default EventForm;
