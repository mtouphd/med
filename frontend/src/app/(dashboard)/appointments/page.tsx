'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { appointments } from '@/lib/api';
import { Appointment, UserRole, AppointmentStatus } from '@/types';
import { Calendar, Clock, Check, XCircle, CalendarPlus, List } from 'lucide-react';
import { AppointmentCalendar } from '@/components/appointments';

export default function AppointmentsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const appointmentsRes = await appointments.getMy();
      setAppointmentsList(appointmentsRes.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('appointments.title')}</h1>
          <p className="text-midnight-600">{t('appointments.subtitle')}</p>
        </div>

        {/* Tab switcher for patients */}
        {user?.role === UserRole.PATIENT && (
          <div className="flex bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <CalendarPlus size={16} />
              {t('calendar.newAppointment')}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List size={16} />
              {t('calendar.myAppointments')}
            </button>
          </div>
        )}
      </div>

      {/* Calendar view for patients */}
      {user?.role === UserRole.PATIENT && activeTab === 'calendar' && (
        <AppointmentCalendar onAppointmentCreated={loadData} />
      )}

      {/* Appointments list */}
      {(user?.role !== UserRole.PATIENT || activeTab === 'list') && (
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-midnight-900 truncate">
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
                          <p className="text-sm text-midnight-500 mt-1 truncate">{apt.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 sm:ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                      {apt.status === AppointmentStatus.PENDING && user?.role !== UserRole.PATIENT && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(apt.id)}
                            className="p-2.5 bg-green-600 text-white hover:bg-green-700 rounded-full transition-all shadow-md"
                            title={t('common.approve')}
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      )}
                      {apt.status === AppointmentStatus.PENDING && (
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="p-2.5 bg-red-600 text-white hover:bg-red-700 rounded-full transition-all shadow-md"
                          title={t('common.cancel')}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
