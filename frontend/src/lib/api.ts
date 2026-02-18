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
};

export const users = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Medical Records API
export const medicalRecords = {
  // Medical Record
  getMedicalRecord: (patientId: string) =>
    api.get<MedicalRecord>(`/medical-records/patient/${patientId}`),
  getSummary: (patientId: string) =>
    api.get<MedicalRecordSummary>(`/medical-records/patient/${patientId}/summary`),
  updateMedicalRecord: (patientId: string, data: any) =>
    api.patch<MedicalRecord>(`/medical-records/patient/${patientId}`, data),

  // Conditions
  getConditions: (patientId: string) =>
    api.get<MedicalCondition[]>(`/medical-records/patient/${patientId}/conditions`),
  addCondition: (patientId: string, data: any) =>
    api.post<MedicalCondition>(`/medical-records/patient/${patientId}/conditions`, data),
  updateCondition: (patientId: string, conditionId: string, data: any) =>
    api.patch<MedicalCondition>(
      `/medical-records/patient/${patientId}/conditions/${conditionId}`,
      data
    ),
  deleteCondition: (patientId: string, conditionId: string) =>
    api.delete(`/medical-records/patient/${patientId}/conditions/${conditionId}`),

  // Allergies
  getAllergies: (patientId: string) =>
    api.get<Allergy[]>(`/medical-records/patient/${patientId}/allergies`),
  addAllergy: (patientId: string, data: any) =>
    api.post<Allergy>(`/medical-records/patient/${patientId}/allergies`, data),
  updateAllergy: (patientId: string, allergyId: string, data: any) =>
    api.patch<Allergy>(
      `/medical-records/patient/${patientId}/allergies/${allergyId}`,
      data
    ),
  deleteAllergy: (patientId: string, allergyId: string) =>
    api.delete(`/medical-records/patient/${patientId}/allergies/${allergyId}`),

  // Medications
  getMedications: (patientId: string) =>
    api.get<Medication[]>(`/medical-records/patient/${patientId}/medications`),
  addMedication: (patientId: string, data: any) =>
    api.post<Medication>(`/medical-records/patient/${patientId}/medications`, data),
  updateMedication: (patientId: string, medicationId: string, data: any) =>
    api.patch<Medication>(
      `/medical-records/patient/${patientId}/medications/${medicationId}`,
      data
    ),
  stopMedication: (patientId: string, medicationId: string) =>
    api.patch<Medication>(
      `/medical-records/patient/${patientId}/medications/${medicationId}/stop`
    ),
  deleteMedication: (patientId: string, medicationId: string) =>
    api.delete(`/medical-records/patient/${patientId}/medications/${medicationId}`),
  checkMedicationAllergy: (patientId: string, medicationName: string) =>
    api.get<{ hasAllergy: boolean; allergies: Allergy[] }>(
      `/medical-records/patient/${patientId}/medications/check-allergy`,
      { params: { medicationName } }
    ),

  // Vaccinations
  getVaccinations: (patientId: string) =>
    api.get<Vaccination[]>(`/medical-records/patient/${patientId}/vaccinations`),
  addVaccination: (patientId: string, data: any) =>
    api.post<Vaccination>(`/medical-records/patient/${patientId}/vaccinations`, data),
  updateVaccination: (patientId: string, vaccinationId: string, data: any) =>
    api.patch<Vaccination>(
      `/medical-records/patient/${patientId}/vaccinations/${vaccinationId}`,
      data
    ),
  deleteVaccination: (patientId: string, vaccinationId: string) =>
    api.delete(`/medical-records/patient/${patientId}/vaccinations/${vaccinationId}`),
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

export default api;
