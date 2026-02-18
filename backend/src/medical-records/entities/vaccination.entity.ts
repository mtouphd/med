import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('vaccinations')
export class Vaccination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  medicalRecordId: string;

  @ManyToOne(() => MedicalRecord, (record: any) => record.vaccinations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord: MedicalRecord;

  @Column({ length: 255 })
  name: string; // Ex: "COVID-19", "Grippe"

  @Column({ type: 'date' })
  dateGiven: Date;

  @Column({ length: 100, nullable: true })
  manufacturer: string; // Ex: "Pfizer"

  @Column({ length: 100, nullable: true })
  lotNumber: string;

  @Column({ nullable: true })
  administeredBy: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'administeredBy' })
  administeringDoctor: Doctor;

  @Column({ type: 'date', nullable: true })
  nextDoseDate: Date; // Date du rappel

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
