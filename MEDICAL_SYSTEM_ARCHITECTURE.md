# Architecture Système de Gestion Médicale

**Version:** 1.0
**Date:** 2026-02-14
**Statut:** Design & Analyse

---

## Table des Matières

1. [Analyse des Besoins](#analyse-des-besoins)
2. [Architecture Actuelle](#architecture-actuelle)
3. [Architecture Proposée](#architecture-proposée)
4. [Modifications du Schéma de Base de Données](#modifications-du-schéma-de-base-de-données)
5. [Système de Permissions](#système-de-permissions)
6. [Logique Métier](#logique-métier)
7. [API Endpoints](#api-endpoints)
8. [Améliorations Suggérées](#améliorations-suggérées)
9. [Clarifications & Décisions](#clarifications--décisions)
10. [Plan d'Implémentation](#plan-dimplémentation)

---

## 1. Analyse des Besoins

### 1.1 Besoins Fonctionnels

#### Relation Patient-Médecin
- ✅ **Médecin de Famille**: Un patient peut avoir UN seul médecin de famille à un moment donné
- ✅ **Consultations Multiples**: Un patient peut être consulté par plusieurs médecins à des dates différentes
- ✅ **Flexibilité de Rendez-vous**: Un patient peut prendre rendez-vous avec n'importe quel médecin si:
  - Il n'a pas de médecin de famille, OU
  - Son médecin de famille n'est pas disponible pendant la période souhaitée

#### Workflow de Rendez-vous
- ✅ **Demande Patient**: Le patient peut demander un rendez-vous
- ✅ **Double Approbation**: Le rendez-vous reste en PENDING jusqu'à approbation par:
  - Le médecin concerné ET
  - L'administrateur de la clinique

#### Contrôle d'Accès

**Médecin:**
- ✅ Visibilité limitée aux dossiers médicaux de SES patients (dont il est médecin de famille)
- ✅ Visibilité limitée aux rendez-vous de SES patients
- ✅ Ne peut pas ajouter de patients à la clinique

**Admin:**
- ✅ Accès à la liste complète des patients inscrits
- ✅ Seul habilité à ajouter/supprimer des patients
- ✅ Approbation des rendez-vous

**Patient:**
- ✅ Peut demander des rendez-vous
- ✅ Peut consulter ses propres données

### 1.2 Règles Métier Clés

1. Un patient ne peut avoir qu'un seul médecin de famille actif
2. Un médecin ne peut ajouter que des rendez-vous, pas des patients
3. Les patients doivent être inscrits par l'admin avant toute consultation
4. Un rendez-vous nécessite une double approbation (médecin + admin)
5. Un médecin voit uniquement les données de ses patients de famille

---

## 2. Architecture Actuelle

### 2.1 Entités Existantes

```
User (users)
├── id: uuid
├── email: string (unique)
├── password: string (hashed)
├── firstName: string
├── lastName: string
├── phone: string
├── role: enum (PATIENT, DOCTOR, ADMIN)
├── isActive: boolean
└── timestamps

Patient (patients)
├── id: uuid
├── userId: string (OneToOne → User)
├── dateOfBirth: date
├── address: string
├── emergencyContact: string
└── medicalHistory: text

Doctor (doctors)
├── id: uuid
├── userId: string (OneToOne → User)
├── specialty: string
├── licenseNumber: string
├── bio: text
├── consultationDuration: number
├── isAvailable: boolean
└── schedule: jsonb

Appointment (appointments)
├── id: uuid
├── patientId: string (ManyToOne → Patient)
├── doctorId: string (ManyToOne → Doctor)
├── dateTime: timestamp
├── duration: number
├── status: enum (PENDING, CONFIRMED, COMPLETED, CANCELLED)
├── reason: string
├── notes: text
├── medications: text
└── timestamps
```

### 2.2 Relations Actuelles

```
User ←OneToOne→ Patient
User ←OneToOne→ Doctor
Appointment →ManyToOne→ Patient
Appointment →ManyToOne→ Doctor
```

**Type de relation Patient ↔ Doctor:** Indirecte Many-to-Many via Appointment

### 2.3 Limitations Identifiées

❌ Pas de notion de "médecin de famille"
❌ Pas de workflow d'approbation (doctorApproved, adminApproved)
❌ Pas de restriction d'accès basée sur la relation médecin-patient
❌ Pas d'historique des changements de médecin de famille
❌ Pas de validation des règles de prise de rendez-vous

---

## 3. Architecture Proposée

### 3.1 Nouveaux Concepts

1. **Médecin de Famille** (Family Doctor)
   - Relation directe Patient → Doctor (ManyToOne)
   - Un patient peut avoir 0 ou 1 médecin de famille
   - Un médecin peut avoir plusieurs patients de famille

2. **Workflow d'Approbation**
   - Champs d'approbation dans Appointment
   - Timestamps d'approbation
   - Raisons de rejet

3. **Historique Médecin de Famille**
   - Traçabilité des changements
   - Audit trail complet

4. **Permissions Granulaires**
   - Guards basés sur les rôles et relations
   - Isolation des données par médecin

---

## 4. Modifications du Schéma de Base de Données

### 4.1 Patient Entity (MODIFIÉE)

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // ========== NOUVEAU: Médecin de Famille ==========
  @Column({ nullable: true })
  familyDoctorId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.familyPatients, { nullable: true, eager: true })
  @JoinColumn({ name: 'familyDoctorId' })
  familyDoctor: Doctor;

  @Column({ type: 'timestamp', nullable: true })
  familyDoctorAssignedAt: Date;
  // ==================================================

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory: string;

  // ========== NOUVEAU: Relations ==========
  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // ========================================
}
```

**Migration SQL:**
```sql
ALTER TABLE patients
  ADD COLUMN "familyDoctorId" uuid,
  ADD COLUMN "familyDoctorAssignedAt" timestamp,
  ADD COLUMN "createdAt" timestamp DEFAULT now(),
  ADD COLUMN "updatedAt" timestamp DEFAULT now(),
  ADD CONSTRAINT "FK_patients_familyDoctor"
    FOREIGN KEY ("familyDoctorId")
    REFERENCES doctors(id)
    ON DELETE SET NULL;
```

### 4.2 Doctor Entity (MODIFIÉE)

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  specialty: string;

  @Column()
  licenseNumber: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: 30 })
  consultationDuration: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  schedule: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };

  // ========== NOUVEAU: Relations ==========
  @OneToMany(() => Patient, (patient) => patient.familyDoctor)
  familyPatients: Patient[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @Column({ nullable: true, default: null })
  maxFamilyPatients: number; // Limite de patients de famille (null = illimité)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // ========================================
}
```

**Migration SQL:**
```sql
ALTER TABLE doctors
  ADD COLUMN "maxFamilyPatients" integer,
  ADD COLUMN "createdAt" timestamp DEFAULT now(),
  ADD COLUMN "updatedAt" timestamp DEFAULT now();
```

### 4.3 Appointment Entity (MODIFIÉE)

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Patient } from '../../patients/entities/patient.entity';

export enum AppointmentStatus {
  PENDING = 'PENDING',           // En attente d'approbation
  CONFIRMED = 'CONFIRMED',       // Approuvé par médecin ET admin
  REJECTED = 'REJECTED',         // Rejeté par médecin OU admin
  COMPLETED = 'COMPLETED',       // Consultation terminée
  CANCELLED = 'CANCELLED',       // Annulé par patient ou médecin
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, (patient) => patient.appointments, { eager: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  doctorId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, { eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ type: 'timestamp' })
  dateTime: Date;

  @Column({ default: 30 })
  duration: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  medications: string;

  // ========== NOUVEAU: Workflow d'Approbation ==========
  @Column({ default: false })
  doctorApproved: boolean;

  @Column({ default: false })
  adminApproved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  doctorApprovedAt: Date;

  @Column({ nullable: true })
  doctorApprovedBy: string; // userId du médecin qui a approuvé

  @Column({ type: 'timestamp', nullable: true })
  adminApprovedAt: Date;

  @Column({ nullable: true })
  adminApprovedBy: string; // userId de l'admin qui a approuvé

  @Column({ type: 'text', nullable: true })
  doctorRejectionReason: string;

  @Column({ type: 'text', nullable: true })
  adminRejectionReason: string;
  // ======================================================

  @Column({ nullable: true })
  requestedBy: string; // userId du patient qui a demandé

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Migration SQL:**
```sql
ALTER TABLE appointments
  ADD COLUMN "doctorApproved" boolean DEFAULT false,
  ADD COLUMN "adminApproved" boolean DEFAULT false,
  ADD COLUMN "doctorApprovedAt" timestamp,
  ADD COLUMN "doctorApprovedBy" uuid,
  ADD COLUMN "adminApprovedAt" timestamp,
  ADD COLUMN "adminApprovedBy" uuid,
  ADD COLUMN "doctorRejectionReason" text,
  ADD COLUMN "adminRejectionReason" text,
  ADD COLUMN "requestedBy" uuid;

-- Ajouter REJECTED au enum
ALTER TYPE "appointment_status_enum" ADD VALUE 'REJECTED';
```

### 4.4 FamilyDoctorHistory Entity (NOUVELLE)

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { User } from '../../users/entities/user.entity';

export enum FamilyDoctorChangeType {
  ASSIGNED = 'ASSIGNED',     // Premier médecin assigné
  CHANGED = 'CHANGED',       // Changement de médecin
  REMOVED = 'REMOVED',       // Médecin retiré (patient n'a plus de médecin de famille)
}

@Entity('family_doctor_history')
export class FamilyDoctorHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  previousDoctorId: string;

  @ManyToOne(() => Doctor, { eager: true, nullable: true })
  @JoinColumn({ name: 'previousDoctorId' })
  previousDoctor: Doctor;

  @Column({ nullable: true })
  newDoctorId: string;

  @ManyToOne(() => Doctor, { eager: true, nullable: true })
  @JoinColumn({ name: 'newDoctorId' })
  newDoctor: Doctor;

  @Column({
    type: 'enum',
    enum: FamilyDoctorChangeType,
  })
  changeType: FamilyDoctorChangeType;

  @Column()
  changedBy: string; // userId de qui a fait le changement (admin)

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'changedBy' })
  changedByUser: User;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  changedAt: Date;
}
```

**Migration SQL:**
```sql
CREATE TYPE "family_doctor_change_type_enum" AS ENUM ('ASSIGNED', 'CHANGED', 'REMOVED');

CREATE TABLE "family_doctor_history" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" uuid NOT NULL,
  "previousDoctorId" uuid,
  "newDoctorId" uuid,
  "changeType" family_doctor_change_type_enum NOT NULL,
  "changedBy" uuid NOT NULL,
  "reason" text,
  "changedAt" timestamp DEFAULT now(),
  CONSTRAINT "FK_history_patient" FOREIGN KEY ("patientId") REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT "FK_history_previousDoctor" FOREIGN KEY ("previousDoctorId") REFERENCES doctors(id) ON DELETE SET NULL,
  CONSTRAINT "FK_history_newDoctor" FOREIGN KEY ("newDoctorId") REFERENCES doctors(id) ON DELETE SET NULL,
  CONSTRAINT "FK_history_changedBy" FOREIGN KEY ("changedBy") REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX "IDX_history_patient" ON "family_doctor_history" ("patientId");
CREATE INDEX "IDX_history_changedAt" ON "family_doctor_history" ("changedAt");
```

---

## 5. Système de Permissions

### 5.1 Guards Existants

- `AuthGuard('jwt')` - Authentification
- `RolesGuard` - Vérification des rôles

### 5.2 Nouveaux Guards à Créer

#### 5.2.1 IsFamilyDoctorGuard

**Fichier:** `backend/src/auth/guards/is-family-doctor.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PatientsService } from '../../patients/patients.service';

@Injectable()
export class IsFamilyDoctorGuard implements CanActivate {
  constructor(private patientsService: PatientsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const patientId = request.params.patientId || request.params.id;

    if (!patientId) {
      throw new ForbiddenException('Patient ID is required');
    }

    // Admin a toujours accès
    if (user.role === 'ADMIN') {
      return true;
    }

    // Vérifier que l'utilisateur est le médecin de famille
    const canAccess = await this.patientsService.isFamilyDoctor(patientId, user.doctorId);

    if (!canAccess) {
      throw new ForbiddenException('You can only access your family patients');
    }

    return true;
  }
}
```

#### 5.2.2 IsPatientOwnerGuard

**Fichier:** `backend/src/auth/guards/is-patient-owner.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class IsPatientOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const patientId = request.params.patientId || request.params.id;

    // Admin a toujours accès
    if (user.role === 'ADMIN') {
      return true;
    }

    // Patient peut accéder à ses propres données
    if (user.role === 'PATIENT' && user.patientId === patientId) {
      return true;
    }

    throw new ForbiddenException('You can only access your own patient data');
  }
}
```

#### 5.2.3 CanViewPatientGuard

**Fichier:** `backend/src/auth/guards/can-view-patient.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PatientsService } from '../../patients/patients.service';

@Injectable()
export class CanViewPatientGuard implements CanActivate {
  constructor(private patientsService: PatientsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const patientId = request.params.patientId || request.params.id;

    // Admin a toujours accès
    if (user.role === 'ADMIN') {
      return true;
    }

    // Patient peut voir ses propres données
    if (user.role === 'PATIENT' && user.patientId === patientId) {
      return true;
    }

    // Médecin peut voir ses patients de famille
    if (user.role === 'DOCTOR') {
      const canAccess = await this.patientsService.isFamilyDoctor(patientId, user.doctorId);
      if (canAccess) {
        return true;
      }
    }

    throw new ForbiddenException('You do not have permission to view this patient');
  }
}
```

#### 5.2.4 CanManagePatientsGuard

**Fichier:** `backend/src/auth/guards/can-manage-patients.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CanManagePatientsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Seul l'admin peut gérer les patients
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can manage patients');
    }

    return true;
  }
}
```

### 5.3 Matrice de Permissions

| Action | Patient | Doctor | Admin |
|--------|---------|--------|-------|
| Voir ses propres données | ✅ | ✅ | ✅ |
| Voir données autres patients | ❌ | ✅ (famille uniquement) | ✅ |
| Créer patient | ❌ | ❌ | ✅ |
| Modifier patient | ❌ (ses données) | ❌ | ✅ |
| Supprimer patient | ❌ | ❌ | ✅ |
| Assigner médecin de famille | ❌ | ❌ | ✅ |
| Demander rendez-vous | ✅ | ❌ | ✅ |
| Approuver rendez-vous (médecin) | ❌ | ✅ (ses patients) | ❌ |
| Approuver rendez-vous (admin) | ❌ | ❌ | ✅ |
| Voir tous les patients | ❌ | ❌ | ✅ |
| Voir ses patients de famille | ❌ | ✅ | ✅ |

---

## 6. Logique Métier

### 6.1 PatientsService - Gestion Médecin de Famille

```typescript
// backend/src/patients/patients.service.ts

