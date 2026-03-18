'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { patients, users } from '@/lib/api';
import { Patient } from '@/types';
import { UserPlus, Search, Trash2, Mail, Phone, Calendar } from 'lucide-react';

export default function AdminPatientsPage() {
  const { t } = useLanguage();
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patientsList.filter(
        (p) =>
          p.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patientsList);
    }
  }, [searchTerm, patientsList]);

  const loadPatients = async () => {
    try {
      const res = await patients.getAll();
      setPatientsList(res.data);
      setFilteredPatients(res.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await patients.delete(id);
      loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
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
          <h1 className="text-2xl font-bold text-midnight-900">{t('admin.managePatients')}</h1>
          <p className="text-midnight-600">{t('admin.patientsSubtitle')}</p>
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

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
            <p className="text-midnight-600">{t('common.noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-start px-6 py-4 text-sm font-medium text-midnight-600">{t('auth.firstName')}</th>
                  <th className="text-start px-6 py-4 text-sm font-medium text-midnight-600">{t('auth.lastName')}</th>
                  <th className="text-start px-6 py-4 text-sm font-medium text-midnight-600">{t('auth.email')}</th>
                  <th className="text-start px-6 py-4 text-sm font-medium text-midnight-600">{t('patients.phone')}</th>
                  <th className="text-start px-6 py-4 text-sm font-medium text-midnight-600">{t('patients.familyDoctor')}</th>
                  <th className="text-end px-6 py-4 text-sm font-medium text-midnight-600">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {patient.user?.firstName?.[0]}{patient.user?.lastName?.[0]}
                          </span>
                        </div>
                        <span className="font-medium text-midnight-900">{patient.user?.firstName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-midnight-700">{patient.user?.lastName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-midnight-600">
                        <Mail size={14} />
                        {patient.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {patient.user?.phone ? (
                        <div className="flex items-center gap-2 text-midnight-600">
                          <Phone size={14} />
                          {patient.user?.phone}
                        </div>
                      ) : (
                        <span className="text-midnight-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {patient.familyDoctor ? (
                        <span className="text-midnight-700">
                          Dr. {patient.familyDoctor.user?.firstName} {patient.familyDoctor.user?.lastName}
                        </span>
                      ) : (
                        <span className="text-midnight-400">{t('patients.noFamilyDoctor')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
