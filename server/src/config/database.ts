import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST || '';
const useSsl = dbHost.includes('neon.tech') || dbHost.includes('aws.neon.tech');

export const pool = new Pool({
  connectionString,
  host: connectionString ? undefined : dbHost,
  port: connectionString ? undefined : parseInt(process.env.DB_PORT || '5432'),
  user: connectionString ? undefined : process.env.DB_USER,
  password: connectionString ? undefined : process.env.DB_PASSWORD,
  database: connectionString ? undefined : process.env.DB_NAME,
  ssl: useSsl
    ? {
        rejectUnauthorized: false,
      }
    : connectionString
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});
