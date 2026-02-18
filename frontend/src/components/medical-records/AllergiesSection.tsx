'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import Badge from '../ui/Badge';
import { Allergy, AllergyType, AllergySeverity } from '@/types';

interface AllergiesSectionProps {
  patientId: string;
  allergies: Allergy[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (allergyId: string, data: any) => Promise<void>;
  onDelete: (allergyId: string) => Promise<void>;
  readOnly?: boolean;
}

export default function AllergiesSection({
  patientId,
  allergies,
  onAdd,
  onUpdate,
  onDelete,
  readOnly = false,
}: AllergiesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    allergen: '',
    type: AllergyType.MEDICATION,
    severity: AllergySeverity.MODERATE,
    reaction: '',
    diagnosedDate: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      await onAdd(formData);
    }
    setFormData({
      allergen: '',
      type: AllergyType.MEDICATION,
      severity: AllergySeverity.MODERATE,
      reaction: '',
      diagnosedDate: '',
      notes: '',
    });
    setShowForm(false);
  };

  const handleEdit = (allergy: Allergy) => {
    setFormData({
      allergen: allergy.allergen,
      type: allergy.type,
      severity: allergy.severity,
      reaction: allergy.reaction || '',
      diagnosedDate: allergy.diagnosedDate
        ? new Date(allergy.diagnosedDate).toISOString().split('T')[0]
        : '',
      notes: allergy.notes || '',
    });
    setEditingId(allergy.id);
    setShowForm(true);
  };

  const getSeverityBadgeVariant = (severity: AllergySeverity) => {
    switch (severity) {
      case AllergySeverity.LIFE_THREATENING:
        return 'danger';
      case AllergySeverity.SEVERE:
        return 'warning';
      case AllergySeverity.MODERATE:
        return 'info';
      case AllergySeverity.MILD:
        return 'success';
      default:
        return 'default';
    }
  };

  const criticalAllergies = allergies.filter(
    (a) => a.severity === AllergySeverity.LIFE_THREATENING || a.severity === AllergySeverity.SEVERE
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Allergies</h3>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add Allergy
          </button>
        )}
      </div>

      {criticalAllergies.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600" size={20} />
            <h4 className="font-semibold text-red-900">Critical Allergies</h4>
          </div>
          <div className="space-y-2">
            {criticalAllergies.map((allergy) => (
              <div key={allergy.id} className="text-sm text-red-900">
                <span className="font-medium">{allergy.allergen}</span> - {allergy.type}
                {allergy.reaction && ` (${allergy.reaction})`}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergen *</label>
              <input
                type="text"
                value={formData.allergen}
                onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AllergyType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Object.values(AllergyType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as AllergySeverity })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Object.values(AllergySeverity).map((severity) => (
                  <option key={severity} value={severity}>
                    {severity.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosed Date</label>
              <input
                type="date"
                value={formData.diagnosedDate}
                onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reaction</label>
            <input
              type="text"
              value={formData.reaction}
              onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Rash, swelling, difficulty breathing"
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
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  allergen: '',
                  type: AllergyType.MEDICATION,
                  severity: AllergySeverity.MODERATE,
                  reaction: '',
                  diagnosedDate: '',
                  notes: '',
                });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {allergies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No allergies recorded</p>
        ) : (
          allergies.map((allergy) => (
            <div
              key={allergy.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{allergy.allergen}</h4>
                  <Badge variant={getSeverityBadgeVariant(allergy.severity)} size="sm">
                    {allergy.severity.replace('_', ' ')}
                  </Badge>
                  <Badge variant="default" size="sm">
                    {allergy.type}
                  </Badge>
                </div>
                {allergy.reaction && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Reaction:</span> {allergy.reaction}
                  </p>
                )}
                {allergy.diagnosedDate && (
                  <p className="text-sm text-gray-600">
                    Diagnosed: {new Date(allergy.diagnosedDate).toLocaleDateString()}
                  </p>
                )}
                {allergy.notes && (
                  <p className="text-sm text-gray-700 mt-2">{allergy.notes}</p>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(allergy)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(allergy.id)}
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
