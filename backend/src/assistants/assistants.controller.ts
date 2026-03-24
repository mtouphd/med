import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssistantsService } from './assistants.service';
import {
  CreateAssistantDto,
  CreateAssistantWithUserDto,
  UpdateAssistantDto,
  AssignDoctorDto,
  AssignAssistantDto,
} from './dto/assistant.dto';
import { UsersService } from '../users/users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/entities/doctor.entity';

@Controller('assistants')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AssistantsController {
  constructor(
    private assistantsService: AssistantsService,
    private usersService: UsersService,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  /**
   * GET /assistants
   * Get all assistants (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.assistantsService.findAll();
  }

  /**
   * POST /assistants
   * Create a new assistant with or without user creation
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async create(@Body() createAssistantDto: CreateAssistantDto | CreateAssistantWithUserDto) {
    if ('user' in createAssistantDto) {
      // Create user first with ASSISTANT role
      const user = await this.usersService.create({
        ...createAssistantDto.user,
        role: UserRole.ASSISTANT,
      });

      const assistantData: CreateAssistantDto = {
        userId: user.id,
        title: createAssistantDto.title,
        bio: createAssistantDto.bio,
        doctorIds: createAssistantDto.doctorIds,
      };
      return this.assistantsService.create(assistantData);
    }
    return this.assistantsService.create(createAssistantDto as CreateAssistantDto);
  }

  // ==================== ME ROUTES ====================

  /**
   * GET /assistants/me
   * Get current assistant's profile
   */
  @Get('me')
  @Roles(UserRole.ASSISTANT)
  async getMyProfile(@Request() req) {
    return this.assistantsService.findByUserId(req.user.id);
  }

  /**
   * GET /assistants/me/doctors
   * Get doctors assigned to current assistant
   */
  @Get('me/doctors')
  @Roles(UserRole.ASSISTANT)
  async getMyDoctors(@Request() req) {
    const assistant = await this.assistantsService.findByUserId(req.user.id);
    if (!assistant) {
      return [];
    }
    return assistant.doctors;
  }

  // ==================== :ID ROUTES ====================

  /**
   * GET /assistants/:id
   * Get assistant by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.ASSISTANT)
  findOne(@Param('id') id: string) {
    return this.assistantsService.findOne(id);
  }

  /**
   * PUT /assistants/:id
   * Update assistant
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  update(@Param('id') id: string, @Body() updateAssistantDto: UpdateAssistantDto) {
    return this.assistantsService.update(id, updateAssistantDto);
  }

  /**
   * DELETE /assistants/:id
   * Delete assistant
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  remove(@Param('id') id: string) {
    return this.assistantsService.remove(id);
  }

  /**
   * GET /assistants/:id/doctors
   * Get all doctors for an assistant
   */
  @Get(':id/doctors')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.ASSISTANT)
  getDoctors(@Param('id') id: string) {
    return this.assistantsService.getDoctorsForAssistant(id);
  }

  /**
   * POST /assistants/:id/doctors
   * Assign assistant to a doctor
   */
  @Post(':id/doctors')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  assignToDoctor(@Param('id') id: string, @Body() body: AssignDoctorDto) {
    return this.assistantsService.assignToDoctor(id, body.doctorId);
  }

  /**
   * DELETE /assistants/:id/doctors/:doctorId
   * Remove assistant from a doctor
   */
  @Delete(':id/doctors/:doctorId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  removeFromDoctor(@Param('id') id: string, @Param('doctorId') doctorId: string) {
    return this.assistantsService.removeFromDoctor(id, doctorId);
  }
}
