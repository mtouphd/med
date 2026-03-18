'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { appointments, doctors, patients, users } from '@/lib/api';
import { DashboardStats, Doctor, User } from '@/types';
import { Users, Stethoscope, Calendar, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [patientsCount, setPatientsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, doctorsRes, patientsRes] = await Promise.all([
        appointments.getStats(),
        doctors.getAll(),
        patients.getAll(),
      ]);
      setStats(statsRes.data);
      setDoctorsCount(doctorsRes.data.length);
      setPatientsCount(patientsRes.data.length);
    } catch (error) {
      console.error('Error loading admin data:', error);
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
        <h1 className="text-2xl font-bold text-midnight-900">{t('admin.overview')}</h1>
        <p className="text-midnight-600">{t('admin.overviewSubtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-midnight-600">{t('admin.totalPatients')}</p>
              <p className="text-3xl font-bold text-midnight-900">{patientsCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-midnight-600">{t('admin.totalDoctors')}</p>
              <p className="text-3xl font-bold text-midnight-900">{doctorsCount}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-midnight-600">{t('appointments.title')}</p>
              <p className="text-3xl font-bold text-midnight-900">{stats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-teal-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-midnight-600">{t('appointments.status.completed')}</p>
              <p className="text-3xl font-bold text-green-600">{stats?.completed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-midnight-900 mb-4">{t('admin.appointmentStats')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-600" size={20} />
                <span className="text-midnight-700">{t('appointments.status.pending')}</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{stats?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-midnight-700">{t('appointments.status.confirmed')}</span>
              </div>
              <span className="text-xl font-bold text-green-600">{stats?.confirmed || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-blue-600" size={20} />
                <span className="text-midnight-700">{t('appointments.status.completed')}</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{stats?.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={20} />
                <span className="text-midnight-700">{t('appointments.status.cancelled')}</span>
              </div>
              <span className="text-xl font-bold text-red-600">{stats?.cancelled || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-midnight-900 mb-4">{t('admin.quickActions')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/patients" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Users className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-midnight-700">{t('admin.managePatients')}</p>
            </a>
            <a href="/admin/doctors" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Stethoscope className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-midnight-700">{t('admin.manageDoctors')}</p>
            </a>
            <a href="/appointments" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Calendar className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-midnight-700">{t('admin.viewAppointments')}</p>
            </a>
            <a href="/admin/settings" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <TrendingUp className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-midnight-700">{t('admin.settings')}</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
