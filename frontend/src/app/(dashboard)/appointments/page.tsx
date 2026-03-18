'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { appointments, doctors } from '@/lib/api';
import { Appointment, Doctor, UserRole, AppointmentStatus } from '@/types';
import { Calendar, Clock, Plus, X, Check, XCircle } from 'lucide-react';

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const appointmentsRes = await appointments.getMy();
      setAppointmentsList(appointmentsRes.data);

      if (user?.role === UserRole.PATIENT) {
        const doctorsRes = await doctors.getAll();
        setDoctorsList(doctorsRes.data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      await appointments.create({
        doctorId: selectedDoctor,
        dateTime: dateTime.toISOString(),
        reason,
      });
      setShowModal(false);
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      loadData();
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      if (user?.role === UserRole.DOCTOR) {
        await appointments.approveByDoctor(id);
      } else if (user?.role === UserRole.ADMIN) {
        await appointments.approveByAdmin(id);
      }
      loadData();
    } catch (error) {
      console.error('Error approving appointment:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointments.cancel(id);
      loadData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-midnight-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return t('appointments.status.pending');
      case 'CONFIRMED': return t('appointments.status.confirmed');
      case 'COMPLETED': return t('appointments.status.completed');
      case 'CANCELLED': return t('appointments.status.cancelled');
      case 'REJECTED': return t('appointments.status.rejected');
      default: return status;
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('appointments.title')}</h1>
          <p className="text-midnight-600">{t('appointments.subtitle')}</p>
        </div>
        {user?.role === UserRole.PATIENT && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} />
            {t('appointments.new')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {appointmentsList.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
            <p className="text-midnight-600">{t('common.noData')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointmentsList.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-midnight-900">
                        {user?.role === UserRole.PATIENT
                          ? `Dr. ${apt.doctor?.user?.firstName} ${apt.doctor?.user?.lastName}`
                          : `${apt.patient?.user?.firstName} ${apt.patient?.user?.lastName}`}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-midnight-600">
                        <Clock size={14} />
                        <span>
                          {new Date(apt.dateTime).toLocaleDateString()} - {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {apt.reason && (
                        <p className="text-sm text-midnight-500 mt-1">{apt.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                    {apt.status === AppointmentStatus.PENDING && user?.role !== UserRole.PATIENT && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(apt.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title={t('common.approve')}
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    )}
                    {apt.status === AppointmentStatus.PENDING && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.cancel')}
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-midnight-900">{t('appointments.new')}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-midnight-400 hover:text-midnight-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-midnight-700 mb-1">
                  {t('appointments.selectDoctor')}
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                >
                  <option value="">{t('appointments.selectDoctor')}</option>
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user.firstName} {doc.user.lastName} - {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>
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
