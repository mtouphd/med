'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { familyDoctorRequests, appointments } from '@/lib/api';
import { FamilyDoctorRequest, Appointment, FamilyDoctorRequestStatus, AppointmentStatus } from '@/types';
import { Inbox, Check, X, Clock, User, Calendar } from 'lucide-react';

export default function RequestsPage() {
  const { t } = useLanguage();
  const [doctorRequests, setDoctorRequests] = useState<FamilyDoctorRequest[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'familyDoctor'>('appointments');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const [familyRes, appointmentsRes] = await Promise.all([
        familyDoctorRequests.getMyDoctorRequests(),
        appointments.getPendingDoctor(),
      ]);
      setDoctorRequests(familyRes.data);
      setPendingAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFamilyRequest = async (id: string) => {
    try {
      await familyDoctorRequests.approveByDoctor(id);
      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectFamilyRequest = async (id: string) => {
    try {
      await familyDoctorRequests.rejectByDoctor(id, 'Request rejected');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleApproveAppointment = async (id: string) => {
    try {
      await appointments.approveByDoctor(id);
      loadRequests();
    } catch (error) {
      console.error('Error approving appointment:', error);
    }
  };

  const handleRejectAppointment = async (id: string) => {
    try {
      await appointments.rejectByDoctor(id, 'Appointment rejected');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    }
  };

  const getStatusColor = (status: FamilyDoctorRequestStatus) => {
    switch (status) {
      case FamilyDoctorRequestStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case FamilyDoctorRequestStatus.APPROVED: return 'bg-green-100 text-green-800';
      case FamilyDoctorRequestStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-midnight-700';
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
        <h1 className="text-2xl font-bold text-midnight-900">{t('nav.requests')}</h1>
        <p className="text-midnight-600">{t('requests.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'appointments'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-100 text-midnight-600 hover:bg-slate-200'
          }`}
        >
          {t('requests.appointmentRequests')} ({pendingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('familyDoctor')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'familyDoctor'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-100 text-midnight-600 hover:bg-slate-200'
          }`}
        >
          {t('requests.familyDoctorRequests')} ({doctorRequests.filter(r => r.status === FamilyDoctorRequestStatus.PENDING).length})
        </button>
      </div>

      {/* Appointment Requests */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {pendingAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
              <p className="text-midnight-600">{t('requests.noAppointments')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingAppointments.map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-midnight-900">
                          {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                        </p>
                        <p className="text-sm text-midnight-600">
                          {new Date(apt.dateTime).toLocaleDateString()} - {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {apt.reason && (
                          <p className="text-sm text-midnight-500 mt-1">{apt.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveAppointment(apt.id)}
                        className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                        title={t('common.approve')}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleRejectAppointment(apt.id)}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                        title={t('common.reject')}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family Doctor Requests */}
      {activeTab === 'familyDoctor' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {doctorRequests.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
              <p className="text-midnight-600">{t('requests.noRequests')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {doctorRequests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-midnight-900">
                          {request.patient?.user?.firstName} {request.patient?.user?.lastName}
                        </p>
                        <p className="text-sm text-midnight-600">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        {request.requestReason && (
                          <p className="text-sm text-midnight-500 mt-1">{request.requestReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.status === FamilyDoctorRequestStatus.PENDING && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveFamilyRequest(request.id)}
                            className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                            title={t('common.approve')}
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleRejectFamilyRequest(request.id)}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            title={t('common.reject')}
                          >
                            <X size={18} />
                          </button>
                        </div>
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
