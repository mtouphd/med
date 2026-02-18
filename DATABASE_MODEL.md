# Modèle de Données - Système de Gestion Médicale

**Version:** 2.0 (avec Dossier Médical Structuré)
**Date:** 2026-02-14

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SYSTÈME DE GESTION MÉDICALE                          │
│                                                                             │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐                     │
│  │   USER   │───────→│ PATIENT  │───────→│ DOCTOR   │                     │
│  │ (Compte) │        │(Médical) │        │  (Pro)   │                     │
│  └──────────┘        └────┬─────┘        └────┬─────┘                     │
│       │                   │                    │                            │
│       │                   │                    │                            │
│       │              ┌────▼────────────────────▼────┐                      │
│       │              │     APPOINTMENT              │                      │
│       │              │    (Rendez-vous)             │                      │
│       │              └──────────────────────────────┘                      │
│       │                   │                                                 │
│       │              ┌────▼──────────────┐                                 │
│       │              │  MEDICAL_RECORD   │                                 │
│       │              │ (Dossier Médical) │                                 │
│       │              └────┬──────────────┘                                 │
│       │                   │                                                 │
│       │         ┌─────────┼─────────┬──────────┬───────────┐              │
│       │         ▼         ▼         ▼          ▼           ▼              │
│       │    ┌─────────┐┌─────────┐┌──────────┐┌──────────┐┌──────────┐   │
│       │    │CONDITION││ALLERGY  ││MEDICATION││VACCINATION││LAB_RESULT│   │
│       │    └─────────┘└─────────┘└──────────┘└──────────┘└──────────┘   │
│       │                                                                     │
│       └──────────────────────────────────────────────────────────────────┤
│                      FAMILY_DOCTOR_HISTORY                                  │
│                      (Historique médecin de famille)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Diagramme Détaillé des Entités

### 1. AUTHENTIFICATION & UTILISATEURS

```
┌────────────────────────────────────────────────────────────────┐
│                            USER                                │
│ ────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                 │
│     email                 VARCHAR(255) UNIQUE                  │
│     password              VARCHAR(255) [HASHED]                │
│     firstName             VARCHAR(100)                         │
│     lastName              VARCHAR(100)                         │
│     phone                 VARCHAR(20)                          │
│     role                  ENUM(PATIENT, DOCTOR, ADMIN)         │
│     isActive              BOOLEAN DEFAULT true                 │
│     createdAt             TIMESTAMP                            │
│     updatedAt             TIMESTAMP                            │
└────────────────────────────────────────────────────────────────┘
           │ 1:1                           │ 1:1
           │                               │
           ▼                               ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│       PATIENT           │      │        DOCTOR           │
│ ─────────────────────── │      │ ─────────────────────── │
│ PK  id          UUID    │      │ PK  id          UUID    │
│ FK  userId      UUID    │      │ FK  userId      UUID    │
│     dateOfBirth DATE    │      │     specialty   VARCHAR │
│     address     VARCHAR │      │     licenseNumber VARCHAR│
│     emergencyContact VARCHAR│  │     bio         TEXT    │
│ FK  familyDoctorId UUID │      │     consultationDuration INT│
│     familyDoctorAssignedAt  │  │     isAvailable BOOLEAN │
│     createdAt   TIMESTAMP│     │     schedule    JSONB   │
│     updatedAt   TIMESTAMP│      │     maxFamilyPatients INT│
└─────────────────────────┘       │     createdAt   TIMESTAMP│
           │                      │     updatedAt   TIMESTAMP│
           │                      └─────────────────────────┘
           │ 1:1                           │ 1:N
           │                               │
           ▼                               ▼
┌─────────────────────────┐      ┌──────────────────────────┐
│   MEDICAL_RECORD        │      │  FAMILY_PATIENTS         │
│  (Voir section 2)       │      │  (Relation virtuelle)    │
└─────────────────────────┘      └──────────────────────────┘
```

---

### 2. RENDEZ-VOUS

