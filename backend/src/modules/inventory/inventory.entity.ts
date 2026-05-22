import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Warehouse } from '../warehouses/warehouse.entity';
import { Product } from '../products/product.entity';

@Entity('inventory')
@Index(['warehouseId', 'productId'], { unique: true })
@Index(['warehouseId'])
@Index(['productId'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse, { eager: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ name: 'reserved_quantity', type: 'int', default: 0 })
  reservedQuantity!: number;

  @Column({ name: 'available_quantity', type: 'int', default: 0 })
  availableQuantity!: number;

  @Column({ name: 'min_stock', type: 'int', default: 0 })
  minStock!: number;

  @Column({ name: 'max_stock', type: 'int', nullable: true })
  maxStock!: number;

  @Column({ name: 'reorder_point', type: 'int', default: 10 })
  reorderPoint!: number;

  @Column({ name: 'last_restocked', type: 'timestamp', nullable: true })
  lastRestocked!: Date;

  @Column({ name: 'last_counted', type: 'timestamp', nullable: true })
  lastCounted!: Date;

  @Column({ name: 'location_in_warehouse', type: 'varchar', nullable: true })
  locationInWarehouse!: string;

  @Column({ name: 'batch_number', type: 'varchar', nullable: true })
  batchNumber!: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate!: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}