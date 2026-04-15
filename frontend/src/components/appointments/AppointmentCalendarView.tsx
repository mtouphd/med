'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  XCircle,
  Clock,
  User,
  CalendarDays,
  Calendar,
  List,
  Stethoscope,
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { appointments as appointmentsApi } from '@/lib/api';
import { Appointment, AppointmentStatus, UserRole } from '@/types';
import ConsultationModal from './ConsultationModal';

type ViewMode = 'day' | 'week' | 'month' | 'list';

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; border: string; dot: string }> = {
  [AppointmentStatus.PENDING]: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-400',
    dot: 'bg-amber-400',
  },
  [AppointmentStatus.CONFIRMED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-400',
    dot: 'bg-emerald-400',
  },
  [AppointmentStatus.COMPLETED]: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-400',
    dot: 'bg-blue-400',
  },
  [AppointmentStatus.CANCELLED]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  [AppointmentStatus.REJECTED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-400',
    dot: 'bg-red-400',
  },
};

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  // pad from previous month
  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year, month, -first.getDay() + i + 1);
    days.push(d);
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // pad to complete grid
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return days;
}

interface AppointmentCalendarViewProps {
  appointmentsList: Appointment[];
  onRefresh: () => void;
  /** Called when the user clicks an empty time slot — open booking dialog */
  onSlotClick?: (dateTime: Date) => void;
}

