import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

interface SettingSeed {
  key: string;
  value: string;
  type: string;
  label: string;
  description: string;
  category: string;
}

const DEFAULT_SETTINGS: SettingSeed[] = [
  {
    key: 'max_appointments_per_day',
    value: '10',
    type: 'number',
    label: 'Nombre maximum de rendez-vous par jour',
    description:
      'Définit le nombre maximum de rendez-vous qu\'un médecin peut accepter par jour. Ce paramètre permet de garantir une qualité de service optimale pour chaque patient.',
    category: 'appointments',
  },
  {
    key: 'min_appointment_duration',
    value: '15',
    type: 'number',
    label: 'Durée minimale d\'un rendez-vous (minutes)',
    description:
      'Définit la durée minimale autorisée pour un rendez-vous médical. Ce seuil assure un temps de consultation suffisant pour un examen de qualité.',
    category: 'appointments',
  },
  {
    key: 'max_appointment_duration',
    value: '30',
    type: 'number',
    label: 'Durée maximale d\'un rendez-vous (minutes)',
    description:
      'Définit la durée maximale autorisée pour un rendez-vous médical. Ce plafond permet d\'optimiser la planification des consultations.',
    category: 'appointments',
  },
  {
    key: 'max_family_patients_per_doctor',
    value: '50',
    type: 'number',
    label: 'Nombre maximum de patients par médecin de famille',
    description:
      'Définit le nombre maximum de patients qu\'un médecin peut prendre en charge en tant que médecin de famille. Ce paramètre garantit un suivi personnalisé pour chaque patient.',
    category: 'family_doctor',
  },
];

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private settingsRepository: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.settingsRepository.findOne({
        where: { key: setting.key },
      });

      if (!existing) {
        await this.settingsRepository.save(
          this.settingsRepository.create(setting),
        );
      }
    }
  }

  async findAll(): Promise<SystemSetting[]> {
    return this.settingsRepository.find({
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<SystemSetting> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }

    return setting;
  }

  async update(key: string, value: string): Promise<SystemSetting> {
    const setting = await this.findByKey(key);
    setting.value = value;
    return this.settingsRepository.save(setting);
  }

  async getNumberValue(key: string): Promise<number> {
    const setting = await this.findByKey(key);
    return parseInt(setting.value, 10);
  }
}
