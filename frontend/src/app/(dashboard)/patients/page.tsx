'use client';

import { useEffect, useState } from 'react';
import { appointments, patients } from '@/lib/api';
import { Patient, Appointment } from '@/types';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import MedicalRecordView from '@/components/medical-records/MedicalRecordView';
import { User, Mail, Phone, MapPin, Users, Search, Edit2 } from 'lucide-react';

export default function DoctorPatientsPage() {
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'medical' | 'appointments'>('info');
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const patientsRes = await patients.getAll();
      setPatientsList(patientsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
    setModalTab('info');

    try {
      const res = await appointments.getByPatientId(patient.id);
      setPatientAppointments(res.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const calculateAge = (dateOfBirth?: Date) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getFamilyDoctorName = (patient: Patient) => {
    if (!patient.familyDoctor) return 'None';
    return `Dr. ${patient.familyDoctor.user.firstName} ${patient.familyDoctor.user.lastName}`;
  };

  const filteredPatients = patientsList.filter((patient) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const name = `${patient.user.firstName} ${patient.user.lastName}`.toLowerCase();
    const email = patient.user.email.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Folder</h1>
        <p className="text-gray-600 mt-1">View patient records and medical information</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
        {searchQuery && ` found for "${searchQuery}"`}
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No matching patients' : 'No Patients Found'}
          </h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search' : 'No patients are available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewPatient(patient)}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="text-primary-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {patient.user.firstName} {patient.user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Age: {calculateAge(patient.dateOfBirth)}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span>{patient.user.email}</span>
                </div>
                {patient.user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{patient.user.phone}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span className="line-clamp-1">{patient.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={16} />
                  <span className="font-medium">{getFamilyDoctorName(patient)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPatient(patient);
                  }}
                  className="w-full px-3 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedPatient ? `${selectedPatient.user.firstName} ${selectedPatient.user.lastName}` : ''}
        size="2xl"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4">
                {[
                  { key: 'info' as const, label: 'Personal Info' },
                  { key: 'medical' as const, label: 'Medical Records' },
                  { key: 'appointments' as const, label: 'Appointments' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setModalTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      modalTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {modalTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <p className="text-gray-900">{selectedPatient.user.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <p className="text-gray-900">{selectedPatient.user.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedPatient.user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">{selectedPatient.user.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <p className="text-gray-900">
                      {selectedPatient.dateOfBirth
                        ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <p className="text-gray-900">{calculateAge(selectedPatient.dateOfBirth)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-900">{selectedPatient.address || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <p className="text-gray-900">{selectedPatient.emergencyContact || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Family Doctor</label>
                    <p className="text-gray-900">{getFamilyDoctorName(selectedPatient)}</p>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'medical' && (
              <MedicalRecordView patientId={selectedPatient.id} readOnly={false} />
            )}

            {modalTab === 'appointments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Appointment History</h3>
                {patientAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No appointments found</p>
                ) : (
                  <div className="space-y-3">
                    {patientAppointments
                      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                      .map((apt) => (
                      <div key={apt.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{apt.doctor?.specialty}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(apt.dateTime).toLocaleString()}
                            </p>
                            {apt.reason && <p className="text-sm text-gray-700 mt-2">{apt.reason}</p>}
                            {apt.notes && (
                              <div className="mt-2 bg-blue-50 rounded p-2">
                                <p className="text-xs font-medium text-blue-700">Notes:</p>
                                <p className="text-sm text-blue-900">{apt.notes}</p>
                              </div>
                            )}
                            {apt.medications && (
                              <div className="mt-2 bg-green-50 rounded p-2">
                                <p className="text-xs font-medium text-green-700">Medications:</p>
                                <p className="text-sm text-green-900">{apt.medications}</p>
                              </div>
                            )}
                          </div>
                          <Badge variant={apt.status === 'COMPLETED' ? 'success' : apt.status === 'CONFIRMED' ? 'info' : 'warning'}>
                            {apt.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
