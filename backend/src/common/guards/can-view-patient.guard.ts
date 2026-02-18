import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PatientsService } from '../../patients/patients.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard: Vérifie que l'utilisateur peut voir les données du patient
 *
 * Autorisations:
 * - ADMIN: Peut voir tous les patients
 * - DOCTOR: Peut voir seulement ses patients de famille
 * - PATIENT: Peut voir seulement son propre profil
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, CanViewPatientGuard)
 * @Get('patients/:patientId/...')
 *
 * Attendu dans la requête:
 * - user (utilisateur connecté avec id, role, doctor)
 * - params.patientId (ID du patient)
 */
@Injectable()
export class CanViewPatientGuard implements CanActivate {
  constructor(private patientsService: PatientsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Injecté par JwtAuthGuard
    const patientId = request.params.patientId || request.params.id;

    if (!patientId) {
      throw new NotFoundException('Patient ID not found in request');
    }

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // 1. ADMIN → Accès total
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Récupérer le patient
    const patient = await this.patientsService.findOne(patientId);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // 2. PATIENT → Peut voir seulement son propre profil
    if (user.role === UserRole.PATIENT) {
      if (patient.userId === user.id) {
        return true;
      }
      throw new ForbiddenException('You can only view your own patient data');
    }

    // 3. DOCTOR → Peut voir seulement ses patients de famille
    if (user.role === UserRole.DOCTOR) {
      const doctorId = user.doctor?.id;

      if (!doctorId) {
        throw new ForbiddenException('Doctor profile not found');
      }

      const isFamilyDoctor = await this.patientsService.isFamilyDoctor(
        patientId,
        doctorId,
      );

      if (isFamilyDoctor) {
        return true;
      }

      throw new ForbiddenException(
        'You can only view your family patients',
      );
    }

    // Rôle non reconnu
    throw new ForbiddenException('Insufficient permissions');
  }
}
