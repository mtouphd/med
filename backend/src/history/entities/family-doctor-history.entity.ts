import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { User } from '../../users/entities/user.entity';

export enum FamilyDoctorChangeType {
  ASSIGNED = 'ASSIGNED',  // Premier médecin assigné
  CHANGED = 'CHANGED',    // Changement de médecin
  REMOVED = 'REMOVED',    // Médecin retiré
}

@Entity('family_doctor_history')
export class FamilyDoctorHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  previousDoctorId: string;

  @ManyToOne(() => Doctor, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'previousDoctorId' })
  previousDoctor: Doctor;

  @Column({ nullable: true })
  newDoctorId: string;

  @ManyToOne(() => Doctor, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'newDoctorId' })
  newDoctor: Doctor;

  @Column({
    type: 'enum',
    enum: FamilyDoctorChangeType,
  })
  changeType: FamilyDoctorChangeType;

  @Column()
  changedBy: string; // userId de qui a fait le changement (admin)

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedBy' })
  changedByUser: User;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  changedAt: Date;
}
