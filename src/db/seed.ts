import { db, pool } from './index.js';
import { tenants, users, agents } from './schema.js';
import { hashPassword } from '../lib/password.js';
import { ingestKnowledge } from '../modules/knowledge/service.js';
import { logger } from '../lib/logger.js';

/**
 * Seed demo: 1 tenant, 1 operator, 1 reviewer, 1 agent, + knowledge contoh.
 * Login: operator@demo.test / reviewer@demo.test (password: password123)
 */
async function main() {
  const [tenant] = await db.insert(tenants).values({ name: 'Demo Co' }).returning();
  if (!tenant) throw new Error('seed tenant gagal');

  const pwd = await hashPassword('password123');
  await db.insert(users).values([
    { tenantId: tenant.id, email: 'operator@demo.test', passwordHash: pwd, role: 'operator' },
    { tenantId: tenant.id, email: 'reviewer@demo.test', passwordHash: pwd, role: 'reviewer' },
  ]);

  const [agent] = await db
    .insert(agents)
    .values({ tenantId: tenant.id, name: 'Support Bot', autonomy: 'draft_for_approval', voice: 'Ramah, ringkas, solutif.' })
    .returning();
  if (!agent) throw new Error('seed agent gagal');

  await ingestKnowledge({
    tenantId: tenant.id,
    agentId: agent.id,
    title: 'Kebijakan Pengiriman & FAQ',
    type: 'text',
    content: [
      'Estimasi pengiriman standar adalah 3-5 hari kerja untuk wilayah Jawa, dan 5-9 hari kerja untuk luar Jawa.',
      '',
      'Pelanggan dapat melacak pesanan melalui halaman "Lacak Pesanan" dengan memasukkan nomor resi yang dikirim via email.',
      '',
      'Jam operasional layanan pelanggan adalah Senin-Jumat, 09.00-17.00 WIB.',
      '',
      'Untuk mengubah alamat pengiriman, pelanggan harus menghubungi kami sebelum pesanan dikirim.',
    ].join('\n'),
  });

  logger.info({ tenantId: tenant.id, agentId: agent.id }, '✅ Seed selesai');
  logger.info('Login: operator@demo.test / password123');
  await pool.end();
}

main().catch((err) => {
  logger.error(err, 'Seed gagal');
  process.exit(1);
});
