'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, User, X, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { appointments, doctors } from '@/lib/api';
import { Doctor, Appointment } from '@/types';
import CalendarGrid from './CalendarGrid';
import TimeSlotPicker from './TimeSlotPicker';
import {
  TimeSlot,
  getCalendarDays,
  generateTimeSlots,
  getPrevMonth,
  getNextMonth,
  getMonthStart,
  getMonthEnd,
  formatDate,
} from './calendar-helpers';

interface AppointmentCalendarProps {
  onAppointmentCreated?: () => void;
}

export default function AppointmentCalendar({ onAppointmentCreated }: AppointmentCalendarProps) {
  const { t, locale } = useLanguage();

  // State
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [reason, setReason] = useState('');

  // Loading states
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load doctors on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await doctors.getAll();
        setDoctorsList(res.data);
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctors();
  }, []);

  // Load appointments when doctor or month changes
  const loadMonthAppointments = useCallback(async () => {
    if (!selectedDoctor) return;

    try {
      const startDate = getMonthStart(currentMonth).toISOString();
      const endDate = getMonthEnd(currentMonth).toISOString();
      const res = await appointments.getByDateRange(selectedDoctor.id, startDate, endDate);
      setMonthAppointments(res.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setMonthAppointments([]);
    }
  }, [selectedDoctor, currentMonth]);

  useEffect(() => {
    loadMonthAppointments();
  }, [loadMonthAppointments]);

  // Generate time slots when date is selected
  useEffect(() => {
    if (!selectedDate || !selectedDoctor?.schedule) {
      setTimeSlots([]);
      return;
    }

    setLoadingSlots(true);

    // Filter appointments for the selected date
    const dateAppointments = monthAppointments.filter((apt) => {
      const aptDate = new Date(apt.dateTime);
      return (
        aptDate.getDate() === selectedDate.getDate() &&
        aptDate.getMonth() === selectedDate.getMonth() &&
        aptDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    const slots = generateTimeSlots(
      selectedDate,
      selectedDoctor.schedule,
      selectedDoctor.consultationDuration || 30,
      dateAppointments
    );

    setTimeSlots(slots);
    setLoadingSlots(false);
    setSelectedSlot(null);
  }, [selectedDate, selectedDoctor, monthAppointments]);

  // Calendar days
  const calendarDays = selectedDoctor
    ? getCalendarDays(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        selectedDoctor.schedule
      )
    : [];

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

  // Handlers
  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctorsList.find((d) => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setCurrentMonth(new Date());
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(getPrevMonth(currentMonth));
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const handleConfirmClick = () => {
    if (selectedSlot) {
      setShowConfirmModal(true);
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      await appointments.create({
        doctorId: selectedDoctor.id,
        dateTime: selectedSlot.dateTime.toISOString(),
        reason,
      });

      setSuccessMessage(t('calendar.bookingSuccess'));
      setShowConfirmModal(false);

      // Reset form
      setSelectedDate(null);
      setSelectedSlot(null);
      setReason('');

      // Reload appointments
      await loadMonthAppointments();

      // Notify parent
      onAppointmentCreated?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctors) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-slide-up">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Doctor selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-xl">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-midnight-900">
            {t('calendar.selectDoctor')}
          </h3>
        </div>
        <select
          value={selectedDoctor?.id || ''}
          onChange={(e) => handleDoctorSelect(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-midnight-900"
        >
          <option value="">{t('appointments.selectDoctor')}</option>
          {doctorsList.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {doctor.user.firstName} {doctor.user.lastName} - {doctor.specialty}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar and time slots */}
      {selectedDoctor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <CalendarGrid
            currentMonth={currentMonth}
            days={calendarDays}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          {/* Time slots */}
          {selectedDate ? (
            <div className="space-y-4">
              <TimeSlotPicker
                selectedDate={selectedDate}
                slots={timeSlots}
                selectedSlot={selectedSlot}
                onSlotSelect={handleSlotSelect}
                loading={loadingSlots}
              />

              {/* Reason input and confirm button */}
              {selectedSlot && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-4 animate-slide-up">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('appointments.reason')}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder={t('appointments.reason')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleConfirmClick}
                    className="w-full py-3 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Calendar size={18} />
                    {t('calendar.confirmBooking')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center h-64">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-center">{t('calendar.selectDatePrompt')}</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedDoctor && selectedSlot && (
        <div className="fixed inset-0 bg-midnight-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-dialog w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-midnight-900">
                {t('calendar.confirmBooking')}
              </h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Doctor info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-midnight-900">
                    Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{selectedDoctor.specialty}</p>
                </div>
              </div>

              {/* Date and time */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-midnight-900 capitalize">
                    {formatDate(selectedSlot.dateTime, getLocaleCode())}
                  </p>
                  <p className="text-sm text-slate-500">{selectedSlot.time}</p>
                </div>
              </div>

              {/* Reason */}
              {reason && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">{t('appointments.reason')}</p>
                  <p className="text-midnight-900">{reason}</p>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={submitting}
                className="flex-1 py-3 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={18} />
                    {t('common.confirm')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
