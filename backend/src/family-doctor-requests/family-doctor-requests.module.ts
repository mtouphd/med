import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyDoctorRequestsService } from './family-doctor-requests.service';
import { FamilyDoctorRequestsController } from './family-doctor-requests.controller';
import { FamilyDoctorRequest } from './entities/family-doctor-request.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FamilyDoctorRequest, Patient, Doctor]),
    SystemSettingsModule,
  ],
  controllers: [FamilyDoctorRequestsController],
  providers: [FamilyDoctorRequestsService],
  exports: [FamilyDoctorRequestsService],
})
export class FamilyDoctorRequestsModule {}