async assignFamilyDoctor(
  patientId: string,
  doctorId: string,
  assignedBy: string,
  reason?: string
): Promise<Patient> {
  // 1. Vérifier que le patient existe
  const patient = await this.findOne(patientId);
  if (!patient) {
    throw new NotFoundException('Patient not found');
  }

  // 2. Vérifier que le médecin existe
  const doctor = await this.doctorsService.findOne(doctorId);
  if (!doctor) {
    throw new NotFoundException('Doctor not found');
  }

  // 3. Vérifier limite de patients du médecin
  if (doctor.maxFamilyPatients) {
    const currentPatientCount = await this.patientsRepository.count({
      where: { familyDoctorId: doctorId },
    });
    if (currentPatientCount >= doctor.maxFamilyPatients) {
      throw new BadRequestException('Doctor has reached maximum family patients limit');
    }
  }

  const previousDoctorId = patient.familyDoctorId;

  // 4. Assigner le médecin
  patient.familyDoctorId = doctorId;
  patient.familyDoctorAssignedAt = new Date();

  // 5. Sauvegarder
  const updatedPatient = await this.patientsRepository.save(patient);

  // 6. Créer historique
  await this.familyDoctorHistoryService.create({
    patientId,
    previousDoctorId,
    newDoctorId: doctorId,
    changeType: previousDoctorId ? FamilyDoctorChangeType.CHANGED : FamilyDoctorChangeType.ASSIGNED,
    changedBy: assignedBy,
    reason,
  });

  return updatedPatient;
}

