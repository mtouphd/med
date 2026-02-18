import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  userId: string;

  @IsString()
  specialty: string;

  @IsString()
  licenseNumber: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  consultationDuration?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  maxFamilyPatients?: number;

  @IsOptional()
  @IsObject()
  schedule?: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
}

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  consultationDuration?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  maxFamilyPatients?: number;

  @IsOptional()
  @IsObject()
  schedule?: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
}
