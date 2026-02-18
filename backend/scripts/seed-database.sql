-- ============================================
-- Script de seed pour la base de données medapp
-- ============================================
-- Mot de passe pour tous les comptes: qwerty
-- Hash bcrypt: $2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y
-- ============================================

-- ==================== ADMIN ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Admin',
  'System',
  'ADMIN',
  '+1234567890',
  true,
  NOW(),
  NOW()
);

-- ==================== DOCTOR 1 - Jean Dupont ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'jean.dupont@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Jean',
  'Dupont',
  'DOCTOR',
  '+1234567891',
  true,
  NOW(),
  NOW()
);

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Cardiologie',
  'LIC-1001',
  'Médecin spécialisé en Cardiologie avec plus de 10 ans d''expérience.',
  30,
  true,
  50,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"15:00","enabled":true},"saturday":{"start":"00:00","end":"00:00","enabled":false},"sunday":{"start":"00:00","end":"00:00","enabled":false}}',
  NOW(),
  NOW()
);

-- ==================== DOCTOR 2 - Marie Martin ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'marie.martin@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Marie',
  'Martin',
  'DOCTOR',
  '+1234567892',
  true,
  NOW(),
  NOW()
);

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'Pédiatrie',
  'LIC-1002',
  'Médecin spécialisé en Pédiatrie avec plus de 10 ans d''expérience.',
  30,
  true,
  50,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"15:00","enabled":true},"saturday":{"start":"00:00","end":"00:00","enabled":false},"sunday":{"start":"00:00","end":"00:00","enabled":false}}',
  NOW(),
  NOW()
);

-- ==================== DOCTOR 3 - Pierre Bernard ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'pierre.bernard@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Pierre',
  'Bernard',
  'DOCTOR',
  '+1234567893',
  true,
  NOW(),
  NOW()
);

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000003',
  'Dermatologie',
  'LIC-1003',
  'Médecin spécialisé en Dermatologie avec plus de 10 ans d''expérience.',
  30,
  true,
  50,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"15:00","enabled":true},"saturday":{"start":"00:00","end":"00:00","enabled":false},"sunday":{"start":"00:00","end":"00:00","enabled":false}}',
  NOW(),
  NOW()
);

-- ==================== DOCTOR 4 - Sophie Dubois ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000004',
  'sophie.dubois@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Sophie',
  'Dubois',
  'DOCTOR',
  '+1234567894',
  true,
  NOW(),
  NOW()
);

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000004',
  'Neurologie',
  'LIC-1004',
  'Médecin spécialisé en Neurologie avec plus de 10 ans d''expérience.',
  30,
  true,
  NULL,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"15:00","enabled":true},"saturday":{"start":"00:00","end":"00:00","enabled":false},"sunday":{"start":"00:00","end":"00:00","enabled":false}}',
  NOW(),
  NOW()
);

-- ==================== DOCTOR 5 - Luc Laurent ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000005',
  'luc.laurent@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Luc',
  'Laurent',
  'DOCTOR',
  '+1234567895',
  true,
  NOW(),
  NOW()
);

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000005',
  'Médecine Générale',
  'LIC-1005',
  'Médecin spécialisé en Médecine Générale avec plus de 10 ans d''expérience.',
  30,
  true,
  NULL,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"15:00","enabled":true},"saturday":{"start":"00:00","end":"00:00","enabled":false},"sunday":{"start":"00:00","end":"00:00","enabled":false}}',
  NOW(),
  NOW()
);

