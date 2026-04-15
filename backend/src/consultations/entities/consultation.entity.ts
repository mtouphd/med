import {
  Entity, Column, PrimaryGeneratedColumn,
  OneToOne, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Lien 1:1 avec le rendez-vous */
  @Column({ unique: true })
  appointmentId: string;

  @OneToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

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

  /** Motif de la consultation (repris du RDV) */
  @Column({ type: 'text', nullable: true })
  chiefComplaint: string;

  /** Diagnostic posé */
  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  /** Observations et notes cliniques */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /** Plan de traitement */
  @Column({ type: 'text', nullable: true })
  treatment: string;

  /** Ordonnance / médicaments prescrits (texte libre) */
  @Column({ type: 'text', nullable: true })
  prescriptions: string;

  /** Date de suivi recommandée */
  @Column({ type: 'date', nullable: true })
  followUpDate: Date;

  /** Instructions de suivi */
  @Column({ type: 'text', nullable: true })
  followUpNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
