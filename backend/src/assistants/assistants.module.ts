import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assistant } from './entities/assistant.entity';
import { AssistantsService } from './assistants.service';
import { AssistantsController } from './assistants.controller';
import { DoctorsModule } from '../doctors/doctors.module';
import { UsersModule } from '../users/users.module';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assistant, Doctor, Patient]),
    forwardRef(() => DoctorsModule),
    UsersModule,
  ],
  controllers: [AssistantsController],
  providers: [AssistantsService],
  exports: [AssistantsService, TypeOrmModule],
})
export class AssistantsModule {}
