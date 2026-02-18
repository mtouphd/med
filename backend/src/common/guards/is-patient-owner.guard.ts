import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PatientsService } from '../../patients/patients.service';

/**
 * Guard: Vérifie que l'utilisateur connecté est le propriétaire du profil patient
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, IsPatientOwnerGuard)
 * @Get('patients/:patientId/...')
 *
 * Attendu dans la requête:
 * - user.id (ID de l'utilisateur connecté)
 * - params.patientId (ID du patient)
 */
@Injectable()
export class IsPatientOwnerGuard implements CanActivate {
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

    // Récupérer le patient
    const patient = await this.patientsService.findOne(patientId);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (patient.userId !== user.id) {
      throw new ForbiddenException('You can only access your own patient profile');
    }

    return true;
  }
}
