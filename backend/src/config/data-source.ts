import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'logitrack_db',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,  // ❗ E rëndësishme: false për migrime!
  logging: process.env.NODE_ENV === 'development',
});