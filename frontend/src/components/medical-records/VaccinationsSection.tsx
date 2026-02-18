'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { Vaccination } from '@/types';

interface VaccinationsSectionProps {
  patientId: string;
  vaccinations: Vaccination[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (vaccinationId: string, data: any) => Promise<void>;
  onDelete: (vaccinationId: string) => Promise<void>;
  readOnly?: boolean;
}

export default function VaccinationsSection({
  patientId,
  vaccinations,
  onAdd,
  onUpdate,
  onDelete,
  readOnly = false,
}: VaccinationsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vaccine: '',
    dateAdministered: '',
    administeredBy: '',
    nextDueDate: '',
    batchNumber: '',
    site: '',
    notes: '',
  });

  const upcomingBoosters = vaccinations.filter(
    (v) => v.nextDueDate && new Date(v.nextDueDate) > new Date()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      vaccine: '',
      dateAdministered: '',
      administeredBy: '',
      nextDueDate: '',
      batchNumber: '',
      site: '',
      notes: '',
    });
    setShowForm(false);
  };

  const handleEdit = (vaccination: Vaccination) => {
    setFormData({
      vaccine: vaccination.vaccine,
      dateAdministered: new Date(vaccination.dateAdministered).toISOString().split('T')[0],
      administeredBy: vaccination.administeredBy || '',
      nextDueDate: vaccination.nextDueDate
        ? new Date(vaccination.nextDueDate).toISOString().split('T')[0]
        : '',
      batchNumber: vaccination.batchNumber || '',
      site: vaccination.site || '',
      notes: vaccination.notes || '',
    });
    setEditingId(vaccination.id);
    setShowForm(true);
  };

  // Sort vaccinations by date (most recent first)
  const sortedVaccinations = [...vaccinations].sort(
    (a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Vaccinations</h3>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add Vaccination
          </button>
        )}
      </div>

      {upcomingBoosters.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-blue-600" size={20} />
            <h4 className="font-semibold text-blue-900">Upcoming Boosters</h4>
          </div>
          <div className="space-y-1">
            {upcomingBoosters.map((vac) => (
              <div key={vac.id} className="text-sm text-blue-900">
                <span className="font-medium">{vac.vaccine}</span> - Due:{' '}
                {new Date(vac.nextDueDate!).toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
              <input
                type="text"
                value={formData.vaccine}
                onChange={(e) => setFormData({ ...formData, vaccine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Administered *</label>
              <input
                type="date"
                value={formData.dateAdministered}
                onChange={(e) => setFormData({ ...formData, dateAdministered: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Administered By</label>
              <input
                type="text"
                value={formData.administeredBy}
                onChange={(e) => setFormData({ ...formData, administeredBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Administration Site</label>
              <input
                type="text"
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Left arm"
              />
            </div>
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
        {sortedVaccinations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No vaccinations recorded</p>
        ) : (
          sortedVaccinations.map((vaccination, index) => (
            <div
              key={vaccination.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:border-gray-300 transition-colors relative"
            >
              {/* Timeline indicator */}
              {index < sortedVaccinations.length - 1 && (
                <div className="absolute left-6 top-full h-6 w-0.5 bg-gray-300" />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0" />
                  <h4 className="font-semibold text-gray-900">{vaccination.vaccine}</h4>
                </div>
                <div className="ml-6 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(vaccination.dateAdministered).toLocaleDateString()}
                  </p>
                  {vaccination.administeredBy && (
                    <p><span className="font-medium">Administered By:</span> {vaccination.administeredBy}</p>
                  )}
                  {vaccination.nextDueDate && (
                    <p className="text-blue-600">
                      <span className="font-medium">Next Due:</span>{' '}
                      {new Date(vaccination.nextDueDate).toLocaleDateString()}
                    </p>
                  )}
                  {vaccination.batchNumber && (
                    <p><span className="font-medium">Batch #:</span> {vaccination.batchNumber}</p>
                  )}
                  {vaccination.site && (
                    <p><span className="font-medium">Site:</span> {vaccination.site}</p>
                  )}
                  {vaccination.notes && (
                    <p className="mt-2 text-gray-600">{vaccination.notes}</p>
                  )}
                </div>
              </div>
              {!readOnly && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(vaccination)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(vaccination.id)}
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
