import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  patientId: string;

  @OneToOne(() => Patient, (patient) => patient.medicalRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  // ========== INFORMATIONS GÉNÉRALES ==========
  @Column({ nullable: true, length: 5 })
  bloodType: string; // A+, O-, AB+, etc.

  @Column({ type: 'int', nullable: true })
  height: number; // cm

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number; // kg

  @Column({ nullable: true, default: null })
  organDonor: boolean;

  @Column({ type: 'text', nullable: true })
  generalNotes: string;

  // ========== RELATIONS ==========
  @OneToMany('MedicalCondition', 'medicalRecord', { cascade: true })
  conditions: any[]; // Type will be MedicalCondition[]

  @OneToMany('Allergy', 'medicalRecord', { cascade: true })
  allergies: any[]; // Type will be Allergy[]

  @OneToMany('Medication', 'medicalRecord', { cascade: true })
  medications: any[]; // Type will be Medication[]

  @OneToMany('Vaccination', 'medicalRecord', { cascade: true })
  vaccinations: any[]; // Type will be Vaccination[]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