async removeFamilyDoctor(
  patientId: string,
  removedBy: string,
  reason?: string
): Promise<Patient> {
  const patient = await this.findOne(patientId);
  if (!patient) {
    throw new NotFoundException('Patient not found');
  }

  const previousDoctorId = patient.familyDoctorId;

  if (!previousDoctorId) {
    throw new BadRequestException('Patient does not have a family doctor');
  }

  patient.familyDoctorId = null;
  patient.familyDoctorAssignedAt = null;

  const updatedPatient = await this.patientsRepository.save(patient);

  // Créer historique
  await this.familyDoctorHistoryService.create({
    patientId,
    previousDoctorId,
    newDoctorId: null,
    changeType: FamilyDoctorChangeType.REMOVED,
    changedBy: removedBy,
    reason,
  });

  return updatedPatient;
}

async changeFamilyDoctor(
  patientId: string,
  newDoctorId: string,
  changedBy: string,
  reason?: string
): Promise<Patient> {
  // Utilise assignFamilyDoctor qui gère déjà le changement
  return this.assignFamilyDoctor(patientId, newDoctorId, changedBy, reason);
}

async getFamilyDoctorHistory(patientId: string): Promise<FamilyDoctorHistory[]> {
  return this.familyDoctorHistoryService.findByPatient(patientId);
}

