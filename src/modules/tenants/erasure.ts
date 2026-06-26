import { eq } from 'drizzle-orm';
import { pool, db } from '../../db/index.js';
import { tenants, events, feedback, ticketCosts } from '../../db/schema.js';

/**
 * Tenant data erasure (GDPR right-to-erasure) — membayar utang DATABASE §6.
 *
 * Entitas inti (users, agents, knowledge, conversations, messages) terhapus via
 * FK cascade saat baris `tenants` dihapus. Tabel log/sidecar (events, feedback,
 * ticket_costs) TIDAK ber-FK (sengaja, agar log independen) → harus dihapus EKSPLISIT.
 * Semua dalam satu transaksi agar atomik.
 *
 * Catatan kepatuhan (roadmap): bukti penghapusan idealnya dicatat ke audit-log
 * TERPISAH di luar scope tenant (karena event tenant ikut terhapus). Belum ada.
 */
export interface ErasureResult {
  tenantId: string;
  deleted: { events: number; feedback: number; ticketCosts: number; tenant: number };
}

export async function eraseTenant(tenantId: string): Promise<ErasureResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tabel log/sidecar tanpa-FK → hapus eksplisit.
    const ev = await client.query('DELETE FROM events WHERE tenant_id = $1', [tenantId]);
    const fb = await client.query('DELETE FROM feedback WHERE tenant_id = $1', [tenantId]);
    const tc = await client.query('DELETE FROM ticket_costs WHERE tenant_id = $1', [tenantId]);

    // 2. Hapus tenant → cascade membersihkan users/agents/knowledge/conversations/messages.
    const tn = await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);

    await client.query('COMMIT');
    return {
      tenantId,
      deleted: {
        events: ev.rowCount ?? 0,
        feedback: fb.rowCount ?? 0,
        ticketCosts: tc.rowCount ?? 0,
        tenant: tn.rowCount ?? 0,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Cek keberadaan tenant (untuk validasi sebelum erasure). */
export async function tenantExists(tenantId: string): Promise<boolean> {
  const [row] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return !!row;
}
