-- ============================================================
-- Médecins algériens — région Alger / Blida (rayon ~100 km)
-- Mot de passe pour tous les comptes : qwerty
-- Hash : $2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 6 — Dr. Mohamed Benali  |  Cardiologie  |  Alger (Hydra)
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000006',
  'mohamed.benali@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Mohamed',
  'Benali',
  'DOCTOR',
  '+213551234501',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000006',
  'Cardiologie',
  'ALG-2001',
  'Cardiologue interventionnel, ancien résident du CHU Mustapha Bacha. Spécialisé dans les maladies coronariennes et l''insuffisance cardiaque.',
  30,
  true,
  60,
  '12 Rue des Frères Laredj, Hydra',
  '16035',
  'Alger',
  'Alger',
  'Algérie',
  36.7510,
  3.0440,
  '{"monday":{"start":"08:00","end":"16:00","enabled":true},"tuesday":{"start":"08:00","end":"16:00","enabled":true},"wednesday":{"start":"08:00","end":"16:00","enabled":true},"thursday":{"start":"08:00","end":"16:00","enabled":true},"friday":{"start":"08:00","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"13:00","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 7 — Dr. Youcef Khelif  |  Médecine Générale  |  Blida
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000007',
  'youcef.khelif@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Youcef',
  'Khelif',
  'DOCTOR',
  '+213551234502',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000007',
  'Médecine Générale',
  'ALG-2002',
  'Médecin généraliste avec 15 ans d''expérience à Blida. Prise en charge des pathologies courantes, suivi des maladies chroniques.',
  20,
  true,
  100,
  '5 Rue de l''Indépendance',
  '09000',
  'Blida',
  'Blida',
  'Algérie',
  36.4700,
  2.8300,
  '{"monday":{"start":"08:00","end":"17:00","enabled":true},"tuesday":{"start":"08:00","end":"17:00","enabled":true},"wednesday":{"start":"08:00","end":"17:00","enabled":true},"thursday":{"start":"08:00","end":"17:00","enabled":true},"friday":{"start":"08:00","end":"12:00","enabled":true},"saturday":{"start":"08:30","end":"13:00","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 8 — Dr. Fatima Zerhouni  |  Pédiatrie  |  Boumerdès
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000008',
  'fatima.zerhouni@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Fatima',
  'Zerhouni',
  'DOCTOR',
  '+213551234503',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000008',
  'Pédiatrie',
  'ALG-2003',
  'Pédiatre diplômée de l''Université de Médecine d''Alger. Spécialisée en néonatologie et maladies infectieuses de l''enfant.',
  25,
  true,
  80,
  '18 Cité des Orangers',
  '35000',
  'Boumerdès',
  'Boumerdès',
  'Algérie',
  36.7637,
  3.4777,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"13:30","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 9 — Dr. Karim Aissaoui  |  Dermatologie  |  Tipaza
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000009',
  'karim.aissaoui@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Karim',
  'Aissaoui',
  'DOCTOR',
  '+213551234504',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000009',
  'Dermatologie',
  'ALG-2004',
  'Dermatologue et vénérologue. Prise en charge des dermatoses inflammatoires, acné, psoriasis, et chirurgie dermatologique.',
  30,
  true,
  50,
  '3 Rue du 1er Novembre, Centre-Ville',
  '42000',
  'Tipaza',
  'Tipaza',
  'Algérie',
  36.5891,
  2.4470,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":false},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"14:00","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 10 — Dr. Samira Boudiaf  |  Gynécologie  |  Alger (Bab Ezzouar)
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000010',
  'samira.boudiaf@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Samira',
  'Boudiaf',
  'DOCTOR',
  '+213551234505',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000010',
  'Gynécologie-Obstétrique',
  'ALG-2005',
  'Gynécologue-obstétricienne avec 20 ans d''expérience. Suivi de grossesse, échographie obstétricale, colposcopie.',
  40,
  true,
  70,
  '7 Avenue de l''ALN, Bab Ezzouar',
  '16111',
  'Alger',
  'Alger',
  'Algérie',
  36.7279,
  3.1884,
  '{"monday":{"start":"08:30","end":"16:30","enabled":true},"tuesday":{"start":"08:30","end":"16:30","enabled":true},"wednesday":{"start":"08:30","end":"16:30","enabled":true},"thursday":{"start":"08:30","end":"16:30","enabled":true},"friday":{"start":"08:30","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"13:00","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 11 — Dr. Omar Bensalem  |  Neurologie  |  Zeralda
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000011',
  'omar.bensalem@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Omar',
  'Bensalem',
  'DOCTOR',
  '+213551234506',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000011',
  'Neurologie',
  'ALG-2006',
  'Neurologue spécialisé dans les pathologies neurovasculaires (AVC), épilepsie et maladies neurodégénératives.',
  45,
  true,
  40,
  '2 Cité AADL, Route de Staouéli',
  '16207',
  'Zeralda',
  'Alger',
  'Algérie',
  36.6969,
  2.8396,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"13:00","enabled":false},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 12 — Dr. Nadia Belkacem  |  Ophtalmologie  |  Boufarik
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000012',
  'nadia.belkacem@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Nadia',
  'Belkacem',
  'DOCTOR',
  '+213551234507',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000012',
  '10000000-0000-0000-0000-000000000012',
  'Ophtalmologie',
  'ALG-2007',
  'Ophtalmologue spécialisée en chirurgie réfractive (laser), glaucome et cataracte. Équipée d''un OCT de dernière génération.',
  30,
  true,
  55,
  '11 Rue des Martyrs',
  '09100',
  'Boufarik',
  'Blida',
  'Algérie',
  36.5700,
  2.9200,
  '{"monday":{"start":"08:00","end":"16:00","enabled":true},"tuesday":{"start":"08:00","end":"16:00","enabled":true},"wednesday":{"start":"08:00","end":"16:00","enabled":true},"thursday":{"start":"08:00","end":"16:00","enabled":true},"friday":{"start":"08:00","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"13:00","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 13 — Dr. Rachid Amrani  |  Médecine Générale  |  Médéa
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000013',
  'rachid.amrani@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Rachid',
  'Amrani',
  'DOCTOR',
  '+213551234508',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000013',
  '10000000-0000-0000-0000-000000000013',
  'Médecine Générale',
  'ALG-2008',
  'Médecin généraliste installé à Médéa depuis 12 ans. Suivi des maladies chroniques, diabète, HTA, et médecine préventive.',
  20,
  true,
  120,
  '8 Rue Emir Abdelkader',
  '26000',
  'Médéa',
  'Médéa',
  'Algérie',
  36.2639,
  2.7514,
  '{"monday":{"start":"08:00","end":"17:00","enabled":true},"tuesday":{"start":"08:00","end":"17:00","enabled":true},"wednesday":{"start":"08:00","end":"17:00","enabled":true},"thursday":{"start":"08:00","end":"17:00","enabled":true},"friday":{"start":"08:00","end":"12:00","enabled":true},"saturday":{"start":"08:30","end":"13:30","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 14 — Dr. Sofiane Meziane  |  Rhumatologie  |  Koléa
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000014',
  'sofiane.meziane@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Sofiane',
  'Meziane',
  'DOCTOR',
  '+213551234509',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000014',
  '10000000-0000-0000-0000-000000000014',
  'Rhumatologie',
  'ALG-2009',
  'Rhumatologue spécialisé dans les maladies auto-immunes, polyarthrite rhumatoïde, lupus et ostéoporose.',
  40,
  true,
  45,
  '15 Cité Bensouna',
  '42310',
  'Koléa',
  'Tipaza',
  'Algérie',
  36.6381,
  2.7636,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":false},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"13:00","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DOCTOR 15 — Dr. Houria Mansouri  |  Endocrinologie  |  Alger (El Biar)
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, phone, "isActive", "createdAt", "updatedAt")
VALUES (
  '10000000-0000-0000-0000-000000000015',
  'houria.mansouri@medapp.com',
  '$2b$10$bGsOu5H033DB67n8GkZbSuXv8btf42C8BX5H0UPgFFOPedpCNkO0y',
  'Houria',
  'Mansouri',
  'DOCTOR',
  '+213551234510',
  true,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, "userId", specialty, "licenseNumber", bio, "consultationDuration", "isAvailable", "maxFamilyPatients", street, "postalCode", city, province, country, latitude, longitude, schedule, "createdAt", "updatedAt")
VALUES (
  '20000000-0000-0000-0000-000000000015',
  '10000000-0000-0000-0000-000000000015',
  'Endocrinologie',
  'ALG-2010',
  'Endocrinologue-diabétologue. Prise en charge du diabète de type 1 et 2, thyroïde, ostéoporose et troubles hormonaux.',
  45,
  true,
  50,
  '24 Chemin Mackley, El Biar',
  '16030',
  'Alger',
  'Alger',
  'Algérie',
  36.7720,
  3.0255,
  '{"monday":{"start":"09:00","end":"17:00","enabled":true},"tuesday":{"start":"09:00","end":"17:00","enabled":true},"wednesday":{"start":"09:00","end":"17:00","enabled":true},"thursday":{"start":"09:00","end":"17:00","enabled":true},"friday":{"start":"09:00","end":"12:00","enabled":true},"saturday":{"start":"09:00","end":"13:00","enabled":true},"sunday":{"start":"09:00","end":"17:00","enabled":false}}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
