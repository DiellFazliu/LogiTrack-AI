import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { Shipment } from '../shipments/shipment.entity';

export enum VehicleType {
  TRUCK = 'truck',
  VAN = 'van',
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  TRAILER = 'trailer',
}

export enum FuelType {
  DIESEL = 'diesel',
  PETROL = 'petrol',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  LPG = 'lpg',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  OUT_OF_SERVICE = 'out_of_service',
}
@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, (organization) => organization.vehicles)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'license_plate', unique: true })
  licensePlate!: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.VAN })
  type!: VehicleType;

  @Column()
  brand!: string;

  @Column()
  model!: string;

  @Column()
  year!: number;

  @Column({ nullable: true })
  color?: string;

  @Column({ name: 'capacity_kg', default: 1000 })
  capacityKg!: number;

  @Column({ name: 'capacity_m3', default: 10 })
  capacityM3!: number;

  @Column({ name: 'fuel_type', default: 'diesel' })
  fuelType!: string;

  @Column({ name: 'fuel_consumption', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fuelConsumption?: number;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;

  @Column({ name: 'last_maintenance', type: 'date', nullable: true })
  lastMaintenance?: Date;

  @Column({ name: 'next_maintenance', type: 'date', nullable: true })
  nextMaintenance?: Date;

  @Column({ name: 'mileage_km', default: 0 })
  mileageKm!: number;

  @Column({ name: 'insurance_expiry', type: 'date', nullable: true })
  insuranceExpiry?: Date;

  @Column({ name: 'registration_expiry', type: 'date', nullable: true })
  registrationExpiry?: Date;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Shipment, (shipment) => shipment.vehicle)
  shipments!: Shipment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}