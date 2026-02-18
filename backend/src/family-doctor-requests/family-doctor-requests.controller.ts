import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FamilyDoctorRequestsService } from './family-doctor-requests.service';
import {
  CreateFamilyDoctorRequestDto,
  RespondToRequestDto,
} from './dto/family-doctor-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/entities/doctor.entity';

@Controller('family-doctor-requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FamilyDoctorRequestsController {
  constructor(
    private readonly familyDoctorRequestsService: FamilyDoctorRequestsService,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  @Post()
  @Roles(UserRole.PATIENT)
  create(
    @Body() createDto: CreateFamilyDoctorRequestDto,
    @Request() req,
  ) {
    return this.familyDoctorRequestsService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.familyDoctorRequestsService.findAll();
  }

  @Get('my')
  @Roles(UserRole.PATIENT)
  findMyRequests(@Request() req) {
    return this.familyDoctorRequestsService.findMyRequests(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PATIENT)
  findOne(@Param('id') id: string) {
    return this.familyDoctorRequestsService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id') id: string,
    @Body() dto: RespondToRequestDto,
    @Request() req,
  ) {
    return this.familyDoctorRequestsService.approve(id, req.user.id, dto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  reject(
    @Param('id') id: string,
    @Body() dto: RespondToRequestDto,
    @Request() req,
  ) {
    return this.familyDoctorRequestsService.reject(id, req.user.id, dto);
  }

  // Doctor endpoints
  @Get('doctor/my-requests')
  @Roles(UserRole.DOCTOR)
  async getMyDoctorRequests(@Request() req) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return [];
    }

    return this.familyDoctorRequestsService.getDoctorRequests(doctor.id);
  }

  @Patch(':id/approve/doctor')
  @Roles(UserRole.DOCTOR)
  async approveByDoctor(
    @Param('id') id: string,
    @Body() dto: RespondToRequestDto,
    @Request() req,
  ) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      throw new Error('Doctor profile not found');
    }

    return this.familyDoctorRequestsService.approveByDoctor(id, doctor.id, req.user.id, dto);
  }

  @Patch(':id/reject/doctor')
  @Roles(UserRole.DOCTOR)
  async rejectByDoctor(
    @Param('id') id: string,
    @Body() dto: RespondToRequestDto,
    @Request() req,
  ) {
    const doctor = await this.doctorsRepository.findOne({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      throw new Error('Doctor profile not found');
    }

    return this.familyDoctorRequestsService.rejectByDoctor(id, doctor.id, req.user.id, dto);
  }
}
