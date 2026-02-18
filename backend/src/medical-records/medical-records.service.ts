import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalCondition, ConditionStatus } from './entities/medical-condition.entity';
import { Allergy, AllergyType, AllergySeverity } from './entities/allergy.entity';
import { Medication, MedicationStatus } from './entities/medication.entity';
import { Vaccination } from './entities/vaccination.entity';
import { CreateMedicalConditionDto } from './dto/create-medical-condition.dto';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecord)
    private medicalRecordsRepository: Repository<MedicalRecord>,
    @InjectRepository(MedicalCondition)
    private conditionsRepository: Repository<MedicalCondition>,
    @InjectRepository(Allergy)
    private allergiesRepository: Repository<Allergy>,
    @InjectRepository(Medication)
    private medicationsRepository: Repository<Medication>,
    @InjectRepository(Vaccination)
    private vaccinationsRepository: Repository<Vaccination>,
  ) {}

  // ==================== DOSSIER MÉDICAL PRINCIPAL ====================

  /**
   * Créer un dossier médical (appelé automatiquement lors création patient)
   */
  async createMedicalRecord(patientId: string): Promise<MedicalRecord> {
    // Vérifier si le dossier existe déjà
    const existing = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (existing) {
      throw new BadRequestException('Medical record already exists for this patient');
    }

    const medicalRecord = this.medicalRecordsRepository.create({
      patientId,
    });

    return this.medicalRecordsRepository.save(medicalRecord);
  }

  /**
   * Récupérer le dossier médical complet d'un patient
   */
  async getMedicalRecord(patientId: string): Promise<MedicalRecord> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
      relations: ['patient', 'conditions', 'allergies', 'medications', 'vaccinations'],
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    return medicalRecord;
  }

  /**
   * Mettre à jour les informations générales du dossier médical
   */
  async updateMedicalRecord(
    patientId: string,
    updateData: Partial<{
      bloodType: string;
      height: number;
      weight: number;
      organDonor: boolean;
      generalNotes: string;
    }>,
  ): Promise<MedicalRecord> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    Object.assign(medicalRecord, updateData);
    return this.medicalRecordsRepository.save(medicalRecord);
  }

  // ==================== CONDITIONS MÉDICALES ====================

  /**
   * Ajouter une condition médicale
   */
  async addCondition(
    patientId: string,
    createDto: CreateMedicalConditionDto,
    diagnosedBy?: string,
  ): Promise<MedicalCondition> {
    // Vérifier que le dossier médical existe
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    const condition = this.conditionsRepository.create({
      ...createDto,
      medicalRecordId: medicalRecord.id,
      diagnosedBy,
    });

    return this.conditionsRepository.save(condition);
  }

  /**
   * Mettre à jour une condition médicale
   */
  async updateCondition(
    conditionId: string,
    updateData: Partial<CreateMedicalConditionDto & { status: ConditionStatus; resolvedDate?: Date }>,
  ): Promise<MedicalCondition> {
    const condition = await this.conditionsRepository.findOne({
      where: { id: conditionId },
    });

    if (!condition) {
      throw new NotFoundException('Medical condition not found');
    }

    Object.assign(condition, updateData);
    return this.conditionsRepository.save(condition);
  }

  /**
   * Récupérer toutes les conditions d'un patient
   */
  async getConditions(patientId: string): Promise<MedicalCondition[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    return this.conditionsRepository.find({
      where: { medicalRecordId: medicalRecord.id },
      relations: ['diagnosingDoctor', 'diagnosingDoctor.user'],
      order: { diagnosedDate: 'DESC' },
    });
  }

  /**
   * Récupérer les conditions actives
   */
  async getActiveConditions(patientId: string): Promise<MedicalCondition[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    return this.conditionsRepository.find({
      where: {
        medicalRecordId: medicalRecord.id,
        status: ConditionStatus.ACTIVE,
      },
      relations: ['diagnosingDoctor', 'diagnosingDoctor.user'],
    });
  }

  // ==================== ALLERGIES ====================

  /**
   * Ajouter une allergie
   */
  async addAllergy(
    patientId: string,
    createDto: CreateAllergyDto,
  ): Promise<Allergy> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    const allergy = this.allergiesRepository.create({
      ...createDto,
      medicalRecordId: medicalRecord.id,
    });

    return this.allergiesRepository.save(allergy);
  }

  /**
   * Récupérer toutes les allergies d'un patient
   */
  async getAllergies(patientId: string): Promise<Allergy[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    return this.allergiesRepository.find({
      where: { medicalRecordId: medicalRecord.id },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupérer les allergies médicamenteuses (pour vérification prescription)
   */
  async getMedicationAllergies(patientId: string): Promise<Allergy[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      return [];
    }

    return this.allergiesRepository.find({
      where: {
        medicalRecordId: medicalRecord.id,
        type: AllergyType.MEDICATION,
      },
    });
  }

  // ==================== MÉDICAMENTS ====================

  /**
   * BR-DM-007: Vérifier si un médicament peut être prescrit (pas d'allergie)
   * CRITIQUE: Doit être appelé AVANT toute prescription
   */
  async canPrescribe(
    patientId: string,
    medicationName: string,
  ): Promise<{ canPrescribe: boolean; allergyWarning?: string; allergies?: Allergy[] }> {
    // Récupérer les allergies médicamenteuses du patient
    const medicationAllergies = await this.getMedicationAllergies(patientId);

    if (medicationAllergies.length === 0) {
      return { canPrescribe: true };
    }

    // Vérifier correspondance (case-insensitive, partielle)
    const matchingAllergies = medicationAllergies.filter((allergy) =>
      medicationName.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
      allergy.allergen.toLowerCase().includes(medicationName.toLowerCase())
    );

    if (matchingAllergies.length === 0) {
      return { canPrescribe: true };
    }

    // Allergie trouvée!
    const severeAllergies = matchingAllergies.filter(
      (a) => a.severity === AllergySeverity.SEVERE || a.severity === AllergySeverity.ANAPHYLACTIC
    );

    if (severeAllergies.length > 0) {
      // Allergie sévère → INTERDIRE la prescription
      return {
        canPrescribe: false,
        allergyWarning: `DANGER: Patient allergique à ${matchingAllergies.map(a => a.allergen).join(', ')} (sévérité: ${severeAllergies[0].severity})`,
        allergies: matchingAllergies,
      };
    }

    // Allergie légère/modérée → AVERTIR mais autoriser (médecin décide)
    return {
      canPrescribe: true,
      allergyWarning: `ATTENTION: Patient allergique à ${matchingAllergies.map(a => a.allergen).join(', ')} (sévérité: ${matchingAllergies[0].severity})`,
      allergies: matchingAllergies,
    };
  }

  /**
   * Ajouter un médicament (AVEC vérification allergies)
   */
  async addMedication(
    patientId: string,
    createDto: CreateMedicationDto,
    prescribedBy?: string,
    forceOverrideAllergy = false,
  ): Promise<Medication> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    // BR-DM-007: Vérification allergies OBLIGATOIRE
    const allergyCheck = await this.canPrescribe(patientId, createDto.name);

    if (!allergyCheck.canPrescribe && !forceOverrideAllergy) {
      throw new BadRequestException(
        allergyCheck.allergyWarning + ' - Prescription interdite pour raisons de sécurité.'
      );
    }

    // Si allergie légère, on crée quand même mais on log l'avertissement
    if (allergyCheck.allergyWarning && allergyCheck.canPrescribe) {
      console.warn(`[PRESCRIPTION WARNING] ${allergyCheck.allergyWarning} - Patient: ${patientId}, Medication: ${createDto.name}`);
    }

    const medication = this.medicationsRepository.create({
      ...createDto,
      medicalRecordId: medicalRecord.id,
      prescribedBy,
      status: MedicationStatus.ACTIVE,
    });

    return this.medicationsRepository.save(medication);
  }

  /**
   * Arrêter un médicament
   */
  async stopMedication(
    medicationId: string,
    reason?: string,
  ): Promise<Medication> {
    const medication = await this.medicationsRepository.findOne({
      where: { id: medicationId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    medication.status = MedicationStatus.STOPPED;
    medication.endDate = new Date();

    if (reason) {
      medication.notes = medication.notes
        ? `${medication.notes}\n\nArrêt: ${reason}`
        : `Arrêt: ${reason}`;
    }

    return this.medicationsRepository.save(medication);
  }

  /**
   * Récupérer tous les médicaments d'un patient
   */
  async getMedications(patientId: string): Promise<Medication[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    return this.medicationsRepository.find({
      where: { medicalRecordId: medicalRecord.id },
      relations: ['prescribingDoctor', 'prescribingDoctor.user'],
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Récupérer les médicaments actifs
   */
  async getActiveMedications(patientId: string): Promise<Medication[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    return this.medicationsRepository.find({
      where: {
        medicalRecordId: medicalRecord.id,
        status: MedicationStatus.ACTIVE,
      },
      relations: ['prescribingDoctor', 'prescribingDoctor.user'],
      order: { startDate: 'DESC' },
    });
  }

  // ==================== VACCINATIONS ====================

  /**
   * Ajouter une vaccination
   */
  async addVaccination(
    patientId: string,
    vaccinationData: {
      name: string;
      dateGiven: string;
      manufacturer?: string;
      lotNumber?: string;
      nextDoseDate?: string;
      notes?: string;
    },
    administeredBy?: string,
  ): Promise<Vaccination> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    const vaccination = this.vaccinationsRepository.create({
      ...vaccinationData,
      medicalRecordId: medicalRecord.id,
      administeredBy,
    });

    return this.vaccinationsRepository.save(vaccination);
  }

  /**
   * Récupérer l'historique vaccinal d'un patient
   */
  async getVaccinations(patientId: string): Promise<Vaccination[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    return this.vaccinationsRepository.find({
      where: { medicalRecordId: medicalRecord.id },
      relations: ['administeringDoctor', 'administeringDoctor.user'],
      order: { dateGiven: 'DESC' },
    });
  }

  /**
   * Récupérer les vaccinations à venir (rappels)
   */
  async getUpcomingVaccinations(patientId: string): Promise<Vaccination[]> {
    const medicalRecord = await this.medicalRecordsRepository.findOne({
      where: { patientId },
    });

    if (!medicalRecord) {
      throw new NotFoundException('Medical record not found');
    }

    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    return this.vaccinationsRepository
      .createQueryBuilder('vaccination')
      .where('vaccination.medicalRecordId = :medicalRecordId', {
        medicalRecordId: medicalRecord.id,
      })
      .andWhere('vaccination.nextDoseDate IS NOT NULL')
      .andWhere('vaccination.nextDoseDate >= :now', { now })
      .andWhere('vaccination.nextDoseDate <= :oneMonth', {
        oneMonth: oneMonthFromNow,
      })
      .orderBy('vaccination.nextDoseDate', 'ASC')
      .getMany();
  }

  // ==================== STATISTIQUES & RAPPORTS ====================

  /**
   * Résumé du dossier médical (pour dashboard médecin/patient)
   */
  async getMedicalRecordSummary(patientId: string) {
    const medicalRecord = await this.getMedicalRecord(patientId);

    const activeConditionsCount = await this.conditionsRepository.count({
      where: {
        medicalRecordId: medicalRecord.id,
        status: ConditionStatus.ACTIVE,
      },
    });

    const allergiesCount = await this.allergiesRepository.count({
      where: { medicalRecordId: medicalRecord.id },
    });

    const activeMedicationsCount = await this.medicationsRepository.count({
      where: {
        medicalRecordId: medicalRecord.id,
        status: MedicationStatus.ACTIVE,
      },
    });

    const vaccinationsCount = await this.vaccinationsRepository.count({
      where: { medicalRecordId: medicalRecord.id },
    });

    return {
      patientId,
      bloodType: medicalRecord.bloodType,
      height: medicalRecord.height,
      weight: medicalRecord.weight,
      bmi: medicalRecord.height && medicalRecord.weight
        ? (medicalRecord.weight / Math.pow(medicalRecord.height / 100, 2)).toFixed(1)
        : null,
      organDonor: medicalRecord.organDonor,
      activeConditions: activeConditionsCount,
      allergies: allergiesCount,
      activeMedications: activeMedicationsCount,
      vaccinations: vaccinationsCount,
      lastUpdated: medicalRecord.updatedAt,
    };
  }
}
