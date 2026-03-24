import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, ManyToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Assistant } from '../../assistants/entities/assistant.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  specialty: string;

  @Column()
  licenseNumber: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @Column({ default: 30 })
  consultationDuration: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  schedule: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };

  // ========== LIMITE PATIENTS DE FAMILLE ==========
  @Column({ nullable: true, default: null })
  maxFamilyPatients: number;

  // ========== RELATIONS ==========
  @OneToMany('Patient', 'familyDoctor')
  familyPatients: any[]; // Type will be Patient[]

  @OneToMany('Appointment', 'doctor')
  appointments: any[]; // Type will be Appointment[]

  @ManyToMany(() => Assistant, (assistant) => assistant.doctors)
  assistants: Assistant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
