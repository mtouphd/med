export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ASSISTANT = 'ASSISTANT',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
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
  street?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  consultationDuration: number;
  isAvailable: boolean;
  maxFamilyPatients?: number | null;
  maxAppointmentsPerDay?: number | null;
  minAppointmentDuration?: number | null;
  maxAppointmentDuration?: number | null;
  schedule?: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
  assistants?: Assistant[];
}

export interface DoctorSettings {
  maxAppointmentsPerDay: number | null;
  minAppointmentDuration: number | null;
  maxAppointmentDuration: number | null;
  maxFamilyPatients: number | null;
  globals: {
    maxAppointmentsPerDay: number;
    minAppointmentDuration: number;
    maxAppointmentDuration: number;
    maxFamilyPatients: number;
  };
}

export interface Patient {
  id: string;
  userId: string;
  user: User;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
  familyDoctorId?: string;
  familyDoctor?: Doctor;
  familyDoctorAssignedAt?: Date;
}

export enum AffiliationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Assistant {
  id: string;
  userId: string;
  user: User;
  title?: string;
  bio?: string;
  isActive: boolean;
  requestedDoctorId?: string;
  affiliationStatus?: AffiliationStatus;
  doctors?: Doctor[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
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
  // Approval workflow
  doctorApproved?: boolean;
  adminApproved?: boolean;
  doctorApprovedAt?: Date;
  adminApprovedAt?: Date;
  doctorRejectionReason?: string;
  adminRejectionReason?: string;
  cancellationReason?: string;
  requestedBy?: string;
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

// Extended availability types for 6-month calendar
export interface DaySlot {
  start: string;
  end: string;
  enabled: boolean;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  morning: DaySlot;
  afternoon: DaySlot;
}

export interface ExtendedSchedule {
  baseSchedule: Record<string, DaySlot>; // Weekly defaults
  specificDays: Record<string, DayAvailability>; // Specific date overrides
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

// Medical Records Types
export enum MedicalConditionStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  CHRONIC = 'CHRONIC',
  MANAGED = 'MANAGED',
}

export enum AllergyType {
  MEDICATION = 'MEDICATION',
  FOOD = 'FOOD',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  OTHER = 'OTHER',
}

export enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  LIFE_THREATENING = 'LIFE_THREATENING',
}

export enum MedicationStatus {
  ACTIVE = 'ACTIVE',
  STOPPED = 'STOPPED',
  COMPLETED = 'COMPLETED',
}

export interface MedicalCondition {
  id: string;
  medicalRecordId: string;
  name: string;
  description?: string;
  status: MedicalConditionStatus;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  diagnosedDate?: Date;
  resolvedDate?: Date;
  treatment?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Allergy {
  id: string;
  medicalRecordId: string;
  allergen: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  id: string;
  medicalRecordId: string;
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: Date;
  endDate?: Date;
  status: MedicationStatus;
  prescribedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vaccination {
  id: string;
  medicalRecordId: string;
  name: string;
  dateGiven?: Date;
  manufacturer?: string;
  lotNumber?: string;
  nextDoseDate?: Date;
  administeredBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patient?: Patient;
  bloodType?: string;
  height?: number;
  weight?: number;
  organDonor: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  conditions?: MedicalCondition[];
  allergies?: Allergy[];
  medications?: Medication[];
  vaccinations?: Vaccination[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecordSummary {
  id: string;
  patientId: string;
  bloodType?: string;
  organDonor: boolean;
  activeConditionsCount: number;
  allergiesCount: number;
  activeMedicationsCount: number;
  vaccinationsCount: number;
}

// Family Doctor Request Types
export enum FamilyDoctorRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// System Settings
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  category: string;
  updatedAt: Date;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  appointment?: Appointment;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  treatment?: string;
  prescriptions?: string;
  followUpDate?: Date;
  followUpNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyDoctorRequest {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  status: FamilyDoctorRequestStatus;
  requestReason?: string;
  responseReason?: string;
  requestedAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
