import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  async findAll() {
    return this.patientsRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string) {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async create(createPatientDto: CreatePatientDto) {
    const patient = this.patientsRepository.create(createPatientDto);
    return this.patientsRepository.save(patient);
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
      relations: ['user'],
    });
  }
}
