'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

interface Schedule {
  [key: string]: DaySchedule;
}

interface ScheduleEditorProps {
  initialSchedule?: Schedule;
  onSave: (schedule: Schedule) => Promise<void>;
  readOnly?: boolean;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_SCHEDULE: Schedule = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '09:00', end: '13:00', enabled: false },
  sunday: { start: '09:00', end: '13:00', enabled: false },
};

export default function ScheduleEditor({
  initialSchedule,
  onSave,
  readOnly = false,
}: ScheduleEditorProps) {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule || DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSchedule) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule]);

  const handleToggleDay = (day: string) => {
    if (readOnly) return;
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    if (readOnly) return;
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(schedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-primary-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
      </div>

      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const daySchedule = schedule[day.key] || DEFAULT_SCHEDULE[day.key];
          return (
            <div
              key={day.key}
              className={`border rounded-lg p-4 transition-all ${
                daySchedule.enabled
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={daySchedule.enabled}
                    onChange={() => handleToggleDay(day.key)}
                    disabled={readOnly}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={`font-medium ${daySchedule.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {day.label}
                  </span>
                </label>

                {daySchedule.enabled && (
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={daySchedule.start}
                        onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                        disabled={readOnly}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <span className="text-gray-500 mt-5">-</span>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={daySchedule.end}
                        onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                        disabled={readOnly}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      )}
    </div>
  );
}
