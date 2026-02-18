import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyDoctorHistory, FamilyDoctorChangeType } from './entities/family-doctor-history.entity';

export interface CreateFamilyDoctorHistoryDto {
  patientId: string;
  previousDoctorId?: string;
  newDoctorId?: string;
  changeType: FamilyDoctorChangeType;
  changedBy: string;
  reason?: string;
}

@Injectable()
export class FamilyDoctorHistoryService {
  constructor(
    @InjectRepository(FamilyDoctorHistory)
    private historyRepository: Repository<FamilyDoctorHistory>,
  ) {}

  /**
   * Créer une entrée d'historique de changement de médecin de famille
   */
  async create(dto: CreateFamilyDoctorHistoryDto): Promise<FamilyDoctorHistory> {
    const history = this.historyRepository.create(dto);
    return this.historyRepository.save(history);
  }

  /**
   * Récupérer l'historique complet des changements de médecin de famille d'un patient
   */
  async findByPatient(patientId: string): Promise<FamilyDoctorHistory[]> {
    return this.historyRepository.find({
      where: { patientId },
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Récupérer tous les patients d'un médecin (historique)
   */
  async findByDoctor(doctorId: string): Promise<FamilyDoctorHistory[]> {
    return this.historyRepository
      .createQueryBuilder('history')
      .where('history.previousDoctorId = :doctorId', { doctorId })
      .orWhere('history.newDoctorId = :doctorId', { doctorId })
      .orderBy('history.changedAt', 'DESC')
      .getMany();
  }

  /**
   * Récupérer le dernier changement d'un patient
   */
  async getLatestChange(patientId: string): Promise<FamilyDoctorHistory | null> {
    return this.historyRepository.findOne({
      where: { patientId },
      order: { changedAt: 'DESC' },
    });
  }
}
