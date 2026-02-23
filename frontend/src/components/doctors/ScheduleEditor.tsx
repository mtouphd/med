'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Old format
interface DaySchedule {
  start: string;
  end: string;
  enabled: boolean;
}

interface OldSchedule {
  [key: string]: DaySchedule;
}

// New slot-based format
type SlotStatus = 'available' | 'unavailable' | 'maybe';

interface SlotSchedule {
  [day: string]: {
    [hour: string]: SlotStatus;
  };
}

type Schedule = OldSchedule | SlotSchedule;

interface ScheduleEditorProps {
  initialSchedule?: Schedule;
  onSave: (schedule: Schedule) => Promise<void>;
  readOnly?: boolean;
}

const DAYS_OF_WEEK = [
  { key: 'sunday', label: 'Sun' },
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
];

const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00',
];

function isNewFormat(schedule: any): boolean {
  if (!schedule) return false;
  const firstDay = Object.values(schedule)[0] as any;
  if (!firstDay) return false;
  return '06:00' in firstDay || '08:00' in firstDay || '07:00' in firstDay;
}

function convertOldToSlot(oldSchedule: OldSchedule): SlotSchedule {
  const newSchedule: SlotSchedule = {};
  for (const day of DAYS_OF_WEEK.map(d => d.key)) {
    newSchedule[day] = {};
    const dayData = oldSchedule[day];
    for (const hour of HOURS) {
      const h = parseInt(hour);
      if (dayData && dayData.enabled) {
        const startH = parseInt(dayData.start);
        const endH = parseInt(dayData.end);
        newSchedule[day][hour] = h >= startH && h < endH ? 'available' : 'unavailable';
      } else {
        newSchedule[day][hour] = 'unavailable';
      }
    }
  }
  return newSchedule;
}

function cycleStatus(status: SlotStatus): SlotStatus {
  switch (status) {
    case 'unavailable': return 'available';
    case 'available': return 'maybe';
    case 'maybe': return 'unavailable';
  }
}

export default function ScheduleEditor({
  initialSchedule,
  onSave,
  readOnly = false,
}: ScheduleEditorProps) {
  const [schedule, setSchedule] = useState<SlotSchedule>(() => {
    if (!initialSchedule) return convertOldToSlot({
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '13:00', enabled: false },
      sunday: { start: '09:00', end: '13:00', enabled: false },
    });
    if (isNewFormat(initialSchedule)) return initialSchedule as SlotSchedule;
    return convertOldToSlot(initialSchedule as OldSchedule);
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSchedule) {
      if (isNewFormat(initialSchedule)) {
        setSchedule(initialSchedule as SlotSchedule);
      } else {
        setSchedule(convertOldToSlot(initialSchedule as OldSchedule));
      }
    }
  }, [initialSchedule]);

  const handleCellClick = (day: string, hour: string) => {
    if (readOnly) return;
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: cycleStatus(prev[day]?.[hour] || 'unavailable'),
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(schedule as any);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const getCellColor = (status: SlotStatus): string => {
    switch (status) {
      case 'available': return 'bg-green-400 border-green-500';
      case 'maybe': return 'border-amber-400';
      case 'unavailable': return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-primary-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs mb-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border border-green-500 bg-green-400"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border border-gray-200 bg-white"></div>
          <span className="text-gray-600">Unavailable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border border-amber-400" style={{
            background: 'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 3px, #fef3c7 3px, #fef3c7 6px)',
          }}></div>
          <span className="text-gray-600">Maybe</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-14 px-1 py-1.5 bg-gray-50 text-left text-xs font-semibold text-gray-500 border-b border-r border-gray-200">
                Time
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={day.key}
                  className={`px-1 py-1.5 text-center text-xs font-semibold border-b border-r last:border-r-0 border-gray-200 ${
                    day.key === 'sunday' || day.key === 'saturday' ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="px-1 py-0 text-xs font-mono text-gray-500 border-r border-b border-gray-200 bg-gray-50 whitespace-nowrap">
                  {hour}
                </td>
                {DAYS_OF_WEEK.map((day) => {
                  const status = schedule[day.key]?.[hour] || 'unavailable';
                  return (
                    <td
                      key={`${day.key}-${hour}`}
                      className="p-0.5 border-r border-b last:border-r-0 border-gray-100"
                    >
                      <button
                        onClick={() => handleCellClick(day.key, hour)}
                        disabled={readOnly}
                        className={`w-full h-7 rounded border cursor-pointer transition-all ${getCellColor(status)} ${
                          readOnly ? 'cursor-default' : 'hover:opacity-80'
                        }`}
                        style={status === 'maybe' ? {
                          background: 'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 3px, #fef3c7 3px, #fef3c7 6px)',
                        } : undefined}
                        title={`${day.label} ${hour} - ${
                          status === 'available' ? 'Available' : status === 'maybe' ? 'Maybe' : 'Unavailable'
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
