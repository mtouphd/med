import { IsString, IsOptional, IsDateString, IsObject, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  role: string;
}

export class CreatePatientDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateUserDto)
  user?: CreateUserDto;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
}
