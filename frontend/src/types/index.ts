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
  address?: string;
  consultationDuration: number;
  isAvailable: boolean;
  maxFamilyPatients?: number;
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
  patientId: string;
  name: string;
  diagnosedDate: Date;
  status: MedicalConditionStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction?: string;
  diagnosedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  status: MedicationStatus;
  prescribedBy?: string;
  reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vaccination {
  id: string;
  patientId: string;
  vaccine: string;
  dateAdministered: Date;
  administeredBy?: string;
  nextDueDate?: Date;
  batchNumber?: string;
  site?: string;
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
