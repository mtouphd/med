'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Copy, Sun, Moon, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface DayAvailability {
  date: string;
  morning: { start: string; end: string; enabled: boolean };
  afternoon: { start: string; end: string; enabled: boolean };
}

interface DayConfigPanelProps {
  selectedDate: string | null;
  availability: DayAvailability | null;
  baseSchedule: Record<string, { start: string; end: string; enabled: boolean }>;
  onSave: (availability: DayAvailability) => void;
  onApplyToWeek: (availability: DayAvailability) => void;
  onSetDayOff: (date: string) => void;
  onSetMorningOff: (date: string) => void;
  onSetAfternoonOff: (date: string) => void;
}

export default function DayConfigPanel({
  selectedDate,
  availability,
  baseSchedule,
  onSave,
  onApplyToWeek,
  onSetDayOff,
  onSetMorningOff,
  onSetAfternoonOff,
}: DayConfigPanelProps) {
  const { t, locale } = useLanguage();

  const getDefaultAvailability = (): DayAvailability => {
    if (!selectedDate) {
      return {
        date: '',
        morning: { start: '08:00', end: '12:00', enabled: true },
        afternoon: { start: '14:00', end: '18:00', enabled: true },
      };
    }

    const date = new Date(selectedDate);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[date.getDay()];
    const baseDay = baseSchedule[dayOfWeek];

    if (baseDay?.enabled) {
      // Split base schedule into morning/afternoon
      const startHour = parseInt(baseDay.start.split(':')[0]);
      const endHour = parseInt(baseDay.end.split(':')[0]);

      return {
        date: selectedDate,
        morning: {
          start: baseDay.start,
          end: startHour < 12 && endHour >= 12 ? '12:00' : baseDay.end,
          enabled: startHour < 12,
        },
        afternoon: {
          start: endHour > 12 ? '14:00' : baseDay.start,
          end: baseDay.end,
          enabled: endHour > 12,
        },
      };
    }

    return {
      date: selectedDate,
      morning: { start: '08:00', end: '12:00', enabled: false },
      afternoon: { start: '14:00', end: '18:00', enabled: false },
    };
  };

  const [localAvailability, setLocalAvailability] = useState<DayAvailability>(
    availability || getDefaultAvailability()
  );

  useEffect(() => {
    if (selectedDate) {
      setLocalAvailability(availability || getDefaultAvailability());
    }
  }, [selectedDate, availability]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleTimeChange = (
    period: 'morning' | 'afternoon',
    field: 'start' | 'end',
    value: string
  ) => {
    setLocalAvailability(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [field]: value,
      },
    }));
  };

  const handleToggle = (period: 'morning' | 'afternoon') => {
    setLocalAvailability(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        enabled: !prev[period].enabled,
      },
    }));
  };

  const handleSave = () => {
    onSave(localAvailability);
  };

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full flex flex-col items-center justify-center text-center">
        <Calendar className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-midnight-600 font-medium">{t('availability.selectDatePrompt')}</p>
        <p className="text-midnight-400 text-sm mt-1">{t('availability.selectDateHint')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      {/* Header with date */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-midnight-900 mb-1">
          {formatDate(selectedDate)}
        </h3>
        <p className="text-sm text-midnight-500">{t('availability.configureSlots')}</p>
      </div>

      {/* Morning slot */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-midnight-800">{t('availability.morning')}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localAvailability.morning.enabled}
              onChange={() => handleToggle('morning')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {localAvailability.morning.enabled && (
          <div className="flex items-center gap-3 pl-7">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-midnight-400" />
              <input
                type="time"
                value={localAvailability.morning.start}
                onChange={(e) => handleTimeChange('morning', 'start', e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <span className="text-midnight-400">-</span>
              <input
                type="time"
                value={localAvailability.morning.end}
                onChange={(e) => handleTimeChange('morning', 'end', e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Afternoon slot */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            <span className="font-medium text-midnight-800">{t('availability.afternoon')}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localAvailability.afternoon.enabled}
              onChange={() => handleToggle('afternoon')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {localAvailability.afternoon.enabled && (
          <div className="flex items-center gap-3 pl-7">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-midnight-400" />
              <input
                type="time"
                value={localAvailability.afternoon.start}
                onChange={(e) => handleTimeChange('afternoon', 'start', e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <span className="text-midnight-400">-</span>
              <input
                type="time"
                value={localAvailability.afternoon.end}
                onChange={(e) => handleTimeChange('afternoon', 'end', e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full btn-primary mb-6"
      >
        {t('availability.saveDay')}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-midnight-400">{t('availability.quickActions')}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <button
          onClick={() => onApplyToWeek(localAvailability)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
        >
          <Copy className="w-5 h-5 text-primary-500" />
          <div>
            <span className="block text-sm font-medium text-midnight-800">
              {t('availability.applyToWeek')}
            </span>
            <span className="block text-xs text-midnight-500">
              {t('availability.applyToWeekDesc')}
            </span>
          </div>
        </button>

        <button
          onClick={() => onSetDayOff(selectedDate)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-red-50 transition-colors text-left group"
        >
          <XCircle className="w-5 h-5 text-red-500" />
          <div>
            <span className="block text-sm font-medium text-midnight-800 group-hover:text-red-700">
              {t('availability.setDayOff')}
            </span>
            <span className="block text-xs text-midnight-500">
              {t('availability.setDayOffDesc')}
            </span>
          </div>
        </button>

        <button
          onClick={() => onSetMorningOff(selectedDate)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-amber-50 transition-colors text-left group"
        >
          <Sun className="w-5 h-5 text-amber-500 opacity-50" />
          <div>
            <span className="block text-sm font-medium text-midnight-800 group-hover:text-amber-700">
              {t('availability.setMorningOff')}
            </span>
            <span className="block text-xs text-midnight-500">
              {t('availability.setMorningOffDesc')}
            </span>
          </div>
        </button>

        <button
          onClick={() => onSetAfternoonOff(selectedDate)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-indigo-50 transition-colors text-left group"
        >
          <Moon className="w-5 h-5 text-indigo-500 opacity-50" />
          <div>
            <span className="block text-sm font-medium text-midnight-800 group-hover:text-indigo-700">
              {t('availability.setAfternoonOff')}
            </span>
            <span className="block text-xs text-midnight-500">
              {t('availability.setAfternoonOffDesc')}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
