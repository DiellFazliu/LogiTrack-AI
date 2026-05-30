import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Unique } from 'typeorm';

export enum DriverStatus {
  AVAILABLE = 'available',
  ON_DUTY = 'on_duty',
  ON_BREAK = 'on_break',
  OFF_DUTY = 'off_duty',
  SICK = 'sick',
  VACATION = 'vacation'
}
@Entity('drivers')
@Unique(['userId'])
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (organization) => organization.drivers)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'license_number', unique: true })
  licenseNumber!: string;

  @Column()
  phone!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.AVAILABLE })
  status!: DriverStatus;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating!: number;

  @Column({ name: 'total_deliveries', default: 0 })
  totalDeliveries!: number;

  @Column({ name: 'hire_date', type: 'date', default: () => 'CURRENT_DATE' })
  hireDate!: Date;

  @Column({ name: 'emergency_contact', nullable: true })
  emergencyContact?: string;

  @Column({ name: 'emergency_phone', nullable: true })
  emergencyPhone?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Shipment, (shipment) => shipment.driver)
  shipments!: Shipment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}