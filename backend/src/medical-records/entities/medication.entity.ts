import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum MedicationStatus {
  ACTIVE = 'ACTIVE',
  STOPPED = 'STOPPED',
  COMPLETED = 'COMPLETED',
}

@Entity('medications')
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  medicalRecordId: string;

  @ManyToOne(() => MedicalRecord, (record: any) => record.medications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord: MedicalRecord;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  dosage: string; // Ex: "500mg"

  @Column({ length: 100 })
  frequency: string; // Ex: "2x par jour"

  @Column({ length: 50, nullable: true })
  route: string; // Oral, IV, etc.

  @Column({
    type: 'enum',
    enum: MedicationStatus,
    default: MedicationStatus.ACTIVE,
  })
  status: MedicationStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  prescribedBy: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'prescribedBy' })
  prescribingDoctor: Doctor;

  @Column({ length: 255, nullable: true })
  forCondition: string; // Pour quelle condition

  @Column({ type: 'text', nullable: true })
  sideEffects: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
