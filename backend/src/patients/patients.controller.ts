import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { AssignFamilyDoctorDto } from './dto/assign-family-doctor.dto';
import { RemoveFamilyDoctorDto } from './dto/remove-family-doctor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CanManagePatientsGuard, CanViewPatientGuard } from '../common/guards';
import { UserRole } from '../users/entities/user.entity';

@Controller('patients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get('me/profile')
  @Roles(UserRole.PATIENT)
  async getMyProfile(@Request() req) {
    return this.patientsService.findByUserId(req.user.id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.PATIENT, UserRole.DOCTOR)
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  // ==================== GESTION MÉDECIN DE FAMILLE ====================

  /**
   * BR-MF-001: Assigner un médecin de famille (Admin uniquement)
   * POST /patients/:id/family-doctor
   */
  @Post(':id/family-doctor')
  @UseGuards(CanManagePatientsGuard)
  async assignFamilyDoctor(
    @Param('id') patientId: string,
    @Body() assignDto: AssignFamilyDoctorDto,
    @Request() req,
  ) {
    return this.patientsService.assignFamilyDoctor(
      patientId,
      assignDto.doctorId,
      req.user.id,
      assignDto.reason,
    );
  }

  /**
   * BR-MF-002: Changer le médecin de famille (Admin uniquement)
   * PATCH /patients/:id/family-doctor
   */
  @Patch(':id/family-doctor')
  @UseGuards(CanManagePatientsGuard)
  async changeFamilyDoctor(
    @Param('id') patientId: string,
    @Body() assignDto: AssignFamilyDoctorDto,
    @Request() req,
  ) {
    return this.patientsService.changeFamilyDoctor(
      patientId,
      assignDto.doctorId,
      req.user.id,
      assignDto.reason,
    );
  }

  /**
   * BR-MF-003: Retirer le médecin de famille (Admin uniquement)
   * DELETE /patients/:id/family-doctor
   */
  @Delete(':id/family-doctor')
  @UseGuards(CanManagePatientsGuard)
  async removeFamilyDoctor(
    @Param('id') patientId: string,
    @Body() removeDto: RemoveFamilyDoctorDto,
    @Request() req,
  ) {
    return this.patientsService.removeFamilyDoctor(
      patientId,
      req.user.id,
      removeDto?.reason,
    );
  }

  /**
   * BR-MF-004: Historique des changements de médecin de famille
   * GET /patients/:id/family-doctor/history
   * Accessible par: Admin, le médecin de famille, le patient
   */
  @Get(':id/family-doctor/history')
  @UseGuards(CanViewPatientGuard)
  async getFamilyDoctorHistory(@Param('id') patientId: string) {
    return this.patientsService.getFamilyDoctorHistory(patientId);
  }
}