```
┌────────────────────────────────────────────────────────────────────────┐
│                              APPOINTMENT                               │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  patientId             UUID  ──→ PATIENT(id)                        │
│ FK  doctorId              UUID  ──→ DOCTOR(id)                         │
│     dateTime              TIMESTAMP                                    │
│     duration              INT (minutes)                                │
│     status                ENUM(PENDING, CONFIRMED, REJECTED,           │
│                                COMPLETED, CANCELLED)                   │
│     reason                TEXT                                         │
│     notes                 TEXT                                         │
│     medications           TEXT                                         │
│                                                                         │
│ ─── WORKFLOW D'APPROBATION ───────────────────────────────────────── │
│     doctorApproved        BOOLEAN DEFAULT false                        │
│     adminApproved         BOOLEAN DEFAULT false                        │
│     doctorApprovedAt      TIMESTAMP                                    │
│ FK  doctorApprovedBy      UUID  ──→ USER(id)                           │
│     adminApprovedAt       TIMESTAMP                                    │
│ FK  adminApprovedBy       UUID  ──→ USER(id)                           │
│     doctorRejectionReason TEXT                                         │
│     adminRejectionReason  TEXT                                         │
│                                                                         │
│ FK  requestedBy           UUID  ──→ USER(id)                           │
│     createdAt             TIMESTAMP                                    │
│     updatedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘

INDEX: patientId, doctorId, status, dateTime
INDEX: (status) WHERE status = 'PENDING'
```

---

### 3. DOSSIER MÉDICAL PRINCIPAL

```
┌────────────────────────────────────────────────────────────────────────┐
│                           MEDICAL_RECORD                               │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  patientId             UUID UNIQUE ──→ PATIENT(id) ON DELETE CASCADE│
│                                                                         │
│ ─── INFORMATIONS GÉNÉRALES ──────────────────────────────────────── │
│     bloodType             VARCHAR(5)  (A+, O-, AB+, etc.)              │
│     height                INT         (cm)                             │
│     weight                DECIMAL(5,2)(kg)                             │
│     organDonor            BOOLEAN                                      │
│     generalNotes          TEXT                                         │
│                                                                         │
│     createdAt             TIMESTAMP                                    │
│     updatedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           │
     ┌─────┴─────┬─────────────┬──────────────┬─────────────┐
     ▼           ▼             ▼              ▼             ▼
┌─────────┐ ┌─────────┐ ┌───────────┐ ┌────────────┐ ┌───────────┐
│CONDITION│ │ALLERGY  │ │MEDICATION │ │VACCINATION │ │LAB_RESULT │
└─────────┘ └─────────┘ └───────────┘ └────────────┘ └───────────┘
```

---

### 4. CONDITIONS MÉDICALES (Maladies)

```
┌────────────────────────────────────────────────────────────────────────┐
│                         MEDICAL_CONDITION                              │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  medicalRecordId       UUID ──→ MEDICAL_RECORD(id) ON DELETE CASCADE│
│                                                                         │
│     name                  VARCHAR(255)  (ex: "Diabète Type 2")         │
│     description           TEXT                                         │
│     status                ENUM(ACTIVE, RESOLVED, CHRONIC, MANAGED)     │
│     severity              ENUM(MILD, MODERATE, SEVERE, CRITICAL)       │
│     diagnosedDate         DATE                                         │
│     resolvedDate          DATE                                         │
│                                                                         │
│ FK  diagnosedBy           UUID  ──→ DOCTOR(id)                         │
│     treatment             TEXT                                         │
│     notes                 TEXT                                         │
│                                                                         │
│     createdAt             TIMESTAMP                                    │
│     updatedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘

INDEX: medicalRecordId, status, name
```

**Exemples de données:**
```sql
INSERT INTO medical_conditions VALUES
  ('uuid1', 'record1', 'Diabète Type 2', 'Diabète non insulino-dépendant',
   'CHRONIC', 'MODERATE', '2020-01-15', NULL, 'doctor1',
   'Metformine 500mg + Régime', '...'),
  ('uuid2', 'record2', 'Hypertension', 'Tension artérielle élevée',
   'MANAGED', 'MILD', '2019-06-10', NULL, 'doctor2',
   'Amlodipine 5mg', '...');
```

---

