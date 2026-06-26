import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

/**
 * Menjalankan migrasi Drizzle. Pastikan ekstensi pgvector aktif lebih dulu.
 */
async function main() {
  const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
  const dbm = drizzle(pool);

  logger.info('Mengaktifkan ekstensi pgvector...');
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

  logger.info('Menjalankan migrasi...');
  await migrate(dbm, { migrationsFolder: './drizzle' });

  logger.info('✅ Migrasi selesai.');
  await pool.end();
}

main().catch((err) => {
  logger.error(err, 'Migrasi gagal');
  process.exit(1);
});
