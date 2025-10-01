import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type SchedulerEvent, formatDuration } from '@/types/scheduler';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: SchedulerEvent) => void;
  onDelete?: (eventId: string) => void;
  event?: SchedulerEvent | null; // null for new event, populated for edit
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
}) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
  const [startTime, setStartTime] = useState('08:00');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDuration(event.duration.toString());
      setStartTime(event.startTime);
    } else {
      // Reset for new event
      setTitle('');
      setDuration('30');
      setStartTime('08:00');
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newEvent: SchedulerEvent = {
      id: event?.id || `event-${Date.now()}`,
      title: title || 'Untitled Event',
      startTime,
      duration: parseInt(duration, 10),
      description: event?.description,
      category: event?.category,
    };
    onSave(newEvent);
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const durationOptions = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
  ];

  return (
    <>
      {/* Backdrop - Relative to card */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg"
        onClick={onClose}
      >
        {/* Modal - Compact */}
        <div
          className="relative w-[90%] max-w-[320px] bg-gradient-to-br from-slate-900/98 to-slate-800/98 rounded-lg border border-slate-700/60 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/40">
            <h2 className="text-sm font-semibold text-white">
              {event ? 'Edit Event' : 'Add New Event'}
            </h2>
            <button
              onClick={onClose}
              className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X size={12} className="text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3 space-y-3">
            {/* Event Title */}
            <div>
              <label className="block text-[10px] font-medium text-white/70 mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                className="w-full px-2.5 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-md text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-colors"
                autoFocus
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[10px] font-medium text-white/70 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-md text-xs text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-colors cursor-pointer"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-[10px] font-medium text-white/70 mb-1">
                Time Slot
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-md text-xs text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-colors"
                min="08:00"
                max="17:00"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-700/40">
            {event && onDelete ? (
              <button
                onClick={handleDelete}
                className="px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-2.5 py-1.5 text-[11px] font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-2.5 py-1.5 text-[11px] font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors shadow-lg shadow-orange-500/20"
              >
                {event ? 'Save' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
