import { IsUUID, IsString, IsOptional } from 'class-validator';

export class AssignFamilyDoctorDto {
  @IsUUID()
  doctorId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
