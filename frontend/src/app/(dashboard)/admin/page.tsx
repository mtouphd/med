'use client';

import { useEffect, useState } from 'react';
import { users, doctors, appointments } from '@/lib/api';
import { DashboardStats, User, Doctor } from '@/types';
import { Trash2, Plus, Users as UsersIcon, Calendar, Stethoscope, CheckCircle } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialty: '',
    licenseNumber: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        appointments.getStats(),
        users.getAll(),
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doctors.create({
        user: {
          email: doctorForm.email,
          password: doctorForm.password,
          firstName: doctorForm.firstName,
          lastName: doctorForm.lastName,
          role: 'DOCTOR',
        },
        specialty: doctorForm.specialty,
        licenseNumber: doctorForm.licenseNumber,
      });
      setMessage('Doctor created successfully!');
      setShowDoctorForm(false);
      setDoctorForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        specialty: '',
        licenseNumber: '',
      });
      loadData();
    } catch (err) {
      console.error('Error creating doctor:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await users.delete(id);
      loadData();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
      <p className="text-gray-500 mb-8">Manage users and system settings</p>

      {message && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{message}</div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="text-primary-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{usersList.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Users Management</h2>
          <button
            onClick={() => setShowDoctorForm(true)}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus size={18} />
            Add Doctor
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersList.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'DOCTOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDoctorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Doctor</h2>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={doctorForm.firstName}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, firstName: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={doctorForm.lastName}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, lastName: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <input
                type="email"
                placeholder="Email"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={doctorForm.password}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, password: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
                minLength={6}
              />

              <input
                type="text"
                placeholder="Specialty"
                value={doctorForm.specialty}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, specialty: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />

              <input
                type="text"
                placeholder="License Number"
                value={doctorForm.licenseNumber}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, licenseNumber: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDoctorForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Create Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
