import { IsString, IsEnum, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { AllergyType, AllergySeverity } from '../entities/allergy.entity';

export class CreateAllergyDto {
  @IsString()
  @IsNotEmpty()
  allergen: string;

  @IsEnum(AllergyType)
  type: AllergyType;

  @IsEnum(AllergySeverity)
  severity: AllergySeverity;

  @IsOptional()
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsDateString()
  firstOccurrence?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