### 5. ALLERGIES

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ALLERGY                                   │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  medicalRecordId       UUID ──→ MEDICAL_RECORD(id) ON DELETE CASCADE│
│                                                                         │
│     allergen              VARCHAR(255) (ex: "Pénicilline", "Arachides")│
│     type                  ENUM(MEDICATION, FOOD, ENVIRONMENTAL, OTHER) │
│     severity              ENUM(MILD, MODERATE, SEVERE, ANAPHYLACTIC)   │
│     reaction              TEXT (Description de la réaction)            │
│     firstOccurrence       DATE                                         │
│     notes                 TEXT                                         │
│                                                                         │
│     createdAt             TIMESTAMP                                    │
│     updatedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘

INDEX: medicalRecordId, type, severity
INDEX: allergen (for searching)
```

**Exemples de données:**
```sql
INSERT INTO allergies VALUES
  ('uuid1', 'record1', 'Pénicilline', 'MEDICATION', 'SEVERE',
   'Urticaire généralisée + difficultés respiratoires', '2015-03-20', '...'),
  ('uuid2', 'record1', 'Arachides', 'FOOD', 'ANAPHYLACTIC',
   'Choc anaphylactique', '2010-05-15', 'Porter EpiPen');
```

---

### 6. MÉDICAMENTS EN COURS

```
┌────────────────────────────────────────────────────────────────────────┐
│                            MEDICATION                                  │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  medicalRecordId       UUID ──→ MEDICAL_RECORD(id) ON DELETE CASCADE│
│                                                                         │
│     name                  VARCHAR(255) (ex: "Metformine")              │
│     dosage                VARCHAR(100) (ex: "500mg")                   │
│     frequency             VARCHAR(100) (ex: "2x par jour")             │
│     route                 VARCHAR(50)  (ex: "Oral", "IV")              │
│     status                ENUM(ACTIVE, STOPPED, COMPLETED)             │
│                                                                         │
│     startDate             DATE                                         │
│     endDate               DATE                                         │
│                                                                         │
│ FK  prescribedBy          UUID  ──→ DOCTOR(id)                         │
│     forCondition          VARCHAR(255) (Nom de la condition)           │
│     sideEffects           TEXT                                         │
│     notes                 TEXT                                         │
│                                                                         │
│     createdAt             TIMESTAMP                                    │
│     updatedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘

INDEX: medicalRecordId, status, prescribedBy
```

**Exemples de données:**
```sql
INSERT INTO medications VALUES
  ('uuid1', 'record1', 'Metformine', '500mg', '2x par jour', 'Oral',
   'ACTIVE', '2020-01-15', NULL, 'doctor1', 'Diabète Type 2',
   'Légers troubles digestifs', '...'),
  ('uuid2', 'record1', 'Aspirine', '100mg', '1x par jour', 'Oral',
   'ACTIVE', '2021-03-10', NULL, 'doctor2', 'Prévention cardiovasculaire',
   NULL, 'Prendre le matin');
```

---

### 7. VACCINATIONS

```
┌────────────────────────────────────────────────────────────────────────┐
│                           VACCINATION                                  │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  medicalRecordId       UUID ──→ MEDICAL_RECORD(id) ON DELETE CASCADE│
│                                                                         │
│     name                  VARCHAR(255) (ex: "COVID-19", "Grippe")      │
│     dateGiven             DATE                                         │
│     manufacturer          VARCHAR(100) (ex: "Pfizer", "Moderna")       │
│     lotNumber             VARCHAR(100)                                 │
│                                                                         │
│ FK  administeredBy        UUID  ──→ DOCTOR(id)                         │
│     nextDoseDate          DATE (Date du rappel)                        │
│     notes                 TEXT                                         │
│                                                                         │
│     createdAt             TIMESTAMP                                    │
│     updatedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘

INDEX: medicalRecordId, dateGiven, name
```

**Exemples de données:**
```sql
INSERT INTO vaccinations VALUES
  ('uuid1', 'record1', 'COVID-19', '2024-01-10', 'Pfizer', 'LOT12345',
   'doctor1', '2024-07-10', 'Dose de rappel'),
  ('uuid2', 'record1', 'Grippe', '2025-10-15', 'Sanofi', 'LOT67890',
   'nurse1', '2026-10-15', 'Vaccination annuelle');
