import { IsUUID, IsDateString, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsDateString()
  dateTime: string;

  @IsInt()
  @Min(15)
  @Max(240)
  duration: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
