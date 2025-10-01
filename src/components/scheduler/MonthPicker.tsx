import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedDate,
  onDateSelect,
  isOpen,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Get number of days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get number of days in previous month
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateSelect(newDate);
    onClose();
  };

  const isSelectedDate = (day: number): boolean => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  // Generate calendar days
  const calendarDays: Array<{ day: number; isCurrentMonth: boolean }> = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
    });
  }

  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
    });
  }

  return (
    <>
      {/* Backdrop - Relative to card */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg"
        onClick={onClose}
      >
        {/* Calendar Container - Compact */}
        <div
          className="relative w-[280px] bg-gradient-to-br from-slate-800/98 to-slate-900/98 rounded-lg border border-slate-700/60 shadow-2xl p-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} className="text-white/70" />
            </button>

            <div className="text-center">
              <h3 className="text-sm font-semibold text-white">
                {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>

            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={16} className="text-white/70" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-white/50 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, index) => {
              const isSelected = item.isCurrentMonth && isSelectedDate(item.day);
              const isTodayDate = item.isCurrentMonth && isToday(item.day);

              return (
                <button
                  key={index}
                  onClick={() => item.isCurrentMonth && handleDateClick(item.day)}
                  disabled={!item.isCurrentMonth}
                  className={`
                    aspect-square rounded-md text-xs font-medium transition-all
                    ${item.isCurrentMonth
                      ? 'text-white hover:bg-white/10 cursor-pointer'
                      : 'text-white/20 cursor-default'
                    }
                    ${isSelected
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                      : isTodayDate
                      ? 'bg-white/10 ring-1 ring-orange-400/50'
                      : 'bg-white/5'
                    }
                  `}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
