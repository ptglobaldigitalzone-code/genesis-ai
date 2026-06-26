import { sql } from 'drizzle-orm';
import { db } from './index.js';

/**
 * withTenant — menjalankan operasi DB di dalam transaksi dengan konteks tenant
 * di-SET, agar kebijakan Row-Level Security (src/db/rls.sql) menegakkan isolasi
 * di level database (Pasal 2 Constitution).
 *
 * `set_config(..., true)` = SET LOCAL → konteks hanya berlaku dalam transaksi ini,
 * aman untuk connection pool (tidak bocor ke koneksi lain).
 *
 * Pemakaian (saat RLS diaktifkan):
 *   const rows = await withTenant(tenantId, (tx) =>
 *     tx.select().from(agents)   // otomatis ter-scope tenant oleh RLS
 *   );
 *
 * Catatan: tx bertipe transaksi Drizzle (kompleks) → di-`any` secara sengaja
 * dengan alasan ini (Engineering Bible §4 mengizinkan cast beralasan).
 */
export function withTenant<T>(
  tenantId: string,
  fn: (tx: any) => Promise<T>, // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_tenant', ${tenantId}, true)`);
    return fn(tx);
  });
}
