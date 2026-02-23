import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  value: string;

  @Column({ default: 'number' })
  type: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  category: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
