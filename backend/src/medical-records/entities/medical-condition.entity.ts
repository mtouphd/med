import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum ConditionStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  CHRONIC = 'CHRONIC',
  MANAGED = 'MANAGED',
}

export enum ConditionSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL',
}

@Entity('medical_conditions')
export class MedicalCondition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  medicalRecordId: string;

  @ManyToOne(() => MedicalRecord, (record: any) => record.conditions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord: MedicalRecord;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ConditionStatus,
    default: ConditionStatus.ACTIVE,
  })
  status: ConditionStatus;

  @Column({
    type: 'enum',
    enum: ConditionSeverity,
    nullable: true,
  })
  severity: ConditionSeverity;

  @Column({ type: 'date', nullable: true })
  diagnosedDate: Date;

  @Column({ type: 'date', nullable: true })
  resolvedDate: Date;

  @Column({ nullable: true })
  diagnosedBy: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'diagnosedBy' })
  diagnosingDoctor: Doctor;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