```

---

### 8. RÉSULTATS D'ANALYSES (OPTIONNEL - PHASE 3)

```
┌────────────────────────────────────────────────────────────────────────┐
│                           LAB_RESULT                                   │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  medicalRecordId       UUID ──→ MEDICAL_RECORD(id) ON DELETE CASCADE│
│                                                                         │
│     testName              VARCHAR(255) (ex: "Glycémie à jeun")         │
│     testDate              DATE                                         │
│     result                VARCHAR(100) (ex: "1.2 g/L")                 │
│     unit                  VARCHAR(50)  (ex: "g/L", "mmol/L")            │
│     referenceRange        VARCHAR(100) (ex: "0.7-1.1 g/L")             │
│     status                ENUM(NORMAL, ABNORMAL, CRITICAL)             │
│                                                                         │
│ FK  orderedBy             UUID  ──→ DOCTOR(id)                         │
│     laboratory            VARCHAR(255)                                 │
│     notes                 TEXT                                         │
│     attachmentUrl         VARCHAR(500) (PDF du résultat)               │
│                                                                         │
│     createdAt             TIMESTAMP                                    │
│     updatedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘

INDEX: medicalRecordId, testDate, status
```

---

### 9. HISTORIQUE MÉDECIN DE FAMILLE

```
┌────────────────────────────────────────────────────────────────────────┐
│                     FAMILY_DOCTOR_HISTORY                              │
│ ────────────────────────────────────────────────────────────────────── │
│ PK  id                    UUID                                         │
│ FK  patientId             UUID  ──→ PATIENT(id) ON DELETE CASCADE      │
│ FK  previousDoctorId      UUID  ──→ DOCTOR(id) ON DELETE SET NULL     │
│ FK  newDoctorId           UUID  ──→ DOCTOR(id) ON DELETE SET NULL     │
│                                                                         │
│     changeType            ENUM(ASSIGNED, CHANGED, REMOVED)             │
│ FK  changedBy             UUID  ──→ USER(id) (Admin qui a fait le chgt)│
│     reason                TEXT                                         │
│                                                                         │
│     changedAt             TIMESTAMP                                    │
└────────────────────────────────────────────────────────────────────────┘

INDEX: patientId, changedAt
```

**Exemples de données:**
```sql
INSERT INTO family_doctor_history VALUES
  -- Première assignation
  ('uuid1', 'patient1', NULL, 'doctor1', 'ASSIGNED', 'admin1',
   'Premier médecin de famille', '2024-01-10'),

  -- Changement de médecin
  ('uuid2', 'patient1', 'doctor1', 'doctor2', 'CHANGED', 'admin1',
   'Dr. Sarah a quitté la clinique', '2025-06-15'),

  -- Retrait du médecin de famille
  ('uuid3', 'patient2', 'doctor3', NULL, 'REMOVED', 'admin1',
   'Patient a déménagé', '2025-12-20');
```

---

## 🔗 Relations Complètes

### Diagramme ERD (Entity Relationship Diagram)

```
                                    ┌─────────┐
                                    │  USER   │
                                    └────┬────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │ 1:1            │ 1:1            │
                        ▼                ▼                ▼
                  ┌─────────┐      ┌─────────┐     ┌─────────┐
                  │ PATIENT │      │ DOCTOR  │     │  ADMIN  │
                  └────┬────┘      └────┬────┘     └─────────┘
                       │                 │
                       │                 │
          ┌────────────┼─────────────────┼────────────┐
          │ 1:1        │ N:1             │ 1:N        │
          ▼            │                 │            │
    ┌──────────────┐   │                 │            │
    │MEDICAL_RECORD│   │                 │            │
    └──────┬───────┘   │                 │            │
           │           │                 │            │
           │ 1:N       │                 │            │
           │           │                 │            │
    ┌──────┴───────────┴─────┐           │            │
    │                         │           │            │
    ▼                         ▼           ▼            ▼
┌─────────────┐      ┌──────────────────────────────────┐
│  CONDITIONS │      │         APPOINTMENT              │
│  ALLERGIES  │      │                                  │
│  MEDICATIONS│      │  patientId ──→ PATIENT          │
│  VACCINATIONS│     │  doctorId  ──→ DOCTOR           │
│  LAB_RESULTS │     │  requestedBy ─→ USER            │
└─────────────┘      │  doctorApprovedBy → USER        │
                     │  adminApprovedBy ─→ USER         │
                     └──────────────────────────────────┘
                                    │
                                    │
                     ┌──────────────┴──────────────┐
                     │ FAMILY_DOCTOR_HISTORY       │
                     │                             │
                     │ patientId ──→ PATIENT       │
                     │ previousDoctorId → DOCTOR   │
                     │ newDoctorId ──→ DOCTOR      │
                     │ changedBy ──→ USER          │
                     └─────────────────────────────┘
