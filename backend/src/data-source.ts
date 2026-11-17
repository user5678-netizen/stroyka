import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { postgresConnectionFromEnv } from './shared/config/postgres.config';

config();

const connection = postgresConnectionFromEnv();

export const AppDataSource = new DataSource({
  ...connection,
  entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});