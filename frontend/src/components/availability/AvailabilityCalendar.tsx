'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface DayAvailability {
  date: string; // YYYY-MM-DD
  morning: { start: string; end: string; enabled: boolean };
  afternoon: { start: string; end: string; enabled: boolean };
}

interface AvailabilityCalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  availabilities: Record<string, DayAvailability>;
  baseSchedule: Record<string, { start: string; end: string; enabled: boolean }>;
}

const MONTHS_TO_SHOW = 6;

export default function AvailabilityCalendar({
  selectedDate,
  onSelectDate,
  availabilities,
  baseSchedule,
}: AvailabilityCalendarProps) {
  const { t, locale } = useLanguage();
  const [startMonth, setStartMonth] = useState(0);

  const months = useMemo(() => {
    const result = [];
    const today = new Date();

    for (let i = 0; i < MONTHS_TO_SHOW; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      result.push(date);
    }
    return result;
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const getAvailabilityStatus = (date: Date) => {
    const dateKey = formatDateKey(date);
    const dayOfWeek = getDayOfWeek(date);

    // Check if there's a specific availability set for this date
    if (availabilities[dateKey]) {
      const dayAvail = availabilities[dateKey];
      if (dayAvail.morning.enabled && dayAvail.afternoon.enabled) {
        return 'full';
      } else if (dayAvail.morning.enabled || dayAvail.afternoon.enabled) {
        return 'partial';
      }
      return 'off';
    }

    // Fall back to base schedule
    if (baseSchedule[dayOfWeek]?.enabled) {
      return 'default';
    }

    return 'off';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (date: Date) => {
    return selectedDate === formatDateKey(date);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale, {
      month: 'long',
      year: 'numeric'
    });
  };

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const weekDaysAr = ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'];
  const weekDaysEn = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getWeekDays = () => {
    if (locale === 'ar') return weekDaysAr;
    if (locale === 'en') return weekDaysEn;
    return weekDays;
  };

  const visibleMonths = months.slice(startMonth, startMonth + 2);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setStartMonth(Math.max(0, startMonth - 1))}
          disabled={startMonth === 0}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-midnight-600">
          {getMonthName(months[startMonth])} - {getMonthName(months[Math.min(startMonth + 1, MONTHS_TO_SHOW - 1)])}
        </span>
        <button
          onClick={() => setStartMonth(Math.min(MONTHS_TO_SHOW - 2, startMonth + 1))}
          disabled={startMonth >= MONTHS_TO_SHOW - 2}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
          <span className="text-midnight-600">{t('availability.legend.full')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <span className="text-midnight-600">{t('availability.legend.partial')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-200"></div>
          <span className="text-midnight-600">{t('availability.legend.off')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-primary-300 bg-primary-50"></div>
          <span className="text-midnight-600">{t('availability.legend.default')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleMonths.map((monthDate, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-semibold text-midnight-800 mb-2 text-center">
              {getMonthName(monthDate)}
            </h3>

            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {getWeekDays().map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium text-midnight-400 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(monthDate).map((day, i) => {
                if (!day) {
                  return <div key={i} className="aspect-square" />;
                }

                const status = getAvailabilityStatus(day);
                const past = isPast(day);
                const today = isToday(day);
                const selected = isSelected(day);

                return (
                  <button
                    key={i}
                    onClick={() => !past && onSelectDate(formatDateKey(day))}
                    disabled={past}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition-all
                      flex items-center justify-center relative
                      ${past ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-primary-300'}
                      ${selected ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
                      ${today ? 'font-bold' : ''}
                      ${status === 'full' ? 'bg-primary-500 text-white' : ''}
                      ${status === 'partial' ? 'bg-amber-400 text-white' : ''}
                      ${status === 'off' ? 'bg-slate-100 text-midnight-400' : ''}
                      ${status === 'default' ? 'bg-primary-50 border-2 border-primary-200 text-primary-700' : ''}
                    `}
                  >
                    {day.getDate()}
                    {today && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
