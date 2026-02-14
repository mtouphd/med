import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto } from './dto/doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async findAll() {
    return this.doctorsRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string) {
    const doctor = await this.doctorsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  async create(createDoctorDto: CreateDoctorDto) {
    const doctor = this.doctorsRepository.create(createDoctorDto);
    return this.doctorsRepository.save(doctor);
  }

  async update(id: string, updateDoctorDto: Partial<CreateDoctorDto>) {
    const doctor = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);
    return this.doctorsRepository.save(doctor);
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);
    await this.doctorsRepository.remove(doctor);
    return { message: 'Doctor deleted successfully' };
  }

  async updateSchedule(id: string, schedule: any) {
    const doctor = await this.findOne(id);
    doctor.schedule = schedule;
    return this.doctorsRepository.save(doctor);
  }
}
