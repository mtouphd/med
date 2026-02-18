import { IsString, IsEnum, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { ConditionStatus, ConditionSeverity } from '../entities/medical-condition.entity';

export class CreateMedicalConditionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ConditionStatus)
  status: ConditionStatus;

  @IsOptional()
  @IsEnum(ConditionSeverity)
  severity?: ConditionSeverity;

  @IsOptional()
  @IsDateString()
  diagnosedDate?: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
