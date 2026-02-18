import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { CreateDoctorWithUserDto } from './dto/create-doctor-with-user.dto';
import { PatientsService } from '../patients/patients.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { UsersService } from '../users/users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';

@Controller('doctors')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DoctorsController {
  constructor(
    private doctorsService: DoctorsService,
    private patientsService: PatientsService,
    private appointmentsService: AppointmentsService,
    private usersService: UsersService,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createDoctorDto: CreateDoctorDto | CreateDoctorWithUserDto) {
    // Vérifier si les données de l'utilisateur sont fournies
    if ('user' in createDoctorDto) {
      // Créer l'utilisateur d'abord
      const user = await this.usersService.create(createDoctorDto.user);

      // Créer le doctor avec le userId
      const doctorData: CreateDoctorDto = {
        userId: user.id,
        specialty: createDoctorDto.specialty,
        licenseNumber: createDoctorDto.licenseNumber,
        bio: createDoctorDto.bio,
      };

      return this.doctorsService.create(doctorData);
    }

    // Ancien format: userId déjà fourni
    return this.doctorsService.create(createDoctorDto as CreateDoctorDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  @Put(':id/schedule')
  @Roles(UserRole.DOCTOR)
  updateSchedule(@Param('id') id: string, @Body('schedule') schedule: any) {
    return this.doctorsService.updateSchedule(id, schedule);
  }

  // ==================== GESTION PATIENTS DE FAMILLE ====================

  /**
   * BR-D-002: Récupérer tous les patients de famille d'un médecin
   * GET /doctors/:id/family-patients
   * Accessible par: Admin, le médecin lui-même
   */
  @Get(':id/family-patients')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getFamilyPatients(@Param('id') doctorId: string) {
    return this.patientsService.getFamilyPatients(doctorId);
  }

  /**
   * GET /doctors/me/family-patients
   * Récupérer mes patients de famille (médecin connecté)
   */
  @Get('me/family-patients')
  @Roles(UserRole.DOCTOR)
  async getMyFamilyPatients(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return [];
    }

    return this.patientsService.getFamilyPatients(doctor.id);
  }

  /**
   * GET /doctors/:id/pending-appointments
   * Récupérer les rendez-vous en attente d'un médecin
   * Accessible par: Admin, le médecin lui-même
   */
  @Get(':id/pending-appointments')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getDoctorPendingAppointments(@Param('id') doctorId: string) {
    return this.appointmentsService.getDoctorPendingAppointments(doctorId);
  }

  /**
   * GET /doctors/me/pending-appointments
   * Récupérer mes rendez-vous en attente (médecin connecté)
   */
  @Get('me/pending-appointments')
  @Roles(UserRole.DOCTOR)
  async getMyPendingAppointments(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return [];
    }

    return this.appointmentsService.getDoctorPendingAppointments(doctor.id);
  }

  /**
   * GET /doctors/:id/statistics
   * Récupérer les statistiques d'un médecin
   * Accessible par: Admin, le médecin lui-même
   */
  @Get(':id/statistics')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getDoctorStatistics(@Param('id') doctorId: string) {
    const doctor = await this.doctorsService.findOne(doctorId);
    const familyPatients = await this.patientsService.getFamilyPatients(doctorId);
    const pendingAppointments = await this.appointmentsService.getDoctorPendingAppointments(doctorId);

    return {
      doctorId: doctor.id,
      specialty: doctor.specialty,
      isAvailable: doctor.isAvailable,
      maxFamilyPatients: doctor.maxFamilyPatients,
      currentFamilyPatients: familyPatients.length,
      pendingAppointments: pendingAppointments.length,
      canAcceptNewPatients: !doctor.maxFamilyPatients || familyPatients.length < doctor.maxFamilyPatients,
    };
  }

  /**
   * GET /doctors/me/statistics
   * Récupérer mes statistiques (médecin connecté)
   */
  @Get('me/statistics')
  @Roles(UserRole.DOCTOR)
  async getMyStatistics(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return null;
    }

    return this.getDoctorStatistics(doctor.id);
  }
}
