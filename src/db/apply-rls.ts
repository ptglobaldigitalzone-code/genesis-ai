import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './index.js';
import { logger } from '../lib/logger.js';

/**
 * Menerapkan kebijakan Row-Level Security dari rls.sql.
 * Jalankan SETELAH migrasi + setelah aplikasi memakai withTenant() untuk
 * operasi tenant-scoped. Perintah: `npm run db:rls`.
 */
async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const sqlText = readFileSync(join(here, 'rls.sql'), 'utf8');
  logger.info('Menerapkan kebijakan RLS...');
  await pool.query(sqlText);
  logger.info('✅ RLS aktif untuk seluruh tabel tenant-scoped.');
  await pool.end();
}

main().catch((err) => {
  logger.error(err, 'Gagal menerapkan RLS');
  process.exit(1);
});
