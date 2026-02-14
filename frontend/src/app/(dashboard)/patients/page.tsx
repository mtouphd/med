'use client';

import { useEffect, useState } from 'react';
import { appointments } from '@/lib/api';
import { DoctorPatient, AppointmentStatus } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { User, Calendar, FileText, Pill } from 'lucide-react';

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await appointments.getDoctorPatients();
      setPatients(res.data);
    } catch (err) {
      console.error('Error loading patients:', err);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Patients</h1>
      <p className="text-gray-500 mb-8">View your patients and their appointment history</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-4">
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

            <div className="flex items-center justify-between text-sm">
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

            <button
              onClick={() => setSelectedPatient(patient)}
              className="mt-4 w-full bg-primary-50 text-primary-600 py-2 rounded-lg hover:bg-primary-100 transition-colors"
            >
              View History
            </button>
          </div>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
          No patients found
        </div>
      )}

      {selectedPatient && (
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
                ✕
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
    </div>
  );
}
