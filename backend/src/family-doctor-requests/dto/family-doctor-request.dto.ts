import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { FamilyDoctorRequestStatus } from '../entities/family-doctor-request.entity';

export class CreateFamilyDoctorRequestDto {
  @IsString()
  doctorId: string;

  @IsOptional()
  @IsString()
  requestReason?: string;
}

export class RespondToRequestDto {
  @IsOptional()
  @IsString()
  responseReason?: string;
}

export class UpdateFamilyDoctorRequestDto {
  @IsOptional()
  @IsEnum(FamilyDoctorRequestStatus)
  status?: FamilyDoctorRequestStatus;

  @IsOptional()
  @IsString()
  responseReason?: string;
}
