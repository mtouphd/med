import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorsService, DoctorSearchParams } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto, UpdateDoctorSettingsDto } from './dto/doctor.dto';
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
import { Assistant } from '../assistants/entities/assistant.entity';

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
    @InjectRepository(Assistant)
    private assistantsRepository: Repository<Assistant>,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  findAll() {
    return this.doctorsService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createDoctorDto: CreateDoctorDto | CreateDoctorWithUserDto) {
    if ('user' in createDoctorDto) {
      const user = await this.usersService.create(createDoctorDto.user);
      const doctorData: CreateDoctorDto = {
        userId: user.id,
        specialty: createDoctorDto.specialty,
        licenseNumber: createDoctorDto.licenseNumber,
        bio: createDoctorDto.bio,
      };
      return this.doctorsService.create(doctorData);
    }
    return this.doctorsService.create(createDoctorDto as CreateDoctorDto);
  }

  // ==================== SEARCH ROUTE ====================

  /**
   * GET /doctors/search?city=...&specialty=...&lat=...&lng=...&radius=...
   * Rechercher des médecins par zone géographique
   */
  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT, UserRole.ASSISTANT)
  searchDoctors(
    @Query('city') city?: string,
    @Query('specialty') specialty?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    const params: DoctorSearchParams = {
      city,
      specialty,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
    };
    return this.doctorsService.searchDoctors(params);
  }

  // ==================== ME ROUTES (must come before :id routes) ====================

  /**
   * GET /doctors/me
   * Récupérer mon profil médecin (médecin connecté)
   */
  @Get('me')
  @Roles(UserRole.DOCTOR)
  async getMyProfile(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
      relations: ['user'],
    });
    if (!doctor) {
      return null;
    }
    return this.doctorsService.findOne(doctor.id);
  }

  /**
   * GET /doctors/me/patients
   * Tous les patients du médecin (famille + RDV)
   */
  @Get('me/patients')
  @Roles(UserRole.DOCTOR)
  async getMyPatients(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });
    if (!doctor) return [];
    return this.patientsService.getPatientsByDoctor(doctor.id);
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
   * GET /doctors/me/settings
   * Récupérer mes paramètres personnalisés + valeurs globales
   */
  @Get('me/settings')
  @Roles(UserRole.DOCTOR)
  async getMySettings(@Request() req) {
    return this.doctorsService.getSettings(req.user.id);
  }

  /**
   * PATCH /doctors/me
   * Mettre à jour mon profil (bio, adresse structurée, spécialité…)
   */
  @Patch('me')
  @Roles(UserRole.DOCTOR)
  async updateMyProfile(@Request() req, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.updateMyProfile(req.user.id, dto);
  }

  /**
   * PATCH /doctors/me/settings
   * Mettre à jour mes paramètres personnalisés (null = retour au global)
   */
  @Patch('me/settings')
  @Roles(UserRole.DOCTOR)
  async updateMySettings(@Request() req, @Body() dto: UpdateDoctorSettingsDto) {
    return this.doctorsService.updateSettings(req.user.id, dto);
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

  // ==================== :ID ROUTES ====================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
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

  // ==================== GESTION DES ASSISTANTS ====================

  /**
   * GET /doctors/me/assistants
   * Get assistants for the current logged-in doctor
   */
  @Get('me/assistants')
  @Roles(UserRole.DOCTOR)
  async getMyAssistants(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
      relations: ['assistants', 'assistants.user'],
    });

    if (!doctor) {
      return [];
    }

    return doctor.assistants || [];
  }

  /**
   * POST /doctors/me/assistants
   * Create and assign a new assistant to current doctor
   */
  @Post('me/assistants')
  @Roles(UserRole.DOCTOR)
  async createMyAssistant(@Request() req, @Body() body: any) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Create user with ASSISTANT role
    const user = await this.usersService.create({
      ...body.user,
      role: UserRole.ASSISTANT,
    });

    // Create assistant
    const assistant = this.assistantsRepository.create({
      userId: user.id,
      title: body.title,
      bio: body.bio,
      doctors: [doctor],
    });

    return this.assistantsRepository.save(assistant);
  }

  /**
   * GET /doctors/:id/assistants
   * Get all assistants for a doctor
   */
  @Get(':id/assistants')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getDoctorAssistants(@Param('id') doctorId: string) {
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
      relations: ['assistants', 'assistants.user'],
    });

    if (!doctor) {
      return [];
    }

    return doctor.assistants || [];
  }

  /**
   * POST /doctors/:id/assistants
   * Assign an existing assistant to a doctor
   */
  @Post(':id/assistants')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async assignAssistant(@Param('id') doctorId: string, @Body('assistantId') assistantId: string) {
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
      relations: ['assistants'],
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const assistant = await this.assistantsRepository.findOne({
      where: { id: assistantId },
      relations: ['doctors'],
    });

    if (!assistant) {
      throw new Error('Assistant not found');
    }

    // Check if already assigned
    const alreadyAssigned = doctor.assistants?.some((a) => a.id === assistantId);
    if (!alreadyAssigned) {
      assistant.doctors = [...(assistant.doctors || []), doctor];
      await this.assistantsRepository.save(assistant);
    }

    return this.doctorsRepository.findOne({
      where: { id: doctorId },
      relations: ['assistants', 'assistants.user'],
    });
  }

  /**
   * DELETE /doctors/:id/assistants/:assistantId
   * Remove an assistant from a doctor
   */
  @Delete(':id/assistants/:assistantId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async removeAssistant(
    @Param('id') doctorId: string,
    @Param('assistantId') assistantId: string,
  ) {
    const assistant = await this.assistantsRepository.findOne({
      where: { id: assistantId },
      relations: ['doctors'],
    });

    if (!assistant) {
      throw new Error('Assistant not found');
    }

    assistant.doctors = assistant.doctors.filter((d) => d.id !== doctorId);
    await this.assistantsRepository.save(assistant);

    return { message: 'Assistant removed successfully' };
  }
}
