'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors, familyDoctorRequests, appointments } from '@/lib/api';
import { Doctor } from '@/types';
import { Stethoscope, X } from 'lucide-react';
import { ViewToggle, DoctorCard, ViewMode } from '@/components/ui';

export default function DoctorsPage() {
  const { t } = useLanguage();
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('box');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [requestingFamilyDoctor, setRequestingFamilyDoctor] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await doctors.getAll();
      setDoctorsList(res.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestFamilyDoctor = async (doctorId: string) => {
    setRequestingFamilyDoctor(doctorId);
    try {
      await familyDoctorRequests.create({ doctorId });
      alert(t('doctors.requestSent'));
    } catch (error) {
      console.error('Error requesting family doctor:', error);
      alert(t('common.error'));
    } finally {
      setRequestingFamilyDoctor(null);
    }
  };

  const openAppointmentModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowAppointmentModal(true);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      await appointments.create({
        doctorId: selectedDoctor.id,
        dateTime: dateTime.toISOString(),
        reason,
      });
      setShowAppointmentModal(false);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      alert(t('appointments.booked'));
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(t('common.error'));
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('doctors.title')}</h1>
          <p className="text-midnight-600">{t('doctors.subtitle')}</p>
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {doctorsList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <Stethoscope className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
          <p className="text-midnight-600">{t('common.noData')}</p>
        </div>
      ) : viewMode === 'box' ? (
        // Box view with 3D cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-animation">
          {doctorsList.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              viewMode={viewMode}
              onBookAppointment={openAppointmentModal}
              onRequestFamilyDoctor={handleRequestFamilyDoctor}
              isRequesting={requestingFamilyDoctor === doctor.id}
            />
          ))}
        </div>
      ) : (
        // List view
        <div className="space-y-3 stagger-animation">
          {doctorsList.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              viewMode={viewMode}
              onBookAppointment={openAppointmentModal}
              onRequestFamilyDoctor={handleRequestFamilyDoctor}
              isRequesting={requestingFamilyDoctor === doctor.id}
            />
          ))}
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && selectedDoctor && (
        <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-dialog w-full max-w-md mx-4 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-800">
                {t('appointments.bookWith')} Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}
              </h2>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t('appointments.date')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t('appointments.time')}
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t('appointments.reason')}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-primary-700 text-white rounded-full hover:bg-primary-800 transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                {t('appointments.book')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
