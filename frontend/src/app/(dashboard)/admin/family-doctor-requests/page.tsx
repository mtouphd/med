'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { familyDoctorRequests } from '@/lib/api';
import { FamilyDoctorRequest, FamilyDoctorRequestStatus } from '@/types';
import { Heart, Check, X, Clock, User, Stethoscope } from 'lucide-react';

export default function FamilyDoctorRequestsPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<FamilyDoctorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await familyDoctorRequests.getAll();
      setRequests(res.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await familyDoctorRequests.approve(id);
      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt(t('admin.enterRejectionReason'));
    if (!reason) return;
    try {
      await familyDoctorRequests.reject(id, reason);
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
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

  const getStatusLabel = (status: FamilyDoctorRequestStatus) => {
    switch (status) {
      case FamilyDoctorRequestStatus.PENDING: return t('appointments.status.pending');
      case FamilyDoctorRequestStatus.APPROVED: return t('admin.approved');
      case FamilyDoctorRequestStatus.REJECTED: return t('admin.rejected');
      default: return status;
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status.toLowerCase() === filter;
  });

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
        <h1 className="text-2xl font-bold text-midnight-900">{t('nav.doctorRequests')}</h1>
        <p className="text-midnight-600">{t('admin.doctorRequestsSubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 text-midnight-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? t('common.all') : getStatusLabel(f.toUpperCase() as FamilyDoctorRequestStatus)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
            <p className="text-midnight-600">{t('common.noData')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-midnight-400" />
                          <span className="font-medium text-midnight-900">
                            {request.patient?.user?.firstName} {request.patient?.user?.lastName}
                          </span>
                        </div>
                        <span className="text-midnight-400">→</span>
                        <div className="flex items-center gap-2">
                          <Stethoscope size={16} className="text-midnight-400" />
                          <span className="font-medium text-midnight-900">
                            Dr. {request.doctor?.user?.firstName} {request.doctor?.user?.lastName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-midnight-500">
                        <Clock size={14} />
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                      {request.requestReason && (
                        <p className="text-sm text-midnight-600 mt-2 bg-slate-50 p-2 rounded-lg">
                          {request.requestReason}
                        </p>
                      )}
                      {request.responseReason && (
                        <p className="text-sm text-midnight-600 mt-2 bg-yellow-50 p-2 rounded-lg">
                          <strong>{t('admin.response')}:</strong> {request.responseReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                    {request.status === FamilyDoctorRequestStatus.PENDING && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                          title={t('common.approve')}
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
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
    </div>
  );
}
