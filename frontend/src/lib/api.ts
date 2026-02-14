import axios from 'axios';
import { AuthResponse, User, Doctor, Appointment, DashboardStats } from '@/types';

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
  create: (data: any) => api.post<Appointment>('/appointments', data),
  update: (id: string, data: any) => api.put<Appointment>(`/appointments/${id}`, data),
  delete: (id: string) => api.delete(`/appointments/${id}`),
  getStats: () => api.get<DashboardStats>('/appointments/admin/stats'),
  checkAvailability: (doctorId: string, dateTime: string, duration?: number) =>
    api.get(`/appointments/check-availability/${doctorId}`, { params: { dateTime, duration } }),
  getByDateRange: (doctorId: string, startDate: string, endDate: string) =>
    api.get(`/appointments/doctor/${doctorId}/range`, { params: { startDate, endDate } }),
  getDoctorPatients: () => api.get('/appointments/doctor/patients'),
  approve: (id: string) => api.put(`/appointments/${id}/approve`),
  cancel: (id: string) => api.put(`/appointments/${id}/cancel`),
};

export const patients = {
  getAll: () => api.get('/patients'),
  getById: (id: string) => api.get(`/patients/${id}`),
  getMyProfile: () => api.get('/patients/me/profile'),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
};

export const users = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export default api;
