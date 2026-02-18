import { IsString, IsNotEmpty } from 'class-validator';

export class RejectAppointmentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
