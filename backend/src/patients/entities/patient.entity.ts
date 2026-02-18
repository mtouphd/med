import { Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  emergencyContact: string;

  // ========== MÉDECIN DE FAMILLE ==========
  @Column({ nullable: true })
  familyDoctorId: string;

  @ManyToOne('Doctor', 'familyPatients', { nullable: true })
  @JoinColumn({ name: 'familyDoctorId' })
  familyDoctor: any; // Type will be Doctor, using any to avoid circular dependency

  @Column({ type: 'timestamp', nullable: true })
  familyDoctorAssignedAt: Date;

  // ========== RELATIONS ==========
  @OneToOne('MedicalRecord', 'patient', { cascade: true })
  medicalRecord: any; // Type will be MedicalRecord

  @OneToMany('Appointment', 'patient')
  appointments: any[]; // Type will be Appointment[]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
