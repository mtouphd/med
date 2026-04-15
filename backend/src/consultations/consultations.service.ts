import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private consultationsRepository: Repository<Consultation>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  /** Crée ou met à jour la consultation pour un rendez-vous (upsert) */
  async upsert(dto: CreateConsultationDto, userId: string): Promise<Consultation> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: dto.appointmentId },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const doctor = await this.doctorsRepository.findOne({ where: { userId } });
    if (!doctor) throw new BadRequestException('Doctor profile not found');

    if (appointment.doctorId !== doctor.id) {
      throw new BadRequestException('You are not the doctor for this appointment');
    }

    // Upsert : cherche consultation existante ou en crée une nouvelle
    let consultation = await this.consultationsRepository.findOne({
      where: { appointmentId: dto.appointmentId },
    });

    if (consultation) {
      Object.assign(consultation, dto);
    } else {
      consultation = this.consultationsRepository.create({
        ...dto,
        patientId: appointment.patientId,
        doctorId: doctor.id,
      });
    }

    return this.consultationsRepository.save(consultation);
  }

  /** Termine le rendez-vous et sauvegarde la consultation en une seule action */
  async complete(appointmentId: string, dto: UpdateConsultationDto, userId: string): Promise<Consultation> {
    const consultation = await this.upsert(
      { appointmentId, ...dto },
      userId,
    );

    // Passe le RDV à COMPLETED
    await this.appointmentsRepository.update(appointmentId, {
      status: AppointmentStatus.COMPLETED,
    });

    return consultation;
  }

  async update(id: string, dto: UpdateConsultationDto): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({ where: { id } });
    if (!consultation) throw new NotFoundException('Consultation not found');
    Object.assign(consultation, dto);
    return this.consultationsRepository.save(consultation);
  }

  async findByAppointment(appointmentId: string): Promise<Consultation | null> {
    return this.consultationsRepository.findOne({
      where: { appointmentId },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });
  }

  async findByPatient(patientId: string): Promise<Consultation[]> {
    return this.consultationsRepository.find({
      where: { patientId },
      relations: ['doctor', 'doctor.user', 'appointment'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Patient — ses propres consultations */
  async findMyConsultations(userId: string): Promise<Consultation[]> {
    const patient = await this.patientsRepository.findOne({ where: { userId } });
    if (!patient) return [];
    return this.findByPatient(patient.id);
  }

  /** Médecin — toutes ses consultations */
  async findByDoctor(userId: string): Promise<Consultation[]> {
    const doctor = await this.doctorsRepository.findOne({ where: { userId } });
    if (!doctor) return [];
    return this.consultationsRepository.find({
      where: { doctorId: doctor.id },
      relations: ['patient', 'patient.user', 'appointment'],
      order: { createdAt: 'DESC' },
    });
  }
}
