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
  street?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

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

export class UpdateDoctorSettingsDto {
  @IsOptional()
  @IsNumber()
  maxAppointmentsPerDay?: number | null;

  @IsOptional()
  @IsNumber()
  minAppointmentDuration?: number | null;

  @IsOptional()
  @IsNumber()
  maxAppointmentDuration?: number | null;

  @IsOptional()
  @IsNumber()
  maxFamilyPatients?: number | null;
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
  street?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

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
  @IsNumber()
  maxAppointmentsPerDay?: number | null;

  @IsOptional()
  @IsNumber()
  minAppointmentDuration?: number | null;

  @IsOptional()
  @IsNumber()
  maxAppointmentDuration?: number | null;

  @IsOptional()
  @IsObject()
  schedule?: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
}
