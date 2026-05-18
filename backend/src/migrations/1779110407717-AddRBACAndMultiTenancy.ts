import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddRBACAndMultiTenancy1779110407717 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. Shto kolona në users për multi-tenancy
    // ============================================
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_by_organization_id uuid,
      ADD COLUMN IF NOT EXISTS last_updated_by uuid
    `);

    // ============================================
    // 2. Krijo roles tabela
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'roles',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // Insert default roles (ON CONFLICT DO NOTHING)
    await queryRunner.query(`
      INSERT INTO roles (name, description) VALUES
      ('super_admin', 'Full system access - can manage all organizations'),
      ('company_admin', 'Manage own organization - users, drivers, vehicles, shipments'),
      ('dispatcher', 'Create and manage shipments, assign drivers'),
      ('driver', 'View assigned shipments, update status'),
      ('customer', 'Create and track own shipments')
      ON CONFLICT (name) DO NOTHING
    `);

    // ============================================
    // 3. Krijo permissions tabela
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'permissions',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', isNullable: false, isUnique: true },
        { name: 'resource', type: 'varchar', isNullable: false },
        { name: 'action', type: 'varchar', isNullable: false },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    await queryRunner.query(`
      INSERT INTO permissions (name, resource, action, description) VALUES
      ('view_users', 'users', 'view', 'View list of users'),
      ('create_users', 'users', 'create', 'Create new users'),
      ('edit_users', 'users', 'edit', 'Edit existing users'),
      ('delete_users', 'users', 'delete', 'Delete users'),
      ('view_organizations', 'organizations', 'view', 'View organizations'),
      ('create_organizations', 'organizations', 'create', 'Create organizations'),
      ('edit_organizations', 'organizations', 'edit', 'Edit organizations'),
      ('delete_organizations', 'organizations', 'delete', 'Delete organizations'),
      ('view_shipments', 'shipments', 'view', 'View shipments'),
      ('create_shipments', 'shipments', 'create', 'Create shipments'),
      ('edit_shipments', 'shipments', 'edit', 'Edit shipments'),
      ('delete_shipments', 'shipments', 'delete', 'Delete shipments'),
      ('update_shipment_status', 'shipments', 'update_status', 'Update shipment status'),
      ('view_drivers', 'drivers', 'view', 'View drivers'),
      ('create_drivers', 'drivers', 'create', 'Create drivers'),
      ('edit_drivers', 'drivers', 'edit', 'Edit drivers'),
      ('delete_drivers', 'drivers', 'delete', 'Delete drivers'),
      ('assign_drivers', 'drivers', 'assign', 'Assign drivers to shipments'),
      ('view_vehicles', 'vehicles', 'view', 'View vehicles'),
      ('create_vehicles', 'vehicles', 'create', 'Create vehicles'),
      ('edit_vehicles', 'vehicles', 'edit', 'Edit vehicles'),
      ('delete_vehicles', 'vehicles', 'delete', 'Delete vehicles'),
      ('view_reports', 'reports', 'view', 'View reports'),
      ('generate_reports', 'reports', 'generate', 'Generate reports'),
      ('use_ai_optimization', 'ai', 'optimize', 'Use AI route optimization'),
      ('use_ai_chatbot', 'ai', 'chatbot', 'Use AI chatbot'),
      ('use_ai_prediction', 'ai', 'predict', 'Use AI delay prediction')
      ON CONFLICT (name) DO NOTHING
    `);

    // ============================================
    // 4. user_roles
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'user_roles',
      columns: [
        { name: 'user_id', type: 'uuid', isNullable: false },
        { name: 'role_id', type: 'uuid', isNullable: false },
        { name: 'assigned_at', type: 'timestamp', default: 'now()' },
        { name: 'assigned_by', type: 'uuid', isNullable: true },
      ],
    }), true);

    // ============================================
    // 5. role_permissions
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'role_permissions',
      columns: [
        { name: 'role_id', type: 'uuid', isNullable: false },
        { name: 'permission_id', type: 'uuid', isNullable: false },
      ],
    }), true);

    // ============================================
    // 6. Assign permissions to roles
    // ============================================
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin'
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p 
      WHERE r.name = 'company_admin' 
      AND p.name IN ('view_users', 'create_users', 'edit_users', 'delete_users',
                     'view_organizations', 'view_shipments', 'create_shipments', 'edit_shipments', 'delete_shipments',
                     'view_drivers', 'create_drivers', 'edit_drivers', 'delete_drivers', 'assign_drivers',
                     'view_vehicles', 'create_vehicles', 'edit_vehicles', 'delete_vehicles',
                     'view_reports', 'generate_reports',
                     'use_ai_optimization', 'use_ai_chatbot', 'use_ai_prediction')
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p 
      WHERE r.name = 'dispatcher' 
      AND p.name IN ('view_shipments', 'create_shipments', 'edit_shipments', 'update_shipment_status',
                     'view_drivers', 'assign_drivers', 'view_vehicles')
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p 
      WHERE r.name = 'driver' 
      AND p.name IN ('view_shipments', 'update_shipment_status')
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p 
      WHERE r.name = 'customer' 
      AND p.name IN ('view_shipments', 'create_shipments')
      ON CONFLICT DO NOTHING
    `);

    // ============================================
    // 7. plan_templates
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'plan_templates',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', isNullable: false },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'price_monthly', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'price_yearly', type: 'decimal', precision: 10, scale: 2, isNullable: true },
        { name: 'max_users', type: 'int', default: 5 },
        { name: 'max_shipments_per_month', type: 'int', default: 100 },
        { name: 'max_drivers', type: 'int', default: 5 },
        { name: 'max_vehicles', type: 'int', default: 5 },
        { name: 'max_warehouses', type: 'int', default: 1 },
        { name: 'features', type: 'jsonb', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    await queryRunner.query(`
    INSERT INTO plan_templates (name, description, price_monthly, max_users, max_shipments_per_month, max_drivers, max_vehicles, max_warehouses, features) VALUES
    ('Free', 'For small businesses starting out', 0, 5, 100, 2, 2, 1, '["basic_tracking", "email_support"]'),
    ('Basic', 'For growing businesses', 49.99, 20, 500, 10, 10, 3, '["basic_tracking", "email_support", "reports", "api_access"]'),
    ('Pro', 'For established logistics companies', 99.99, 50, 2000, 25, 25, 5, '["advanced_tracking", "priority_support", "reports", "api_access", "ai_optimization"]'),
    ('Enterprise', 'For large enterprises', 249.99, 999999, 999999, 999999, 999999, 999999, '["all_features", "dedicated_support", "custom_integrations", "sla"]')
    `);

    // ============================================
    // 8. organization_subscriptions
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'organization_subscriptions',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'plan_id', type: 'uuid', isNullable: false },
        { name: 'status', type: 'varchar', default: "'active'" },
        { name: 'start_date', type: 'date', default: 'CURRENT_DATE' },
        { name: 'end_date', type: 'date', isNullable: true },
        { name: 'auto_renew', type: 'boolean', default: false },
        { name: 'payment_method', type: 'varchar', isNullable: true },
        { name: 'trial_ends_at', type: 'date', isNullable: true },
        { name: 'cancelled_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 9. tenant_settings
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'tenant_settings',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: false },
        { name: 'setting_key', type: 'varchar', isNullable: false },
        { name: 'setting_value', type: 'text', isNullable: true },
        { name: 'data_type', type: 'varchar', default: "'string'" },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // 10. audit_logs
    // ============================================
    await queryRunner.createTable(new Table({
      name: 'audit_logs',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
        { name: 'organization_id', type: 'uuid', isNullable: true },
        { name: 'user_id', type: 'uuid', isNullable: true },
        { name: 'action', type: 'varchar', isNullable: false },
        { name: 'entity_type', type: 'varchar', isNullable: true },
        { name: 'entity_id', type: 'uuid', isNullable: true },
        { name: 'old_values', type: 'jsonb', isNullable: true },
        { name: 'new_values', type: 'jsonb', isNullable: true },
        { name: 'ip_address', type: 'varchar', isNullable: true },
        { name: 'user_agent', type: 'text', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
    }), true);

    // ============================================
    // FOREIGN KEYS
    // ============================================
    await queryRunner.createForeignKey('users', new TableForeignKey({
      columnNames: ['created_by_organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('user_roles', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('user_roles', new TableForeignKey({
      columnNames: ['role_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'roles',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('role_permissions', new TableForeignKey({
      columnNames: ['role_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'roles',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('role_permissions', new TableForeignKey({
      columnNames: ['permission_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'permissions',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('organization_subscriptions', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('organization_subscriptions', new TableForeignKey({
      columnNames: ['plan_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'plan_templates',
      onDelete: 'RESTRICT',
    }));

    await queryRunner.createForeignKey('tenant_settings', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('audit_logs', new TableForeignKey({
      columnNames: ['organization_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('audit_logs', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL',
    }));

    // ============================================
    // INDEXES
    // ============================================
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org ON organization_subscriptions(organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tenant_settings_org ON tenant_settings(organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('audit_logs', 'FK_audit_logs_user_id');
    await queryRunner.dropForeignKey('audit_logs', 'FK_audit_logs_organization_id');
    await queryRunner.dropForeignKey('tenant_settings', 'FK_tenant_settings_organization_id');
    await queryRunner.dropForeignKey('organization_subscriptions', 'FK_organization_subscriptions_plan_id');
    await queryRunner.dropForeignKey('organization_subscriptions', 'FK_organization_subscriptions_organization_id');
    await queryRunner.dropForeignKey('role_permissions', 'FK_role_permissions_permission_id');
    await queryRunner.dropForeignKey('role_permissions', 'FK_role_permissions_role_id');
    await queryRunner.dropForeignKey('user_roles', 'FK_user_roles_role_id');
    await queryRunner.dropForeignKey('user_roles', 'FK_user_roles_user_id');
    await queryRunner.dropForeignKey('users', 'FK_users_created_by_organization_id');

    // Drop tables
    await queryRunner.dropTable('audit_logs', true, true);
    await queryRunner.dropTable('tenant_settings', true, true);
    await queryRunner.dropTable('organization_subscriptions', true, true);
    await queryRunner.dropTable('plan_templates', true, true);
    await queryRunner.dropTable('role_permissions', true, true);
    await queryRunner.dropTable('user_roles', true, true);
    await queryRunner.dropTable('permissions', true, true);
    await queryRunner.dropTable('roles', true, true);
    
    // Drop columns
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS created_by_organization_id`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS last_updated_by`);
  }
}