import axios from 'axios';
import {
  AuthResponse,
  User,
  Doctor,
  Appointment,
  DashboardStats,
  MedicalRecord,
  MedicalRecordSummary,
  MedicalCondition,
  SystemSetting,
  Allergy,
  Medication,
  Vaccination,
  FamilyDoctorRequest,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const auth = {
  register: (data: any) => api.post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  getProfile: () => api.get<User>('/auth/profile'),
};

export const doctors = {
  getAll: () => api.get<Doctor[]>('/doctors'),
  getById: (id: string) => api.get<Doctor>(`/doctors/${id}`),
  create: (data: any) => api.post<Doctor>('/doctors', data),
  update: (id: string, data: any) => api.put<Doctor>(`/doctors/${id}`, data),
  delete: (id: string) => api.delete(`/doctors/${id}`),
  updateSchedule: (id: string, schedule: any) =>
    api.put(`/doctors/${id}/schedule`, { schedule }),
  // Family patients
  getFamilyPatients: (doctorId: string) => api.get(`/doctors/${doctorId}/family-patients`),
  getMyFamilyPatients: () => api.get('/doctors/me/family-patients'),
  // Statistics
  getStatistics: (doctorId: string) => api.get(`/doctors/${doctorId}/statistics`),
  getMyStatistics: () => api.get('/doctors/me/statistics'),
  // Pending appointments
  getPendingAppointments: (doctorId: string) => api.get(`/doctors/${doctorId}/pending-appointments`),
  getMyPendingAppointments: () => api.get('/doctors/me/pending-appointments'),
};

export const appointments = {
  getAll: () => api.get<Appointment[]>('/appointments'),
  getMy: () => api.get<Appointment[]>('/appointments/me'),
  getById: (id: string) => api.get<Appointment>(`/appointments/${id}`),
  getByPatientId: (patientId: string) => api.get<Appointment[]>(`/appointments/patient/${patientId}`),
  create: (data: any) => api.post<Appointment>('/appointments', data),
  update: (id: string, data: any) => api.put<Appointment>(`/appointments/${id}`, data),
  delete: (id: string) => api.delete(`/appointments/${id}`),
  getStats: () => api.get<DashboardStats>('/appointments/admin/stats'),
  checkAvailability: (doctorId: string, dateTime: string, duration?: number) =>
    api.get(`/appointments/check-availability/${doctorId}`, { params: { dateTime, duration } }),
  getByDateRange: (doctorId: string, startDate: string, endDate: string) =>
    api.get(`/appointments/doctor/${doctorId}/range`, { params: { startDate, endDate } }),
  getDoctorPatients: () => api.get('/appointments/doctor/patients'),
  getPending: () => api.get('/appointments/pending/all'),
  getPendingDoctor: () => api.get('/appointments/pending/doctor'),
  approve: (id: string) => api.put(`/appointments/${id}/approve`),
  approveByDoctor: (id: string) => api.patch(`/appointments/${id}/approve/doctor`),
  approveByAdmin: (id: string) => api.patch(`/appointments/${id}/approve/admin`),
  rejectByDoctor: (id: string, reason: string) => api.patch(`/appointments/${id}/reject/doctor`, { reason }),
  rejectByAdmin: (id: string, reason: string) => api.patch(`/appointments/${id}/reject/admin`, { reason }),
  cancel: (id: string) => api.put(`/appointments/${id}/cancel`),
};

export const patients = {
  getAll: () => api.get('/patients'),
  getById: (id: string) => api.get(`/patients/${id}`),
  getMyProfile: () => api.get('/patients/me/profile'),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
  // Family doctor management
  assignFamilyDoctor: (patientId: string, doctorId: string, reason?: string) =>
    api.post(`/patients/${patientId}/family-doctor`, { doctorId, reason }),
  changeFamilyDoctor: (patientId: string, doctorId: string, reason?: string) =>
    api.patch(`/patients/${patientId}/family-doctor`, { doctorId, reason }),
  removeFamilyDoctor: (patientId: string, reason?: string) =>
    api.delete(`/patients/${patientId}/family-doctor`, { data: { reason } }),
  getFamilyDoctorHistory: (patientId: string) =>
    api.get(`/patients/${patientId}/family-doctor/history`),
};

export const users = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Medical Records API
// Backend controller: @Controller('patients/:patientId/medical-record')
export const medicalRecords = {
  // Medical Record
  getMedicalRecord: (patientId: string) =>
    api.get<MedicalRecord>(`/patients/${patientId}/medical-record`),
  getSummary: (patientId: string) =>
    api.get<MedicalRecordSummary>(`/patients/${patientId}/medical-record/summary`),
  updateMedicalRecord: (patientId: string, data: any) =>
    api.patch<MedicalRecord>(`/patients/${patientId}/medical-record`, data),

  // Conditions
  getConditions: (patientId: string) =>
    api.get<MedicalCondition[]>(`/patients/${patientId}/medical-record/conditions`),
  getActiveConditions: (patientId: string) =>
    api.get<MedicalCondition[]>(`/patients/${patientId}/medical-record/conditions/active`),
  addCondition: (patientId: string, data: any) =>
    api.post<MedicalCondition>(`/patients/${patientId}/medical-record/conditions`, data),

  // Allergies
  getAllergies: (patientId: string) =>
    api.get<Allergy[]>(`/patients/${patientId}/medical-record/allergies`),
  getMedicationAllergies: (patientId: string) =>
    api.get<Allergy[]>(`/patients/${patientId}/medical-record/allergies/medications`),
  addAllergy: (patientId: string, data: any) =>
    api.post<Allergy>(`/patients/${patientId}/medical-record/allergies`, data),

  // Medications
  getMedications: (patientId: string) =>
    api.get<Medication[]>(`/patients/${patientId}/medical-record/medications`),
  getActiveMedications: (patientId: string) =>
    api.get<Medication[]>(`/patients/${patientId}/medical-record/medications/active`),
  addMedication: (patientId: string, data: any) =>
    api.post<Medication>(`/patients/${patientId}/medical-record/medications`, data),
  stopMedication: (patientId: string, medicationId: string, reason?: string) =>
    api.patch<Medication>(
      `/patients/${patientId}/medical-record/medications/${medicationId}/stop`,
      { reason }
    ),
  checkMedicationAllergy: (patientId: string, medicationName: string) =>
    api.post<{ canPrescribe: boolean; warnings: string[] }>(
      `/patients/${patientId}/medical-record/medications/check-allergy`,
      { medicationName }
    ),

  // Vaccinations
  getVaccinations: (patientId: string) =>
    api.get<Vaccination[]>(`/patients/${patientId}/medical-record/vaccinations`),
  getUpcomingVaccinations: (patientId: string) =>
    api.get<Vaccination[]>(`/patients/${patientId}/medical-record/vaccinations/upcoming`),
  addVaccination: (patientId: string, data: any) =>
    api.post<Vaccination>(`/patients/${patientId}/medical-record/vaccinations`, data),
};

// Family Doctor Requests API
export const familyDoctorRequests = {
  create: (data: { doctorId: string; requestReason?: string }) =>
    api.post<FamilyDoctorRequest>('/family-doctor-requests', data),
  getAll: () => api.get<FamilyDoctorRequest[]>('/family-doctor-requests'),
  getMy: () => api.get<FamilyDoctorRequest[]>('/family-doctor-requests/my'),
  getById: (id: string) => api.get<FamilyDoctorRequest>(`/family-doctor-requests/${id}`),
  approve: (id: string, responseReason?: string) =>
    api.patch<FamilyDoctorRequest>(`/family-doctor-requests/${id}/approve`, {
      responseReason,
    }),
  reject: (id: string, responseReason: string) =>
    api.patch<FamilyDoctorRequest>(`/family-doctor-requests/${id}/reject`, {
      responseReason,
    }),
  // Doctor endpoints
  getMyDoctorRequests: () => api.get<FamilyDoctorRequest[]>('/family-doctor-requests/doctor/my-requests'),
  approveByDoctor: (id: string, responseReason?: string) =>
    api.patch<FamilyDoctorRequest>(`/family-doctor-requests/${id}/approve/doctor`, {
      responseReason,
    }),
  rejectByDoctor: (id: string, responseReason: string) =>
    api.patch<FamilyDoctorRequest>(`/family-doctor-requests/${id}/reject/doctor`, {
      responseReason,
    }),
};

// System Settings API
export const systemSettings = {
  getAll: () => api.get<SystemSetting[]>('/system-settings'),
  update: (key: string, value: string) =>
    api.patch<SystemSetting>(`/system-settings/${key}`, { value }),
};

export default api;
