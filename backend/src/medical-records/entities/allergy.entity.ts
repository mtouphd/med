import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';

export enum AllergyType {
  MEDICATION = 'MEDICATION',
  FOOD = 'FOOD',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  OTHER = 'OTHER',
}

export enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  ANAPHYLACTIC = 'ANAPHYLACTIC',
}

@Entity('allergies')
export class Allergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  medicalRecordId: string;

  @ManyToOne(() => MedicalRecord, (record: any) => record.allergies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicalRecordId' })
  medicalRecord: MedicalRecord;

  @Column({ length: 255 })
  allergen: string; // Ex: "Pénicilline", "Arachides"

  @Column({
    type: 'enum',
    enum: AllergyType,
  })
  type: AllergyType;

  @Column({
    type: 'enum',
    enum: AllergySeverity,
  })
  severity: AllergySeverity;

  @Column({ type: 'text', nullable: true })
  reaction: string; // Description de la réaction

  @Column({ type: 'date', nullable: true })
  firstOccurrence: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