async isFamilyDoctor(patientId: string, doctorId: string): Promise<boolean> {
  const patient = await this.patientsRepository.findOne({
    where: { id: patientId },
  });
  return patient?.familyDoctorId === doctorId;
}

async getFamilyPatients(doctorId: string): Promise<Patient[]> {
  return this.patientsRepository.find({
    where: { familyDoctorId: doctorId },
    relations: ['user', 'familyDoctor'],
  });
}
```

### 6.2 AppointmentsService - Règles de Rendez-vous

```typescript
// backend/src/appointments/appointments.service.ts

async canPatientBookWithDoctor(
  patientId: string,
  doctorId: string,
  dateTime: Date
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Récupérer le patient
  const patient = await this.patientsService.findOne(patientId);
  if (!patient) {
    return { allowed: false, reason: 'Patient not found' };
  }

  // 2. Récupérer le médecin
  const doctor = await this.doctorsService.findOne(doctorId);
  if (!doctor) {
    return { allowed: false, reason: 'Doctor not found' };
  }

  // 3. Vérifier si le médecin est disponible
  if (!doctor.isAvailable) {
    return { allowed: false, reason: 'Doctor is not available' };
  }

  // 4. Si pas de médecin de famille → OK avec n'importe quel médecin
  if (!patient.familyDoctorId) {
    return { allowed: true };
  }

  // 5. Si rendez-vous avec son médecin de famille → OK
  if (patient.familyDoctorId === doctorId) {
    return { allowed: true };
  }

  // 6. Rendez-vous avec un autre médecin → vérifier disponibilité du médecin de famille
  const familyDoctorAvailable = await this.isDoctorAvailable(
    patient.familyDoctorId,
    dateTime,
    doctor.consultationDuration
  );

  if (familyDoctorAvailable) {
    return {
      allowed: false,
      reason: 'Your family doctor is available at this time. Please book with your family doctor first.'
    };
  }

  // 7. Médecin de famille non disponible → OK avec autre médecin
  return { allowed: true };
}

