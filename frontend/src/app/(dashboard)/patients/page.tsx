'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { doctors, medicalRecords } from '@/lib/api';
import { Patient, MedicalRecordSummary } from '@/types';
import { FolderOpen, User, FileText, Heart, Pill, Syringe, AlertTriangle } from 'lucide-react';
import { ViewToggle, PatientCard, ViewMode } from '@/components/ui';

interface PatientWithSummary extends Patient {
  medicalSummary?: MedicalRecordSummary;
}

export default function PatientsPage() {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<PatientWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('box');
  const [selectedPatient, setSelectedPatient] = useState<PatientWithSummary | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await doctors.getMyFamilyPatients();
      // Load medical summaries for all patients
      const patientsWithSummaries = await Promise.all(
        res.data.map(async (patient: Patient) => {
          try {
            const summaryRes = await medicalRecords.getSummary(patient.id);
            return { ...patient, medicalSummary: summaryRes.data };
          } catch {
            return patient;
          }
        })
      );
      setPatients(patientsWithSummaries);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient: PatientWithSummary) => {
    if (!patient.medicalSummary) {
      try {
        const res = await medicalRecords.getSummary(patient.id);
        const updatedPatient = { ...patient, medicalSummary: res.data };
        setSelectedPatient(updatedPatient);
        // Update in list too
        setPatients((prev) =>
          prev.map((p) => (p.id === patient.id ? updatedPatient : p))
        );
      } catch {
        setSelectedPatient(patient);
      }
    } else {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">{t('nav.patientFolder')}</h1>
          <p className="text-midnight-600">{t('patients.subtitle')}</p>
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <FolderOpen className="w-12 h-12 text-midnight-300 mx-auto mb-3" />
          <p className="text-midnight-600">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List/Grid */}
          <div className={viewMode === 'box' ? 'lg:col-span-2' : 'lg:col-span-1'}>
            {viewMode === 'box' ? (
              // Box view with 3D cards
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger-animation">
                {patients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    viewMode={viewMode}
                    isSelected={selectedPatient?.id === patient.id}
                    onSelect={handleSelectPatient}
                  />
                ))}
              </div>
            ) : (
              // List view
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="font-semibold text-midnight-900">{t('patients.myPatients')}</h2>
                </div>
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto stagger-animation">
                  {patients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      viewMode={viewMode}
                      isSelected={selectedPatient?.id === patient.id}
                      onSelect={handleSelectPatient}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Patient Details */}
          <div className={viewMode === 'box' ? 'lg:col-span-1' : 'lg:col-span-2'}>
            {selectedPatient ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden sticky top-6 animate-slide-up">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-primary-500 to-cyan-500">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="text-white">
                      <h2 className="text-xl font-semibold">
                        {selectedPatient.user?.firstName} {selectedPatient.user?.lastName}
                      </h2>
                      <p className="opacity-90">{selectedPatient.user?.email}</p>
                      {selectedPatient.user?.phone && (
                        <p className="text-sm opacity-75">{selectedPatient.user?.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedPatient.medicalSummary && (
                  <div className="p-6">
                    <h3 className="font-semibold text-midnight-900 mb-4">{t('patients.medicalSummary')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Heart className="w-5 h-5 text-red-500" />
                          </div>
                          <span className="text-sm text-slate-600">{t('medicalRecord.conditions')}</span>
                        </div>
                        <p className="text-3xl font-bold text-red-600">
                          {selectedPatient.medicalSummary.activeConditionsCount}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                          </div>
                          <span className="text-sm text-slate-600">{t('medicalRecord.allergies')}</span>
                        </div>
                        <p className="text-3xl font-bold text-orange-600">
                          {selectedPatient.medicalSummary.allergiesCount}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Pill className="w-5 h-5 text-blue-500" />
                          </div>
                          <span className="text-sm text-slate-600">{t('medicalRecord.medications')}</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                          {selectedPatient.medicalSummary.activeMedicationsCount}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Syringe className="w-5 h-5 text-green-500" />
                          </div>
                          <span className="text-sm text-slate-600">{t('medicalRecord.vaccinations')}</span>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                          {selectedPatient.medicalSummary.vaccinationsCount}
                        </p>
                      </div>
                    </div>

                    {selectedPatient.medicalSummary.bloodType && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white">
                        <p className="text-sm opacity-90">{t('medicalRecord.bloodType')}</p>
                        <p className="text-2xl font-bold">{selectedPatient.medicalSummary.bloodType}</p>
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
      )}
    </div>
  );
}
