import type { FastifyInstance } from 'fastify';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { events } from '../../db/schema.js';
import { authenticate } from '../../auth/middleware.js';

/**
 * Audit & replay (FR-15/FR-16): membaca action log (system of record).
 */
export async function eventRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate);

  /** Semua event sebuah percakapan (urut waktu) — jejak penalaran agent. */
  app.get('/v1/conversations/:id/events', async (req) => {
    const { tenantId } = req.auth!;
    const { id } = req.params as { id: string };
    return db
      .select()
      .from(events)
      .where(and(eq(events.tenantId, tenantId), eq(events.conversationId, id)))
      .orderBy(events.createdAt);
  });

  /** Audit log tenant (terbaru). */
  app.get('/v1/events', async (req) => {
    const { tenantId } = req.auth!;
    return db
      .select()
      .from(events)
      .where(eq(events.tenantId, tenantId))
      .orderBy(desc(events.createdAt))
      .limit(200);
  });
}
