'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import Badge from '../ui/Badge';
import {
  MedicalCondition,
  MedicalConditionStatus,
} from '@/types';

interface ConditionsSectionProps {
  patientId: string;
  conditions: MedicalCondition[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (conditionId: string, data: any) => Promise<void>;
  onDelete: (conditionId: string) => Promise<void>;
  readOnly?: boolean;
}

export default function ConditionsSection({
  patientId,
  conditions,
  onAdd,
  onUpdate,
  onDelete,
  readOnly = false,
}: ConditionsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    diagnosedDate: '',
    status: MedicalConditionStatus.ACTIVE,
    notes: '',
  });

  const filteredConditions = showActiveOnly
    ? conditions.filter((c) => c.status === MedicalConditionStatus.ACTIVE)
    : conditions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      await onAdd(formData);
    }
    setFormData({ name: '', diagnosedDate: '', status: MedicalConditionStatus.ACTIVE, notes: '' });
    setShowForm(false);
  };

  const handleEdit = (condition: MedicalCondition) => {
    setFormData({
      name: condition.name,
      diagnosedDate: new Date(condition.diagnosedDate).toISOString().split('T')[0],
      status: condition.status,
      notes: condition.notes || '',
    });
    setEditingId(condition.id);
    setShowForm(true);
  };

  const getStatusBadgeVariant = (status: MedicalConditionStatus) => {
    switch (status) {
      case MedicalConditionStatus.ACTIVE:
        return 'danger';
      case MedicalConditionStatus.CHRONIC:
        return 'warning';
      case MedicalConditionStatus.MANAGED:
        return 'info';
      case MedicalConditionStatus.RESOLVED:
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Medical Conditions</h3>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            Active Only
          </label>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add Condition
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosed Date *</label>
              <input
                type="date"
                value={formData.diagnosedDate}
                onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MedicalConditionStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.values(MedicalConditionStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
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
                setFormData({ name: '', diagnosedDate: '', status: MedicalConditionStatus.ACTIVE, notes: '' });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {filteredConditions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No conditions recorded</p>
        ) : (
          filteredConditions.map((condition) => (
            <div
              key={condition.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{condition.name}</h4>
                  <Badge variant={getStatusBadgeVariant(condition.status)} size="sm">
                    {condition.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                </p>
                {condition.notes && (
                  <p className="text-sm text-gray-700 mt-2">{condition.notes}</p>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(condition)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(condition.id)}
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
