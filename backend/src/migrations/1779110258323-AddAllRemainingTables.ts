import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddAllRemainingTables1779110258323 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. ENUM TYPES
    // ============================================
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."shipments_status_enum" AS ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."drivers_status_enum" AS ENUM('available', 'on_duty', 'on_break', 'off_duty', 'sick', 'vacation');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."vehicles_status_enum" AS ENUM('available', 'in_use', 'maintenance', 'repair', 'out_of_service');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."vehicles_type_enum" AS ENUM('truck', 'van', 'motorcycle', 'car', 'trailer');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."invoice_status_enum" AS ENUM('pending', 'paid', 'overdue', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."payment_method_enum" AS ENUM('cash', 'card', 'bank_transfer', 'online');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."notification_type_enum" AS ENUM('email', 'sms', 'push', 'in_app');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // ============================================
    // 2. drivers
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'drivers',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'user_id', type: 'uuid', isNullable: true },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'license_number', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'phone', type: 'varchar', isNullable: false },
        { name: 'address', type: 'text', isNullable: true },
        { name: 'status', type: 'enum', enum: ['available', 'on_duty', 'on_break', 'off_duty', 'sick', 'vacation'], default: "'available'" },
        { name: 'rating', type: 'decimal', precision: 2, scale: 1, default: 0 },
        { name: 'total_deliveries', type: 'int', default: 0 },
        { name: 'hire_date', type: 'date', default: 'CURRENT_DATE' },
        { name: 'emergency_contact', type: 'varchar', isNullable: true },
        { name: 'emergency_phone', type: 'varchar', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 3. vehicles
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'vehicles',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'license_plate', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'type', type: 'enum', enum: ['truck', 'van', 'motorcycle', 'car', 'trailer'], default: "'van'" },
        { name: 'brand', type: 'varchar', isNullable: false },
        { name: 'model', type: 'varchar', isNullable: false },
        { name: 'year', type: 'int', isNullable: false },
        { name: 'color', type: 'varchar', isNullable: true },
        { name: 'capacity_kg', type: 'int', default: 1000 },
        { name: 'capacity_m3', type: 'int', default: 10 },
        { name: 'fuel_type', type: 'varchar', default: "'diesel'" },
        { name: 'fuel_consumption', type: 'decimal', precision: 5, scale: 2, isNullable: true },
        { name: 'status', type: 'enum', enum: ['available', 'in_use', 'maintenance', 'repair', 'out_of_service'], default: "'available'" },
        { name: 'last_maintenance', type: 'date', isNullable: true },
        { name: 'next_maintenance', type: 'date', isNullable: true },
        { name: 'mileage_km', type: 'int', default: 0 },
        { name: 'insurance_expiry', type: 'date', isNullable: true },
        { name: 'registration_expiry', type: 'date', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 4. warehouses
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'warehouses',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'name', type: 'varchar', isNullable: false },
        { name: 'address', type: 'text', isNullable: false },
        { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
        { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
        { name: 'capacity_sqm', type: 'int', isNullable: true },
        { name: 'manager_name', type: 'varchar', isNullable: true },
        { name: 'manager_phone', type: 'varchar', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 5. products
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'products',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'sku', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'name', type: 'varchar', isNullable: false },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'category', type: 'varchar', isNullable: true },
        { name: 'weight_kg', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'volume_m3', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'hazardous', type: 'boolean', default: false },
        { name: 'fragile', type: 'boolean', default: false },
        { name: 'image_url', type: 'varchar', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 6. inventory
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'inventory',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'warehouse_id', type: 'uuid', isNullable: false },
        { name: 'product_id', type: 'uuid', isNullable: false },
        { name: 'quantity', type: 'int', default: 0 },
        { name: 'reserved_quantity', type: 'int', default: 0 },
        { name: 'min_stock', type: 'int', default: 0 },
        { name: 'max_stock', type: 'int', isNullable: true },
        { name: 'last_restocked', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 7. shipments
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'shipments',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'tracking_number', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'customer_id', type: 'uuid', isNullable: false },
        { name: 'driver_id', type: 'uuid', isNullable: true },
        { name: 'vehicle_id', type: 'uuid', isNullable: true },
        { name: 'pickup_address', type: 'text', isNullable: false },
        { name: 'pickup_latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
        { name: 'pickup_longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
        { name: 'pickup_warehouse_id', type: 'uuid', isNullable: true },
        { name: 'delivery_address', type: 'text', isNullable: false },
        { name: 'delivery_latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
        { name: 'delivery_longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
        { name: 'status', type: 'enum', enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'], default: "'pending'" },
        { name: 'weight_kg', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'volume_m3', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'estimated_distance_km', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'estimated_duration_min', type: 'int', isNullable: true },
        { name: 'estimated_delivery', type: 'timestamp', isNullable: true },
        { name: 'actual_delivery', type: 'timestamp', isNullable: true },
        { name: 'picked_up_at', type: 'timestamp', isNullable: true },
        { name: 'delivery_photo', type: 'varchar', isNullable: true },
        { name: 'delivery_signature', type: 'text', isNullable: true },
        { name: 'notes', type: 'text', isNullable: true },
        { name: 'priority', type: 'varchar', default: "'normal'" },
        { name: 'is_express', type: 'boolean', default: false },
        { name: 'created_by', type: 'uuid', isNullable: false },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 8. shipment_status_history
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'shipment_status_history',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'shipment_id', type: 'uuid', isNullable: false },
        { name: 'status', type: 'varchar', isNullable: false },
        { name: 'location', type: 'varchar', isNullable: true },
        { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
        { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
        { name: 'notes', type: 'text', isNullable: true },
        { name: 'changed_by', type: 'uuid', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 9. waybills
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'waybills',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'shipment_id', type: 'uuid', isNullable: false },
        { name: 'waybill_number', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'pdf_url', type: 'varchar', isNullable: true },
        { name: 'qr_code', type: 'text', isNullable: true },
        { name: 'signature', type: 'text', isNullable: true },
        { name: 'signed_at', type: 'timestamp', isNullable: true },
        { name: 'generated_by', type: 'uuid', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 10. tracking_history
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'tracking_history',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'shipment_id', type: 'uuid', isNullable: false },
        { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
        { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
        { name: 'address', type: 'text', isNullable: true },
        { name: 'speed', type: 'decimal', precision: 5, scale: 2, isNullable: true },
        { name: 'heading', type: 'int', isNullable: true },
        { name: 'tracked_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 11. ai_optimizations
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'ai_optimizations',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'shipment_id', type: 'uuid', isNullable: false },
        { name: 'original_route', type: 'jsonb', isNullable: true },
        { name: 'optimized_route', type: 'jsonb', isNullable: true },
        { name: 'saved_distance_km', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'saved_time_min', type: 'int', isNullable: true },
        { name: 'confidence_score', type: 'decimal', precision: 3, scale: 2, isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 12. reports
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'reports',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'type', type: 'varchar', isNullable: false },
        { name: 'title', type: 'varchar', isNullable: true },
        { name: 'data', type: 'jsonb', isNullable: true },
        { name: 'generated_by', type: 'uuid', isNullable: true },
        { name: 'file_url', type: 'varchar', isNullable: true },
        { name: 'generated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 13. notifications
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'notifications',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'user_id', type: 'uuid', isNullable: false },
        { name: 'type', type: 'enum', enum: ['email', 'sms', 'push', 'in_app'], default: "'in_app'" },
        { name: 'title', type: 'varchar', isNullable: true },
        { name: 'message', type: 'text', isNullable: false },
        { name: 'data', type: 'jsonb', isNullable: true },
        { name: 'is_read', type: 'boolean', default: false },
        { name: 'read_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 14. invoices
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'invoices',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'shipment_id', type: 'uuid', isNullable: true },
        { name: 'invoice_number', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
        { name: 'tax', type: 'decimal', precision: 10, scale: 2, default: 0 },
        { name: 'total_amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
        { name: 'status', type: 'enum', enum: ['pending', 'paid', 'overdue', 'cancelled'], default: "'pending'" },
        { name: 'due_date', type: 'date', isNullable: true },
        { name: 'paid_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 15. payments
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'payments',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'invoice_id', type: 'uuid', isNullable: false },
        { name: 'amount', type: 'decimal', precision: 10, scale: 2, isNullable: false },
        { name: 'method', type: 'enum', enum: ['cash', 'card', 'bank_transfer', 'online'], default: "'card'" },
        { name: 'transaction_id', type: 'varchar', isNullable: true },
        { name: 'status', type: 'varchar', default: "'pending'" },
        { name: 'paid_at', type: 'timestamp', default: 'now()' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 16. reviews
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'reviews',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'shipment_id', type: 'uuid', isNullable: false },
        { name: 'driver_id', type: 'uuid', isNullable: true },
        { name: 'rating', type: 'int', isNullable: false },
        { name: 'comment', type: 'text', isNullable: true },
        { name: 'created_by', type: 'uuid', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 17. routes
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'routes',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'shipment_id', type: 'uuid', isNullable: false },
        { name: 'waypoints', type: 'jsonb', isNullable: true },
        { name: 'total_distance_km', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'total_duration_min', type: 'int', isNullable: true },
        { name: 'polyline', type: 'text', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 18. stops
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'stops',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'route_id', type: 'uuid', isNullable: false },
        { name: 'sequence_number', type: 'int', isNullable: false },
        { name: 'address', type: 'text', isNullable: false },
        { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
        { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
        { name: 'estimated_arrival', type: 'timestamp', isNullable: true },
        { name: 'actual_arrival', type: 'timestamp', isNullable: true },
        { name: 'stop_duration_min', type: 'int', isNullable: true },
        { name: 'status', type: 'varchar', default: "'pending'" },
      ],
    }), true);

    // ============================================
    // 19. returns
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'returns',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'original_shipment_id', type: 'uuid', isNullable: false },
        { name: 'return_reason', type: 'varchar', isNullable: true },
        { name: 'return_status', type: 'varchar', default: "'requested'" },
        { name: 'pickup_scheduled', type: 'date', isNullable: true },
        { name: 'returned_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 20. documents
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'documents',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'shipment_id', type: 'uuid', isNullable: false },
        { name: 'document_type', type: 'varchar', isNullable: false },
        { name: 'file_name', type: 'varchar', isNullable: true },
        { name: 'file_url', type: 'varchar', isNullable: true },
        { name: 'uploaded_by', type: 'uuid', isNullable: true },
        { name: 'uploaded_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 21. settings
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'settings',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: true },
        { name: 'key', type: 'varchar', isNullable: false },
        { name: 'value', type: 'text', isNullable: true },
        { name: 'data_type', type: 'varchar', default: "'string'" },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // FOREIGN KEYS
    // ============================================
    await queryRunner.createForeignKey('drivers', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('drivers', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('vehicles', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('warehouses', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('products', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('inventory', new TableForeignKey({
      columnNames: ['warehouse_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'warehouses',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('inventory', new TableForeignKey({
      columnNames: ['product_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'products',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('shipments', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('shipments', new TableForeignKey({
      columnNames: ['customer_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'RESTRICT',
    }));

    await queryRunner.createForeignKey('shipments', new TableForeignKey({
      columnNames: ['driver_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'drivers',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('shipments', new TableForeignKey({
      columnNames: ['vehicle_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'vehicles',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('shipments', new TableForeignKey({
      columnNames: ['pickup_warehouse_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'warehouses',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('shipments', new TableForeignKey({
      columnNames: ['created_by'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'RESTRICT',
    }));

    await queryRunner.createForeignKey('shipment_status_history', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('waybills', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('tracking_history', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('ai_optimizations', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('reports', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('notifications', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('invoices', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('invoices', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('payments', new TableForeignKey({
      columnNames: ['invoice_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'invoices',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('reviews', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('reviews', new TableForeignKey({
      columnNames: ['driver_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'drivers',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('routes', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('stops', new TableForeignKey({
      columnNames: ['route_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'routes',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('returns', new TableForeignKey({
      columnNames: ['original_shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('documents', new TableForeignKey({
      columnNames: ['shipment_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'shipments',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('settings', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    // ============================================
    // INDEXES
    // ============================================
    await queryRunner.createIndex('shipments', new TableIndex({ columnNames: ['tracking_number'] }));
    await queryRunner.createIndex('shipments', new TableIndex({ columnNames: ['status'] }));
    await queryRunner.createIndex('shipments', new TableIndex({ columnNames: ['organization_id', 'status'] }));
    await queryRunner.createIndex('shipments', new TableIndex({ columnNames: ['customer_id'] }));
    await queryRunner.createIndex('shipments', new TableIndex({ columnNames: ['driver_id'] }));
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['organization_id', 'status'] }));
    await queryRunner.createIndex('drivers', new TableIndex({ columnNames: ['license_number'] }));
    await queryRunner.createIndex('vehicles', new TableIndex({ columnNames: ['organization_id', 'status'] }));
    await queryRunner.createIndex('vehicles', new TableIndex({ columnNames: ['license_plate'] }));
    await queryRunner.createIndex('tracking_history', new TableIndex({ columnNames: ['shipment_id', 'tracked_at'] }));
    await queryRunner.createIndex('notifications', new TableIndex({ columnNames: ['user_id', 'is_read'] }));
    await queryRunner.createIndex('inventory', new TableIndex({ columnNames: ['warehouse_id'] }));
    await queryRunner.createIndex('inventory', new TableIndex({ columnNames: ['product_id'] }));
    await queryRunner.createIndex('waybills', new TableIndex({ columnNames: ['waybill_number'] }));
    await queryRunner.createIndex('invoices', new TableIndex({ columnNames: ['invoice_number'] }));
    await queryRunner.createIndex('invoices', new TableIndex({ columnNames: ['organization_id', 'status'] }));
    await queryRunner.createIndex('routes', new TableIndex({ columnNames: ['shipment_id'] }));
    await queryRunner.createIndex('stops', new TableIndex({ columnNames: ['route_id', 'sequence_number'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'stops', 'routes', 'returns', 'documents', 'settings',
      'reviews', 'payments', 'invoices', 'notifications', 'reports',
      'ai_optimizations', 'tracking_history', 'waybills', 'shipment_status_history',
      'shipments', 'inventory', 'products', 'warehouses', 'vehicles', 'drivers'
    ];
    
    for (const table of tables) {
      const foreignKeys = await queryRunner.getTable(table);
      if (foreignKeys) {
        for (const fk of foreignKeys.foreignKeys) {
          await queryRunner.dropForeignKey(table, fk);
        }
      }
    }
    
    for (const table of tables.reverse()) {
      await queryRunner.dropTable(table, true, true);
    }

    const enums = [
      'shipments_status_enum', 'drivers_status_enum', 'vehicles_status_enum',
      'vehicles_type_enum', 'invoice_status_enum', 'payment_method_enum',
      'notification_type_enum'
    ];
    
    for (const enumType of enums) {
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."${enumType}"`);
    }
  }
}
