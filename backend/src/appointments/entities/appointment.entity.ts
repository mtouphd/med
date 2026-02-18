import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Patient } from '../../patients/entities/patient.entity';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  doctorId: string;

  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ type: 'timestamp' })
  dateTime: Date;

  @Column({ default: 30 })
  duration: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  medications: string;

  // ========== WORKFLOW D'APPROBATION ==========
  @Column({ default: false })
  doctorApproved: boolean;

  @Column({ default: false })
  adminApproved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  doctorApprovedAt: Date;

  @Column({ nullable: true })
  doctorApprovedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctorApprovedBy' })
  doctorApprover: User;

  @Column({ type: 'timestamp', nullable: true })
  adminApprovedAt: Date;

  @Column({ nullable: true })
  adminApprovedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adminApprovedBy' })
  adminApprover: User;

  @Column({ type: 'text', nullable: true })
  doctorRejectionReason: string;

  @Column({ type: 'text', nullable: true })
  adminRejectionReason: string;

  @Column({ nullable: true })
  requestedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requestedBy' })
  requester: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
