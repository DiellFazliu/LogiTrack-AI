import {
  Entity,
  Column,
 PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Shipment } from '../shipments/shipment.entity';
import { Driver } from '../drivers/driver.entity';
import { User } from '../users/user.entity';

@Entity('reviews')
export class Review {

 @PrimaryGeneratedColumn('uuid')
 id!: string;

 @Column({
   name:'shipment_id'
 })
 shipmentId!: string;

 @ManyToOne(
   ()=>Shipment
 )
 @JoinColumn({
   name:'shipment_id'
 })
 shipment!: Shipment;

 @Column({
   name:'driver_id',
   nullable:true
 })
 driverId!: string;

 @ManyToOne(
   ()=>Driver
 )
 @JoinColumn({
   name:'driver_id'
 })
 driver!: Driver;

 @Column({
   type:'int'
 })
 rating!: number;

 @Column({
   type:'text',
   nullable:true
 })
 comment!: string;

 @Column({
   name:'created_by',
   nullable:true
 })
 createdBy!: string;

 @ManyToOne(
   ()=>User
 )
 @JoinColumn({
   name:'created_by'
 })
 reviewer!: User;

 @CreateDateColumn({
   name:'created_at'
 })
 createdAt!: Date;

}