// backend/src/modules/drivers/location.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index 
} from 'typeorm';
import { Driver } from './driver.entity';

@Entity('driver_locations')
@Index(['driverId', 'createdAt'])
export class DriverLocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'driver_id', type: 'uuid' })
  driverId!: string;

  @ManyToOne(() => Driver, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver!: Driver;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude!: number;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}