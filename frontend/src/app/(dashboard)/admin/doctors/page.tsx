'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors } from '@/lib/api';
import { Doctor } from '@/types';
import { UserCog, Search, Trash2, Mail, MapPin, Clock, Edit } from 'lucide-react';

export default function AdminDoctorsPage() {
  const { t } = useLanguage();
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = doctorsList.filter(
        (d) =>
          d.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctorsList);
    }
  }, [searchTerm, doctorsList]);

  const loadDoctors = async () => {
    try {
      const res = await doctors.getAll();
      setDoctorsList(res.data);
      setFilteredDoctors(res.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await doctors.delete(id);
      loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
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
          <h1 className="text-2xl font-bold text-midnight-900">{t('admin.manageDoctors')}</h1>
          <p className="text-midnight-600">{t('admin.doctorsSubtitle')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-midnight-400" size={20} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <UserCog className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
          <p className="text-midnight-600">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-lg">
                        {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-midnight-900">
                        Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                      </h3>
                      <p className="text-primary-600 text-sm">{doctor.specialty}</p>
                      <p className="text-midnight-500 text-sm flex items-center gap-1 mt-1">
                        <Mail size={14} />
                        {doctor.user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {doctor.address && (
                    <p className="flex items-center gap-2 text-midnight-600">
                      <MapPin size={14} />
                      {doctor.address}
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-midnight-600">
                    <Clock size={14} />
                    {doctor.consultationDuration} min {t('doctors.perConsultation')}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    doctor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {doctor.isAvailable ? t('doctors.available') : t('doctors.unavailable')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(doctor.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
