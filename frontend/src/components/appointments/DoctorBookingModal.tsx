'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CalendarDays, User, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { appointments as appointmentsApi, doctors as doctorsApi } from '@/lib/api';
import { Doctor, Patient, Appointment } from '@/types';
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
} from './calendar-helpers';

interface DoctorBookingModalProps {
  /** If provided, the patient selector is hidden and this patient is used */
  preselectedPatient?: Patient;
  /** List of patients the doctor can book for (shown when no preselectedPatient) */
  patients?: Patient[];
  /** Pre-fill the calendar at this date/time (from clicking a calendar slot) */
  initialDate?: Date;
  onCreated: () => void;
  onClose: () => void;
}

export default function DoctorBookingModal({
  preselectedPatient,
  patients = [],
  initialDate,
  onCreated,
  onClose,
}: DoctorBookingModalProps) {
  const { t, locale } = useLanguage();

  const [myDoctor, setMyDoctor] = useState<Doctor | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPatient ?? null);
  const [currentMonth, setCurrentMonth] = useState(initialDate ?? new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate ?? null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load logged-in doctor's profile (for schedule)
  useEffect(() => {
    doctorsApi.getMyProfile()
      .then((res) => setMyDoctor(res.data))
      .catch(() => setMyDoctor(null))
      .finally(() => setLoadingDoctor(false));
  }, []);

  // Load month appointments for the doctor
  const loadMonthAppointments = useCallback(async () => {
    if (!myDoctor) return;
    try {
      const start = getMonthStart(currentMonth).toISOString();
      const end = getMonthEnd(currentMonth).toISOString();
      const res = await appointmentsApi.getByDateRange(myDoctor.id, start, end);
      setMonthAppointments(res.data);
    } catch {
      setMonthAppointments([]);
    }
  }, [myDoctor, currentMonth]);

  useEffect(() => {
    loadMonthAppointments();
  }, [loadMonthAppointments]);

  // Regenerate time slots when date or month appointments change
  useEffect(() => {
    if (!selectedDate || !myDoctor?.schedule) {
      setTimeSlots([]);
      return;
    }
    const dateApts = monthAppointments.filter((apt) => {
      const d = new Date(apt.dateTime);
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });
    const slots = generateTimeSlots(
      selectedDate,
      myDoctor.schedule,
      myDoctor.consultationDuration || 30,
      dateApts,
    );
    setTimeSlots(slots);
    setSelectedSlot(null);
  }, [selectedDate, myDoctor, monthAppointments]);

  const calendarDays = myDoctor
    ? getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth(), myDoctor.schedule)
    : [];

  const handleSubmit = async () => {
    if (!myDoctor || !selectedPatient || !selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      await appointmentsApi.create({
        doctorId: myDoctor.id,
        patientId: selectedPatient.id,
        dateTime: selectedSlot.dateTime.toISOString(),
        duration: myDoctor.consultationDuration || 30,
        reason,
      });
      setSuccess(t('appointments.booked'));
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(e.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-600" />
            {t('appointments.newAppointment')}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Feedback */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
              <Check size={16} /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Patient selector */}
          {preselectedPatient ? (
            <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
              <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {preselectedPatient.user?.firstName?.[0]}{preselectedPatient.user?.lastName?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {preselectedPatient.user?.firstName} {preselectedPatient.user?.lastName}
                </p>
                <p className="text-xs text-slate-500">{preselectedPatient.user?.email}</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User size={15} className="text-primary-500" />
                {t('appointments.selectPatient')}
              </label>
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const p = patients.find((x) => x.id === e.target.value) ?? null;
                  setSelectedPatient(p);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
              >
                <option value="">{t('appointments.selectPatientPlaceholder')}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user?.firstName} {p.user?.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Calendar + slots */}
          {loadingDoctor ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-7 h-7 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : !myDoctor ? (
            <p className="text-sm text-red-600 text-center">{t('common.error')}</p>
          ) : selectedPatient ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CalendarGrid
                currentMonth={currentMonth}
                days={calendarDays}
                selectedDate={selectedDate}
                onDateSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                onPrevMonth={() => { setCurrentMonth(getPrevMonth(currentMonth)); setSelectedDate(null); setSelectedSlot(null); }}
                onNextMonth={() => { setCurrentMonth(getNextMonth(currentMonth)); setSelectedDate(null); setSelectedSlot(null); }}
              />
              {selectedDate ? (
                <div className="space-y-3">
                  <TimeSlotPicker
                    selectedDate={selectedDate}
                    slots={timeSlots}
                    selectedSlot={selectedSlot}
                    onSlotSelect={setSelectedSlot}
                    loading={false}
                  />
                  {selectedSlot && (
                    <div className="space-y-3">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        placeholder={t('appointments.reason')}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
                      >
                        {submitting ? t('common.saving') : t('calendar.confirmBooking')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic self-center text-center">{t('calendar.selectDatePrompt')}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-4">{t('appointments.selectPatientFirst')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
