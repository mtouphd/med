import { IsString, IsOptional, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class CreateAssistantDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  doctorIds?: string[];
}

export class CreateAssistantWithUserDto {
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  doctorIds?: string[];
}

export class UpdateAssistantDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignDoctorDto {
  @IsUUID()
  doctorId: string;
}

export class AssignAssistantDto {
  @IsUUID()
  assistantId: string;
}
