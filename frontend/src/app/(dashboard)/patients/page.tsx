'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors, medicalRecords } from '@/lib/api';
import { Patient, MedicalRecordSummary } from '@/types';
import { FolderOpen, User, FileText, Heart, Pill, Syringe, AlertTriangle } from 'lucide-react';

interface PatientWithSummary extends Patient {
  medicalSummary?: MedicalRecordSummary;
}

export default function PatientsPage() {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<PatientWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithSummary | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await doctors.getMyFamilyPatients();
      setPatients(res.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientSummary = async (patient: PatientWithSummary) => {
    try {
      const res = await medicalRecords.getSummary(patient.id);
      setSelectedPatient({ ...patient, medicalSummary: res.data });
    } catch (error) {
      console.error('Error loading medical summary:', error);
      setSelectedPatient(patient);
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
        <h1 className="text-2xl font-bold text-midnight-900">{t('nav.patientFolder')}</h1>
        <p className="text-midnight-600">{t('patients.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-midnight-900">{t('patients.myPatients')}</h2>
            </div>
            {patients.length === 0 ? (
              <div className="p-8 text-center">
                <FolderOpen className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
                <p className="text-midnight-600">{t('common.noData')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => loadPatientSummary(patient)}
                    className={`w-full p-4 text-start hover:bg-slate-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {patient.user?.firstName?.[0]}{patient.user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-midnight-900">
                          {patient.user?.firstName} {patient.user?.lastName}
                        </p>
                        <p className="text-sm text-midnight-500">{patient.user?.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-midnight-900">
                      {selectedPatient.user?.firstName} {selectedPatient.user?.lastName}
                    </h2>
                    <p className="text-midnight-600">{selectedPatient.user?.email}</p>
                    {selectedPatient.user?.phone && (
                      <p className="text-midnight-500 text-sm">{selectedPatient.user?.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedPatient.medicalSummary && (
                <div className="p-6">
                  <h3 className="font-semibold text-midnight-900 mb-4">{t('patients.medicalSummary')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-midnight-600">{t('medicalRecord.conditions')}</span>
                      </div>
                      <p className="text-2xl font-bold text-midnight-900">
                        {selectedPatient.medicalSummary.activeConditionsCount}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span className="text-sm text-midnight-600">{t('medicalRecord.allergies')}</span>
                      </div>
                      <p className="text-2xl font-bold text-midnight-900">
                        {selectedPatient.medicalSummary.allergiesCount}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-midnight-600">{t('medicalRecord.medications')}</span>
                      </div>
                      <p className="text-2xl font-bold text-midnight-900">
                        {selectedPatient.medicalSummary.activeMedicationsCount}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Syringe className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-midnight-600">{t('medicalRecord.vaccinations')}</span>
                      </div>
                      <p className="text-2xl font-bold text-midnight-900">
                        {selectedPatient.medicalSummary.vaccinationsCount}
                      </p>
                    </div>
                  </div>

                  {selectedPatient.medicalSummary.bloodType && (
                    <div className="mt-4 p-4 bg-red-50 rounded-xl">
                      <p className="text-sm text-midnight-600">{t('medicalRecord.bloodType')}</p>
                      <p className="text-lg font-bold text-red-600">{selectedPatient.medicalSummary.bloodType}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
              <FileText className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
              <p className="text-midnight-600">{t('patients.selectPatient')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
