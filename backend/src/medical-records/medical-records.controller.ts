import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalConditionDto } from './dto/create-medical-condition.dto';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CanViewPatientGuard } from '../common/guards';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/entities/doctor.entity';

/**
 * Controller: Gestion des dossiers médicaux
 * Routes: /patients/:patientId/medical-record/*
 *
 * Sécurité:
 * - Lecture (GET): CanViewPatientGuard (Admin OU Médecin de famille OU Patient)
 * - Modifications (POST/PATCH): Doctor OU Admin uniquement
 */
@Controller('patients/:patientId/medical-record')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MedicalRecordsController {
  constructor(
    private medicalRecordsService: MedicalRecordsService,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  // ==================== DOSSIER MÉDICAL PRINCIPAL ====================

  /**
   * GET /patients/:patientId/medical-record
   * Récupérer le dossier médical complet
   * Accessible par: Admin, Médecin de famille, Patient
   */
  @Get()
  @UseGuards(CanViewPatientGuard)
  async getMedicalRecord(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getMedicalRecord(patientId);
  }

  /**
   * GET /patients/:patientId/medical-record/summary
   * Résumé du dossier médical (pour dashboard)
   */
  @Get('summary')
  @UseGuards(CanViewPatientGuard)
  async getMedicalRecordSummary(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getMedicalRecordSummary(patientId);
  }

  /**
   * PATCH /patients/:patientId/medical-record
   * Mettre à jour les informations générales (bloodType, height, weight, etc.)
   * Accessible par: Admin, Médecin (de famille ou autre)
   */
  @Patch()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async updateMedicalRecord(
    @Param('patientId') patientId: string,
    @Body()
    updateData: Partial<{
      bloodType: string;
      height: number;
      weight: number;
      organDonor: boolean;
      generalNotes: string;
    }>,
  ) {
    return this.medicalRecordsService.updateMedicalRecord(patientId, updateData);
  }

  // ==================== CONDITIONS MÉDICALES ====================

  /**
   * GET /patients/:patientId/medical-record/conditions
   * Récupérer toutes les conditions médicales
   */
  @Get('conditions')
  @UseGuards(CanViewPatientGuard)
  async getConditions(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getConditions(patientId);
  }

  /**
   * GET /patients/:patientId/medical-record/conditions/active
   * Récupérer les conditions actives
   */
  @Get('conditions/active')
  @UseGuards(CanViewPatientGuard)
  async getActiveConditions(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getActiveConditions(patientId);
  }

  /**
   * POST /patients/:patientId/medical-record/conditions
   * Ajouter une condition médicale
   * Accessible par: Admin, Médecin (de famille ou autre)
   */
  @Post('conditions')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async addCondition(
    @Param('patientId') patientId: string,
    @Body() createDto: CreateMedicalConditionDto,
    @Request() req,
  ) {
    // Récupérer le doctorId si c'est un médecin
    let diagnosedBy: string | undefined;

    if (req.user.role === UserRole.DOCTOR) {
      const doctor = await this.doctorsRepository.findOne({
        where: { userId: req.user.id },
      });
      diagnosedBy = doctor?.id;
    }

    return this.medicalRecordsService.addCondition(
      patientId,
      createDto,
      diagnosedBy,
    );
  }

  // ==================== ALLERGIES ====================

  /**
   * GET /patients/:patientId/medical-record/allergies
   * Récupérer toutes les allergies
   */
  @Get('allergies')
  @UseGuards(CanViewPatientGuard)
  async getAllergies(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getAllergies(patientId);
  }

  /**
   * GET /patients/:patientId/medical-record/allergies/medications
   * Récupérer les allergies médicamenteuses (pour vérification prescription)
   */
  @Get('allergies/medications')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getMedicationAllergies(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getMedicationAllergies(patientId);
  }

  /**
   * POST /patients/:patientId/medical-record/allergies
   * Ajouter une allergie
   * Accessible par: Admin, Médecin (de famille ou autre)
   */
  @Post('allergies')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async addAllergy(
    @Param('patientId') patientId: string,
    @Body() createDto: CreateAllergyDto,
  ) {
    return this.medicalRecordsService.addAllergy(patientId, createDto);
  }

  // ==================== MÉDICAMENTS ====================

  /**
   * GET /patients/:patientId/medical-record/medications
   * Récupérer tous les médicaments
   */
  @Get('medications')
  @UseGuards(CanViewPatientGuard)
  async getMedications(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getMedications(patientId);
  }

  /**
   * GET /patients/:patientId/medical-record/medications/active
   * Récupérer les médicaments actifs
   */
  @Get('medications/active')
  @UseGuards(CanViewPatientGuard)
  async getActiveMedications(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getActiveMedications(patientId);
  }

  /**
   * POST /patients/:patientId/medical-record/medications/check-allergy
   * BR-DM-007: Vérifier si un médicament peut être prescrit (pas d'allergie)
   * CRITIQUE: Doit être appelé AVANT la prescription
   */
  @Post('medications/check-allergy')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async checkMedicationAllergy(
    @Param('patientId') patientId: string,
    @Body() body: { medicationName: string },
  ) {
    return this.medicalRecordsService.canPrescribe(
      patientId,
      body.medicationName,
    );
  }

  /**
   * POST /patients/:patientId/medical-record/medications
   * Ajouter un médicament (AVEC vérification allergies)
   * Accessible par: Admin, Médecin (de famille ou autre)
   */
  @Post('medications')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async addMedication(
    @Param('patientId') patientId: string,
    @Body() createDto: CreateMedicationDto & { forceOverrideAllergy?: boolean },
    @Request() req,
  ) {
    // Récupérer le doctorId si c'est un médecin
    let prescribedBy: string | undefined;

    if (req.user.role === UserRole.DOCTOR) {
      const doctor = await this.doctorsRepository.findOne({
        where: { userId: req.user.id },
      });
      prescribedBy = doctor?.id;
    }

    const { forceOverrideAllergy, ...medicationDto } = createDto;

    return this.medicalRecordsService.addMedication(
      patientId,
      medicationDto,
      prescribedBy,
      forceOverrideAllergy,
    );
  }

  /**
   * PATCH /patients/:patientId/medical-record/medications/:medicationId/stop
   * Arrêter un médicament
   */
  @Patch('medications/:medicationId/stop')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async stopMedication(
    @Param('medicationId') medicationId: string,
    @Body() body: { reason?: string },
  ) {
    return this.medicalRecordsService.stopMedication(medicationId, body.reason);
  }

  // ==================== VACCINATIONS ====================

  /**
   * GET /patients/:patientId/medical-record/vaccinations
   * Récupérer l'historique vaccinal
   */
  @Get('vaccinations')
  @UseGuards(CanViewPatientGuard)
  async getVaccinations(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getVaccinations(patientId);
  }

  /**
   * GET /patients/:patientId/medical-record/vaccinations/upcoming
   * Récupérer les vaccinations à venir (rappels)
   */
  @Get('vaccinations/upcoming')
  @UseGuards(CanViewPatientGuard)
  async getUpcomingVaccinations(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.getUpcomingVaccinations(patientId);
  }

  /**
   * POST /patients/:patientId/medical-record/vaccinations
   * Ajouter une vaccination
   * Accessible par: Admin, Médecin (de famille ou autre)
   */
  @Post('vaccinations')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async addVaccination(
    @Param('patientId') patientId: string,
    @Body()
    vaccinationData: {
      name: string;
      dateGiven: string;
      manufacturer?: string;
      lotNumber?: string;
      nextDoseDate?: string;
      notes?: string;
    },
    @Request() req,
  ) {
    // Récupérer le doctorId si c'est un médecin
    let administeredBy: string | undefined;

    if (req.user.role === UserRole.DOCTOR) {
      const doctor = await this.doctorsRepository.findOne({
        where: { userId: req.user.id },
      });
      administeredBy = doctor?.id;
    }

    return this.medicalRecordsService.addVaccination(
      patientId,
      vaccinationData,
      administeredBy,
    );
  }
}
