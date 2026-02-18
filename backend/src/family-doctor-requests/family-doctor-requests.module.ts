import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyDoctorRequestsService } from './family-doctor-requests.service';
import { FamilyDoctorRequestsController } from './family-doctor-requests.controller';
import { FamilyDoctorRequest } from './entities/family-doctor-request.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyDoctorRequest, Patient, Doctor])],
  controllers: [FamilyDoctorRequestsController],
  providers: [FamilyDoctorRequestsService],
  exports: [FamilyDoctorRequestsService],
})
export class FamilyDoctorRequestsModule {}
