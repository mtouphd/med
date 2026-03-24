'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { DayInfo, formatMonthYear } from './calendar-helpers';

interface CalendarGridProps {
  currentMonth: Date;
  days: DayInfo[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarGrid({
  currentMonth,
  days,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const { t, locale } = useLanguage();

  const dayNames = [
    t('availability.days.sunday'),
    t('availability.days.monday'),
    t('availability.days.tuesday'),
    t('availability.days.wednesday'),
    t('availability.days.thursday'),
    t('availability.days.friday'),
    t('availability.days.saturday'),
  ];

  const getLocaleCode = () => {
    switch (locale) {
      case 'ar':
        return 'ar-SA';
      case 'fr':
        return 'fr-FR';
      default:
        return 'en-US';
    }
  };

  const isSelected = (day: DayInfo) => {
    if (!selectedDate) return false;
    return (
      day.date.getDate() === selectedDate.getDate() &&
      day.date.getMonth() === selectedDate.getMonth() &&
      day.date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getDayClasses = (day: DayInfo) => {
    const baseClasses = 'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200';

    if (!day.isCurrentMonth) {
      return `${baseClasses} text-slate-300 cursor-default`;
    }

    if (day.isPast) {
      return `${baseClasses} bg-slate-50 text-slate-400 cursor-not-allowed`;
    }

    if (isSelected(day)) {
      return `${baseClasses} bg-primary-600 text-white ring-2 ring-primary-300 shadow-lg cursor-pointer`;
    }

    if (day.isToday) {
      if (day.isAvailable) {
        return `${baseClasses} bg-green-50 border-2 border-green-400 text-green-700 ring-2 ring-primary-400 cursor-pointer hover:bg-green-100`;
      }
      return `${baseClasses} bg-slate-50 text-slate-500 ring-2 ring-primary-400 cursor-not-allowed`;
    }

    if (day.isAvailable) {
      return `${baseClasses} bg-green-50 border border-green-200 text-green-700 cursor-pointer hover:bg-green-100 hover:border-green-300 hover:shadow-md`;
    }

    return `${baseClasses} bg-slate-50 text-slate-400 cursor-not-allowed`;
  };

  const handleDayClick = (day: DayInfo) => {
    if (day.isCurrentMonth && day.isAvailable && !day.isPast) {
      onDateSelect(day.date);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
          aria-label={t('common.previous')}
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg sm:text-xl font-semibold text-midnight-900 capitalize">
          {formatMonthYear(currentMonth, getLocaleCode())}
        </h3>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
          aria-label={t('common.next')}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center text-xs sm:text-sm font-medium text-slate-500 py-2"
          >
            {name.substring(0, 3)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index} className="flex items-center justify-center p-1">
            <button
              onClick={() => handleDayClick(day)}
              disabled={!day.isCurrentMonth || day.isPast || !day.isAvailable}
              className={getDayClasses(day)}
            >
              {day.dayNumber}
            </button>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-50 border border-green-200"></div>
          <span>{t('doctors.available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-50 border border-slate-200"></div>
          <span>{t('doctors.unavailable')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary-600"></div>
          <span>{t('calendar.selected')}</span>
        </div>
      </div>
    </div>
  );
}
