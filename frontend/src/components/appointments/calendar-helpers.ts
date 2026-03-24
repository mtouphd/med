import { Appointment, Doctor } from '@/types';

export interface DayInfo {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
  isPast: boolean;
}

export interface TimeSlot {
  time: string;
  dateTime: Date;
  isBooked: boolean;
}

// Day names in order (Sunday to Saturday)
export const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Get the start of a month
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of a month
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get all days to display in a calendar month view (including padding days)
 */
export function getCalendarDays(year: number, month: number, doctorSchedule?: Doctor['schedule']): DayInfo[] {
  const days: DayInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = firstDayOfMonth.getDay();

  // Add padding days from previous month
  const prevMonth = new Date(year, month, 0);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i);
    days.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      isAvailable: false,
      isPast: true,
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const dayKey = DAY_KEYS[dayOfWeek];
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();

    // Check if doctor works on this day
    let isAvailable = false;
    if (doctorSchedule && !isPast) {
      const scheduleForDay = doctorSchedule[dayKey];
      isAvailable = scheduleForDay?.enabled === true;
    }

    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isToday,
      isAvailable,
      isPast,
    });
  }

  // Add padding days for next month to complete the grid (6 rows max)
  const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      isAvailable: false,
      isPast: false,
    });
  }

  return days;
}

/**
 * Parse time string (HH:MM) to hours and minutes
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Generate time slots for a given day based on doctor's schedule
 */
export function generateTimeSlots(
  date: Date,
  doctorSchedule: Doctor['schedule'],
  consultationDuration: number = 30,
  existingAppointments: Appointment[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayOfWeek = date.getDay();
  const dayKey = DAY_KEYS[dayOfWeek];

  if (!doctorSchedule || !doctorSchedule[dayKey]?.enabled) {
    return slots;
  }

  const schedule = doctorSchedule[dayKey];
  const { hours: startHours, minutes: startMinutes } = parseTime(schedule.start);
  const { hours: endHours, minutes: endMinutes } = parseTime(schedule.end);

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  // Generate slots from start to end time
  let currentTime = new Date(date);
  currentTime.setHours(startHours, startMinutes, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHours, endMinutes, 0, 0);

  while (currentTime < endTime) {
    const slotDateTime = new Date(currentTime);

    // Skip if slot is in the past (for today)
    if (isToday && slotDateTime <= now) {
      currentTime.setMinutes(currentTime.getMinutes() + consultationDuration);
      continue;
    }

    // Check if slot is booked
    const isBooked = existingAppointments.some((apt) => {
      const aptTime = new Date(apt.dateTime);
      return aptTime.getTime() === slotDateTime.getTime() &&
             apt.status !== 'CANCELLED' &&
             apt.status !== 'REJECTED';
    });

    const timeString = currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    slots.push({
      time: timeString,
      dateTime: new Date(slotDateTime),
      isBooked,
    });

    currentTime.setMinutes(currentTime.getMinutes() + consultationDuration);
  }

  return slots;
}

/**
 * Group time slots into morning and afternoon
 */
export function groupSlotsByPeriod(slots: TimeSlot[]): {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
} {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];

  slots.forEach((slot) => {
    const hours = slot.dateTime.getHours();
    if (hours < 12) {
      morning.push(slot);
    } else {
      afternoon.push(slot);
    }
  });

  return { morning, afternoon };
}

/**
 * Format date for display
 */
export function formatDate(date: Date, locale: string = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format month and year for calendar header
 */
export function formatMonthYear(date: Date, locale: string = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Get the previous month
 */
export function getPrevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/**
 * Get the next month
 */
export function getNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
