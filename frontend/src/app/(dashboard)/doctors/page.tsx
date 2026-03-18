'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors, familyDoctorRequests, appointments } from '@/lib/api';
import { Doctor } from '@/types';
import { Stethoscope, MapPin, Clock, Heart, Calendar, X } from 'lucide-react';

export default function DoctorsPage() {
  const { t } = useLanguage();
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-midnight-900">{t('doctors.title')}</h1>
        <p className="text-midnight-600">{t('doctors.subtitle')}</p>
      </div>

      {doctorsList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <Stethoscope className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
          <p className="text-midnight-600">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctorsList.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-semibold text-lg">
                      {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-midnight-900">
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </h3>
                    <p className="text-primary-600 text-sm">{doctor.specialty}</p>
                    {doctor.address && (
                      <p className="text-midnight-500 text-sm flex items-center gap-1 mt-1">
                        <MapPin size={14} />
                        {doctor.address}
                      </p>
                    )}
                  </div>
                </div>

                {doctor.bio && (
                  <p className="text-midnight-600 text-sm mt-4 line-clamp-2">{doctor.bio}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-midnight-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {doctor.consultationDuration} min
                  </span>
                  <span className={`flex items-center gap-1 ${doctor.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${doctor.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {doctor.isAvailable ? t('doctors.available') : t('doctors.unavailable')}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => openAppointmentModal(doctor)}
                  disabled={!doctor.isAvailable}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Calendar size={16} />
                  {t('appointments.book')}
                </button>
                <button
                  onClick={() => handleRequestFamilyDoctor(doctor.id)}
                  disabled={requestingFamilyDoctor === doctor.id}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 text-sm"
                >
                  <Heart size={16} />
                  {t('doctors.requestFamily')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-midnight-900">
                {t('appointments.bookWith')} Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}
              </h2>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="p-2 text-midnight-400 hover:text-midnight-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-midnight-700 mb-1">
                  {t('appointments.date')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-700 mb-1">
                  {t('appointments.time')}
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-700 mb-1">
                  {t('appointments.reason')}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
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
