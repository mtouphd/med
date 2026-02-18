'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, StopCircle, AlertCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import { Medication, MedicationStatus, Allergy } from '@/types';

interface MedicationsSectionProps {
  patientId: string;
  medications: Medication[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (medicationId: string, data: any) => Promise<void>;
  onStop: (medicationId: string) => Promise<void>;
  onDelete: (medicationId: string) => Promise<void>;
  onCheckAllergy: (medicationName: string) => Promise<{ hasAllergy: boolean; allergies: Allergy[] }>;
  readOnly?: boolean;
}

export default function MedicationsSection({
  patientId,
  medications,
  onAdd,
  onUpdate,
  onStop,
  onDelete,
  onCheckAllergy,
  readOnly = false,
}: MedicationsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allergyWarning, setAllergyWarning] = useState<{ show: boolean; allergies: Allergy[] }>({
    show: false,
    allergies: [],
  });
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    prescribedBy: '',
    reason: '',
    notes: '',
  });

  const activeMedications = medications.filter((m) => m.status === MedicationStatus.ACTIVE);

  const checkAllergyForMedication = async (medicationName: string) => {
    if (!medicationName.trim()) return;
    const result = await onCheckAllergy(medicationName);
    if (result.hasAllergy) {
      setAllergyWarning({ show: true, allergies: result.allergies });
    } else {
      setAllergyWarning({ show: false, allergies: [] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allergyWarning.show && !confirm('This medication may trigger allergies. Do you want to proceed?')) {
      return;
    }
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      await onAdd(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      prescribedBy: '',
      reason: '',
      notes: '',
    });
    setShowForm(false);
    setAllergyWarning({ show: false, allergies: [] });
  };

  const handleEdit = (medication: Medication) => {
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: new Date(medication.startDate).toISOString().split('T')[0],
      endDate: medication.endDate ? new Date(medication.endDate).toISOString().split('T')[0] : '',
      prescribedBy: medication.prescribedBy || '',
      reason: medication.reason || '',
      notes: medication.notes || '',
    });
    setEditingId(medication.id);
    setShowForm(true);
  };

  const getStatusBadgeVariant = (status: MedicationStatus) => {
    switch (status) {
      case MedicationStatus.ACTIVE:
        return 'success';
      case MedicationStatus.STOPPED:
        return 'warning';
      case MedicationStatus.COMPLETED:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Medications</h3>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add Medication
          </button>
        )}
      </div>

      {activeMedications.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Active Medications</h4>
          <div className="space-y-1">
            {activeMedications.map((med) => (
              <div key={med.id} className="text-sm text-green-900">
                <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          {allergyWarning.show && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-yellow-900">Allergy Warning!</p>
                <p className="text-sm text-yellow-800">
                  Patient has allergies that may be triggered by this medication:
                </p>
                <ul className="text-sm text-yellow-900 mt-1 ml-4 list-disc">
                  {allergyWarning.allergies.map((allergy) => (
                    <li key={allergy.id}>{allergy.allergen} - {allergy.severity}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={(e) => checkAllergyForMedication(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 500mg"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
              <input
                type="text"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Twice daily"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescribed By</label>
              <input
                type="text"
                value={formData.prescribedBy}
                onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {medications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No medications recorded</p>
        ) : (
          medications.map((medication) => (
            <div
              key={medication.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{medication.name}</h4>
                  <Badge variant={getStatusBadgeVariant(medication.status)} size="sm">
                    {medication.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Dosage:</span> {medication.dosage}</p>
                  <p><span className="font-medium">Frequency:</span> {medication.frequency}</p>
                  <p><span className="font-medium">Start Date:</span> {new Date(medication.startDate).toLocaleDateString()}</p>
                  {medication.endDate && (
                    <p><span className="font-medium">End Date:</span> {new Date(medication.endDate).toLocaleDateString()}</p>
                  )}
                  {medication.prescribedBy && (
                    <p><span className="font-medium">Prescribed By:</span> {medication.prescribedBy}</p>
                  )}
                  {medication.reason && (
                    <p><span className="font-medium">Reason:</span> {medication.reason}</p>
                  )}
                  {medication.notes && (
                    <p className="mt-2 text-gray-600">{medication.notes}</p>
                  )}
                </div>
              </div>
              {!readOnly && (
                <div className="flex gap-2 ml-4">
                  {medication.status === MedicationStatus.ACTIVE && (
                    <button
                      onClick={() => onStop(medication.id)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Stop medication"
                    >
                      <StopCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(medication)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(medication.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
