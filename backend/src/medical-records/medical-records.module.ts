import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalCondition } from './entities/medical-condition.entity';
import { Allergy } from './entities/allergy.entity';
import { Medication } from './entities/medication.entity';
import { Vaccination } from './entities/vaccination.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      MedicalCondition,
      Allergy,
      Medication,
      Vaccination,
      Doctor,
    ]),
    PatientsModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
  exports: [MedicalRecordsService, TypeOrmModule],
})
export class MedicalRecordsModule {}
