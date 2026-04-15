import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, In, LessThan } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { PatientsService } from '../patients/patients.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';

@Injectable()
export class AppointmentsService implements OnModuleInit, OnModuleDestroy {
  private autoCompleteTimer: NodeJS.Timeout;

  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @Inject(forwardRef(() => PatientsService))
    private patientsService: PatientsService,
    private systemSettingsService: SystemSettingsService,
  ) {}

  // ─── Auto-complete lifecycle ────────────────────────────────────────────────

  onModuleInit() {
    // Run once immediately, then every 60 seconds
    this.runAutoComplete();
    this.autoCompleteTimer = setInterval(() => this.runAutoComplete(), 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.autoCompleteTimer);
  }

  private async runAutoComplete() {
    const now = new Date();
    const confirmed = await this.appointmentsRepository.find({
      where: { status: AppointmentStatus.CONFIRMED },
    });
    const expired = confirmed.filter((apt) => {
      const end = new Date(new Date(apt.dateTime).getTime() + (apt.duration ?? 30) * 60_000);
      return end <= now;
    });
    if (expired.length > 0) {
      expired.forEach((apt) => { apt.status = AppointmentStatus.COMPLETED; });
      await this.appointmentsRepository.save(expired);
      console.log(`[AutoComplete] ${expired.length} rendez-vous terminé(s) automatiquement.`);
    }
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

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

  async create(createAppointmentDto: CreateAppointmentDto, userId: string, userRole: string) {
    const doctor = await this.doctorsRepository.findOne({
      where: { id: createAppointmentDto.doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    let patientId: string;

    // Si c'est un patient qui crée le rendez-vous, utiliser son propre profil
    if (userRole === 'PATIENT') {
      const patient = await this.patientsRepository.findOne({
        where: { userId },
      });

      if (!patient) {
        throw new NotFoundException('Patient profile not found');
      }

      patientId = patient.id;
    }
    // Si c'est un médecin ou admin, utiliser le patientId fourni
    else {
      if (!createAppointmentDto.patientId) {
        throw new BadRequestException('Patient ID is required');
      }

      const patient = await this.patientsRepository.findOne({
        where: { id: createAppointmentDto.patientId },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      patientId = createAppointmentDto.patientId;
    }

    // Validate duration against system settings
    const duration = createAppointmentDto.duration || 30;
    const minDuration = await this.systemSettingsService.getNumberValue('min_appointment_duration');
    const maxDuration = await this.systemSettingsService.getNumberValue('max_appointment_duration');

    if (duration < minDuration) {
      throw new BadRequestException(
        `La durée minimale d'un rendez-vous est de ${minDuration} minutes.`,
      );
    }
    if (duration > maxDuration) {
      throw new BadRequestException(
        `La durée maximale d'un rendez-vous est de ${maxDuration} minutes.`,
      );
    }

    // Validate max appointments per day
    const appointmentDate = new Date(createAppointmentDto.dateTime);
    const maxPerDay = await this.systemSettingsService.getNumberValue('max_appointments_per_day');
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayCount = await this.appointmentsRepository.count({
      where: {
        doctorId: createAppointmentDto.doctorId,
        dateTime: Between(startOfDay, endOfDay),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    if (dayCount >= maxPerDay) {
      throw new BadRequestException(
        `Ce médecin a atteint le nombre maximum de rendez-vous par jour (${maxPerDay}). Veuillez choisir une autre date.`,
      );
    }

    // Validate doctor's schedule and no slot conflict (CONFIRMED + PENDING)
    const doctorAvailable = await this.isDoctorAvailable(
      createAppointmentDto.doctorId,
      appointmentDate,
      duration,
    );

    if (!doctorAvailable) {
      throw new BadRequestException(
        'Ce créneau est indisponible : le médecin ne travaille pas à cette heure ou le créneau est déjà réservé.',
      );
    }

    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      patientId,
      doctorId: doctor.id,
      dateTime: appointmentDate,
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

    // Vérifier le schedule du médecin
    const dayOfWeek = requestedDate
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const daySchedule = doctor.schedule?.[dayOfWeek];

    if (!daySchedule) {
      return { available: false, reason: 'Doctor has no schedule defined' };
    }

    const isNewFormat =
      daySchedule['06:00'] !== undefined || daySchedule['08:00'] !== undefined;

    if (isNewFormat) {
      const requestedHour =
        requestedDate.toTimeString().slice(0, 2).padStart(2, '0') + ':00';
      const slotStatus = daySchedule[requestedHour];
      if (!slotStatus || slotStatus === 'unavailable') {
        return { available: false, reason: 'Doctor is not available at this time' };
      }
    } else {
      if (!daySchedule.enabled) {
        return { available: false, reason: 'Doctor does not work on this day' };
      }
      const requestedTime = requestedDate.toTimeString().slice(0, 5);
      if (requestedTime < daySchedule.start || requestedTime >= daySchedule.end) {
        return { available: false, reason: 'Outside doctor working hours' };
      }
    }

    // Vérifier conflits de créneaux (CONFIRMED + PENDING)
    const endTime = new Date(requestedDate.getTime() + duration * 60000);

    const conflict = await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
      })
      .andWhere('appointment.dateTime < :endTime', { endTime })
      .andWhere(
        `appointment.dateTime + (appointment.duration || ' minutes')::interval > :startTime`,
        { startTime: requestedDate },
      )
      .getOne();

    if (conflict) {
      return { available: false, reason: 'Time slot already booked' };
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

  async cancelAppointment(id: string, reason?: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CANCELLED;
    if (reason) {
      appointment.cancellationReason = reason;
    }
    return this.appointmentsRepository.save(appointment);
  }

  // ==================== NOUVELLES RÈGLES MÉTIER ====================

  /**
   * BR-A-003: Vérification disponibilité médecin (3 niveaux)
   * 1. Médecin actif
   * 2. Schedule compatible
   * 3. Pas de conflit avec rendez-vous existants
   */
  async isDoctorAvailable(
    doctorId: string,
    dateTime: Date,
    duration: number,
  ): Promise<boolean> {
    // 1. Médecin existe et disponible
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
    });

    if (!doctor || !doctor.isAvailable) {
      return false;
    }

    // 2. Vérifier schedule
    const dayOfWeek = dateTime
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const daySchedule = doctor.schedule?.[dayOfWeek];

    if (!daySchedule) {
      return false;
    }

    // Detect format: new slot-based format has hour keys like "08:00"
    const isNewFormat = daySchedule['06:00'] !== undefined || daySchedule['08:00'] !== undefined;

    if (isNewFormat) {
      // New slot-based format: { "06:00": "available", "07:00": "unavailable", ... }
      const requestedHour = dateTime.toTimeString().slice(0, 2).padStart(2, '0') + ':00';
      const slotStatus = daySchedule[requestedHour];
      if (!slotStatus || slotStatus === 'unavailable') {
        return false;
      }
    } else {
      // Old format: { start: "08:00", end: "17:00", enabled: true }
      if (!daySchedule.enabled) {
        return false;
      }
      const requestedTime = dateTime.toTimeString().slice(0, 5);
      if (requestedTime < daySchedule.start || requestedTime > daySchedule.end) {
        return false;
      }
    }

    // 3. Vérifier pas de conflit avec rendez-vous existants
    const endTime = new Date(dateTime.getTime() + duration * 60000);

    const conflictingAppointment = await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
      })
      .andWhere('appointment.dateTime < :endTime', { endTime })
      .andWhere(
        `appointment.dateTime + (appointment.duration || ' minutes')::interval > :startTime`,
        { startTime: dateTime },
      )
      .getOne();

    return !conflictingAppointment;
  }

  /**
   * BR-A-002: Règle priorité médecin de famille
   * Patient doit consulter son médecin de famille si disponible
   */
  async canPatientBookWithDoctor(
    patientId: string,
    requestedDoctorId: string,
    dateTime: Date,
    duration: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Récupérer le patient
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: ['id', 'familyDoctorId'],
    });

    if (!patient) {
      return { allowed: false, reason: 'Patient not found' };
    }

    // Vérifier que le médecin demandé existe
    const doctor = await this.doctorsRepository.findOne({
      where: { id: requestedDoctorId },
    });

    if (!doctor) {
      return { allowed: false, reason: 'Doctor not found' };
    }

    if (!doctor.isAvailable) {
      return { allowed: false, reason: 'Doctor is not available' };
    }

    // Pas de médecin de famille → OK avec n'importe quel médecin
    if (!patient.familyDoctorId) {
      return { allowed: true };
    }

    // Rendez-vous avec son médecin de famille → OK
    if (patient.familyDoctorId === requestedDoctorId) {
      return { allowed: true };
    }

    // Autre médecin → vérifier disponibilité médecin de famille
    const familyDoctorAvailable = await this.isDoctorAvailable(
      patient.familyDoctorId,
      dateTime,
      duration,
    );

    if (familyDoctorAvailable) {
      return {
        allowed: false,
        reason:
          "Votre médecin de famille est disponible à ce créneau. Veuillez d'abord prendre rendez-vous avec lui.",
      };
    }

    // Médecin de famille indisponible → OK avec autre médecin
    return { allowed: true };
  }

  /**
   * BR-A-001: Créer rendez-vous avec toutes les validations
   */
  async createAppointment(
    createDto: any,
    requestedBy: string,
  ): Promise<Appointment> {
    const { patientId, doctorId, dateTime, duration, reason } = createDto;
    const appointmentDate = new Date(dateTime);

    // Validation 1: Date dans le futur (minimum 2h)
    const now = new Date();
    const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (appointmentDate < minDate) {
      throw new BadRequestException(
        'Appointment must be at least 2 hours in advance',
      );
    }

    // Validation 2: Maximum 3 mois à l'avance
    const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (appointmentDate > maxDate) {
      throw new BadRequestException(
        'Cannot book more than 3 months in advance',
      );
    }

    // Validation 3: Durée selon paramètres système
    const minDuration = await this.systemSettingsService.getNumberValue('min_appointment_duration');
    const maxDuration = await this.systemSettingsService.getNumberValue('max_appointment_duration');

    if (duration < minDuration) {
      throw new BadRequestException(
        `La durée minimale d'un rendez-vous est de ${minDuration} minutes.`,
      );
    }

    if (duration > maxDuration) {
      throw new BadRequestException(
        `La durée maximale d'un rendez-vous est de ${maxDuration} minutes.`,
      );
    }

    if (duration % 15 !== 0) {
      throw new BadRequestException(
        'La durée doit être un multiple de 15 minutes.',
      );
    }

    // Validation 4: Nombre max de rendez-vous par jour pour le médecin
    const maxPerDay = await this.systemSettingsService.getNumberValue('max_appointments_per_day');
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayAppointmentsCount = await this.appointmentsRepository.count({
      where: {
        doctorId,
        dateTime: Between(startOfDay, endOfDay),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    if (dayAppointmentsCount >= maxPerDay) {
      throw new BadRequestException(
        `Ce médecin a atteint le nombre maximum de rendez-vous par jour (${maxPerDay}). Veuillez choisir une autre date.`,
      );
    }

    // Validation 6: Règle médecin de famille (BR-A-002)
    const bookingValidation = await this.canPatientBookWithDoctor(
      patientId,
      doctorId,
      appointmentDate,
      duration,
    );

    if (!bookingValidation.allowed) {
      throw new BadRequestException(bookingValidation.reason);
    }

    // Validation 7: Disponibilité médecin (BR-A-003)
    const doctorAvailable = await this.isDoctorAvailable(
      doctorId,
      appointmentDate,
      duration,
    );

    if (!doctorAvailable) {
      throw new BadRequestException('Doctor not available at this time');
    }

    // Créer rendez-vous en PENDING (en attente d'approbation médecin)
    const appointment = this.appointmentsRepository.create({
      patientId,
      doctorId,
      dateTime: appointmentDate,
      duration,
      reason,
      status: AppointmentStatus.PENDING,
      doctorApproved: false,
      adminApproved: true,
      requestedBy,
    });

    return this.appointmentsRepository.save(appointment);
  }

  /**
   * BR-W-002: Approbation par le médecin
   */
  async approveByDoctor(
    appointmentId: string,
    doctorId: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(appointmentId);

    // Vérifier que le médecin approuve son propre rendez-vous
    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only approve your own appointments',
      );
    }

    // Vérifier status PENDING
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Appointment is not in pending status');
    }

    // Récupérer le userId du médecin
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    appointment.doctorApproved = true;
    appointment.doctorApprovedAt = new Date();
    appointment.doctorApprovedBy = doctor.userId;
    appointment.status = AppointmentStatus.CONFIRMED;

    return this.appointmentsRepository.save(appointment);
  }

  /**
   * BR-W-002: Rejet par le médecin
   */
  async rejectByDoctor(
    appointmentId: string,
    doctorId: string,
    reason: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(appointmentId);

    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only reject your own appointments',
      );
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Appointment is not in pending status');
    }

    appointment.doctorApproved = false;
    appointment.doctorRejectionReason = reason;
    appointment.status = AppointmentStatus.REJECTED;

    return this.appointmentsRepository.save(appointment);
  }

  /**
   * BR-W-003: Approbation par l'admin
   */
  async approveByAdmin(
    appointmentId: string,
    adminId: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(appointmentId);

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Appointment is not in pending status');
    }

    appointment.adminApproved = true;
    appointment.adminApprovedAt = new Date();
    appointment.adminApprovedBy = adminId;

    // Si médecin a déjà approuvé → CONFIRMED
    if (appointment.doctorApproved) {
      appointment.status = AppointmentStatus.CONFIRMED;
    }

    return this.appointmentsRepository.save(appointment);
  }

  /**
   * BR-W-003: Rejet par l'admin
   */
  async rejectByAdmin(
    appointmentId: string,
    adminId: string,
    reason: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(appointmentId);

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Appointment is not in pending status');
    }

    appointment.adminApproved = false;
    appointment.adminRejectionReason = reason;
    appointment.status = AppointmentStatus.REJECTED;

    return this.appointmentsRepository.save(appointment);
  }

  /**
   * Récupérer tous les rendez-vous en attente
   */
  async getPendingAppointments(): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { status: AppointmentStatus.PENDING },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Récupérer les rendez-vous en attente d'un médecin
   */
  async getDoctorPendingAppointments(doctorId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: {
        doctorId,
        status: AppointmentStatus.PENDING,
      },
      relations: ['patient', 'patient.user'],
      order: { createdAt: 'ASC' },
    });
  }
}
