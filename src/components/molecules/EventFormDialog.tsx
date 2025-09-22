import React from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/atoms/Dialog.tsx';
import {CalendarEvent} from "@/models/CalendarEvent.ts";
import EventForm from "@/components/molecules/EventForm.tsx";

interface EventFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event?: CalendarEvent;
    onSave: (event: Omit<CalendarEvent, 'id'>) => void;
    onDelete?: () => void;
    onConvertToTask?: () => void;
}

const EventFormDialog: React.FC<EventFormDialogProps> = ({isOpen, onClose, event, onSave, onDelete, onConvertToTask}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 p-6 rounded-xl backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-white font-medium">
                        {event ? 'Edit Event' : 'Create New Event'}
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                        {event ? 'Update your calendar event details' : 'Add a new event to your calendar'}
                    </DialogDescription>
                </DialogHeader>
                <EventForm onSave={onSave} onClose={onClose} onDelete={onDelete} onConvertToTask={onConvertToTask} />
            </DialogContent>
        </Dialog>
    );
};

export default EventFormDialog;
