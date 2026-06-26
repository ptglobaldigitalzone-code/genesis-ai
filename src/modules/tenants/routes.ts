import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireRole } from '../../auth/middleware.js';
import { Errors } from '../../lib/errors.js';
import { eraseTenant } from './erasure.js';

const eraseSchema = z.object({
  // Konfirmasi eksplisit: klien harus mengirim nama tenant-id-nya sendiri.
  confirm: z.literal('ERASE'),
});

export async function tenantRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate);

  /**
   * GDPR erasure — menghapus SELURUH data tenant pemanggil (operasi destruktif,
   * tak bisa di-undo). Operator only + konfirmasi eksplisit. Tenant diambil dari
   * token (tak bisa menghapus tenant lain).
   */
  app.post('/v1/tenant/erase', { onRequest: [requireRole('operator')] }, async (req) => {
    const { tenantId } = req.auth!;
    const parsed = eraseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.badRequest('Konfirmasi diperlukan: kirim { "confirm": "ERASE" }');
    }
    const result = await eraseTenant(tenantId);
    return { ok: true, ...result };
  });
}