export default function AppointmentCalendarView({
  appointmentsList,
  onRefresh,
  onSlotClick,
}: AppointmentCalendarViewProps) {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  // Default to list on mobile, week on larger screens
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'list' : 'week'
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<{ apt: Appointment; x: number; y: number } | null>(null);
  const [consultationApt, setConsultationApt] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState<{ apt: Appointment; reason: string } | null>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedAppointment = selected?.apt ?? null;

  const openPopover = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSelected({ apt, x: rect.right + 8, y: rect.top });
  };
  const now = new Date();

  // Scroll to current time on mount
  useEffect(() => {
    if (timeGridRef.current && (viewMode === 'day' || viewMode === 'week')) {
      const offset = (now.getHours() - START_HOUR) * HOUR_HEIGHT - 100;
      timeGridRef.current.scrollTop = Math.max(0, offset);
    }
  }, [viewMode]);

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const getHeaderLabel = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const ws = getWeekStart(currentDate);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const m1 = ws.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      const m2 = we.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      return m1 === m2 ? m1 : `${ws.toLocaleDateString(locale, { month: 'short' })} – ${m2}`;
    }
    return currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const getAppointmentsForDay = (day: Date) =>
    appointmentsList.filter((apt) => isSameDay(new Date(apt.dateTime), day));

  const closePopover = useCallback(() => setSelected(null), []);

  // Close popover on outside click
  useEffect(() => {
    if (!selected) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    // Delay to avoid catching the same click that opened it
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [selected, closePopover]);

  const handleApprove = async (apt: Appointment) => {
    setActionLoading(true);
    try {
      // Doctor uses the tracked approval endpoint; assistant uses the generic one
      if (user?.role === UserRole.DOCTOR) {
        await appointmentsApi.approveByDoctor(apt.id);
      } else {
        await appointmentsApi.approve(apt.id);
      }
      closePopover();
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClick = (apt: Appointment) => {
    if (user?.role === UserRole.DOCTOR) {
      setCancelModal({ apt, reason: '' });
    } else {
      handleCancel(apt);
    }
  };

  const handleCancel = async (apt: Appointment, reason?: string) => {
    setActionLoading(true);
    try {
      await appointmentsApi.cancel(apt.id, reason);
      closePopover();
      setCancelModal(null);
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Time grid helpers ────────────────────────────────────────────────────

  const aptTopPercent = (apt: Appointment) => {
    const dt = new Date(apt.dateTime);
    const mins = (dt.getHours() - START_HOUR) * 60 + dt.getMinutes();
    return (mins / (TOTAL_HOURS * 60)) * 100;
  };

  const aptHeightPercent = (apt: Appointment) => {
    const mins = apt.duration || 30;
    return (mins / (TOTAL_HOURS * 60)) * 100;
  };

  const currentTimeTopPct = () => {
    const mins = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
    return (mins / (TOTAL_HOURS * 60)) * 100;
  };

  const showCurrentTime = (day: Date) => {
    if (viewMode === 'day') return isSameDay(day, now);
    if (viewMode === 'week') {
      const ws = getWeekStart(currentDate);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return now >= ws && now <= we && isSameDay(day, now);
    }
    return false;
  };

  // ─── Appointment block in time grid ──────────────────────────────────────

  const AppointmentBlock = ({ apt, totalHeight }: { apt: Appointment; totalHeight: number }) => {
    const colors = STATUS_COLORS[apt.status] || STATUS_COLORS[AppointmentStatus.PENDING];
    const topPx = (aptTopPercent(apt) / 100) * totalHeight;
    const heightPx = Math.max((aptHeightPercent(apt) / 100) * totalHeight, 20);
    const dt = new Date(apt.dateTime);
    const timeStr = dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const name =
      user?.role === UserRole.PATIENT
        ? `Dr. ${apt.doctor?.user?.firstName} ${apt.doctor?.user?.lastName}`
        : `${apt.patient?.user?.firstName} ${apt.patient?.user?.lastName}`;

    return (
      <div
        className={`absolute left-0.5 right-0.5 rounded-lg border-l-4 px-2 py-1 cursor-pointer select-none overflow-hidden shadow-sm hover:shadow-md transition-shadow z-10 ${colors.bg} ${colors.border}`}
        style={{ top: topPx, height: heightPx }}
        onClick={(e) => openPopover(apt, e)}
      >
        <p className={`text-xs font-semibold leading-tight truncate ${colors.text}`}>{name}</p>
        {heightPx > 28 && (
          <p className={`text-xs leading-tight truncate ${colors.text} opacity-75`}>{timeStr}</p>
        )}
      </div>
    );
  };

  // ─── Time column ──────────────────────────────────────────────────────────

  const TimeColumn = () => (
    <div className="flex-shrink-0 w-14 relative" style={{ height: HOUR_HEIGHT * TOTAL_HOURS }}>
      {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
        const h = START_HOUR + i;
        return (
          <div
            key={h}
            className="absolute right-2 text-xs text-slate-400 -translate-y-2.5"
            style={{ top: i * HOUR_HEIGHT }}
          >
            {h < 10 ? `0${h}:00` : `${h}:00`}
          </div>
        );
      })}
    </div>
  );

  // ─── Day column (time grid) ───────────────────────────────────────────────

  const DayColumn = ({ day, isToday }: { day: Date; isToday: boolean }) => {
    const dayApts = getAppointmentsForDay(day);
    const totalHeight = HOUR_HEIGHT * TOTAL_HOURS;
    const showNow = showCurrentTime(day);

    const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSlotClick) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      // Snap to nearest 30 min
      const rawMin = Math.round((relY / totalHeight) * (TOTAL_HOURS * 60) / 30) * 30;
      const clampedMin = Math.max(0, Math.min(rawMin, (TOTAL_HOURS - 1) * 60));
      const dt = new Date(day);
      dt.setHours(START_HOUR + Math.floor(clampedMin / 60), clampedMin % 60, 0, 0);
      onSlotClick(dt);
    };

    return (
      <div
        className={`flex-1 relative border-l border-slate-100 ${onSlotClick ? 'cursor-pointer' : ''}`}
        style={{ height: totalHeight }}
        onClick={handleBgClick}
      >
        {/* Hour lines */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-slate-100"
            style={{ top: i * HOUR_HEIGHT }}
          />
        ))}
        {/* Half-hour lines */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div
            key={`h${i}`}
            className="absolute left-0 right-0 border-t border-slate-50"
            style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
          />
        ))}
        {/* Appointments */}
        {dayApts.map((apt) => (
          <AppointmentBlock key={apt.id} apt={apt} totalHeight={totalHeight} />
        ))}
        {/* Current time indicator */}
        {showNow && (
          <div
            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
            style={{ top: `${currentTimeTopPct()}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0 shadow" />
            <div className="flex-1 h-px bg-red-500" />
          </div>
        )}
      </div>
    );
  };

  // ─── VIEWS ────────────────────────────────────────────────────────────────

  const renderWeekDayHeader = (days: Date[]) => (
    <div className="flex border-b border-slate-200 sticky top-0 bg-white z-30">
      <div className="flex-shrink-0 w-14" />
      {days.map((day, i) => {
        const isToday = isSameDay(day, now);
        return (
          <div
            key={i}
            className="flex-1 text-center py-2 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => { setCurrentDate(day); setViewMode('day'); }}
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {day.toLocaleDateString(locale, { weekday: 'short' })}
            </p>
            <div
              className={`mx-auto mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                isToday ? 'bg-primary-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {day.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const isToday = isSameDay(currentDate, now);
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex border-b border-slate-200 sticky top-0 bg-white z-30">
          <div className="flex-shrink-0 w-14" />
          <div className="flex-1 text-center py-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {currentDate.toLocaleDateString(locale, { weekday: 'long' })}
            </p>
            <div
              className={`mx-auto mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                isToday ? 'bg-primary-600 text-white' : 'text-slate-700'
              }`}
            >
              {currentDate.getDate()}
            </div>
          </div>
        </div>
        <div ref={timeGridRef} className="flex-1 overflow-y-auto">
          <div className="flex">
            <TimeColumn />
            <DayColumn day={currentDate} isToday={isToday} />
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const ws = getWeekStart(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      return d;
    });
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        {renderWeekDayHeader(days)}
        <div ref={timeGridRef} className="flex-1 overflow-y-auto">
          <div className="flex">
            <TimeColumn />
            {days.map((day, i) => (
              <DayColumn key={i} day={day} isToday={isSameDay(day, now)} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    const today = now;

    return (
      <div className="flex-1 overflow-auto">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(2024, 0, i); // Jan 0-6 2024 = Sun-Sat
            return (
              <div key={i} className="text-center py-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
                {d.toLocaleDateString(locale, { weekday: 'short' })}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const inMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, today);
            const dayApts = getAppointmentsForDay(day);
            return (
              <div
                key={i}
                className={`min-h-[60px] sm:min-h-[90px] border-b border-r border-slate-100 p-1 cursor-pointer hover:bg-slate-50 transition-colors ${!inMonth ? 'opacity-40' : ''}`}
                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                  isToday ? 'bg-primary-600 text-white' : 'text-slate-700'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayApts.slice(0, 3).map((apt) => {
                    const colors = STATUS_COLORS[apt.status];
                    const name =
                      user?.role === UserRole.PATIENT
                        ? `Dr. ${apt.doctor?.user?.firstName}`
                        : `${apt.patient?.user?.firstName}`;
                    const timeStr = new Date(apt.dateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={apt.id}
                        className={`rounded px-1 py-0.5 text-xs truncate border-l-2 ${colors.bg} ${colors.text} ${colors.border} cursor-pointer`}
                        onClick={(e) => openPopover(apt, e)}
                      >
                        {timeStr} {name}
                      </div>
                    );
                  })}
                  {dayApts.length > 3 && (
                    <div className="text-xs text-slate-500 px-1">+{dayApts.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const sorted = [...appointmentsList].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );

    if (sorted.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500">{t('common.noData')}</p>
        </div>
      );
    }

    // Group by date
    const groups: { label: string; apts: Appointment[] }[] = [];
    let lastLabel = '';
    for (const apt of sorted) {
      const dt = new Date(apt.dateTime);
      const label = dt.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (label !== lastLabel) {
        groups.push({ label, apts: [] });
        lastLabel = label;
      }
      groups[groups.length - 1].apts.push(apt);
    }

    return (
      <div className="flex-1 overflow-auto divide-y divide-slate-100">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-4 py-2 bg-slate-50 sticky top-0 z-10">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{g.label}</p>
            </div>
            {g.apts.map((apt) => {
              const colors = STATUS_COLORS[apt.status];
              const dt = new Date(apt.dateTime);
              const timeStr = dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
              const name =
                user?.role === UserRole.PATIENT
                  ? `Dr. ${apt.doctor?.user?.firstName} ${apt.doctor?.user?.lastName}`
                  : `${apt.patient?.user?.firstName} ${apt.patient?.user?.lastName}`;
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={(e) => openPopover(apt, e)}
                >
                  <div className={`w-1 self-stretch rounded-full ${colors.dot}`} />
                  <div className="w-14 text-sm font-medium text-slate-600 flex-shrink-0">{timeStr}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{name}</p>
                    {apt.reason && <p className="text-sm text-slate-500 truncate">{apt.reason}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${colors.bg} ${colors.text}`}>
                    {t(`appointments.status.${apt.status.toLowerCase()}`)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ─── Google-Calendar-style popover ────────────────────────────────────────

  const renderPopover = () => {
    if (!selected) return null;
    const { apt, x, y } = selected;
    const colors = STATUS_COLORS[apt.status];
    const dt = new Date(apt.dateTime);
    const endDt = new Date(dt.getTime() + (apt.duration ?? 30) * 60000);
    const name =
      user?.role === UserRole.PATIENT
        ? `Dr. ${apt.doctor?.user?.firstName} ${apt.doctor?.user?.lastName}`
        : `${apt.patient?.user?.firstName} ${apt.patient?.user?.lastName}`;
    const isStaff = user?.role === UserRole.DOCTOR || user?.role === UserRole.ASSISTANT;
    const canApprove = apt.status === AppointmentStatus.PENDING && isStaff;
    const canCancel  = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(apt.status);
    // Doctor or assistant can open/edit the consultation form (except cancelled/rejected)
    const canConsult = isStaff &&
      apt.status !== AppointmentStatus.CANCELLED &&
      apt.status !== AppointmentStatus.REJECTED;

    // Smart positioning: on mobile center it, on desktop anchor to element
    const isMobile = window.innerWidth < 640;
    const PW = isMobile ? Math.min(window.innerWidth - 32, 320) : 320;
    let left: number;
    let top: number;
    if (isMobile) {
      left = (window.innerWidth - PW) / 2;
      top = Math.max(16, window.innerHeight * 0.1);
    } else {
      left = Math.max(8, x + PW > window.innerWidth - 12 ? x - PW - 16 : x);
      top = Math.min(y, window.innerHeight - 480);
    }

    return (
      <div
          ref={popoverRef}
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{ left, top, width: PW }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Colored header */}
          <div className={`px-4 pt-4 pb-3 border-l-4 ${colors.border} ${colors.bg}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                    {t(`appointments.status.${apt.status.toLowerCase()}`)}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 leading-tight">{name}</p>
              </div>
              <button
                onClick={closePopover}
                className="p-1 hover:bg-black/10 rounded-full transition-colors flex-shrink-0 mt-0.5"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Date */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-700 font-medium">
                {dt.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 text-sm">
              <Clock size={15} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">
                {dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {endDt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                <span className="text-slate-400 ml-1">({apt.duration ?? 30} min)</span>
              </span>
            </div>

            {/* Person */}
            <div className="flex items-center gap-3 text-sm">
              <User size={15} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{name}</span>
            </div>

            {/* Reason */}
            {apt.reason && (
              <div className="flex items-start gap-3 text-sm">
                <CalendarDays size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600">{apt.reason}</span>
              </div>
            )}

            {/* Notes */}
            {apt.notes && (
              <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
                <p className="font-medium text-slate-700 mb-0.5 text-xs uppercase tracking-wide">
                  {t('appointments.notes')}
                </p>
                <p>{apt.notes}</p>
              </div>
            )}

            {/* Rejection / cancellation reason */}
            {(apt.doctorRejectionReason || apt.adminRejectionReason) && (
              <div className="bg-red-50 rounded-lg px-3 py-2 text-sm text-red-700">
                <p className="font-medium mb-0.5 text-xs uppercase tracking-wide">
                  {t('appointments.rejectionReason')}
                </p>
                <p>{apt.doctorRejectionReason || apt.adminRejectionReason}</p>
              </div>
            )}
            {apt.cancellationReason && (
              <div className="bg-orange-50 rounded-lg px-3 py-2 text-sm text-orange-700">
                <p className="font-medium mb-0.5 text-xs uppercase tracking-wide">
                  {t('appointments.cancellationReason')}
                </p>
                <p>{apt.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {(canApprove || canCancel || canConsult) && (
            <div className="px-4 pb-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {canConsult && (
                <button
                  onClick={() => { setConsultationApt(apt); closePopover(); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  <Stethoscope size={15} />
                  {t('consultation.open')}
                </button>
              )}
              <div className="flex gap-2">
                {canApprove && (
                  <button
                    onClick={() => handleApprove(apt)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    <Check size={14} /> {t('common.approve')}
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => handleCancelClick(apt)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition-colors"
                  >
                    <XCircle size={14} /> {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          )}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const VIEW_BUTTONS: { key: ViewMode; icon: React.ReactNode; label: string; mobileHide?: boolean }[] = [
    { key: 'day',   icon: <CalendarDays size={15} />, label: t('calendarView.day') },
    { key: 'week',  icon: <Calendar size={15} />,     label: t('calendarView.week'),  mobileHide: true },
    { key: 'month', icon: <Calendar size={15} />,     label: t('calendarView.month') },
    { key: 'list',  icon: <List size={15} />,         label: t('calendarView.list') },
  ];

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col" style={{ height: 'calc(100dvh - 220px)', minHeight: 400 }}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            {t('calendarView.today')}
          </button>
          <h2 className="text-sm font-semibold text-slate-800 ml-1 capitalize">{getHeaderLabel()}</h2>
        </div>

        {/* View switcher */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {VIEW_BUTTONS.map(({ key, icon, label, mobileHide }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mobileHide ? 'hidden sm:flex' : 'flex'
              } ${
                viewMode === key
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {/* Consultation modal (doctor only) */}
      {consultationApt && (
        <ConsultationModal
          appointment={consultationApt}
          onSaved={onRefresh}
          onClose={() => setConsultationApt(null)}
        />
      )}

      {/* Cancel reason modal (doctor only) */}
      {cancelModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setCancelModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{t('appointments.cancelTitle')}</h3>
              <button onClick={() => setCancelModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-600">{t('appointments.cancelReasonPrompt')}</p>
              <textarea
                autoFocus
                rows={3}
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                placeholder={t('appointments.cancelReasonPlaceholder')}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t('common.back')}
              </button>
              <button
                onClick={() => handleCancel(cancelModal.apt, cancelModal.reason)}
                disabled={!cancelModal.reason.trim() || actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle size={16} />
                {t('appointments.confirmCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Detail popover — outside overflow-hidden container */}
    {renderPopover()}
    </>
  );
}
