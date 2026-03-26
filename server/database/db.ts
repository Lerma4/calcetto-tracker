import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const globalForDb = globalThis as typeof globalThis & {
  __calcettoPgPool?: Pool;
};

const pool = globalForDb.__calcettoPgPool ?? new Pool({
  connectionString,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__calcettoPgPool = pool;
}

export const db = drizzle({ client: pool, schema });
export { pool };
