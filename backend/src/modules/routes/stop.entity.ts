import {
 Entity,
 Column,
 PrimaryGeneratedColumn,
 ManyToOne,
 JoinColumn
} from 'typeorm';

import { Route } from './routes.entity';

@Entity('stops')
export class Stop {

 @PrimaryGeneratedColumn('uuid')
 id!: string;

 @Column({
   name:'route_id'
 })
 routeId!: string;

 @ManyToOne(
   ()=>Route,
   route=>route.stops
 )
 @JoinColumn({
   name:'route_id'
 })
 route!: Route;

 @Column({
   name:'sequence_number',
   type:'int'
 })
 sequenceNumber!: number;

 @Column({
   type:'text'
 })
 address!: string;

 @Column({
   type:'decimal',
   precision:10,
   scale:8,
   nullable:true
 })
 latitude!: number;

 @Column({
   type:'decimal',
   precision:11,
   scale:8,
   nullable:true
 })
 longitude!: number;

 @Column({
   name:'estimated_arrival',
   type:'timestamp',
   nullable:true
 })
 estimatedArrival!: Date;

 @Column({
   name:'actual_arrival',
   type:'timestamp',
   nullable:true
 })
 actualArrival!: Date;

 @Column({
   name:'stop_duration_min',
   type:'int',
   nullable:true
 })
 stopDurationMin!: number;

 @Column({
   default:'pending'
 })
 status!: string;
}