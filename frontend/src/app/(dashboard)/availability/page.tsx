'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { doctors } from '@/lib/api';
import { Doctor } from '@/types';
import { CalendarDays, Clock, Save } from 'lucide-react';

interface Schedule {
  [key: string]: { start: string; end: string; enabled: boolean };
}

const defaultSchedule: Schedule = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '09:00', end: '12:00', enabled: false },
  sunday: { start: '09:00', end: '12:00', enabled: false },
};

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AvailabilityPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [doctorId, setDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
          setSchedule({ ...defaultSchedule, ...myDoctor.schedule });
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!doctorId) return;

    setSaving(true);
    setMessage('');
    try {
      await doctors.updateSchedule(doctorId, schedule);
      setMessage(t('availability.saved'));
    } catch (error) {
      console.error('Error saving schedule:', error);
      setMessage(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (day: string, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    setSchedule(prev => ({
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('nav.availability')}</h1>
          <p className="text-midnight-600">{t('availability.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message === t('availability.saved') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-midnight-900">{t('availability.weeklySchedule')}</h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {days.map((day) => (
            <div key={day} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[day]?.enabled ?? false}
                      onChange={(e) => updateDay(day, 'enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className={`font-medium ${schedule[day]?.enabled ? 'text-midnight-900' : 'text-midnight-400'}`}>
                      {getDayLabel(day)}
                    </span>
                  </label>
                </div>

                {schedule[day]?.enabled && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-midnight-400" />
                      <input
                        type="time"
                        value={schedule[day]?.start ?? '09:00'}
                        onChange={(e) => updateDay(day, 'start', e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                      <span className="text-midnight-400">-</span>
                      <input
                        type="time"
                        value={schedule[day]?.end ?? '17:00'}
                        onChange={(e) => updateDay(day, 'end', e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}

                {!schedule[day]?.enabled && (
                  <span className="text-sm text-midnight-400">{t('availability.closed')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
