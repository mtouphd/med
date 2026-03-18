'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { appointments } from '@/lib/api';
import { Appointment, UserRole, AppointmentStatus } from '@/types';
import { FileText, Calendar, Clock, User } from 'lucide-react';

export default function ConsultationsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      const res = await appointments.getMy();
      // Filter only completed appointments (consultations)
      const completed = res.data.filter((apt: Appointment) => apt.status === AppointmentStatus.COMPLETED);
      setConsultations(completed);
    } catch (error) {
      console.error('Error loading consultations:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-midnight-900">{t('nav.consultations')}</h1>
        <p className="text-midnight-600">{t('consultations.subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {consultations.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
            <p className="text-midnight-600">{t('common.noData')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {consultations.map((consultation) => (
              <div key={consultation.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-midnight-900">
                        {user?.role === UserRole.PATIENT
                          ? `Dr. ${consultation.doctor?.user?.firstName} ${consultation.doctor?.user?.lastName}`
                          : `${consultation.patient?.user?.firstName} ${consultation.patient?.user?.lastName}`}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-midnight-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(consultation.dateTime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(consultation.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {consultation.reason && (
                        <p className="text-sm text-midnight-500 mt-2">
                          <strong>{t('appointments.reason')}:</strong> {consultation.reason}
                        </p>
                      )}
                      {consultation.notes && (
                        <p className="text-sm text-midnight-600 mt-2 bg-slate-50 p-3 rounded-lg">
                          <strong>{t('consultations.notes')}:</strong> {consultation.notes}
                        </p>
                      )}
                      {consultation.medications && (
                        <p className="text-sm text-midnight-600 mt-2 bg-green-50 p-3 rounded-lg">
                          <strong>{t('consultations.medications')}:</strong> {consultation.medications}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {t('appointments.status.completed')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
