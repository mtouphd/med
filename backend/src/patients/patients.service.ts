import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/patient.dto';
import { FamilyDoctorHistoryService } from '../history/history.service';
import { FamilyDoctorChangeType } from '../history/entities/family-doctor-history.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private familyDoctorHistoryService: FamilyDoctorHistoryService,
  ) {}

  async findAll() {
    return this.patientsRepository.find({
      relations: ['user', 'familyDoctor', 'familyDoctor.user'],
    });
  }

  async findOne(id: string) {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['user', 'familyDoctor', 'familyDoctor.user'],
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async create(createPatientDto: CreatePatientDto) {
    console.log('=== CREATE PATIENT ===');
    console.log('Received DTO:', JSON.stringify(createPatientDto, null, 2));

    let userId = createPatientDto.userId;

    // If user data is provided, create the user first
    if (createPatientDto.user) {
      // Check if user with email already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: createPatientDto.user.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createPatientDto.user.password, 10);

      // Create user
      const user = this.usersRepository.create({
        email: createPatientDto.user.email,
        password: hashedPassword,
        firstName: createPatientDto.user.firstName,
        lastName: createPatientDto.user.lastName,
        phone: createPatientDto.user.phone,
        role: createPatientDto.user.role as any,
      });

      const savedUser = await this.usersRepository.save(user);
      userId = savedUser.id;
    }

    if (!userId) {
      throw new BadRequestException('Either userId or user data must be provided');
    }

    // Create patient
    const patient = this.patientsRepository.create({
      userId,
      dateOfBirth: createPatientDto.dateOfBirth,
      address: createPatientDto.address,
      emergencyContact: createPatientDto.emergencyContact,
    });

    const savedPatient = await this.patientsRepository.save(patient);

    // Return patient with relations
    return this.findOne(savedPatient.id);
  }

  async update(id: string, updatePatientDto: Partial<CreatePatientDto>) {
    const patient = await this.findOne(id);
    Object.assign(patient, updatePatientDto);
    return this.patientsRepository.save(patient);
  }

  async remove(id: string) {
    const patient = await this.findOne(id);
    await this.patientsRepository.remove(patient);
    return { message: 'Patient deleted successfully' };
  }

  async findByUserId(userId: string) {
    return this.patientsRepository.findOne({
      where: { userId },
      relations: ['user', 'familyDoctor', 'familyDoctor.user'],
    });
  }

  async createFromUser(userId: string) {
    const patient = this.patientsRepository.create({
      userId,
    });
    return this.patientsRepository.save(patient);
  }

  // ==================== GESTION MÉDECIN DE FAMILLE ====================

  /**
   * Assigner un médecin de famille à un patient
   * BR-MF-001: Seul admin peut assigner
   */
  async assignFamilyDoctor(
    patientId: string,
    doctorId: string,
    assignedBy: string,
    reason?: string,
  ): Promise<Patient> {
    // 1. Vérifier que le patient existe
    const patient = await this.findOne(patientId);

    // 2. Vérifier que le médecin existe (sera fait par le controller avec DoctorsService)
    // Note: On fait confiance au controller pour cette validation

    // 3. Enregistrer l'ancien médecin pour l'historique
    const previousDoctorId = patient.familyDoctorId;

    // 4. Assigner le médecin
    patient.familyDoctorId = doctorId;
    patient.familyDoctorAssignedAt = new Date();

    // 5. Sauvegarder
    const updatedPatient = await this.patientsRepository.save(patient);

    // 6. Créer entrée d'historique
    await this.familyDoctorHistoryService.create({
      patientId,
      previousDoctorId,
      newDoctorId: doctorId,
      changeType: previousDoctorId
        ? FamilyDoctorChangeType.CHANGED
        : FamilyDoctorChangeType.ASSIGNED,
      changedBy: assignedBy,
      reason,
    });

    return updatedPatient;
  }

  /**
   * Retirer le médecin de famille d'un patient
   * BR-MF-003: Seul admin peut retirer
   */
  async removeFamilyDoctor(
    patientId: string,
    removedBy: string,
    reason?: string,
  ): Promise<Patient> {
    const patient = await this.findOne(patientId);

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

  /**
   * Changer le médecin de famille (utilise assignFamilyDoctor)
   * BR-MF-002: Seul admin peut changer
   */
  async changeFamilyDoctor(
    patientId: string,
    newDoctorId: string,
    changedBy: string,
    reason?: string,
  ): Promise<Patient> {
    const patient = await this.findOne(patientId);

    if (!patient.familyDoctorId) {
      throw new BadRequestException(
        'Patient does not have a family doctor to change',
      );
    }

    if (patient.familyDoctorId === newDoctorId) {
      throw new BadRequestException('New doctor is the same as current doctor');
    }

    return this.assignFamilyDoctor(patientId, newDoctorId, changedBy, reason);
  }

  /**
   * Récupérer l'historique des changements de médecin de famille
   * BR-MF-004: Traçabilité complète
   */
  async getFamilyDoctorHistory(patientId: string) {
    return this.familyDoctorHistoryService.findByPatient(patientId);
  }

  /**
   * Vérifier si un médecin est le médecin de famille d'un patient
   * Utilisé par les Guards de sécurité
   */
  async isFamilyDoctor(patientId: string, doctorId: string): Promise<boolean> {
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: ['id', 'familyDoctorId'],
    });

    return patient?.familyDoctorId === doctorId;
  }

  /**
   * Récupérer tous les patients de famille d'un médecin
   * BR-D-002: Médecin peut voir ses patients de famille
   */
  async getFamilyPatients(doctorId: string): Promise<Patient[]> {
    return this.patientsRepository.find({
      where: { familyDoctorId: doctorId },
      relations: ['user', 'familyDoctor'],
    });
  }
}
