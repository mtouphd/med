export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Doctor {
  id: string;
  userId: string;
  user: User;
  specialty: string;
  licenseNumber: string;
  bio?: string;
  consultationDuration: number;
  isAvailable: boolean;
  schedule?: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
}

export interface Patient {
  id: string;
  userId: string;
  user: User;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: Doctor;
  dateTime: Date;
  duration: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  medications?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface AvailabilityCheck {
  available: boolean;
  reason?: string;
}

export interface DoctorPatient {
  id: string;
  user: User;
  appointments: {
    id: string;
    dateTime: Date;
    status: AppointmentStatus;
    reason?: string;
    notes?: string;
    medications?: string;
    duration: number;
  }[];
  lastVisit: Date | null;
}
