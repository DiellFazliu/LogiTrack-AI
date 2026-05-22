import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { Shipment } from '../shipments/shipment.entity';
import { Stop } from './stop.entity';

@Entity('routes')
export class Route {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'shipment_id',
  })
  shipmentId!: string;

  @ManyToOne(
    () => Shipment
  )
  @JoinColumn({
    name: 'shipment_id',
  })
  shipment!: Shipment;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  waypoints!: any;

  @Column({
    name: 'total_distance_km',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalDistanceKm!: number;

  @Column({
    name: 'total_duration_min',
    type: 'int',
    nullable: true,
  })
  totalDurationMin!: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  polyline!: string;

  @OneToMany(
    () => Stop,
    (stop: Stop) => stop.route,
  )
  stops!: Stop[];

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}