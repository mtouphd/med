import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum AffiliationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('assistants')
export class Assistant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string; // e.g., "Secrétaire médicale", "Infirmière"

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: true })
  isActive: boolean;

  // Affiliation request made during registration
  @Column({ nullable: true })
  requestedDoctorId: string;

  @Column({
    type: 'enum',
    enum: AffiliationStatus,
    default: AffiliationStatus.PENDING,
  })
  affiliationStatus: AffiliationStatus;

  // Many-to-many relationship with doctors
  @ManyToMany(() => Doctor, (doctor) => doctor.assistants, { eager: true })
  @JoinTable({
    name: 'doctor_assistants',
    joinColumn: { name: 'assistantId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'doctorId', referencedColumnName: 'id' },
  })
  doctors: Doctor[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
