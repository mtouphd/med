'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { assistants as assistantsApi, appointments as appointmentsApi, doctors as doctorsApi } from '@/lib/api';
import { Assistant, AffiliationStatus, Patient, Doctor } from '@/types';
import { Users, Clock, Calendar, CalendarPlus } from 'lucide-react';
import { AppointmentCalendar } from '@/components/appointments';

export default function AssistantPatientsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Assistant | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingPatient, setBookingPatient] = useState<Patient | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const profileRes = await assistantsApi.getMyProfile();
      setProfile(profileRes.data);
      if (profileRes.data.affiliationStatus === AffiliationStatus.APPROVED) {
        const patientsRes = await assistantsApi.getMyPatients();
        setPatients(patientsRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Pending state
  if (!profile || profile.affiliationStatus === AffiliationStatus.PENDING) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t('assistantStatus.pendingTitle')}</h2>
          <p className="text-slate-500 mt-1 max-w-sm">{t('assistantStatus.pendingDesc')}</p>
        </div>
      </div>
    );
  }

  // Rejected state
  if (profile.affiliationStatus === AffiliationStatus.REJECTED) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t('assistantStatus.rejectedTitle')}</h2>
          <p className="text-slate-500 mt-1 max-w-sm">{t('assistantStatus.rejectedDesc')}</p>
        </div>
      </div>
    );
  }

  // Approved — show patients
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-midnight-900">{t('assistantPatients.title')}</h1>
        <p className="text-midnight-600">{t('assistantPatients.subtitle')}</p>
      </div>

      {/* Booking modal */}
      {bookingPatient && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setBookingPatient(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarPlus size={18} className="text-primary-600" />
                {t('calendar.title')} — {bookingPatient.user?.firstName} {bookingPatient.user?.lastName}
              </h2>
              <button onClick={() => setBookingPatient(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">✕</button>
            </div>
            <div className="p-4">
              <AppointmentCalendar
                onAppointmentCreated={() => setBookingPatient(null)}
              />
            </div>
          </div>
        </div>
      )}

      {patients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
          {patients.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {patient.user?.firstName} {patient.user?.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{patient.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setBookingPatient(patient)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <CalendarPlus size={15} />
                {t('calendar.newAppointment')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
