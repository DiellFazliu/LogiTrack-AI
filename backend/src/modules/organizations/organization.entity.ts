// src/modules/organizations/organization.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Driver } from '../drivers/driver.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { Product } from '../products/product.entity';
import { Shipment } from '../shipments/shipment.entity';

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: PlanType, default: PlanType.FREE, name: 'plan_type' })
  planType!: PlanType;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL, name: 'subscription_status' })
  subscriptionStatus!: SubscriptionStatus;

  @Column({ name: 'subscription_ends_at', nullable: true })
  subscriptionEndsAt?: Date;

  @Column({ name: 'max_users', default: 5 })
  maxUsers!: number;

  @Column({ name: 'max_shipments_per_month', default: 100 })
  maxShipmentsPerMonth!: number;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  // ============================================
  // RELACIONET (MULTI-TENANCY)
  // ============================================
  
  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Driver, (driver) => driver.organization)
  drivers!: Driver[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.organization)
  vehicles!: Vehicle[];

  @OneToMany(() => Warehouse, (warehouse) => warehouse.organization)
  warehouses!: Warehouse[];

  @OneToMany(() => Product, (product) => product.organization)
  products!: Product[];

  @OneToMany(() => Shipment, (shipment) => shipment.organization)
  shipments!: Shipment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}