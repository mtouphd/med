import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FamilyDoctorRequest,
  FamilyDoctorRequestStatus,
} from './entities/family-doctor-request.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { CreateFamilyDoctorRequestDto, RespondToRequestDto } from './dto/family-doctor-request.dto';
import { SystemSettingsService } from '../system-settings/system-settings.service';

@Injectable()
export class FamilyDoctorRequestsService {
  constructor(
    @InjectRepository(FamilyDoctorRequest)
    private requestsRepository: Repository<FamilyDoctorRequest>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    private systemSettingsService: SystemSettingsService,
  ) {}

  async create(
    createDto: CreateFamilyDoctorRequestDto,
    userId: string,
  ): Promise<FamilyDoctorRequest> {
    // Find patient by userId
    const patient = await this.patientsRepository.findOne({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    // Verify doctor exists
    const doctor = await this.doctorsRepository.findOne({
      where: { id: createDto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // A family doctor must be a general practitioner
    if (doctor.specialty.toLowerCase() !== 'general' && doctor.specialty.toLowerCase() !== 'généraliste') {
      throw new BadRequestException(
        'Seul un médecin généraliste peut être désigné comme médecin de famille. Ce médecin est spécialiste.',
      );
    }

    // Check if patient already has a family doctor assigned
    if (patient.familyDoctorId) {
      throw new BadRequestException(
        'You already have a family doctor. You cannot request another one.',
      );
    }

    // Check if patient already has a pending request
    const existingRequest = await this.requestsRepository.findOne({
      where: {
        patientId: patient.id,
        status: FamilyDoctorRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending family doctor request',
      );
    }

    const request = this.requestsRepository.create({
      patientId: patient.id,
      doctorId: createDto.doctorId,
      requestReason: createDto.requestReason,
      status: FamilyDoctorRequestStatus.PENDING,
    });

    return this.requestsRepository.save(request);
  }

  async findAll(): Promise<FamilyDoctorRequest[]> {
    return this.requestsRepository.find({
      where: { status: FamilyDoctorRequestStatus.PENDING },
      order: { requestedAt: 'DESC' },
      relations: ['patient', 'doctor', 'patient.user', 'doctor.user'],
    });
  }

  async findMyRequests(userId: string): Promise<FamilyDoctorRequest[]> {
    const patient = await this.patientsRepository.findOne({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return this.requestsRepository.find({
      where: { patientId: patient.id },
      order: { requestedAt: 'DESC' },
      relations: ['patient', 'doctor', 'patient.user', 'doctor.user', 'respondedByUser'],
    });
  }

  async findOne(id: string): Promise<FamilyDoctorRequest> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'patient.user', 'doctor.user', 'respondedByUser'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async approve(
    id: string,
    adminUserId: string,
    dto: RespondToRequestDto,
  ): Promise<FamilyDoctorRequest> {
    const request = await this.findOne(id);

    if (request.status !== FamilyDoctorRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    // Check if doctor has reached max family patients (system setting)
    const maxFamilyPatients = await this.systemSettingsService.getNumberValue('max_family_patients_per_doctor');
    const currentCount = await this.patientsRepository.count({
      where: { familyDoctorId: request.doctorId },
    });

    if (currentCount >= maxFamilyPatients) {
      throw new BadRequestException(
        `Ce médecin a atteint le nombre maximum de patients en tant que médecin de famille (${maxFamilyPatients}).`,
      );
    }

    // Update the patient's family doctor
    await this.patientsRepository.update(request.patientId, {
      familyDoctorId: request.doctorId,
    });

    // Update the request
    request.status = FamilyDoctorRequestStatus.APPROVED;
    request.respondedAt = new Date();
    request.respondedBy = adminUserId;
    request.responseReason = dto.responseReason;

    return this.requestsRepository.save(request);
  }

  async reject(
    id: string,
    adminUserId: string,
    dto: RespondToRequestDto,
  ): Promise<FamilyDoctorRequest> {
    const request = await this.findOne(id);

    if (request.status !== FamilyDoctorRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    if (!dto.responseReason) {
      throw new BadRequestException('Response reason is required for rejection');
    }

    request.status = FamilyDoctorRequestStatus.REJECTED;
    request.respondedAt = new Date();
    request.respondedBy = adminUserId;
    request.responseReason = dto.responseReason;

    return this.requestsRepository.save(request);
  }

  // Doctor-specific methods
  async getDoctorRequests(doctorId: string): Promise<FamilyDoctorRequest[]> {
    return this.requestsRepository.find({
      where: {
        doctorId,
        status: FamilyDoctorRequestStatus.PENDING,
      },
      order: { requestedAt: 'DESC' },
      relations: ['patient', 'doctor', 'patient.user', 'doctor.user'],
    });
  }

  async approveByDoctor(
    id: string,
    doctorId: string,
    userId: string,
    dto: RespondToRequestDto,
  ): Promise<FamilyDoctorRequest> {
    const request = await this.findOne(id);

    // Verify the request is for this doctor
    if (request.doctorId !== doctorId) {
      throw new ForbiddenException('You can only approve requests for yourself');
    }

    if (request.status !== FamilyDoctorRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    // Check if doctor has reached max family patients (system setting)
    const maxFamilyPatients = await this.systemSettingsService.getNumberValue('max_family_patients_per_doctor');
    const currentCount = await this.patientsRepository.count({
      where: { familyDoctorId: doctorId },
    });

    if (currentCount >= maxFamilyPatients) {
      throw new BadRequestException(
        `Vous avez atteint le nombre maximum de patients en tant que médecin de famille (${maxFamilyPatients}).`,
      );
    }

    // Update the patient's family doctor
    await this.patientsRepository.update(request.patientId, {
      familyDoctorId: doctorId,
    });

    // Update the request
    request.status = FamilyDoctorRequestStatus.APPROVED;
    request.respondedAt = new Date();
    request.respondedBy = userId;
    request.responseReason = dto.responseReason;

    return this.requestsRepository.save(request);
  }

  async rejectByDoctor(
    id: string,
    doctorId: string,
    userId: string,
    dto: RespondToRequestDto,
  ): Promise<FamilyDoctorRequest> {
    const request = await this.findOne(id);

    // Verify the request is for this doctor
    if (request.doctorId !== doctorId) {
      throw new ForbiddenException('You can only reject requests for yourself');
    }

    if (request.status !== FamilyDoctorRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    if (!dto.responseReason) {
      throw new BadRequestException('Response reason is required for rejection');
    }

    request.status = FamilyDoctorRequestStatus.REJECTED;
    request.respondedAt = new Date();
    request.respondedBy = userId;
    request.responseReason = dto.responseReason;

    return this.requestsRepository.save(request);
  }
}
