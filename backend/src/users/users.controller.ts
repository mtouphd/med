import { Controller, Get, Post, Param, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { PatientsService } from '../patients/patients.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private patientsService: PatientsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async create(@Body() createUserDto: any) {
    const user = await this.usersService.create(createUserDto);
    if (createUserDto.role === 'PATIENT') {
      await this.patientsService.createFromUser(user.id);
    }
    return user;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
