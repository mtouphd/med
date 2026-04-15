'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { appointments, doctors as doctorsApi } from '@/lib/api';
import { Appointment, Patient, UserRole } from '@/types';
import { CalendarPlus, CalendarDays } from 'lucide-react';
import { AppointmentCalendar, AppointmentCalendarView, DoctorBookingModal } from '@/components/appointments';

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [myPatients, setMyPatients] = useState<Patient[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await appointments.getMy();
      setAppointmentsList(res.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === UserRole.DOCTOR) {
      doctorsApi.getMyPatients()
        .then((res) => setMyPatients(res.data))
        .catch(() => setMyPatients([]));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('appointments.title')}</h1>
          <p className="text-midnight-600">{t('appointments.subtitle')}</p>
        </div>
        {(user?.role === UserRole.PATIENT || user?.role === UserRole.DOCTOR) && (
          <button
            onClick={() => setBookingOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            <CalendarPlus size={16} />
            {t('calendar.newAppointment')}
          </button>
        )}
      </div>

      {/* Calendar view */}
      <AppointmentCalendarView
        appointmentsList={appointmentsList}
        onRefresh={loadData}
        onSlotClick={(dt) => { setBookingDate(dt); setBookingOpen(true); }}
      />

      {/* Booking modal — patient books with a doctor */}
      {bookingOpen && user?.role === UserRole.PATIENT && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setBookingOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays size={18} className="text-primary-600" />
                {t('calendar.title')}
              </h2>
              <button
                onClick={() => setBookingOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <AppointmentCalendar
                initialDate={bookingDate}
                onAppointmentCreated={() => {
                  setBookingOpen(false);
                  loadData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Booking modal — doctor books for a patient */}
      {bookingOpen && user?.role === UserRole.DOCTOR && (
        <DoctorBookingModal
          patients={myPatients}
          onCreated={loadData}
          onClose={() => setBookingOpen(false)}
          initialDate={bookingDate}
        />
      )}
    </div>
  );
}
