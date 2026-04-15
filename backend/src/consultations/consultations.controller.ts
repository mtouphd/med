import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('consultations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ConsultationsController {
  constructor(private consultationsService: ConsultationsService) {}

  /** Créer/mettre à jour la consultation d'un RDV (brouillon) */
  @Post()
  @Roles(UserRole.DOCTOR, UserRole.ASSISTANT)
  upsert(@Body() dto: CreateConsultationDto, @Request() req) {
    return this.consultationsService.upsert(dto, req.user.id);
  }

  /** Terminer un RDV + sauvegarder la consultation en une action */
  @Post('complete/:appointmentId')
  @Roles(UserRole.DOCTOR, UserRole.ASSISTANT)
  complete(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateConsultationDto,
    @Request() req,
  ) {
    return this.consultationsService.complete(appointmentId, dto, req.user.id);
  }

  /** Mettre à jour une consultation existante */
  @Patch(':id')
  @Roles(UserRole.DOCTOR, UserRole.ASSISTANT)
  update(@Param('id') id: string, @Body() dto: UpdateConsultationDto) {
    return this.consultationsService.update(id, dto);
  }

  /** Récupérer la consultation d'un rendez-vous */
  @Get('appointment/:appointmentId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT, UserRole.ASSISTANT)
  findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.consultationsService.findByAppointment(appointmentId);
  }

  /** Récupérer toutes les consultations d'un patient (médecin/admin) */
  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  findByPatient(@Param('patientId') patientId: string) {
    return this.consultationsService.findByPatient(patientId);
  }

  /** Patient — ses propres consultations */
  @Get('my')
  @Roles(UserRole.PATIENT)
  findMy(@Request() req) {
    return this.consultationsService.findMyConsultations(req.user.id);
  }

  /** Médecin — toutes ses consultations */
  @Get('doctor/my')
  @Roles(UserRole.DOCTOR)
  findMyDoctor(@Request() req) {
    return this.consultationsService.findByDoctor(req.user.id);
  }
}