```

---

## 📐 Cardinalités Détaillées

| Relation | Entité A | Cardinalité | Entité B | Type |
|----------|----------|-------------|----------|------|
| User ↔ Patient | User (1) | 1:1 | Patient (0..1) | OneToOne |
| User ↔ Doctor | User (1) | 1:1 | Doctor (0..1) | OneToOne |
| Patient ↔ MedicalRecord | Patient (1) | 1:1 | MedicalRecord (0..1) | OneToOne |
| Patient ↔ Doctor (famille) | Patient (N) | N:1 | Doctor (1) | ManyToOne |
| Doctor ↔ Patient (famille) | Doctor (1) | 1:N | Patient (N) | OneToMany |
| Patient ↔ Appointment | Patient (1) | 1:N | Appointment (N) | OneToMany |
| Doctor ↔ Appointment | Doctor (1) | 1:N | Appointment (N) | OneToMany |
| MedicalRecord ↔ Condition | MedicalRecord (1) | 1:N | Condition (N) | OneToMany |
| MedicalRecord ↔ Allergy | MedicalRecord (1) | 1:N | Allergy (N) | OneToMany |
| MedicalRecord ↔ Medication | MedicalRecord (1) | 1:N | Medication (N) | OneToMany |
| MedicalRecord ↔ Vaccination | MedicalRecord (1) | 1:N | Vaccination (N) | OneToMany |
| MedicalRecord ↔ LabResult | MedicalRecord (1) | 1:N | LabResult (N) | OneToMany |

---

## 🗂️ Index Recommandés

### Index de Performance

```sql
-- USERS
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- PATIENTS
CREATE INDEX idx_patients_userId ON patients(userId);
CREATE INDEX idx_patients_familyDoctorId ON patients(familyDoctorId);

-- DOCTORS
CREATE INDEX idx_doctors_userId ON doctors(userId);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_isAvailable ON doctors(isAvailable);

-- APPOINTMENTS
CREATE INDEX idx_appointments_patientId ON appointments(patientId);
CREATE INDEX idx_appointments_doctorId ON appointments(doctorId);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_dateTime ON appointments(dateTime);
CREATE INDEX idx_appointments_pending ON appointments(status) WHERE status = 'PENDING';

-- MEDICAL_RECORDS
CREATE INDEX idx_medicalrecords_patientId ON medical_records(patientId);

-- MEDICAL_CONDITIONS
CREATE INDEX idx_conditions_medicalRecordId ON medical_conditions(medicalRecordId);
CREATE INDEX idx_conditions_status ON medical_conditions(status);
CREATE INDEX idx_conditions_name ON medical_conditions(name);

-- ALLERGIES
CREATE INDEX idx_allergies_medicalRecordId ON allergies(medicalRecordId);
CREATE INDEX idx_allergies_type ON allergies(type);
CREATE INDEX idx_allergies_allergen ON allergies(allergen);

-- MEDICATIONS
CREATE INDEX idx_medications_medicalRecordId ON medications(medicalRecordId);
CREATE INDEX idx_medications_status ON medications(status);
CREATE INDEX idx_medications_prescribedBy ON medications(prescribedBy);

-- VACCINATIONS
CREATE INDEX idx_vaccinations_medicalRecordId ON vaccinations(medicalRecordId);
CREATE INDEX idx_vaccinations_dateGiven ON vaccinations(dateGiven);

