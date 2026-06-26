import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { agents } from '../../db/schema.js';
import { authenticate, requireRole } from '../../auth/middleware.js';
import { Errors } from '../../lib/errors.js';
import { emitEvent } from '../events/service.js';
import { canPromoteTo } from '../../eval/gating.js';

const createSchema = z.object({
  name: z.string().min(2),
  voice: z.string().optional(),
});

const autonomySchema = z.object({
  autonomy: z.enum(['suggest', 'draft_for_approval', 'act_with_review', 'autonomous']),
});

const killSwitchSchema = z.object({
  level: z.enum(['suggest', 'draft_for_approval']).default('draft_for_approval'),
  reason: z.string().optional(),
});

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  // Semua route agent butuh autentikasi
  app.addHook('onRequest', authenticate);

  /** Buat agent (AI Employee) baru — hanya operator. */
  app.post('/v1/agents', { onRequest: [requireRole('operator')] }, async (req) => {
    const { tenantId } = req.auth!;
    const body = createSchema.parse(req.body);

    const [agent] = await db
      .insert(agents)
      .values({ tenantId, name: body.name, voice: body.voice ?? undefined })
      .returning();
    if (!agent) throw Errors.internal('Gagal membuat agent');

    await emitEvent({ tenantId, type: 'agent.created', agentId: agent.id, payload: { name: agent.name } });
    return agent;
  });

  /** List agent milik tenant. */
  app.get('/v1/agents', async (req) => {
    const { tenantId } = req.auth!;
    return db.select().from(agents).where(eq(agents.tenantId, tenantId));
  });

  /** Detail satu agent (ter-scope tenant). */
  app.get('/v1/agents/:id', async (req) => {
    const { tenantId } = req.auth!;
    const { id } = req.params as { id: string };
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.tenantId, tenantId)))
      .limit(1);
    if (!agent) throw Errors.notFound('Agent');
    return agent;
  });

  /**
   * Ubah autonomy level (trust ladder, FR-12).
   * Catatan: di iterasi berikutnya, naik ke 'autonomous' digate oleh ambang eval.
   */
  app.patch('/v1/agents/:id/autonomy', { onRequest: [requireRole('operator')] }, async (req) => {
    const { tenantId } = req.auth!;
    const { id } = req.params as { id: string };
    const { autonomy } = autonomySchema.parse(req.body);

    // Autonomy gating (FR-12): level tinggi di-gate eval keselamatan.
    const gate = canPromoteTo(autonomy);
    if (!gate.allowed) throw Errors.forbidden(gate.reason);

    const [agent] = await db
      .update(agents)
      .set({ autonomy })
      .where(and(eq(agents.id, id), eq(agents.tenantId, tenantId)))
      .returning();
    if (!agent) throw Errors.notFound('Agent');

    await emitEvent({
      tenantId,
      type: 'agent.autonomy_changed',
      agentId: agent.id,
      payload: { autonomy },
    });
    return agent;
  });

  /**
   * KILL SWITCH (incident response) — turunkan SEMUA agent tenant ke level aman
   * seketika. Tidak di-gate (menurunkan otonomi selalu boleh & aman).
   */
  app.post('/v1/kill-switch', { onRequest: [requireRole('operator')] }, async (req) => {
    const { tenantId } = req.auth!;
    const { level, reason } = killSwitchSchema.parse(req.body);

    const updated = await db
      .update(agents)
      .set({ autonomy: level })
      .where(eq(agents.tenantId, tenantId))
      .returning({ id: agents.id });

    await emitEvent({
      tenantId,
      type: 'agent.autonomy_changed',
      payload: { killSwitch: true, level, reason, affected: updated.length },
    });
    return { ok: true, level, affected: updated.length };
  });
}
