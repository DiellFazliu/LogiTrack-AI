// backend/src/modules/ai/ai-optimization.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shipment } from '../shipments/shipment.entity';

@Entity('ai_optimizations')
export class AiOptimization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'shipment_id', type: 'uuid' })
  shipmentId!: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;

  @Column({ name: 'original_route', type: 'jsonb', nullable: true })  // ✅ emri i saktë
  originalRoute!: any;

  @Column({ name: 'optimized_route', type: 'jsonb', nullable: true })  // ✅ emri i saktë
  optimizedRoute!: any;

@Column({ 
  name: 'saved_distance_km', 
  type: 'decimal', 
  precision: 12,  // ✅ Rrit precision-in
  scale: 4,       // ✅ Rrit scale-in
  nullable: true 
})
savedDistanceKm!: number | null;

  @Column({ name: 'saved_time_min', type: 'int', nullable: true })
  savedTimeMin!: number | null;

@Column({ 
  name: 'confidence_score', 
  type: 'decimal', 
  precision: 5,   // ✅ Rrit precision-in
  scale: 2,       // ✅ Rrit scale-in
  nullable: true 
})
confidenceScore!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}