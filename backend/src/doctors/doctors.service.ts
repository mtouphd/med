import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorDto, UpdateDoctorSettingsDto } from './dto/doctor.dto';
import { SystemSettingsService } from '../system-settings/system-settings.service';

export interface DoctorSearchParams {
  city?: string;
  specialty?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km
}

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    private systemSettingsService: SystemSettingsService,
  ) {}

  async findAll() {
    return this.doctorsRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string) {
    const doctor = await this.doctorsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  async create(createDoctorDto: CreateDoctorDto) {
    const doctor = this.doctorsRepository.create(createDoctorDto);
    return this.doctorsRepository.save(doctor);
  }

  async update(id: string, updateDoctorDto: Partial<CreateDoctorDto>) {
    const doctor = await this.findOne(id);
    Object.assign(doctor, updateDoctorDto);

    // Auto-geocode if address fields changed and no explicit coords provided
    const hasAddressChange = updateDoctorDto.street !== undefined
      || updateDoctorDto.city !== undefined
      || updateDoctorDto.postalCode !== undefined
      || updateDoctorDto.country !== undefined;
    const hasExplicitCoords = updateDoctorDto.latitude !== undefined || updateDoctorDto.longitude !== undefined;

    if (hasAddressChange && !hasExplicitCoords) {
      const coords = await this.geocodeAddress(doctor.street, doctor.postalCode, doctor.city, doctor.country);
      if (coords) {
        doctor.latitude = coords.lat;
        doctor.longitude = coords.lng;
      }
    }

    return this.doctorsRepository.save(doctor);
  }

  async updateMyProfile(userId: string, dto: Partial<CreateDoctorDto>) {
    const doctor = await this.doctorsRepository.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return this.update(doctor.id, dto);
  }

  async searchDoctors(params: DoctorSearchParams): Promise<Doctor[]> {
    const qb = this.doctorsRepository.createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .where('doctor.isAvailable = :available', { available: true });

    if (params.city) {
      qb.andWhere('LOWER(doctor.city) LIKE :city', { city: `%${params.city.toLowerCase()}%` });
    }
    if (params.specialty) {
      qb.andWhere('LOWER(doctor.specialty) LIKE :specialty', { specialty: `%${params.specialty.toLowerCase()}%` });
    }
    if (params.lat != null && params.lng != null && params.radius) {
      qb.andWhere('doctor.latitude IS NOT NULL AND doctor.longitude IS NOT NULL')
        .andWhere(
          `(6371 * acos(LEAST(1.0, cos(radians(:lat)) * cos(radians(doctor.latitude)) * cos(radians(doctor.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(doctor.latitude))))) <= :radius`,
          { lat: params.lat, lng: params.lng, radius: params.radius },
        );
    }

    return qb.getMany();
  }

  private async geocodeAddress(street?: string, postalCode?: string, city?: string, country?: string): Promise<{ lat: number; lng: number } | null> {
    const parts = [street, postalCode, city, country].filter(Boolean);
    if (parts.length === 0) return null;
    try {
      const q = encodeURIComponent(parts.join(', '));
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MedApp/1.0 (medical-appointment-system)' },
      });
      const data = await res.json() as Array<{ lat: string; lon: string }>;
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {
      // Geocoding failed — coordinates remain null
    }
    return null;
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);
    await this.doctorsRepository.remove(doctor);
    return { message: 'Doctor deleted successfully' };
  }

  async updateSchedule(id: string, schedule: any) {
    const doctor = await this.findOne(id);
    doctor.schedule = schedule;
    return this.doctorsRepository.save(doctor);
  }

  async getSettings(userId: string) {
    const doctor = await this.doctorsRepository.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const [maxAppt, minDur, maxDur, maxFam] = await Promise.all([
      this.systemSettingsService.getNumberValue('max_appointments_per_day'),
      this.systemSettingsService.getNumberValue('min_appointment_duration'),
      this.systemSettingsService.getNumberValue('max_appointment_duration'),
      this.systemSettingsService.getNumberValue('max_family_patients_per_doctor'),
    ]);

    return {
      maxAppointmentsPerDay: doctor.maxAppointmentsPerDay,
      minAppointmentDuration: doctor.minAppointmentDuration,
      maxAppointmentDuration: doctor.maxAppointmentDuration,
      maxFamilyPatients: doctor.maxFamilyPatients,
      globals: {
        maxAppointmentsPerDay: maxAppt,
        minAppointmentDuration: minDur,
        maxAppointmentDuration: maxDur,
        maxFamilyPatients: maxFam,
      },
    };
  }

  async updateSettings(userId: string, dto: UpdateDoctorSettingsDto) {
    const doctor = await this.doctorsRepository.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    Object.assign(doctor, dto);
    await this.doctorsRepository.save(doctor);
    return this.getSettings(userId);
  }
}