-- FAMILY_DOCTOR_HISTORY
CREATE INDEX idx_history_patientId ON family_doctor_history(patientId);
CREATE INDEX idx_history_changedAt ON family_doctor_history(changedAt);
```

---

## 📊 Statistiques de Stockage

### Estimation de Taille (pour 10,000 patients)

| Table | Lignes estimées | Taille moyenne/ligne | Taille totale estimée |
|-------|-----------------|----------------------|-----------------------|
| users | 10,500 | 500 bytes | ~5 MB |
| patients | 10,000 | 800 bytes | ~8 MB |
| doctors | 500 | 1 KB | ~500 KB |
| medical_records | 10,000 | 400 bytes | ~4 MB |
| medical_conditions | 30,000 | 600 bytes | ~18 MB |
| allergies | 15,000 | 400 bytes | ~6 MB |
| medications | 25,000 | 500 bytes | ~12.5 MB |
| vaccinations | 40,000 | 400 bytes | ~16 MB |
| appointments | 100,000 | 700 bytes | ~70 MB |
| family_doctor_history | 15,000 | 300 bytes | ~4.5 MB |
| **TOTAL** | | | **~145 MB** |

---

## 🔐 Contraintes d'Intégrité

### Contraintes UNIQUE

```sql
-- Un email par utilisateur
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Un numéro de licence par médecin
ALTER TABLE doctors ADD CONSTRAINT unique_license UNIQUE (licenseNumber);

-- Un dossier médical par patient
ALTER TABLE medical_records ADD CONSTRAINT unique_patient UNIQUE (patientId);
```

### Contraintes CHECK

```sql
-- Validation du groupe sanguin
ALTER TABLE medical_records ADD CONSTRAINT check_blood_type
  CHECK (bloodType IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- Poids et taille positifs
ALTER TABLE medical_records ADD CONSTRAINT check_weight
  CHECK (weight IS NULL OR weight > 0);
ALTER TABLE medical_records ADD CONSTRAINT check_height
  CHECK (height IS NULL OR height > 0);

-- Durée de consultation valide
ALTER TABLE doctors ADD CONSTRAINT check_consultation_duration
  CHECK (consultationDuration >= 15 AND consultationDuration <= 240);

-- Date de rendez-vous dans le futur (pour nouvelles créations)
-- Cette contrainte pourrait être gérée au niveau applicatif
```

### Cascade Actions

```sql
-- Suppression d'un patient supprime son dossier médical
ALTER TABLE medical_records
  ADD CONSTRAINT fk_patient
  FOREIGN KEY (patientId)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Suppression d'un dossier médical supprime toutes les données médicales
ALTER TABLE medical_conditions
  ADD CONSTRAINT fk_medical_record
  FOREIGN KEY (medicalRecordId)
  REFERENCES medical_records(id)
  ON DELETE CASCADE;

-- Idem pour allergies, medications, vaccinations, lab_results
```

---

## 📈 Exemple de Données Complètes

### Scénario: Patient "Ahmed Mohamed"

```sql
-- 1. USER
INSERT INTO users VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'ahmed.mohamed@email.com',
  '$2b$10$hashpassword',
  'Ahmed',
  'Mohamed',
  '+212 600 123 456',
  'PATIENT',
  true,
  '2024-01-15 10:00:00',
  '2024-01-15 10:00:00'
);

-- 2. PATIENT
INSERT INTO patients VALUES (
  '650e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000', -- userId
  '1985-05-20',
  '123 Rue Hassan II, Casablanca',
  '+212 600 999 888',
  '750e8400-e29b-41d4-a716-446655440002', -- familyDoctorId (Dr. Sarah)
  '2024-01-20 14:00:00',
  '2024-01-15 10:05:00',
  '2024-01-20 14:00:00'
);

-- 3. MEDICAL RECORD
INSERT INTO medical_records VALUES (
  '850e8400-e29b-41d4-a716-446655440003',
  '650e8400-e29b-41d4-a716-446655440001', -- patientId
  'A+',
  175, -- height (cm)
  78.5, -- weight (kg)
  true, -- organDonor
  'Patient en bonne santé générale',
  '2024-01-15 10:10:00',
  '2024-01-15 10:10:00'
);

-- 4. MEDICAL CONDITION (Diabète)
INSERT INTO medical_conditions VALUES (
  '950e8400-e29b-41d4-a716-446655440004',
  '850e8400-e29b-41d4-a716-446655440003', -- medicalRecordId
  'Diabète Type 2',
  'Diabète non insulino-dépendant diagnostiqué en 2020',
  'CHRONIC',
  'MODERATE',
  '2020-06-15',
  NULL,
  '750e8400-e29b-41d4-a716-446655440002', -- diagnosedBy (Dr. Sarah)
  'Metformine 500mg 2x/jour + Régime diabétique + Exercice',
  'HbA1c = 7.2% au dernier contrôle',
  '2024-01-15 10:15:00',
  '2024-01-15 10:15:00'
);

