import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant } from './entities/assistant.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateAssistantDto, UpdateAssistantDto } from './dto/assistant.dto';

@Injectable()
export class AssistantsService {
  constructor(
    @InjectRepository(Assistant)
    private assistantsRepository: Repository<Assistant>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async findAll(): Promise<Assistant[]> {
    return this.assistantsRepository.find({
      relations: ['user', 'doctors', 'doctors.user'],
    });
  }

  async findOne(id: string): Promise<Assistant> {
    const assistant = await this.assistantsRepository.findOne({
      where: { id },
      relations: ['user', 'doctors', 'doctors.user'],
    });
    if (!assistant) {
      throw new NotFoundException('Assistant not found');
    }
    return assistant;
  }

  async findByUserId(userId: string): Promise<Assistant | null> {
    return this.assistantsRepository.findOne({
      where: { userId },
      relations: ['user', 'doctors', 'doctors.user'],
    });
  }

  async create(createAssistantDto: CreateAssistantDto): Promise<Assistant> {
    const assistant = this.assistantsRepository.create({
      userId: createAssistantDto.userId,
      title: createAssistantDto.title,
      bio: createAssistantDto.bio,
      doctors: [],
    });

    // If doctorIds provided, assign doctors
    if (createAssistantDto.doctorIds && createAssistantDto.doctorIds.length > 0) {
      const doctors = await this.doctorsRepository.findByIds(createAssistantDto.doctorIds);
      assistant.doctors = doctors;
    }

    return this.assistantsRepository.save(assistant);
  }

  async update(id: string, updateAssistantDto: UpdateAssistantDto): Promise<Assistant> {
    const assistant = await this.findOne(id);
    Object.assign(assistant, updateAssistantDto);
    return this.assistantsRepository.save(assistant);
  }

  async remove(id: string): Promise<{ message: string }> {
    const assistant = await this.findOne(id);
    await this.assistantsRepository.remove(assistant);
    return { message: 'Assistant deleted successfully' };
  }

  // ==================== DOCTOR-ASSISTANT RELATIONSHIPS ====================

  /**
   * Get all assistants for a specific doctor
   */
  async getAssistantsForDoctor(doctorId: string): Promise<Assistant[]> {
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
      relations: ['assistants', 'assistants.user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor.assistants || [];
  }

  /**
   * Assign an assistant to a doctor
   */
  async assignToDoctor(assistantId: string, doctorId: string): Promise<Assistant> {
    const assistant = await this.findOne(assistantId);
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if already assigned
    const alreadyAssigned = assistant.doctors.some((d) => d.id === doctorId);
    if (alreadyAssigned) {
      throw new BadRequestException('Assistant is already assigned to this doctor');
    }

    assistant.doctors.push(doctor);
    return this.assistantsRepository.save(assistant);
  }

  /**
   * Remove an assistant from a doctor
   */
  async removeFromDoctor(assistantId: string, doctorId: string): Promise<Assistant> {
    const assistant = await this.findOne(assistantId);

    assistant.doctors = assistant.doctors.filter((d) => d.id !== doctorId);
    return this.assistantsRepository.save(assistant);
  }

  /**
   * Get all doctors for a specific assistant
   */
  async getDoctorsForAssistant(assistantId: string): Promise<Doctor[]> {
    const assistant = await this.findOne(assistantId);
    return assistant.doctors;
  }
}
