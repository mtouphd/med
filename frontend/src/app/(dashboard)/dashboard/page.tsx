'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { appointments, doctors } from '@/lib/api';
import { Appointment, Doctor, DashboardStats, UserRole } from '@/types';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const appointmentsRes = await appointments.getMy();
      setAppointmentsList(appointmentsRes.data);

      if (user?.role === UserRole.ADMIN) {
        const statsRes = await appointments.getStats();
        setStats(statsRes.data);
      }

      const doctorsRes = await doctors.getAll();
      setDoctorsList(doctorsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-midnight-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return t('appointments.status.pending');
      case 'CONFIRMED': return t('appointments.status.confirmed');
      case 'COMPLETED': return t('appointments.status.completed');
      case 'CANCELLED': return t('appointments.status.cancelled');
      default: return status;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight-900 mb-2">{t('nav.dashboard')}</h1>
      <p className="text-midnight-600 mb-8">{t('dashboard.welcome')}, {user?.firstName} {user?.lastName}!</p>

      {user?.role === UserRole.ADMIN && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-midnight-600">{t('appointments.title')}</p>
                <p className="text-3xl font-bold text-midnight-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-midnight-600">{t('appointments.status.pending')}</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-midnight-600">{t('appointments.status.confirmed')}</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-midnight-600">{t('appointments.status.completed')}</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-midnight-900 mb-4">{t('dashboard.upcomingAppointments')}</h2>
          <div className="space-y-4">
            {appointmentsList.length === 0 ? (
              <p className="text-midnight-600 text-center py-4">{t('common.noData')}</p>
            ) : (
              appointmentsList.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-midnight-900">
                      {user?.role === UserRole.PATIENT
                        ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`
                        : `${apt.patient.user.firstName} ${apt.patient.user.lastName}`}
                    </p>
                    <p className="text-sm text-midnight-600">
                      {new Date(apt.dateTime).toLocaleDateString()} - {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {user?.role !== UserRole.PATIENT && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-midnight-900 mb-4">{t('doctors.title')}</h2>
            <div className="space-y-4">
              {doctorsList.length === 0 ? (
                <p className="text-midnight-600 text-center py-4">{t('common.noData')}</p>
              ) : (
                doctorsList.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">{doc.user.firstName[0]}{doc.user.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-midnight-900">Dr. {doc.user.firstName} {doc.user.lastName}</p>
                        <p className="text-sm text-midnight-600">{doc.specialty}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
