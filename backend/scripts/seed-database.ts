import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { DoctorsService } from '../src/doctors/doctors.service';
import { PatientsService } from '../src/patients/patients.service';
import { UserRole } from '../src/users/entities/user.entity';

async function seed() {
  console.log('🌱 Début du seeding de la base de données...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const doctorsService = app.get(DoctorsService);
  const patientsService = app.get(PatientsService);

  try {
    // ==================== CRÉER L'ADMIN ====================
    console.log('👤 Création de l\'admin...');
    const admin = await usersService.create({
      email: 'admin@medapp.com',
      password: 'qwerty',
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.ADMIN,
      phone: '+1234567890',
    });
    console.log(`✅ Admin créé: ${admin.email}\n`);

    // ==================== CRÉER DOCTOR 1 ====================
    console.log('👨‍⚕️ Création du Doctor 1...');
    const userDoctor1 = await usersService.create({
      email: 'jean.dupont@medapp.com',
      password: 'qwerty',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: UserRole.DOCTOR,
      phone: '+1234567891',
    });
    const doctor1 = await doctorsService.create({
      userId: userDoctor1.id,
      specialty: 'Cardiologie',
      licenseNumber: 'LIC-1001',
      bio: 'Médecin spécialisé en Cardiologie avec plus de 10 ans d\'expérience.',
      consultationDuration: 30,
      isAvailable: true,
      maxFamilyPatients: 50,
      schedule: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '15:00', enabled: true },
        saturday: { start: '00:00', end: '00:00', enabled: false },
        sunday: { start: '00:00', end: '00:00', enabled: false },
      },
    });
    console.log(`✅ Jean Dupont créé: ${userDoctor1.email} - Cardiologie\n`);

    // ==================== CRÉER DOCTOR 2 ====================
    console.log('👨‍⚕️ Création du Doctor 2...');
    const userDoctor2 = await usersService.create({
      email: 'marie.martin@medapp.com',
      password: 'qwerty',
      firstName: 'Marie',
      lastName: 'Martin',
      role: UserRole.DOCTOR,
      phone: '+1234567892',
    });
    const doctor2 = await doctorsService.create({
      userId: userDoctor2.id,
      specialty: 'Pédiatrie',
      licenseNumber: 'LIC-1002',
      bio: 'Médecin spécialisé en Pédiatrie avec plus de 10 ans d\'expérience.',
      consultationDuration: 30,
      isAvailable: true,
      maxFamilyPatients: 50,
      schedule: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '15:00', enabled: true },
        saturday: { start: '00:00', end: '00:00', enabled: false },
        sunday: { start: '00:00', end: '00:00', enabled: false },
      },
    });
    console.log(`✅ Marie Martin créé: ${userDoctor2.email} - Pédiatrie\n`);

    // ==================== CRÉER DOCTOR 3 ====================
    console.log('👨‍⚕️ Création du Doctor 3...');
    const userDoctor3 = await usersService.create({
      email: 'pierre.bernard@medapp.com',
      password: 'qwerty',
      firstName: 'Pierre',
      lastName: 'Bernard',
      role: UserRole.DOCTOR,
      phone: '+1234567893',
    });
    const doctor3 = await doctorsService.create({
      userId: userDoctor3.id,
      specialty: 'Dermatologie',
      licenseNumber: 'LIC-1003',
      bio: 'Médecin spécialisé en Dermatologie avec plus de 10 ans d\'expérience.',
      consultationDuration: 30,
      isAvailable: true,
      maxFamilyPatients: 50,
      schedule: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '15:00', enabled: true },
        saturday: { start: '00:00', end: '00:00', enabled: false },
        sunday: { start: '00:00', end: '00:00', enabled: false },
      },
    });
    console.log(`✅ Pierre Bernard créé: ${userDoctor3.email} - Dermatologie\n`);

    // ==================== CRÉER DOCTOR 4 ====================
    console.log('👨‍⚕️ Création du Doctor 4...');
    const userDoctor4 = await usersService.create({
      email: 'sophie.dubois@medapp.com',
      password: 'qwerty',
      firstName: 'Sophie',
      lastName: 'Dubois',
      role: UserRole.DOCTOR,
      phone: '+1234567894',
    });
    const doctor4 = await doctorsService.create({
      userId: userDoctor4.id,
      specialty: 'Neurologie',
      licenseNumber: 'LIC-1004',
      bio: 'Médecin spécialisé en Neurologie avec plus de 10 ans d\'expérience.',
      consultationDuration: 30,
      isAvailable: true,
      schedule: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '15:00', enabled: true },
        saturday: { start: '00:00', end: '00:00', enabled: false },
        sunday: { start: '00:00', end: '00:00', enabled: false },
      },
    });
    console.log(`✅ Sophie Dubois créé: ${userDoctor4.email} - Neurologie\n`);

    // ==================== CRÉER DOCTOR 5 ====================
    console.log('👨‍⚕️ Création du Doctor 5...');
    const userDoctor5 = await usersService.create({
      email: 'luc.laurent@medapp.com',
      password: 'qwerty',
      firstName: 'Luc',
      lastName: 'Laurent',
      role: UserRole.DOCTOR,
      phone: '+1234567895',
    });
    const doctor5 = await doctorsService.create({
      userId: userDoctor5.id,
      specialty: 'Médecine Générale',
      licenseNumber: 'LIC-1005',
      bio: 'Médecin spécialisé en Médecine Générale avec plus de 10 ans d\'expérience.',
      consultationDuration: 30,
      isAvailable: true,
      schedule: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '15:00', enabled: true },
        saturday: { start: '00:00', end: '00:00', enabled: false },
        sunday: { start: '00:00', end: '00:00', enabled: false },
      },
    });
    console.log(`✅ Luc Laurent créé: ${userDoctor5.email} - Médecine Générale\n`);

    // ==================== CRÉER PATIENT 1 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 1...');
    const userPatient1 = await usersService.create({
      email: 'alice.dubois@email.com',
      password: 'qwerty',
      firstName: 'Alice',
      lastName: 'Dubois',
      role: UserRole.PATIENT,
      phone: '+1987654321',
    });
    const patient1 = await patientsService.createFromUser(userPatient1.id);
    console.log(`✅ Alice Dubois créé: ${userPatient1.email}\n`);

    // ==================== CRÉER PATIENT 2 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 2...');
    const userPatient2 = await usersService.create({
      email: 'marc.leroy@email.com',
      password: 'qwerty',
      firstName: 'Marc',
      lastName: 'Leroy',
      role: UserRole.PATIENT,
      phone: '+1987654322',
    });
    const patient2 = await patientsService.createFromUser(userPatient2.id);
    console.log(`✅ Marc Leroy créé: ${userPatient2.email}\n`);

    // ==================== CRÉER PATIENT 3 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 3...');
    const userPatient3 = await usersService.create({
      email: 'claire.moreau@email.com',
      password: 'qwerty',
      firstName: 'Claire',
      lastName: 'Moreau',
      role: UserRole.PATIENT,
      phone: '+1987654323',
    });
    const patient3 = await patientsService.createFromUser(userPatient3.id);
    console.log(`✅ Claire Moreau créé: ${userPatient3.email}\n`);

    // ==================== CRÉER PATIENT 4 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 4...');
    const userPatient4 = await usersService.create({
      email: 'thomas.simon@email.com',
      password: 'qwerty',
      firstName: 'Thomas',
      lastName: 'Simon',
      role: UserRole.PATIENT,
      phone: '+1987654324',
    });
    const patient4 = await patientsService.createFromUser(userPatient4.id);
    console.log(`✅ Thomas Simon créé: ${userPatient4.email}\n`);

    // ==================== CRÉER PATIENT 5 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 5...');
    const userPatient5 = await usersService.create({
      email: 'julie.michel@email.com',
      password: 'qwerty',
      firstName: 'Julie',
      lastName: 'Michel',
      role: UserRole.PATIENT,
      phone: '+1987654325',
    });
    const patient5 = await patientsService.createFromUser(userPatient5.id);
    console.log(`✅ Julie Michel créé: ${userPatient5.email}\n`);

    // ==================== CRÉER PATIENT 6 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 6...');
    const userPatient6 = await usersService.create({
      email: 'nicolas.lefebvre@email.com',
      password: 'qwerty',
      firstName: 'Nicolas',
      lastName: 'Lefebvre',
      role: UserRole.PATIENT,
      phone: '+1987654326',
    });
    const patient6 = await patientsService.createFromUser(userPatient6.id);
    console.log(`✅ Nicolas Lefebvre créé: ${userPatient6.email}\n`);

    // ==================== CRÉER PATIENT 7 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 7...');
    const userPatient7 = await usersService.create({
      email: 'emma.rousseau@email.com',
      password: 'qwerty',
      firstName: 'Emma',
      lastName: 'Rousseau',
      role: UserRole.PATIENT,
      phone: '+1987654327',
    });
    const patient7 = await patientsService.createFromUser(userPatient7.id);
    console.log(`✅ Emma Rousseau créé: ${userPatient7.email}\n`);

    // ==================== CRÉER PATIENT 8 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 8...');
    const userPatient8 = await usersService.create({
      email: 'lucas.blanc@email.com',
      password: 'qwerty',
      firstName: 'Lucas',
      lastName: 'Blanc',
      role: UserRole.PATIENT,
      phone: '+1987654328',
    });
    const patient8 = await patientsService.createFromUser(userPatient8.id);
    console.log(`✅ Lucas Blanc créé: ${userPatient8.email}\n`);

    // ==================== CRÉER PATIENT 9 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 9...');
    const userPatient9 = await usersService.create({
      email: 'sarah.garnier@email.com',
      password: 'qwerty',
      firstName: 'Sarah',
      lastName: 'Garnier',
      role: UserRole.PATIENT,
      phone: '+1987654329',
    });
    const patient9 = await patientsService.createFromUser(userPatient9.id);
    console.log(`✅ Sarah Garnier créé: ${userPatient9.email}\n`);

    // ==================== CRÉER PATIENT 10 ====================
    console.log('🧑‍🤝‍🧑 Création du Patient 10...');
    const userPatient10 = await usersService.create({
      email: 'paul.chevalier@email.com',
      password: 'qwerty',
      firstName: 'Paul',
      lastName: 'Chevalier',
      role: UserRole.PATIENT,
      phone: '+1987654330',
    });
    const patient10 = await patientsService.createFromUser(userPatient10.id);
    console.log(`✅ Paul Chevalier créé: ${userPatient10.email}\n`);

    // ==================== ASSIGNER MÉDECINS DE FAMILLE ====================
    console.log('🏥 Association des médecins de famille...\n');

    // Doctor 1 (Jean Dupont): 3 patients
    await patientsService.assignFamilyDoctor(patient1.id, doctor1.id, admin.id, 'Initial assignment');
    console.log('✅ Alice Dubois assigné au Doctor Jean Dupont');

    await patientsService.assignFamilyDoctor(patient2.id, doctor1.id, admin.id, 'Initial assignment');
    console.log('✅ Marc Leroy assigné au Doctor Jean Dupont');

    await patientsService.assignFamilyDoctor(patient3.id, doctor1.id, admin.id, 'Initial assignment');
    console.log('✅ Claire Moreau assigné au Doctor Jean Dupont\n');

    // Doctor 2 (Marie Martin): 2 patients
    await patientsService.assignFamilyDoctor(patient4.id, doctor2.id, admin.id, 'Initial assignment');
    console.log('✅ Thomas Simon assigné au Doctor Marie Martin');

    await patientsService.assignFamilyDoctor(patient5.id, doctor2.id, admin.id, 'Initial assignment');
    console.log('✅ Julie Michel assigné au Doctor Marie Martin\n');

    // Doctor 3 (Pierre Bernard): 2 patients
    await patientsService.assignFamilyDoctor(patient6.id, doctor3.id, admin.id, 'Initial assignment');
    console.log('✅ Nicolas Lefebvre assigné au Doctor Pierre Bernard');

    await patientsService.assignFamilyDoctor(patient7.id, doctor3.id, admin.id, 'Initial assignment');
    console.log('✅ Emma Rousseau assigné au Doctor Pierre Bernard\n');

    // Doctor 4 (Sophie Dubois): 2 patients
    await patientsService.assignFamilyDoctor(patient8.id, doctor4.id, admin.id, 'Initial assignment');
    console.log('✅ Lucas Blanc assigné au Doctor Sophie Dubois');

    await patientsService.assignFamilyDoctor(patient9.id, doctor4.id, admin.id, 'Initial assignment');
    console.log('✅ Sarah Garnier assigné au Doctor Sophie Dubois\n');

    // Patient 10 reste sans médecin de famille
    console.log('ℹ️  Paul Chevalier: Aucun médecin de famille assigné\n');

    // ==================== RÉSUMÉ ====================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING TERMINÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n📊 RÉSUMÉ DES DONNÉES CRÉÉES:\n');

    console.log('👤 Admin:    1');
    console.log('   └─ Email: admin@medapp.com');
    console.log('   └─ Pass:  qwerty\n');

    console.log('👨‍⚕️ Doctors:  5');
    console.log('   └─ jean.dupont@medapp.com (Cardiologie) - qwerty');
    console.log('   └─ marie.martin@medapp.com (Pédiatrie) - qwerty');
    console.log('   └─ pierre.bernard@medapp.com (Dermatologie) - qwerty');
    console.log('   └─ sophie.dubois@medapp.com (Neurologie) - qwerty');
    console.log('   └─ luc.laurent@medapp.com (Médecine Générale) - qwerty\n');

    console.log('🧑‍🤝‍🧑 Patients: 10');
    console.log('   └─ alice.dubois@email.com (Alice Dubois) - qwerty');
    console.log('   └─ marc.leroy@email.com (Marc Leroy) - qwerty');
    console.log('   └─ claire.moreau@email.com (Claire Moreau) - qwerty');
    console.log('   └─ thomas.simon@email.com (Thomas Simon) - qwerty');
    console.log('   └─ julie.michel@email.com (Julie Michel) - qwerty');
    console.log('   └─ nicolas.lefebvre@email.com (Nicolas Lefebvre) - qwerty');
    console.log('   └─ emma.rousseau@email.com (Emma Rousseau) - qwerty');
    console.log('   └─ lucas.blanc@email.com (Lucas Blanc) - qwerty');
    console.log('   └─ sarah.garnier@email.com (Sarah Garnier) - qwerty');
    console.log('   └─ paul.chevalier@email.com (Paul Chevalier) - qwerty\n');

    console.log('🏥 Associations Médecin-Patient:');
    console.log('   └─ Doctor Jean Dupont: 3 patients (Alice, Marc, Claire)');
    console.log('   └─ Doctor Marie Martin: 2 patients (Thomas, Julie)');
    console.log('   └─ Doctor Pierre Bernard: 2 patients (Nicolas, Emma)');
    console.log('   └─ Doctor Sophie Dubois: 2 patients (Lucas, Sarah)');
    console.log('   └─ Paul Chevalier: Sans médecin de famille\n');

    console.log('🔑 Tous les comptes utilisent le mot de passe: qwerty\n');
    console.log('='.repeat(60));
    console.log('Vous pouvez maintenant vous connecter avec n\'importe quel compte!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR lors du seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Exécuter le seeding
seed()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
