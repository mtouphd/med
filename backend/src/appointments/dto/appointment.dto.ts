import { IsString, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsString()
  doctorId: string;

  @IsDateString()
  dateTime: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  medications?: string;
}
