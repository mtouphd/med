import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyDoctorHistory } from './entities/family-doctor-history.entity';
import { FamilyDoctorHistoryService } from './history.service';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyDoctorHistory])],
  providers: [FamilyDoctorHistoryService],
  exports: [TypeOrmModule, FamilyDoctorHistoryService],
})
export class HistoryModule {}
