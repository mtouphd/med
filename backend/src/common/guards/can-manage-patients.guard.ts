import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard: Vérifie que l'utilisateur peut gérer les patients
 *
 * Autorisations:
 * - ADMIN: Peut gérer tous les patients (assigner/retirer médecin de famille, etc.)
 * - DOCTOR/PATIENT: Accès refusé
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, CanManagePatientsGuard)
 * @Post('patients/:patientId/family-doctor')
 *
 * Implémente les règles métier:
 * - BR-MF-001: Seul admin peut assigner médecin de famille
 * - BR-MF-002: Seul admin peut changer médecin de famille
 * - BR-MF-003: Seul admin peut retirer médecin de famille
 *
 * Attendu dans la requête:
 * - user.role (rôle de l'utilisateur)
 */
@Injectable()
export class CanManagePatientsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Injecté par JwtAuthGuard

    if (!user || !user.role) {
      throw new ForbiddenException('User not authenticated');
    }

    // Seul ADMIN peut gérer les patients
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can manage patients',
      );
    }

    return true;
  }
}
