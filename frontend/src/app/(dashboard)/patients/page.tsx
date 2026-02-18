'use client';

import { useEffect, useState } from 'react';
import { appointments, patients, users } from '@/lib/api';
import { DoctorPatient, AppointmentStatus, Patient, UserRole } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { User, Calendar, FileText, Pill, Plus, Trash2, X } from 'lucide-react';

interface PatientWithNotes extends DoctorPatient {
  medicalNotes?: string;
}

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const [patientsList, setPatientsList] = useState<PatientWithNotes[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithNotes | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
  });
  const [patientNotes, setPatientNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await patients.getAll();
      const patientsData = res.data;
      
      const patientsWithNotes: PatientWithNotes[] = await Promise.all(
        patientsData.map(async (patient: Patient) => {
          try {
            const aptRes = await appointments.getByPatientId(patient.id);
            return {
              id: patient.id,
              user: patient.user,
              appointments: aptRes.data,
              lastVisit: aptRes.data.length > 0 
                ? new Date(Math.max(...aptRes.data.map((a: any) => new Date(a.dateTime).getTime())))
                : null,
              medicalNotes: (patient as any).medicalNotes || '',
            };
          } catch {
            return {
              id: patient.id,
              user: patient.user,
              appointments: [],
              lastVisit: null,
              medicalNotes: (patient as any).medicalNotes || '',
            };
          }
        })
      );
      setPatientsList(patientsWithNotes);
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

  const handleCreatePatient = async () => {
    try {
      await users.create({
        email: newPatient.email,
        password: newPatient.password,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        role: 'PATIENT',
      });
      setMessage('Patient created successfully!');
      setShowAddModal(false);
      setNewPatient({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
        medicalHistory: '',
      });
      loadPatients();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error creating patient');
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }
    try {
      await users.delete(patientId);
      setMessage('Patient deleted successfully!');
      loadPatients();
    } catch (err) {
      console.error('Error deleting patient:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedPatient) return;
    try {
      await patients.update(selectedPatient.id, {
        medicalHistory: patientNotes,
      });
      setMessage('Notes saved successfully!');
      setShowNotesModal(false);
      loadPatients();
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Folder</h1>
          <p className="text-gray-500">Manage your patients and their medical records</p>
        </div>
        {user?.role === UserRole.DOCTOR && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add Patient
          </button>
        )}
      </div>

      {message && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{message}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patientsList.map((patient) => (
          <div
            key={patient.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="text-primary-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {patient.user.firstName} {patient.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{patient.user.email}</p>
                </div>
              </div>
              {user?.role === UserRole.DOCTOR && (
                <button
                  onClick={() => handleDeletePatient(patient.user.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete patient"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {patient.medicalNotes && (
                <p className="line-clamp-2">
                  <span className="font-medium">Notes:</span> {patient.medicalNotes}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{patient.appointments.length} visits</span>
                </div>
                {patient.lastVisit && (
                  <div className="text-gray-500">
                    Last: {new Date(patient.lastVisit).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedPatient(patient);
                  setShowNotesModal(true);
                  setPatientNotes(patient.medicalNotes || '');
                }}
                className="flex-1 bg-primary-50 text-primary-600 py-2 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Notes
              </button>
              <button
                onClick={() => setSelectedPatient(patient)}
                className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                History
              </button>
            </div>
          </div>
        ))}
      </div>

      {patientsList.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
          No patients found
        </div>
      )}

      {selectedPatient && !showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                </h2>
                <p className="text-gray-500">{selectedPatient.user.email}</p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedPatient.appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No appointments</div>
              ) : (
                selectedPatient.appointments
                  .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="text-gray-400" size={18} />
                          <div>
                            <div className="font-medium">
                              {new Date(apt.dateTime).toLocaleDateString()} at{' '}
                              {new Date(apt.dateTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="text-sm text-gray-500">{apt.duration} minutes</div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>

                      {apt.reason && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <FileText size={14} />
                            Reason
                          </div>
                          <p className="text-sm text-gray-600 pl-6">{apt.reason}</p>
                        </div>
                      )}

                      {apt.notes && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <FileText size={14} />
                            Doctor Notes
                          </div>
                          <p className="text-sm text-gray-600 pl-6">{apt.notes}</p>
                        </div>
                      )}

                      {apt.medications && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <Pill size={14} />
                            Medications
                          </div>
                          <p className="text-sm text-gray-600 pl-6">{apt.medications}</p>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {showNotesModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Medical Notes - {selectedPatient.user.firstName} {selectedPatient.user.lastName}
              </h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical History & Notes
              </label>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg"
                rows={8}
                placeholder="Write medical notes, observations, diagnosis..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl w-full max-w-md my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Add New Patient
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  placeholder="patient@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newPatient.password}
                  onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  placeholder="******"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  placeholder="123 Main St, City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={newPatient.emergencyContact}
                  onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePatient}
                disabled={!newPatient.email || !newPatient.password || !newPatient.firstName || !newPatient.lastName}
                className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