-- 5. ALLERGY (Pénicilline)
INSERT INTO allergies VALUES (
  'a50e8400-e29b-41d4-a716-446655440005',
  '850e8400-e29b-41d4-a716-446655440003',
  'Pénicilline',
  'MEDICATION',
  'SEVERE',
  'Urticaire généralisée + œdème facial',
  '2010-03-20',
  '⚠️ NE JAMAIS prescrire de pénicilline ou dérivés',
  '2024-01-15 10:20:00',
  '2024-01-15 10:20:00'
);

-- 6. MEDICATION (Metformine)
INSERT INTO medications VALUES (
  'b50e8400-e29b-41d4-a716-446655440006',
  '850e8400-e29b-41d4-a716-446655440003',
  'Metformine',
  '500mg',
  '2 fois par jour (matin et soir)',
  'Oral',
  'ACTIVE',
  '2020-06-15',
  NULL,
  '750e8400-e29b-41d4-a716-446655440002', -- prescribedBy (Dr. Sarah)
  'Diabète Type 2',
  'Légers troubles digestifs au début (résolus)',
  'Prendre avec les repas',
  '2024-01-15 10:25:00',
  '2024-01-15 10:25:00'
);

-- 7. VACCINATION (COVID-19)
INSERT INTO vaccinations VALUES (
  'c50e8400-e29b-41d4-a716-446655440007',
  '850e8400-e29b-41d4-a716-446655440003',
  'COVID-19 (Rappel)',
  '2024-10-15',
  'Pfizer',
  'LOT2024ABC123',
  '750e8400-e29b-41d4-a716-446655440002', -- administeredBy
  '2025-10-15',
  'Dose de rappel annuelle',
  '2024-10-15 14:30:00',
  '2024-10-15 14:30:00'
);

-- 8. APPOINTMENT (Consultation de suivi)
INSERT INTO appointments VALUES (
  'd50e8400-e29b-41d4-a716-446655440008',
  '650e8400-e29b-41d4-a716-446655440001', -- patientId (Ahmed)
  '750e8400-e29b-41d4-a716-446655440002', -- doctorId (Dr. Sarah)
  '2026-02-20 10:00:00',
  30,
  'CONFIRMED',
  'Suivi diabète + contrôle HbA1c',
  '',
  '',
  true, -- doctorApproved
  true, -- adminApproved
  '2026-02-14 15:00:00', -- doctorApprovedAt
  '750e8400-e29b-41d4-a716-446655440002', -- doctorApprovedBy
  '2026-02-14 16:00:00', -- adminApprovedAt
  'e50e8400-e29b-41d4-a716-446655440009', -- adminApprovedBy
  NULL,
  NULL,
  '550e8400-e29b-41d4-a716-446655440000', -- requestedBy (Ahmed)
  '2026-02-14 14:00:00',
  '2026-02-14 16:00:00'
);
```

---

## 🎯 Résumé

**Nombre total d'entités:** 11 (+ 1 optionnelle)

### Entités Principales:
1. ✅ User (Authentification)
2. ✅ Patient (Profil patient)
3. ✅ Doctor (Profil médecin)
4. ✅ Appointment (Rendez-vous)
5. ✅ MedicalRecord (Dossier médical)
6. ✅ MedicalCondition (Conditions médicales)
7. ✅ Allergy (Allergies)
8. ✅ Medication (Médicaments)
9. ✅ Vaccination (Vaccinations)
10. ✅ FamilyDoctorHistory (Historique médecin de famille)
11. ⭐ LabResult (Résultats d'analyses - Phase 3)

**Nombre total de relations:** 15+

**Types de relations:**
- OneToOne: 3 (User↔Patient, User↔Doctor, Patient↔MedicalRecord)
- OneToMany: 9 (Doctor↔Patient, Patient↔Appointment, Doctor↔Appointment, MedicalRecord↔tous les sous-dossiers)
- ManyToOne: 3 (Patient↔Doctor famille, Appointment↔Patient, Appointment↔Doctor)

---

**Version:** 2.0
**Statut:** ✅ Complet et prêt pour implémentation
**Prochaine étape:** Génération des migrations TypeORM
