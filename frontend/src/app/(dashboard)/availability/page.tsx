'use client';

import { useEffect, useState } from 'react';
import { doctors } from '@/lib/api';
import { Doctor, UserRole } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { CalendarDays, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

type SlotStatus = 'available' | 'unavailable' | 'maybe';

interface WeeklySchedule {
  [day: string]: {
    [hour: string]: SlotStatus;
  };
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00',
];

function getDefaultSchedule(): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  for (const day of DAYS) {
    schedule[day] = {};
    for (const hour of HOURS) {
      const h = parseInt(hour);
      const isWeekday = day !== 'sunday' && day !== 'saturday';
      const isMorning = h >= 8 && h <= 11;
      const isAfternoon = h >= 13 && h <= 16;
      schedule[day][hour] = isWeekday && (isMorning || isAfternoon) ? 'available' : 'unavailable';
    }
  }
  return schedule;
}

function isOldFormat(schedule: any): boolean {
  if (!schedule) return false;
  const firstDay = Object.values(schedule)[0] as any;
  return firstDay && ('start' in firstDay || 'end' in firstDay || 'enabled' in firstDay);
}

function convertOldToNew(oldSchedule: any): WeeklySchedule {
  const newSchedule = getDefaultSchedule();
  for (const day of DAYS) {
    const dayData = oldSchedule[day];
    if (!dayData) continue;
    if (!dayData.enabled) {
      for (const hour of HOURS) {
        newSchedule[day][hour] = 'unavailable';
      }
    } else {
      const startH = parseInt(dayData.start);
      const endH = parseInt(dayData.end);
      for (const hour of HOURS) {
        const h = parseInt(hour);
        newSchedule[day][hour] = h >= startH && h < endH ? 'available' : 'unavailable';
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

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedule, setSchedule] = useState<WeeklySchedule>(getDefaultSchedule());
  const [originalSchedule, setOriginalSchedule] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadDoctor();
  }, [user]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadDoctor = async () => {
    if (!user || user.role !== UserRole.DOCTOR) {
      setLoading(false);
      return;
    }
    try {
      const res = await doctors.getAll();
      const doctorList = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      const myDoctor = doctorList.find((d: Doctor) => d.userId === user.id);
      if (myDoctor) {
        setDoctor(myDoctor);
        let sched: WeeklySchedule;
        if (myDoctor.schedule && !isOldFormat(myDoctor.schedule)) {
          sched = myDoctor.schedule as unknown as WeeklySchedule;
        } else if (myDoctor.schedule && isOldFormat(myDoctor.schedule)) {
          sched = convertOldToNew(myDoctor.schedule);
        } else {
          sched = getDefaultSchedule();
        }
        setSchedule(sched);
        setOriginalSchedule(JSON.stringify(sched));
      }
    } catch (err) {
      console.error('Error loading doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (day: string, hour: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [hour]: cycleStatus(prev[day][hour]),
      },
    }));
  };

  const handleSave = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      await doctors.updateSchedule(doctor.id, schedule);
      setOriginalSchedule(JSON.stringify(schedule));
      setMessage({ text: 'Availability schedule saved successfully.', type: 'success' });
    } catch (err) {
      console.error('Error saving schedule:', err);
      setMessage({ text: 'Error saving schedule.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSchedule(getDefaultSchedule());
  };

  const hasChanges = JSON.stringify(schedule) !== originalSchedule;

  const getCellStyle = (status: SlotStatus): string => {
    switch (status) {
      case 'available':
        return 'bg-green-400 hover:bg-green-500 border-green-500';
      case 'maybe':
        return 'bg-maybe-pattern hover:opacity-80 border-amber-400';
      case 'unavailable':
        return 'bg-white hover:bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center text-gray-500 py-12">
        Doctor profile not found.
      </div>
    );
  }

  return (
    <div>
      <style jsx>{`
        .bg-maybe-pattern {
          background: repeating-linear-gradient(
            -45deg,
            #fbbf24,
            #fbbf24 4px,
            #fef3c7 4px,
            #fef3c7 8px
          );
        }
      `}</style>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary-100 p-2 rounded-lg">
            <CalendarDays className="text-primary-600" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Availability Schedule</h1>
        </div>
        <p className="text-gray-500 ml-12">
          Click on the cells to change your availability slots. Changes apply to every week.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Legend + Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-green-500 bg-green-400"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-gray-200 bg-white"></div>
            <span className="text-gray-700">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-amber-400" style={{
              background: 'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 4px, #fef3c7 4px, #fef3c7 8px)',
            }}></div>
            <span className="text-gray-700">Maybe available</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-5 py-2 text-sm rounded-lg font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save size={16} />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-20 px-3 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase border-b border-r border-gray-200">
                  Time
                </th>
                {DAY_LABELS.map((label, i) => (
                  <th
                    key={DAYS[i]}
                    className={`px-2 py-3 text-center text-sm font-semibold border-b border-r last:border-r-0 border-gray-200 ${
                      i === 0 || i === 6 ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="px-3 py-0 text-xs font-mono text-gray-500 border-r border-b border-gray-200 bg-gray-50 whitespace-nowrap">
                    {hour}
                  </td>
                  {DAYS.map((day) => {
                    const status = schedule[day]?.[hour] || 'unavailable';
                    return (
                      <td
                        key={`${day}-${hour}`}
                        className="p-0.5 border-r border-b last:border-r-0 border-gray-100"
                      >
                        <button
                          onClick={() => handleCellClick(day, hour)}
                          className={`w-full h-10 rounded border-2 cursor-pointer transition-all ${getCellStyle(status)}`}
                          style={status === 'maybe' ? {
                            background: 'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 4px, #fef3c7 4px, #fef3c7 8px)',
                          } : undefined}
                          title={`${DAY_LABELS[DAYS.indexOf(day)]} ${hour} - ${
                            status === 'available' ? 'Available' : status === 'maybe' ? 'Maybe available' : 'Unavailable'
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
      </div>

      {hasChanges && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
          <AlertCircle size={16} />
          You have unsaved changes.
        </div>
      )}
    </div>
  );
}
