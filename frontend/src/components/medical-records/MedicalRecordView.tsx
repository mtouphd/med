'use client';

import { useState, useEffect } from 'react';
import { medicalRecords } from '@/lib/api';
import {
  MedicalRecord,
  MedicalCondition,
  Allergy,
  Medication,
  Vaccination,
} from '@/types';
import ConditionsSection from './ConditionsSection';
import AllergiesSection from './AllergiesSection';
import MedicationsSection from './MedicationsSection';
import VaccinationsSection from './VaccinationsSection';
import { Activity, AlertCircle, Pill, Syringe, FileText } from 'lucide-react';

interface MedicalRecordViewProps {
  patientId: string;
  readOnly?: boolean;
}

type TabKey = 'overview' | 'conditions' | 'allergies' | 'medications' | 'vaccinations';

export default function MedicalRecordView({ patientId, readOnly = false }: MedicalRecordViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  useEffect(() => {
    loadMedicalRecord();
  }, [patientId]);

  const loadMedicalRecord = async () => {
    try {
      setLoading(true);
      const [recordRes, conditionsRes, allergiesRes, medicationsRes, vaccinationsRes] = await Promise.all([
        medicalRecords.getMedicalRecord(patientId),
        medicalRecords.getConditions(patientId),
        medicalRecords.getAllergies(patientId),
        medicalRecords.getMedications(patientId),
        medicalRecords.getVaccinations(patientId),
      ]);

      setMedicalRecord(recordRes.data);
      setConditions(conditionsRes.data);
      setAllergies(allergiesRes.data);
      setMedications(medicationsRes.data);
      setVaccinations(vaccinationsRes.data);
    } catch (error) {
      console.error('Error loading medical record:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conditions handlers
  const handleAddCondition = async (data: any) => {
    await medicalRecords.addCondition(patientId, data);
    await loadMedicalRecord();
  };

  const handleUpdateCondition = async (conditionId: string, data: any) => {
    await medicalRecords.updateCondition(patientId, conditionId, data);
    await loadMedicalRecord();
  };

  const handleDeleteCondition = async (conditionId: string) => {
    if (confirm('Are you sure you want to delete this condition?')) {
      await medicalRecords.deleteCondition(patientId, conditionId);
      await loadMedicalRecord();
    }
  };

  // Allergies handlers
  const handleAddAllergy = async (data: any) => {
    await medicalRecords.addAllergy(patientId, data);
    await loadMedicalRecord();
  };

  const handleUpdateAllergy = async (allergyId: string, data: any) => {
    await medicalRecords.updateAllergy(patientId, allergyId, data);
    await loadMedicalRecord();
  };

  const handleDeleteAllergy = async (allergyId: string) => {
    if (confirm('Are you sure you want to delete this allergy?')) {
      await medicalRecords.deleteAllergy(patientId, allergyId);
      await loadMedicalRecord();
    }
  };

  // Medications handlers
  const handleAddMedication = async (data: any) => {
    await medicalRecords.addMedication(patientId, data);
    await loadMedicalRecord();
  };

  const handleUpdateMedication = async (medicationId: string, data: any) => {
    await medicalRecords.updateMedication(patientId, medicationId, data);
    await loadMedicalRecord();
  };

  const handleStopMedication = async (medicationId: string) => {
    if (confirm('Are you sure you want to stop this medication?')) {
      await medicalRecords.stopMedication(patientId, medicationId);
      await loadMedicalRecord();
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      await medicalRecords.deleteMedication(patientId, medicationId);
      await loadMedicalRecord();
    }
  };

  const handleCheckMedicationAllergy = async (medicationName: string) => {
    const res = await medicalRecords.checkMedicationAllergy(patientId, medicationName);
    return res.data;
  };

  // Vaccinations handlers
  const handleAddVaccination = async (data: any) => {
    await medicalRecords.addVaccination(patientId, data);
    await loadMedicalRecord();
  };

  const handleUpdateVaccination = async (vaccinationId: string, data: any) => {
    await medicalRecords.updateVaccination(patientId, vaccinationId, data);
    await loadMedicalRecord();
  };

  const handleDeleteVaccination = async (vaccinationId: string) => {
    if (confirm('Are you sure you want to delete this vaccination?')) {
      await medicalRecords.deleteVaccination(patientId, vaccinationId);
      await loadMedicalRecord();
    }
  };

  const tabs = [
    { key: 'overview' as TabKey, label: 'Overview', icon: FileText },
    { key: 'conditions' as TabKey, label: 'Conditions', icon: Activity, count: conditions.length },
    { key: 'allergies' as TabKey, label: 'Allergies', icon: AlertCircle, count: allergies.length },
    { key: 'medications' as TabKey, label: 'Medications', icon: Pill, count: medications.length },
    { key: 'vaccinations' as TabKey, label: 'Vaccinations', icon: Syringe, count: vaccinations.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">General Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                <p className="text-gray-900 font-semibold text-lg">
                  {medicalRecord?.bloodType || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organ Donor</label>
                <p className="text-gray-900 font-semibold text-lg">
                  {medicalRecord?.organDonor ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                <p className="text-gray-900 font-semibold text-lg">
                  {medicalRecord?.height ? `${medicalRecord.height} cm` : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <p className="text-gray-900 font-semibold text-lg">
                  {medicalRecord?.weight ? `${medicalRecord.weight} kg` : 'Not specified'}
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <Activity size={18} />
                  <span className="text-sm font-medium">Conditions</span>
                </div>
                <p className="text-2xl font-bold text-red-900">{conditions.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-600 mb-1">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">Allergies</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{allergies.length}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Pill size={18} />
                  <span className="text-sm font-medium">Medications</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{medications.length}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Syringe size={18} />
                  <span className="text-sm font-medium">Vaccinations</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{vaccinations.length}</p>
              </div>
            </div>

            {medicalRecord?.notes && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{medicalRecord.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'conditions' && (
          <ConditionsSection
            patientId={patientId}
            conditions={conditions}
            onAdd={handleAddCondition}
            onUpdate={handleUpdateCondition}
            onDelete={handleDeleteCondition}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'allergies' && (
          <AllergiesSection
            patientId={patientId}
            allergies={allergies}
            onAdd={handleAddAllergy}
            onUpdate={handleUpdateAllergy}
            onDelete={handleDeleteAllergy}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsSection
            patientId={patientId}
            medications={medications}
            onAdd={handleAddMedication}
            onUpdate={handleUpdateMedication}
            onStop={handleStopMedication}
            onDelete={handleDeleteMedication}
            onCheckAllergy={handleCheckMedicationAllergy}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'vaccinations' && (
          <VaccinationsSection
            patientId={patientId}
            vaccinations={vaccinations}
            onAdd={handleAddVaccination}
            onUpdate={handleUpdateVaccination}
            onDelete={handleDeleteVaccination}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
}
