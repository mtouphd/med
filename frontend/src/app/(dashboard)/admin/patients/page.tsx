'use client';

import { useEffect, useState } from 'react';
import { patients, appointments, doctors } from '@/lib/api';
import { Patient, Appointment, Doctor } from '@/types';
import ViewModeToggle, { ViewMode } from '@/components/ui/ViewModeToggle';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import MedicalRecordView from '@/components/medical-records/MedicalRecordView';
import { User, Mail, Phone, Calendar, MapPin, Plus, Edit2, Trash2, Users } from 'lucide-react';

export default function AdminPatientsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'medical' | 'appointments' | 'family'>('info');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
  });

  useEffect(() => {
    loadData();
    // Load view mode preference from localStorage
    const savedViewMode = localStorage.getItem('admin-patients-view-mode');
    if (savedViewMode) {
      setViewMode(savedViewMode as ViewMode);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsRes, doctorsRes] = await Promise.all([
        patients.getAll(),
        doctors.getAll(),
      ]);
      setPatientsList(patientsRes.data);
      setDoctorsList(doctorsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('admin-patients-view-mode', mode);
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
    setModalTab('info');

    // Load patient appointments
    try {
      const res = await appointments.getByPatientId(patient.id);
      setPatientAppointments(res.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await patients.create({
        user: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: 'PATIENT',
        },
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
      });

      // Reload data first
      await loadData();

      // Then close form and reset after successful reload
      setShowCreateForm(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
      });

      // Show success message
      alert('Patient created successfully!');
    } catch (error: any) {
      console.error('Error creating patient:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create patient. Please try again.';
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }

    try {
      await patients.delete(patientId);
      await loadData();
      if (selectedPatient?.id === patientId) {
        setShowModal(false);
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient');
    }
  };

  const handleAssignFamilyDoctor = async (doctorId: string) => {
    if (!selectedPatient) return;

    try {
      await patients.update(selectedPatient.id, { familyDoctorId: doctorId });
      await loadData();
      // Refresh selected patient
      const updatedPatient = patientsList.find(p => p.id === selectedPatient.id);
      if (updatedPatient) {
        setSelectedPatient(updatedPatient);
      }
    } catch (error) {
      console.error('Error assigning family doctor:', error);
      alert('Failed to assign family doctor');
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

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (patient) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="text-primary-600" size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {patient.user.firstName} {patient.user.lastName}
            </p>
            <p className="text-sm text-gray-500">{patient.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'age',
      label: 'Age',
      sortable: true,
      render: (patient) => <span className="text-gray-900">{calculateAge(patient.dateOfBirth)}</span>,
    },
    {
      key: 'address',
      label: 'Address',
      render: (patient) => (
        <span className="text-gray-700">{patient.address || 'Not specified'}</span>
      ),
    },
    {
      key: 'familyDoctor',
      label: 'Family Doctor',
      sortable: true,
      render: (patient) => (
        <span className="text-gray-900">{getFamilyDoctorName(patient)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (patient) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewPatient(patient)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDeletePatient(patient.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600 mt-1">Manage patient records and medical information</p>
        </div>
        <div className="flex items-center gap-4">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} />
            Add Patient
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Patient</h2>
          <form onSubmit={handleCreatePatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Name and phone number"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Creating...
                  </span>
                ) : (
                  'Create Patient'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Patients Display */}
      {patientsList.length === 0 && !loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first patient</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} />
            Add First Patient
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <DataTable
          data={patientsList}
          columns={columns}
          keyExtractor={(patient) => patient.id}
          loading={loading}
          emptyMessage="No patients found"
          onRowClick={handleViewPatient}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patientsList.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewPatient(patient)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
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

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPatient(patient);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePatient(patient.id);
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
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
                  { key: 'family' as const, label: 'Family Doctor' },
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
                    {patientAppointments.map((apt) => (
                      <div key={apt.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{apt.doctor.specialty}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(apt.dateTime).toLocaleString()}
                            </p>
                            {apt.reason && <p className="text-sm text-gray-700 mt-2">{apt.reason}</p>}
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

            {modalTab === 'family' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Family Doctor Assignment</h3>

                {selectedPatient.familyDoctor ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900 mb-2">Current Family Doctor</p>
                    <p className="font-semibold text-green-900">
                      Dr. {selectedPatient.familyDoctor.user.firstName} {selectedPatient.familyDoctor.user.lastName}
                    </p>
                    <p className="text-sm text-green-700">{selectedPatient.familyDoctor.specialty}</p>
                    <button
                      onClick={() => handleAssignFamilyDoctor('')}
                      className="mt-3 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Family Doctor
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600">No family doctor assigned</p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign/Change Family Doctor
                  </label>
                  <select
                    onChange={(e) => handleAssignFamilyDoctor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue=""
                  >
                    <option value="">Select a doctor...</option>
                    {doctorsList.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user.firstName} {doctor.user.lastName} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