async isDoctorAvailable(
  doctorId: string,
  dateTime: Date,
  duration: number
): Promise<boolean> {
  const doctor = await this.doctorsService.findOne(doctorId);

  if (!doctor || !doctor.isAvailable) {
    return false;
  }

  // Vérifier le schedule
  const dayOfWeek = dateTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const timeSlot = doctor.schedule?.[dayOfWeek];

  if (!timeSlot || !timeSlot.enabled) {
    return false;
  }

  // Vérifier les rendez-vous existants
  const existingAppointment = await this.appointmentsRepository.findOne({
    where: {
      doctorId,
      dateTime,
      status: In([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
    },
  });

  return !existingAppointment;
}

async createAppointment(createDto: CreateAppointmentDto, requestedBy: string): Promise<Appointment> {
  // 1. Valider les règles métier
  const validation = await this.canPatientBookWithDoctor(
    createDto.patientId,
    createDto.doctorId,
    createDto.dateTime
  );

  if (!validation.allowed) {
    throw new BadRequestException(validation.reason);
  }

  // 2. Créer le rendez-vous en PENDING
  const appointment = this.appointmentsRepository.create({
    ...createDto,
    status: AppointmentStatus.PENDING,
    doctorApproved: false,
    adminApproved: false,
    requestedBy,
  });

  return this.appointmentsRepository.save(appointment);
}

async approveByDoctor(appointmentId: string, doctorId: string): Promise<Appointment> {
  const appointment = await this.findOne(appointmentId);

  if (!appointment) {
    throw new NotFoundException('Appointment not found');
  }

  if (appointment.doctorId !== doctorId) {
    throw new ForbiddenException('You can only approve your own appointments');
  }

  appointment.doctorApproved = true;
  appointment.doctorApprovedAt = new Date();
  appointment.doctorApprovedBy = doctorId;

  // Si admin a déjà approuvé → passer en CONFIRMED
  if (appointment.adminApproved) {
    appointment.status = AppointmentStatus.CONFIRMED;
  }

  return this.appointmentsRepository.save(appointment);
}

async rejectByDoctor(appointmentId: string, doctorId: string, reason: string): Promise<Appointment> {
  const appointment = await this.findOne(appointmentId);

  if (!appointment) {
    throw new NotFoundException('Appointment not found');
  }

  if (appointment.doctorId !== doctorId) {
    throw new ForbiddenException('You can only reject your own appointments');
  }

  appointment.doctorApproved = false;
  appointment.doctorRejectionReason = reason;
  appointment.status = AppointmentStatus.REJECTED;

  return this.appointmentsRepository.save(appointment);
}

async approveByAdmin(appointmentId: string, adminId: string): Promise<Appointment> {
  const appointment = await this.findOne(appointmentId);

  if (!appointment) {
    throw new NotFoundException('Appointment not found');
  }

  appointment.adminApproved = true;
  appointment.adminApprovedAt = new Date();
  appointment.adminApprovedBy = adminId;

  // Si médecin a déjà approuvé → passer en CONFIRMED
  if (appointment.doctorApproved) {
    appointment.status = AppointmentStatus.CONFIRMED;
  }

  return this.appointmentsRepository.save(appointment);
}

async rejectByAdmin(appointmentId: string, adminId: string, reason: string): Promise<Appointment> {
  const appointment = await this.findOne(appointmentId);

  if (!appointment) {
    throw new NotFoundException('Appointment not found');
  }

  appointment.adminApproved = false;
  appointment.adminRejectionReason = reason;
  appointment.status = AppointmentStatus.REJECTED;

  return this.appointmentsRepository.save(appointment);
}

async getPendingAppointments(): Promise<Appointment[]> {
  return this.appointmentsRepository.find({
    where: { status: AppointmentStatus.PENDING },
    order: { createdAt: 'ASC' },
  });
}

async getDoctorPendingAppointments(doctorId: string): Promise<Appointment[]> {
  return this.appointmentsRepository.find({
    where: {
      doctorId,
      status: AppointmentStatus.PENDING,
    },
    order: { createdAt: 'ASC' },
  });
}
```

### 6.3 DoctorsService - Gestion Patients

```typescript
// backend/src/doctors/doctors.service.ts

async getMyFamilyPatients(doctorId: string): Promise<Patient[]> {
  return this.patientsService.getFamilyPatients(doctorId);
}

async canAccessPatient(doctorId: string, patientId: string): Promise<boolean> {
  return this.patientsService.isFamilyDoctor(patientId, doctorId);
}

async getStatistics(doctorId: string): Promise<{
  totalFamilyPatients: number;
  maxFamilyPatients: number | null;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
}> {
  const doctor = await this.findOne(doctorId);

  const familyPatients = await this.patientsService.getFamilyPatients(doctorId);

  const [totalAppointments, pendingAppointments, confirmedAppointments] = await Promise.all([
    this.appointmentsRepository.count({ where: { doctorId } }),
    this.appointmentsRepository.count({ where: { doctorId, status: AppointmentStatus.PENDING } }),
    this.appointmentsRepository.count({ where: { doctorId, status: AppointmentStatus.CONFIRMED } }),
  ]);

  return {
    totalFamilyPatients: familyPatients.length,
    maxFamilyPatients: doctor.maxFamilyPatients,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
  };
}
```

---

## 7. API Endpoints

### 7.1 Patients Endpoints

#### Gestion Médecin de Famille

```typescript
// POST /api/patients/:id/family-doctor
@Post(':id/family-doctor')
@UseGuards(AuthGuard('jwt'), RolesGuard, CanManagePatientsGuard)
@Roles(UserRole.ADMIN)
async assignFamilyDoctor(
  @Param('id') patientId: string,
  @Body() dto: { doctorId: string; reason?: string },
  @Request() req,
) {
  return this.patientsService.assignFamilyDoctor(
    patientId,
    dto.doctorId,
    req.user.userId,
    dto.reason
  );
}

// DELETE /api/patients/:id/family-doctor
@Delete(':id/family-doctor')
@UseGuards(AuthGuard('jwt'), RolesGuard, CanManagePatientsGuard)
@Roles(UserRole.ADMIN)
async removeFamilyDoctor(
  @Param('id') patientId: string,
  @Body() dto: { reason?: string },
  @Request() req,
) {
  return this.patientsService.removeFamilyDoctor(
    patientId,
    req.user.userId,
    dto.reason
  );
}

// PATCH /api/patients/:id/family-doctor
@Patch(':id/family-doctor')
@UseGuards(AuthGuard('jwt'), RolesGuard, CanManagePatientsGuard)
@Roles(UserRole.ADMIN)
async changeFamilyDoctor(
  @Param('id') patientId: string,
  @Body() dto: { newDoctorId: string; reason?: string },
  @Request() req,
) {
  return this.patientsService.changeFamilyDoctor(
    patientId,
    dto.newDoctorId,
    req.user.userId,
    dto.reason
  );
}

// GET /api/patients/:id/family-doctor/history
@Get(':id/family-doctor/history')
@UseGuards(AuthGuard('jwt'), RolesGuard, CanViewPatientGuard)
async getFamilyDoctorHistory(@Param('id') patientId: string) {
  return this.patientsService.getFamilyDoctorHistory(patientId);
}
```

### 7.2 Doctors Endpoints

```typescript
// GET /api/doctors/:id/family-patients
@Get(':id/family-patients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR, UserRole.ADMIN)
async getFamilyPatients(@Param('id') doctorId: string, @Request() req) {
  // Médecin ne peut voir que ses propres patients
  if (req.user.role === UserRole.DOCTOR && req.user.doctorId !== doctorId) {
    throw new ForbiddenException('You can only view your own family patients');
  }
  return this.doctorsService.getMyFamilyPatients(doctorId);
}

// GET /api/doctors/:id/statistics
@Get(':id/statistics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR, UserRole.ADMIN)
async getStatistics(@Param('id') doctorId: string, @Request() req) {
  if (req.user.role === UserRole.DOCTOR && req.user.doctorId !== doctorId) {
    throw new ForbiddenException('You can only view your own statistics');
  }
  return this.doctorsService.getStatistics(doctorId);
}

// GET /api/doctors/:id/pending-appointments
@Get(':id/pending-appointments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR)
async getPendingAppointments(@Param('id') doctorId: string, @Request() req) {
  if (req.user.doctorId !== doctorId) {
    throw new ForbiddenException();
  }
  return this.appointmentsService.getDoctorPendingAppointments(doctorId);
}
```

### 7.3 Appointments Endpoints

```typescript
// POST /api/appointments
@Post()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.PATIENT, UserRole.ADMIN)
async create(@Body() createDto: CreateAppointmentDto, @Request() req) {
  // Patient ne peut créer que pour lui-même
  if (req.user.role === UserRole.PATIENT && req.user.patientId !== createDto.patientId) {
    throw new ForbiddenException('You can only create appointments for yourself');
  }
  return this.appointmentsService.createAppointment(createDto, req.user.userId);
}

// PATCH /api/appointments/:id/approve/doctor
@Patch(':id/approve/doctor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR)
async approveByDoctor(@Param('id') id: string, @Request() req) {
  return this.appointmentsService.approveByDoctor(id, req.user.doctorId);
}

// PATCH /api/appointments/:id/reject/doctor
@Patch(':id/reject/doctor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR)
async rejectByDoctor(
  @Param('id') id: string,
  @Body() dto: { reason: string },
  @Request() req,
) {
  return this.appointmentsService.rejectByDoctor(id, req.user.doctorId, dto.reason);
}

// PATCH /api/appointments/:id/approve/admin
@Patch(':id/approve/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async approveByAdmin(@Param('id') id: string, @Request() req) {
  return this.appointmentsService.approveByAdmin(id, req.user.userId);
}

// PATCH /api/appointments/:id/reject/admin
@Patch(':id/reject/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async rejectByAdmin(
  @Param('id') id: string,
  @Body() dto: { reason: string },
  @Request() req,
) {
  return this.appointmentsService.rejectByAdmin(id, req.user.userId, dto.reason);
}

// GET /api/appointments/pending
@Get('pending')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async getPending() {
  return this.appointmentsService.getPendingAppointments();
}
```

### 7.4 Admin Endpoints

```typescript
// GET /api/admin/patients
@Get('patients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async getAllPatients() {
  return this.patientsService.findAll();
}

// POST /api/admin/patients
@Post('patients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async createPatient(@Body() createDto: CreatePatientDto) {
  return this.patientsService.create(createDto);
}

// DELETE /api/admin/patients/:id
@Delete('patients/:id')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async deletePatient(@Param('id') id: string) {
  return this.patientsService.remove(id);
}

// GET /api/admin/appointments/pending
@Get('appointments/pending')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async getPendingAppointments() {
  return this.appointmentsService.getPendingAppointments();
}

// GET /api/admin/statistics
@Get('statistics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
async getStatistics() {
  return this.adminService.getGlobalStatistics();
}
```

---

## 8. Améliorations Suggérées

### 8.1 Priorité Critique

#### 1. Gestion des Départs de Médecins
**Problème:** Que se passe-t-il quand un médecin quitte la clinique?

**Solution:**
- Ajouter un statut `isActive` sur Doctor (déjà existant)
- Lors de la désactivation d'un médecin:
  - Lister tous ses patients de famille
  - Notifier l'admin
  - Option 1: Réassignation automatique au médecin avec le moins de patients
  - Option 2: Réassignation manuelle par l'admin
  - Conserver l'historique

```typescript
async deactivateDoctor(doctorId: string, reassignStrategy: 'auto' | 'manual' = 'manual') {
  const familyPatients = await this.getFamilyPatients(doctorId);

  if (reassignStrategy === 'auto' && familyPatients.length > 0) {
    // Trouver médecin avec moins de patients
    const targetDoctor = await this.findDoctorWithLeastPatients();

    for (const patient of familyPatients) {
      await this.patientsService.assignFamilyDoctor(
        patient.id,
        targetDoctor.id,
        'SYSTEM',
        `Auto-reassigned from deactivated doctor ${doctorId}`
      );
    }
  }

  // Désactiver le médecin
  await this.update(doctorId, { isAvailable: false });
}
```

#### 2. Système de Notifications
**Besoin:** Informer les utilisateurs des événements importants

**Événements à notifier:**
- Patient: Rendez-vous approuvé/rejeté
- Médecin: Nouvelle demande de rendez-vous
- Admin: Rendez-vous en attente d'approbation
- Patient: Changement de médecin de famille

**Solution:**
- Créer une table `notifications`
- Service de notifications
- WebSocket ou polling pour notifications en temps réel
- Email pour notifications importantes

#### 3. Validation Disponibilité Médecin de Famille
**Besoin:** Vérifier si le médecin de famille est vraiment indisponible avant d'autoriser rendez-vous avec autre médecin

**Implémenté dans:** `AppointmentsService.canPatientBookWithDoctor()`

### 8.2 Priorité Moyenne

#### 4. Limite de Patients par Médecin
**Besoin:** Éviter qu'un médecin ait trop de patients de famille

**Solution:**
- Champ `maxFamilyPatients` sur Doctor (déjà dans le design)
- Validation lors de l'assignation
- Dashboard pour admin montrant la charge de chaque médecin

#### 5. Demande de Changement de Médecin de Famille
**Besoin:** Patient peut demander un changement, admin approuve

**Solution:**
- Nouvelle table `family_doctor_change_requests`
- Workflow: Patient demande → Admin approuve → Changement effectué
- Historique des demandes

```typescript
@Entity('family_doctor_change_requests')
export class FamilyDoctorChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column()
  currentDoctorId: string;

  @Column()
  requestedDoctorId: string;

  @Column()
  reason: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 6. Statistiques & Rapports
**Besoin:** Tableaux de bord pour admin et médecins

**Métriques:**
- Admin:
  - Total patients, médecins, rendez-vous
  - Taux d'occupation des médecins
  - Rendez-vous en attente
  - Temps moyen d'approbation
- Médecin:
  - Nombre de patients de famille
  - Rendez-vous du jour/semaine
  - Taux d'approbation
  - Patients actifs vs inactifs

### 8.3 Priorité Basse (Future)

#### 7. Liste d'Attente
**Besoin:** Si un médecin est complet, patient peut s'inscrire

**Solution:**
- Table `waiting_list`
- Notification automatique quand une place se libère

#### 8. Préférences Patient
**Besoin:** Patient peut avoir une liste de médecins préférés

**Solution:**
- Champ JSONB `preferredDoctors` sur Patient
- Algorithme de suggestion de rendez-vous

#### 9. Recall Automatique
**Besoin:** Rendez-vous de suivi pour certaines conditions

**Solution:**
- Champ `requiresFollowUp` sur Appointment
- Cron job pour créer rappels automatiques

---

## 9. Clarifications & Décisions

### 9.1 Changement de Médecin de Famille

**Question:** Qui peut initier un changement de médecin de famille?

**Décision:**
- ✅ **Admin uniquement** peut changer directement
- ✅ **Patient peut demander** via une requête que l'admin approuve (feature future)
- ❌ **Médecin ne peut pas** changer

**Fréquence:**
- ✅ Pas de limite technique (l'admin décide)
- ✅ Historique complet conservé
- ⚠️ Considérer une limite de 2 changements/an (configurable) si abus

**Implémentation:**
```typescript
// Phase 1: Admin change directement
POST /api/patients/:id/family-doctor

// Phase 2 (future): Patient demande
POST /api/patients/:id/family-doctor/request-change
PATCH /api/admin/family-doctor-requests/:id/approve
PATCH /api/admin/family-doctor-requests/:id/reject
```

### 9.2 Approbation des Rendez-vous

**Question:** Ordre d'approbation? (Médecin puis Admin, ou inverse, ou parallèle?)

**Décision:**
- ✅ **Approbations parallèles** (pas d'ordre imposé)
- ✅ **Status CONFIRMED** seulement quand les DEUX ont approuvé
- ✅ **Status REJECTED** dès que l'un des deux rejette

**Logique:**
```typescript
if (doctorApproved && adminApproved) {
  status = CONFIRMED;
} else if (doctorRejected || adminRejected) {
  status = REJECTED;
} else {
  status = PENDING;
}
```

**Timeout:**
- ⚠️ **Phase 1:** Pas de timeout automatique
- ✅ **Phase 2 (future):** Auto-rejet après 7 jours sans approbation
- ✅ **Phase 2 (future):** Notification à J+3 si pas d'action

**Implémentation:**
```typescript
// Cron job quotidien
async checkExpiredAppointments() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const expiredAppointments = await this.appointmentsRepository.find({
    where: {
      status: AppointmentStatus.PENDING,
      createdAt: LessThan(sevenDaysAgo),
    },
  });

  for (const appointment of expiredAppointments) {
    appointment.status = AppointmentStatus.REJECTED;
    appointment.adminRejectionReason = 'Auto-rejected: No action taken within 7 days';
    await this.appointmentsRepository.save(appointment);

    // Notifier le patient
    await this.notificationsService.notify(appointment.patientId, {
      type: 'APPOINTMENT_REJECTED',
      message: 'Your appointment request has been automatically rejected due to timeout',
    });
  }
}
```

### 9.3 Vérification Disponibilité Médecin de Famille

**Question:** Comment vérifier la disponibilité?

**Décision:**
- ✅ **Vérifier le schedule** (jours/heures de travail)
- ✅ **Vérifier les rendez-vous existants** (pas de double booking)
- ✅ **Vérifier isAvailable** (médecin actif)

**Logique:**
```typescript
async isDoctorAvailable(doctorId: string, dateTime: Date, duration: number): Promise<boolean> {
  const doctor = await this.findOne(doctorId);

  // 1. Médecin existe et actif
  if (!doctor || !doctor.isAvailable) return false;

  // 2. Vérifier schedule
  const dayOfWeek = dateTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const timeSlot = doctor.schedule?.[dayOfWeek];
  if (!timeSlot?.enabled) return false;

  // Vérifier heures
  const requestedTime = dateTime.toTimeString().slice(0, 5); // "14:30"
  if (requestedTime < timeSlot.start || requestedTime > timeSlot.end) return false;

  // 3. Vérifier pas de conflit avec rendez-vous existants
  const endTime = new Date(dateTime.getTime() + duration * 60000);
  const conflictingAppointment = await this.appointmentsRepository
    .createQueryBuilder('appointment')
    .where('appointment.doctorId = :doctorId', { doctorId })
    .andWhere('appointment.status IN (:...statuses)', {
      statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]
    })
    .andWhere(
      '(appointment.dateTime < :endTime AND ' +
      'appointment.dateTime + (appointment.duration || \' minutes\')::interval > :startTime)',
      { startTime: dateTime, endTime }
    )
    .getOne();

  return !conflictingAppointment;
}
```

### 9.4 Accès Médecin aux Rendez-vous

**Question:** Un médecin peut-il voir les rendez-vous demandés avec lui par des non-family patients?

**Décision:**
- ✅ **OUI**, un médecin voit TOUS les rendez-vous demandés avec lui
- ✅ Mais il ne peut voir les **dossiers médicaux** que de ses patients de famille
- ✅ Pour approuver un rendez-vous, pas besoin d'accès au dossier complet

**Matrice d'accès:**

| Ressource | Patient de famille | Patient non-famille |
|-----------|-------------------|---------------------|
| Rendez-vous avec le médecin | ✅ Voir + Approuver | ✅ Voir + Approuver |
| Dossier médical complet | ✅ Accès complet | ❌ Pas d'accès |
| Historique rendez-vous | ✅ Tous | ❌ Aucun |

**Implémentation:**
```typescript
// Médecin peut voir tous SES rendez-vous
@Get('my-appointments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR)
async getMyAppointments(@Request() req) {
  return this.appointmentsService.findByDoctor(req.user.doctorId);
}

// Mais accès dossier médical limité
@Get('patients/:id/medical-history')
@UseGuards(AuthGuard('jwt'), RolesGuard, IsFamilyDoctorGuard)
@Roles(UserRole.DOCTOR)
async getPatientMedicalHistory(@Param('id') patientId: string) {
  return this.patientsService.getMedicalHistory(patientId);
}
```

### 9.5 Migration Données Existantes

**Question:** Comment gérer les patients existants?

**Décision:**
- ✅ **Phase 1:** `familyDoctorId` est nullable
- ✅ Patients existants → `familyDoctorId = null`
- ✅ Admin assigne progressivement les médecins de famille
- ✅ Pas d'assignation automatique (décision métier importante)

**Script de migration (optionnel):**
```typescript
// Si on veut répartir automatiquement
async autoAssignFamilyDoctors() {
  const patientsWithoutFamilyDoctor = await this.patientsRepository.find({
    where: { familyDoctorId: IsNull() },
  });

  const doctors = await this.doctorsRepository.find({
    where: { isAvailable: true },
  });

  let doctorIndex = 0;

  for (const patient of patientsWithoutFamilyDoctor) {
    const doctor = doctors[doctorIndex % doctors.length];

    await this.patientsService.assignFamilyDoctor(
      patient.id,
      doctor.id,
      'SYSTEM',
      'Auto-assigned during migration'
    );

    doctorIndex++;
  }
}
```

### 9.6 Règles de Validation Supplémentaires

**Décisions additionnelles:**

1. **Rendez-vous dans le passé:**
   - ❌ Interdit de créer un rendez-vous dans le passé
   - ✅ Validation: `dateTime > new Date()`

2. **Durée minimum de rendez-vous:**
   - ✅ Minimum 15 minutes
   - ✅ Maximum 2 heures
   - ✅ Multiples de 15 minutes

3. **Délai de création:**
   - ✅ Minimum 2 heures à l'avance (sauf admin)
   - ✅ Maximum 3 mois à l'avance

4. **Annulation:**
   - ✅ Patient peut annuler jusqu'à 24h avant
   - ✅ Médecin/Admin peuvent annuler à tout moment
   - ✅ Historique des annulations conservé

5. **Modification:**
   - ✅ Modification = Annulation + Nouvelle demande
   - ❌ Pas de modification directe (pour garder l'audit trail)

**Validation DTO:**
```typescript
export class CreateAppointmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsDate()
  @Type(() => Date)
  @MinDate(new Date(), { message: 'Appointment must be in the future' })
  dateTime: Date;

  @IsInt()
  @Min(15)
  @Max(120)
  @IsMultiple(15)
  duration: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
```

---

## 10. Plan d'Implémentation

### Phase 1: Fondations (Sprint 1 - 2 semaines)

#### Semaine 1: Schema & Entities
- [ ] Créer migration pour Patient (familyDoctorId)
- [ ] Créer migration pour Doctor (familyPatients, maxFamilyPatients)
- [ ] Créer migration pour Appointment (approbations)
- [ ] Créer entity FamilyDoctorHistory
- [ ] Mettre à jour les entities existantes
- [ ] Tester les migrations

#### Semaine 2: Services de Base
- [ ] PatientsService: assignFamilyDoctor, removeFamilyDoctor, changeFamilyDoctor
- [ ] FamilyDoctorHistoryService: create, findByPatient
- [ ] PatientsService: isFamilyDoctor, getFamilyPatients
- [ ] Tests unitaires services

### Phase 2: Workflow Rendez-vous (Sprint 2 - 2 semaines)

#### Semaine 3: Logique Métier
- [ ] AppointmentsService: canPatientBookWithDoctor
- [ ] AppointmentsService: isDoctorAvailable
- [ ] AppointmentsService: createAppointment (avec validations)
- [ ] AppointmentsService: approveByDoctor, rejectByDoctor
- [ ] AppointmentsService: approveByAdmin, rejectByAdmin
- [ ] Tests unitaires

#### Semaine 4: Guards & Permissions
- [ ] IsFamilyDoctorGuard
- [ ] IsPatientOwnerGuard
- [ ] CanViewPatientGuard
- [ ] CanManagePatientsGuard
- [ ] Tests guards

### Phase 3: API & Controllers (Sprint 3 - 2 semaines)

#### Semaine 5: Endpoints Patients & Doctors
- [ ] PatientsController: endpoints médecin de famille
- [ ] PatientsController: endpoint historique
- [ ] DoctorsController: family-patients
- [ ] DoctorsController: statistics
- [ ] DoctorsController: pending-appointments
- [ ] Tests e2e

#### Semaine 6: Endpoints Appointments & Admin
- [ ] AppointmentsController: approve/reject endpoints
- [ ] AppointmentsController: pending endpoint
- [ ] AdminController: patients management
- [ ] AdminController: statistics
- [ ] Tests e2e

### Phase 4: Améliorations & Polish (Sprint 4 - 1-2 semaines)

#### Semaine 7: Fonctionnalités Avancées
- [ ] Validation détaillée (délais, durées, etc.)
- [ ] Gestion départs médecins
- [ ] DTOs complets avec validation
- [ ] Documentation API (Swagger)

#### Semaine 8: Tests & Documentation
- [ ] Tests d'intégration complets
- [ ] Tests de performance
- [ ] Documentation utilisateur
- [ ] Scripts de migration données existantes

### Phase 5 (Future): Notifications & Features Avancées

- [ ] Système de notifications
- [ ] WebSocket pour temps réel
- [ ] Email notifications
- [ ] Demandes de changement médecin de famille
- [ ] Liste d'attente
- [ ] Statistiques avancées
- [ ] Cron jobs (timeouts, rappels)

---

## Annexes

### A. Checklist de Sécurité

- [ ] Toutes les routes sont protégées par AuthGuard
- [ ] Guards de permission sur routes sensibles
- [ ] Validation des entrées utilisateur (DTOs)
- [ ] Pas d'exposition de données sensibles (passwords, etc.)
- [ ] Audit trail pour actions importantes
- [ ] Rate limiting sur API
- [ ] HTTPS obligatoire en production
- [ ] Tokens JWT sécurisés

### B. Checklist de Performance

- [ ] Index sur clés étrangères
- [ ] Index sur champs de recherche fréquents
- [ ] Eager loading optimisé
- [ ] Pagination sur listes longues
- [ ] Cache pour données fréquentes
- [ ] Requêtes N+1 évitées

### C. Index de Base de Données

```sql
-- Patients
CREATE INDEX "IDX_patients_familyDoctorId" ON "patients" ("familyDoctorId");
CREATE INDEX "IDX_patients_userId" ON "patients" ("userId");

-- Appointments
CREATE INDEX "IDX_appointments_patientId" ON "appointments" ("patientId");
CREATE INDEX "IDX_appointments_doctorId" ON "appointments" ("doctorId");
CREATE INDEX "IDX_appointments_status" ON "appointments" ("status");
CREATE INDEX "IDX_appointments_dateTime" ON "appointments" ("dateTime");
CREATE INDEX "IDX_appointments_pending" ON "appointments" ("status")
  WHERE "status" = 'PENDING';

-- Family Doctor History
CREATE INDEX "IDX_history_patientId" ON "family_doctor_history" ("patientId");
CREATE INDEX "IDX_history_changedAt" ON "family_doctor_history" ("changedAt");
```

### D. Variables d'Environnement

```env
# Appointments
APPOINTMENT_MIN_ADVANCE_HOURS=2
APPOINTMENT_MAX_ADVANCE_MONTHS=3
APPOINTMENT_MIN_DURATION_MINUTES=15
APPOINTMENT_MAX_DURATION_MINUTES=120
APPOINTMENT_AUTO_REJECT_DAYS=7

# Notifications
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=false
EMAIL_FROM=noreply@clinic.com

# Limits
MAX_FAMILY_PATIENTS_DEFAULT=100
```

---

**Document Version:** 1.0
**Last Updated:** 2026-02-14
**Status:** ✅ Prêt pour implémentation
**Next Review:** Après Phase 1