-- ==================== PATIENT 1 - Alice Dubois ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000001',
  'alice.dubois@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Alice',
  'Dubois',
  'PATIENT',
  '+1987654321',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 2 - Marc Leroy ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000002',
  'marc.leroy@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Marc',
  'Leroy',
  'PATIENT',
  '+1987654322',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000002',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 3 - Claire Moreau ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000003',
  'claire.moreau@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Claire',
  'Moreau',
  'PATIENT',
  '+1987654323',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000003',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000003',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 4 - Thomas Simon ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000004',
  'thomas.simon@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Thomas',
  'Simon',
  'PATIENT',
  '+1987654324',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000004',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000004',
  '40000000-0000-0000-0000-000000000004',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 5 - Julie Michel ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000005',
  'julie.michel@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Julie',
  'Michel',
  'PATIENT',
  '+1987654325',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000005',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000005',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 6 - Nicolas Lefebvre ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000006',
  'nicolas.lefebvre@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Nicolas',
  'Lefebvre',
  'PATIENT',
  '+1987654326',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000006',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000006',
  '40000000-0000-0000-0000-000000000006',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 7 - Emma Rousseau ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000007',
  'emma.rousseau@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Emma',
  'Rousseau',
  'PATIENT',
  '+1987654327',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000007',
  '30000000-0000-0000-0000-000000000007',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000007',
  '40000000-0000-0000-0000-000000000007',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 8 - Lucas Blanc ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000008',
  'lucas.blanc@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Lucas',
  'Blanc',
  'PATIENT',
  '+1987654328',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000008',
  '30000000-0000-0000-0000-000000000008',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000008',
  '40000000-0000-0000-0000-000000000008',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 9 - Sarah Garnier ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000009',
  'sarah.garnier@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Sarah',
  'Garnier',
  'PATIENT',
  '+1987654329',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000009',
  '30000000-0000-0000-0000-000000000009',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000009',
  '40000000-0000-0000-0000-000000000009',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== PATIENT 10 - Paul Chevalier ====================
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '30000000-0000-0000-0000-000000000010',
  'paul.chevalier@email.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Paul',
  'Chevalier',
  'PATIENT',
  '+1987654330',
  true,
  NOW(),
  NOW()
);

INSERT INTO patients (id, "userId", "familyDoctorId", "createdAt", "updatedAt")
VALUES (
  '40000000-0000-0000-0000-000000000010',
  '30000000-0000-0000-0000-000000000010',
  NULL,
  NOW(),
  NOW()
);

INSERT INTO medical_records (id, "patientId", "bloodType", height, weight, "organDonor", "generalNotes", "createdAt", "updatedAt")
VALUES (
  '50000000-0000-0000-0000-000000000010',
  '40000000-0000-0000-0000-000000000010',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ==================== ASSIGNER MÉDECINS DE FAMILLE ====================

-- Doctor 1 (Jean Dupont): 3 patients
UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000001' WHERE id = '40000000-0000-0000-0000-000000000001';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', NULL, '20000000-0000-0000-0000-000000000001', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000001' WHERE id = '40000000-0000-0000-0000-000000000002';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', NULL, '20000000-0000-0000-0000-000000000001', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000001' WHERE id = '40000000-0000-0000-0000-000000000003';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', NULL, '20000000-0000-0000-0000-000000000001', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

-- Doctor 2 (Marie Martin): 2 patients
UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000002' WHERE id = '40000000-0000-0000-0000-000000000004';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', NULL, '20000000-0000-0000-0000-000000000002', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000002' WHERE id = '40000000-0000-0000-0000-000000000005';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', NULL, '20000000-0000-0000-0000-000000000002', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

-- Doctor 3 (Pierre Bernard): 2 patients
UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000003' WHERE id = '40000000-0000-0000-0000-000000000006';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', NULL, '20000000-0000-0000-0000-000000000003', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000003' WHERE id = '40000000-0000-0000-0000-000000000007';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', NULL, '20000000-0000-0000-0000-000000000003', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

-- Doctor 4 (Sophie Dubois): 2 patients
UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000004' WHERE id = '40000000-0000-0000-0000-000000000008';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', NULL, '20000000-0000-0000-0000-000000000004', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

UPDATE patients SET "familyDoctorId" = '20000000-0000-0000-0000-000000000004' WHERE id = '40000000-0000-0000-0000-000000000009';
INSERT INTO family_doctor_history (id, "patientId", "previousDoctorId", "newDoctorId", "changeType", "changedBy", reason)
VALUES ('60000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000009', NULL, '20000000-0000-0000-0000-000000000004', 'ASSIGNED', '00000000-0000-0000-0000-000000000001', 'Initial assignment');

-- Patient 10 (Paul Chevalier) reste sans médecin de famille

-- ============================================
-- FIN DU SCRIPT
-- ============================================
