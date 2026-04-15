'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { doctors } from '@/lib/api';
import { Doctor, DayAvailability, DaySlot } from '@/types';
import { CalendarDays, Save, Settings, RotateCcw } from 'lucide-react';
import { AvailabilityCalendar, DayConfigPanel } from '@/components/availability';

interface Schedule {
  [key: string]: DaySlot;
}

const defaultSchedule: Schedule = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '09:00', end: '17:00', enabled: true },
  sunday: { start: '09:00', end: '17:00', enabled: true },
};

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AvailabilityPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Base weekly schedule (defaults)
  const [baseSchedule, setBaseSchedule] = useState<Schedule>(defaultSchedule);
  // Specific day overrides (6 months)
  const [specificDays, setSpecificDays] = useState<Record<string, DayAvailability>>({});
  // Currently selected date
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [doctorId, setDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showBaseConfig, setShowBaseConfig] = useState(false);

  useEffect(() => {
    loadDoctorSchedule();
  }, []);

  const loadDoctorSchedule = async () => {
    try {
      const res = await doctors.getAll();
      const myDoctor = res.data.find((d: Doctor) => d.user.id === user?.id);
      if (myDoctor) {
        setDoctorId(myDoctor.id);
        if (myDoctor.schedule) {
          setBaseSchedule({ ...defaultSchedule, ...myDoctor.schedule });
        }
        // Load extended schedule if available
        try {
          const extRes = await doctors.getExtendedSchedule(myDoctor.id);
          if (extRes.data?.specificDays) {
            setSpecificDays(extRes.data.specificDays);
          }
        } catch {
          // Extended schedule might not exist yet, that's ok
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!doctorId) return;

    setSaving(true);
    setMessage('');
    try {
      // Save both base schedule and specific days
      await Promise.all([
        doctors.updateSchedule(doctorId, baseSchedule),
        doctors.updateExtendedSchedule(doctorId, { specificDays })
      ]);
      setMessage(t('availability.saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving schedule:', error);
      setMessage(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDay = useCallback((availability: DayAvailability) => {
    setSpecificDays(prev => ({
      ...prev,
      [availability.date]: availability,
    }));
    setMessage(t('availability.daySaved'));
    setTimeout(() => setMessage(''), 2000);
  }, [t]);

  const handleApplyToWeek = useCallback((availability: DayAvailability) => {
    const date = new Date(availability.date);
    const dayOfWeek = date.getDay();
    // Get Monday of the week
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));

    const newSpecificDays = { ...specificDays };

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      // Don't apply to past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (currentDate >= today) {
        newSpecificDays[dateKey] = {
          ...availability,
          date: dateKey,
        };
      }
    }

    setSpecificDays(newSpecificDays);
    setMessage(t('availability.weekApplied'));
    setTimeout(() => setMessage(''), 2000);
  }, [specificDays, t]);

  const handleSetDayOff = useCallback((date: string) => {
    setSpecificDays(prev => ({
      ...prev,
      [date]: {
        date,
        morning: { start: '08:00', end: '12:00', enabled: false },
        afternoon: { start: '14:00', end: '18:00', enabled: false },
      },
    }));
    setMessage(t('availability.dayOffSet'));
    setTimeout(() => setMessage(''), 2000);
  }, [t]);

  const handleSetMorningOff = useCallback((date: string) => {
    setSpecificDays(prev => {
      const existing = prev[date];
      return {
        ...prev,
        [date]: {
          date,
          morning: { start: '08:00', end: '12:00', enabled: false },
          afternoon: existing?.afternoon || { start: '14:00', end: '18:00', enabled: true },
        },
      };
    });
    setMessage(t('availability.morningOffSet'));
    setTimeout(() => setMessage(''), 2000);
  }, [t]);

  const handleSetAfternoonOff = useCallback((date: string) => {
    setSpecificDays(prev => {
      const existing = prev[date];
      return {
        ...prev,
        [date]: {
          date,
          morning: existing?.morning || { start: '08:00', end: '12:00', enabled: true },
          afternoon: { start: '14:00', end: '18:00', enabled: false },
        },
      };
    });
    setMessage(t('availability.afternoonOffSet'));
    setTimeout(() => setMessage(''), 2000);
  }, [t]);

  const updateBaseDay = (day: string, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    setBaseSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const getDayLabel = (day: string) => {
    return t(`availability.days.${day}`);
  };

  const handleResetSpecificDays = () => {
    if (window.confirm(t('availability.confirmReset'))) {
      setSpecificDays({});
      setMessage(t('availability.resetDone'));
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('nav.availability')}</h1>
          <p className="text-midnight-600">{t('availability.subtitle6months')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBaseConfig(!showBaseConfig)}
            className={`btn-secondary ${showBaseConfig ? 'bg-slate-200' : ''}`}
          >
            <Settings size={18} />
            {t('availability.defaultSchedule')}
          </button>
          <button
            onClick={handleResetSpecificDays}
            className="btn-secondary text-amber-600 hover:bg-amber-50"
          >
            <RotateCcw size={18} />
            {t('availability.reset')}
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? t('common.saving') : t('availability.saveAll')}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${
          message.includes('erreur') || message.includes('error')
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Default schedule panel (collapsible) */}
      {showBaseConfig && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-midnight-900">{t('availability.weeklySchedule')}</h2>
            </div>
            <p className="text-sm text-midnight-500 mt-1">{t('availability.defaultsDescription')}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {days.map((day) => (
              <div key={day} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={baseSchedule[day]?.enabled ?? false}
                      onChange={(e) => updateBaseDay(day, 'enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className={`font-medium ${baseSchedule[day]?.enabled ? 'text-midnight-900' : 'text-midnight-400'}`}>
                      {getDayLabel(day)}
                    </span>
                  </label>

                  {baseSchedule[day]?.enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={baseSchedule[day]?.start ?? '09:00'}
                        onChange={(e) => updateBaseDay(day, 'start', e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                      <span className="text-midnight-400">-</span>
                      <input
                        type="time"
                        value={baseSchedule[day]?.end ?? '17:00'}
                        onChange={(e) => updateBaseDay(day, 'end', e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {!baseSchedule[day]?.enabled && (
                    <span className="text-sm text-midnight-400">{t('availability.closed')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content: Calendar + Config panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar (left, 2 cols) */}
        <div className="lg:col-span-2">
          <AvailabilityCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            availabilities={specificDays}
            baseSchedule={baseSchedule}
          />
        </div>

        {/* Config panel (right, 1 col) */}
        <div className="lg:col-span-1">
          <DayConfigPanel
            selectedDate={selectedDate}
            availability={selectedDate ? specificDays[selectedDate] : null}
            baseSchedule={baseSchedule}
            onSave={handleSaveDay}
            onApplyToWeek={handleApplyToWeek}
            onSetDayOff={handleSetDayOff}
            onSetMorningOff={handleSetMorningOff}
            onSetAfternoonOff={handleSetAfternoonOff}
          />
        </div>
      </div>
    </div>
  );
}
