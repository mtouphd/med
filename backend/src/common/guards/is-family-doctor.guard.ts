import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PatientsService } from '../../patients/patients.service';

/**
 * Guard: Vérifie que le médecin connecté est le médecin de famille du patient
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, IsFamilyDoctorGuard)
 * @Get('patients/:patientId/...')
 *
 * Attendu dans la requête:
 * - user.id (ID du médecin connecté)
 * - params.patientId (ID du patient)
 */
@Injectable()
export class IsFamilyDoctorGuard implements CanActivate {
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

    // Récupérer le doctorId depuis l'utilisateur connecté
    // On suppose que user.doctor existe si le rôle est DOCTOR
    const doctorId = user.doctor?.id;

    if (!doctorId) {
      throw new ForbiddenException('User is not a doctor');
    }

    // Vérifier si ce médecin est le médecin de famille du patient
    const isFamilyDoctor = await this.patientsService.isFamilyDoctor(
      patientId,
      doctorId,
    );

    if (!isFamilyDoctor) {
      throw new ForbiddenException(
        'You are not the family doctor of this patient',
      );
    }

    return true;
  }
}
