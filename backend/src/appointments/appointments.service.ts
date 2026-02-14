import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  async findAll() {
    return this.appointmentsRepository.find({
      relations: ['patient', 'doctor', 'doctor.user'],
      order: { dateTime: 'DESC' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'doctor.user'],
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async create(createAppointmentDto: CreateAppointmentDto, userId: string) {
    const doctor = await this.doctorsRepository.findOne({
      where: { id: createAppointmentDto.doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const patient = await this.patientsRepository.findOne({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const existingAppointment = await this.appointmentsRepository.findOne({
      where: {
        doctorId: createAppointmentDto.doctorId,
        dateTime: new Date(createAppointmentDto.dateTime),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('This time slot is already booked');
    }

    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      patientId: patient.id,
      doctorId: doctor.id,
      dateTime: new Date(createAppointmentDto.dateTime),
    });

    return this.appointmentsRepository.save(appointment);
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    await this.appointmentsRepository.remove(appointment);
    return { message: 'Appointment deleted successfully' };
  }

  async findByPatient(patientId: string) {
    return this.appointmentsRepository.find({
      where: { patientId },
      relations: ['doctor', 'doctor.user'],
      order: { dateTime: 'DESC' },
    });
  }

  async findByDoctor(doctorId: string) {
    return this.appointmentsRepository.find({
      where: { doctorId },
      relations: ['patient', 'patient.user'],
      order: { dateTime: 'DESC' },
    });
  }

  async findMyAppointments(userId: string, role: string, userRepo: Repository<any>, patientRepo: Repository<Patient>) {
    if (role === 'PATIENT') {
      const patient = await patientRepo.findOne({ where: { userId } });
      if (!patient) return [];
      return this.findByPatient(patient.id);
    } else if (role === 'DOCTOR') {
      const doctor = await userRepo.findOne({ 
        where: { id: userId },
        relations: ['doctor']
      });
      if (!doctor || !doctor.doctor) return [];
      return this.findByDoctor(doctor.doctor.id);
    }
    return this.findAll();
  }

  async getStats() {
    const total = await this.appointmentsRepository.count();
    const pending = await this.appointmentsRepository.count({ where: { status: AppointmentStatus.PENDING } });
    const confirmed = await this.appointmentsRepository.count({ where: { status: AppointmentStatus.CONFIRMED } });
    const completed = await this.appointmentsRepository.count({ where: { status: AppointmentStatus.COMPLETED } });
    const cancelled = await this.appointmentsRepository.count({ where: { status: AppointmentStatus.CANCELLED } });

    return { total, pending, confirmed, completed, cancelled };
  }

  async checkAvailability(doctorId: string, dateTime: string, duration: number = 30) {
    const requestedDate = new Date(dateTime);
    const doctor = await this.doctorsRepository.findOne({ where: { id: doctorId } });
    
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.appointmentsRepository.find({
      where: {
        doctorId,
        dateTime: Between(startOfDay, endOfDay),
        status: AppointmentStatus.CONFIRMED,
      },
      order: { dateTime: 'ASC' },
    });

    const requestedStart = requestedDate.getTime();
    const requestedEnd = requestedStart + (duration * 60000);

    for (const apt of existingAppointments) {
      const aptStart = new Date(apt.dateTime).getTime();
      const aptEnd = aptStart + (apt.duration * 60000);
      
      if (requestedStart < aptEnd && requestedEnd > aptStart) {
        return { available: false, reason: 'Time slot already booked' };
      }
    }

    const dayOfWeek = requestedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { available: false, reason: 'Cannot book on weekends' };
    }

    const hour = requestedDate.getHours();
    if (hour < 8 || hour >= 18) {
      return { available: false, reason: 'Working hours are 8:00 AM to 6:00 PM' };
    }

    return { available: true };
  }

  async getAppointmentsByDateRange(doctorId: string, startDate: string, endDate: string) {
    return this.appointmentsRepository.find({
      where: {
        doctorId,
        dateTime: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['patient', 'patient.user'],
      order: { dateTime: 'ASC' },
    });
  }

  async getDoctorPatients(doctorId: string) {
    const appointments = await this.appointmentsRepository.find({
      where: { doctorId },
      relations: ['patient', 'patient.user'],
      order: { dateTime: 'DESC' },
    });

    const patientMap = new Map();
    
    for (const apt of appointments) {
      const patientId = apt.patient.id;
      
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          id: apt.patient.id,
          user: apt.patient.user,
          appointments: [],
          lastVisit: null,
        });
      }
      
      const patient = patientMap.get(patientId);
      patient.appointments.push({
        id: apt.id,
        dateTime: apt.dateTime,
        status: apt.status,
        reason: apt.reason,
        notes: apt.notes,
        medications: apt.medications,
        duration: apt.duration,
      });
      
      if (!patient.lastVisit || new Date(apt.dateTime) > new Date(patient.lastVisit)) {
        patient.lastVisit = apt.dateTime;
      }
    }

    return Array.from(patientMap.values());
  }

  async approveAppointment(id: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CONFIRMED;
    return this.appointmentsRepository.save(appointment);
  }

  async cancelAppointment(id: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentsRepository.save(appointment);
  }
}
