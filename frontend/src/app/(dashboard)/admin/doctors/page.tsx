'use client';

import { useEffect, useState } from 'react';
import { doctors, patients, appointments } from '@/lib/api';
import { Doctor, Patient, Appointment } from '@/types';
import ViewModeToggle, { ViewMode } from '@/components/ui/ViewModeToggle';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ScheduleEditor from '@/components/doctors/ScheduleEditor';
import { User, Mail, Phone, MapPin, Stethoscope, FileText, Calendar, Users, Plus, Edit2, Trash2, Award } from 'lucide-react';

export default function AdminDoctorsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'schedule' | 'office' | 'patients' | 'stats'>('profile');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [familyPatients, setFamilyPatients] = useState<Patient[]>([]);
  const [doctorStats, setDoctorStats] = useState({ totalAppointments: 0, completedAppointments: 0, familyPatientsCount: 0 });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    bio: '',
    address: '',
    consultationDuration: 30,
    maxFamilyPatients: 50,
  });

  useEffect(() => {
    loadData();
    // Load view mode preference
    const savedViewMode = localStorage.getItem('admin-doctors-view-mode');
    if (savedViewMode) {
      setViewMode(savedViewMode as ViewMode);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [doctorsRes, patientsRes] = await Promise.all([
        doctors.getAll(),
        patients.getAll(),
      ]);
      setDoctorsList(doctorsRes.data);
      setPatientsList(patientsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('admin-doctors-view-mode', mode);
  };

  const handleViewDoctor = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
    setModalTab('profile');

    // Load doctor's family patients
    const familyPats = patientsList.filter(p => p.familyDoctorId === doctor.id);
    setFamilyPatients(familyPats);

    // Load stats
    try {
      const res = await appointments.getAll();
      const doctorAppointments = res.data.filter((apt: Appointment) => apt.doctorId === doctor.id);
      const completed = doctorAppointments.filter((apt: Appointment) => apt.status === 'COMPLETED');
      setDoctorStats({
        totalAppointments: doctorAppointments.length,
        completedAppointments: completed.length,
        familyPatientsCount: familyPats.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doctors.create({
        user: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: 'DOCTOR',
        },
        specialty: formData.specialty,
        licenseNumber: formData.licenseNumber,
        bio: formData.bio,
        address: formData.address,
        consultationDuration: formData.consultationDuration,
        maxFamilyPatients: formData.maxFamilyPatients,
      });

      setShowCreateForm(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        specialty: '',
        licenseNumber: '',
        bio: '',
        address: '',
        consultationDuration: 30,
        maxFamilyPatients: 50,
      });
      await loadData();
    } catch (error) {
      console.error('Error creating doctor:', error);
      alert('Failed to create doctor');
    }
  };

  const handleUpdateDoctor = async (updates: Partial<Doctor>) => {
    if (!selectedDoctor) return;

    try {
      await doctors.update(selectedDoctor.id, updates);
      await loadData();
      const updatedDoctor = doctorsList.find(d => d.id === selectedDoctor.id);
      if (updatedDoctor) {
        setSelectedDoctor(updatedDoctor);
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Failed to update doctor');
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      return;
    }

    try {
      await doctors.delete(doctorId);
      await loadData();
      if (selectedDoctor?.id === doctorId) {
        setShowModal(false);
        setSelectedDoctor(null);
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  };

  const handleToggleAvailability = async (doctor: Doctor) => {
    try {
      await doctors.update(doctor.id, { isAvailable: !doctor.isAvailable });
      await loadData();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleSaveSchedule = async (schedule: any) => {
    if (!selectedDoctor) return;
    await doctors.updateSchedule(selectedDoctor.id, schedule);
    await loadData();
    const updatedDoctor = doctorsList.find(d => d.id === selectedDoctor.id);
    if (updatedDoctor) {
      setSelectedDoctor(updatedDoctor);
    }
  };

  const getFamilyPatientsCount = (doctor: Doctor) => {
    return patientsList.filter(p => p.familyDoctorId === doctor.id).length;
  };

  const columns: Column<Doctor>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (doctor) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Stethoscope className="text-primary-600" size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              Dr. {doctor.user.firstName} {doctor.user.lastName}
            </p>
            <p className="text-sm text-gray-500">{doctor.specialty}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'licenseNumber',
      label: 'License',
      render: (doctor) => <span className="text-gray-700">{doctor.licenseNumber}</span>,
    },
    {
      key: 'address',
      label: 'Office',
      render: (doctor) => <span className="text-gray-700">{doctor.address || 'Not specified'}</span>,
    },
    {
      key: 'isAvailable',
      label: 'Status',
      sortable: true,
      render: (doctor) => (
        <Badge variant={doctor.isAvailable ? 'success' : 'warning'}>
          {doctor.isAvailable ? 'Available' : 'Unavailable'}
        </Badge>
      ),
    },
    {
      key: 'familyPatients',
      label: 'Family Patients',
      sortable: true,
      render: (doctor) => (
        <span className="text-gray-900">
          {getFamilyPatientsCount(doctor)}{doctor.maxFamilyPatients ? ` / ${doctor.maxFamilyPatients}` : ''}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (doctor) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDoctor(doctor)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteDoctor(doctor.id)}
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
          <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-600 mt-1">Manage doctor profiles, schedules, and availability</p>
        </div>
        <div className="flex items-center gap-4">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Doctor</h2>
          <form onSubmit={handleCreateDoctor} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Duration (min)</label>
                <input
                  type="number"
                  value={formData.consultationDuration}
                  onChange={(e) => setFormData({ ...formData, consultationDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min={15}
                  step={15}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Family Patients</label>
                <input
                  type="number"
                  value={formData.maxFamilyPatients}
                  onChange={(e) => setFormData({ ...formData, maxFamilyPatients: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min={1}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Create Doctor
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors Display */}
      {viewMode === 'list' ? (
        <DataTable
          data={doctorsList}
          columns={columns}
          keyExtractor={(doctor) => doctor.id}
          loading={loading}
          emptyMessage="No doctors found"
          onRowClick={handleViewDoctor}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctorsList.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDoctor(doctor)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Stethoscope className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </h3>
                    <p className="text-sm text-primary-600">{doctor.specialty}</p>
                  </div>
                </div>
                <Badge variant={doctor.isAvailable ? 'success' : 'warning'} size="sm">
                  {doctor.isAvailable ? 'Available' : 'Busy'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Award size={16} />
                  <span>License: {doctor.licenseNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span>{doctor.user.email}</span>
                </div>
                {doctor.user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{doctor.user.phone}</span>
                  </div>
                )}
                {doctor.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span className="line-clamp-1">{doctor.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={16} />
                  <span>
                    Family Patients: {getFamilyPatientsCount(doctor)}
                    {doctor.maxFamilyPatients && ` / ${doctor.maxFamilyPatients}`}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAvailability(doctor);
                  }}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                    doctor.isAvailable
                      ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {doctor.isAvailable ? 'Set Unavailable' : 'Set Available'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDoctor(doctor.id);
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

      {/* Doctor Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedDoctor ? `Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}` : ''}
        size="2xl"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4">
                {[
                  { key: 'profile' as const, label: 'Profile', icon: User },
                  { key: 'schedule' as const, label: 'Schedule', icon: Calendar },
                  { key: 'office' as const, label: 'Office', icon: MapPin },
                  { key: 'patients' as const, label: 'Family Patients', icon: Users },
                  { key: 'stats' as const, label: 'Statistics', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setModalTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        modalTab === tab.key
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            {modalTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <p className="text-gray-900">{selectedDoctor.user.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <p className="text-gray-900">{selectedDoctor.user.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedDoctor.user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">{selectedDoctor.user.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                    <p className="text-gray-900">{selectedDoctor.specialty}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <p className="text-gray-900">{selectedDoctor.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Duration</label>
                    <p className="text-gray-900">{selectedDoctor.consultationDuration} minutes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Family Patients</label>
                    <p className="text-gray-900">{selectedDoctor.maxFamilyPatients || 'Unlimited'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <Badge variant={selectedDoctor.isAvailable ? 'success' : 'warning'}>
                      {selectedDoctor.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
                {selectedDoctor.bio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedDoctor.bio}</p>
                  </div>
                )}
              </div>
            )}

            {modalTab === 'schedule' && (
              <ScheduleEditor
                initialSchedule={selectedDoctor.schedule}
                onSave={handleSaveSchedule}
              />
            )}

            {modalTab === 'office' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                  <input
                    type="text"
                    defaultValue={selectedDoctor.address || ''}
                    onBlur={(e) => handleUpdateDoctor({ address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter office address"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Update the office/clinic location where this doctor practices.
                </p>
              </div>
            )}

            {modalTab === 'patients' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Family Patients ({familyPatients.length})
                </h3>
                {familyPatients.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No family patients assigned</p>
                ) : (
                  <div className="space-y-2">
                    {familyPatients.map((patient) => (
                      <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-900">
                          {patient.user.firstName} {patient.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{patient.user.email}</p>
                        {patient.user.phone && (
                          <p className="text-sm text-gray-600">{patient.user.phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {modalTab === 'stats' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Total Appointments</p>
                    <p className="text-3xl font-bold text-blue-900">{doctorStats.totalAppointments}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-900">{doctorStats.completedAppointments}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">Family Patients</p>
                    <p className="text-3xl font-bold text-purple-900">{doctorStats.familyPatientsCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
