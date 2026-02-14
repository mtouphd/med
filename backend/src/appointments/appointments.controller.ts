import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AppointmentsController {
  constructor(
    private appointmentsService: AppointmentsService,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  async getMyAppointments(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });
    
    if (req.user.role === UserRole.PATIENT) {
      const patient = await this.patientsRepository.findOne({
        where: { userId: req.user.id },
      });
      if (patient) {
        return this.appointmentsService.findByPatient(patient.id);
      }
      return [];
    } else if (req.user.role === UserRole.DOCTOR && doctor) {
      return this.appointmentsService.findByDoctor(doctor.id);
    }
    return this.appointmentsService.findAll();
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findByDoctor(doctorId);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.findByPatient(patientId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.PATIENT, UserRole.ADMIN)
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req) {
    return this.appointmentsService.create(createAppointmentDto, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.appointmentsService.getStats();
  }

  @Get('check-availability/:doctorId')
  @Roles(UserRole.PATIENT, UserRole.ADMIN)
  checkAvailability(
    @Param('doctorId') doctorId: string,
    @Query('dateTime') dateTime: string,
    @Query('duration') duration?: number,
  ) {
    return this.appointmentsService.checkAvailability(doctorId, dateTime, duration);
  }

  @Get('doctor/:doctorId/range')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  getAppointmentsByDateRange(
    @Param('doctorId') doctorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.getAppointmentsByDateRange(doctorId, startDate, endDate);
  }

  @Get('doctor/patients')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async getDoctorPatients(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });
    if (!doctor) {
      return [];
    }
    return this.appointmentsService.getDoctorPatients(doctor.id);
  }

  @Put(':id/approve')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  approveAppointment(@Param('id') id: string) {
    return this.appointmentsService.approveAppointment(id);
  }

  @Put(':id/cancel')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  cancelAppointment(@Param('id') id: string) {
    return this.appointmentsService.cancelAppointment(id);
  }
}
