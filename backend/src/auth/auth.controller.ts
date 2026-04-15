import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Doctor } from '../doctors/entities/doctor.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }

  /**
   * Public endpoint — list of doctors for assistant registration form
   */
  @Get('doctors')
  async getPublicDoctors() {
    const docs = await this.doctorsRepository.find({
      relations: ['user'],
      where: { isAvailable: true },
    });
    return docs.map((d) => ({
      id: d.id,
      firstName: d.user?.firstName,
      lastName: d.user?.lastName,
      specialty: d.specialty,
    }));
  }
}
