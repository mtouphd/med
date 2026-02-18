import { IsString, IsOptional } from 'class-validator';

export class RemoveFamilyDoctorDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
