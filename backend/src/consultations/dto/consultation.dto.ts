import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateConsultationDto {
  @IsUUID()
  appointmentId: string;

  @IsOptional() @IsString()
  chiefComplaint?: string;

  @IsOptional() @IsString()
  diagnosis?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  treatment?: string;

  @IsOptional() @IsString()
  prescriptions?: string;

  @IsOptional() @IsDateString()
  followUpDate?: string;

  @IsOptional() @IsString()
  followUpNotes?: string;
}

export class UpdateConsultationDto {
  @IsOptional() @IsString()
  chiefComplaint?: string;

  @IsOptional() @IsString()
  diagnosis?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  treatment?: string;

  @IsOptional() @IsString()
  prescriptions?: string;

  @IsOptional() @IsDateString()
  followUpDate?: string;

  @IsOptional() @IsString()
  followUpNotes?: string;
}
