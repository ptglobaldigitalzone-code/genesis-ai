import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { conversations, messages, feedback } from '../../db/schema.js';
import { authenticate, requireRole } from '../../auth/middleware.js';
import { Errors } from '../../lib/errors.js';
import { addMessage, setStatus } from '../conversations/service.js';
import { emitEvent } from '../events/service.js';

const actionSchema = z.object({
  action: z.enum(['approve', 'edit', 'reject']),
  editedBody: z.string().optional(),
  reason: z.string().optional(),
});

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate);

  /** Review queue (FR-13): percakapan yang menunggu tindakan manusia. */
  app.get('/v1/review-queue', async (req) => {
    const { tenantId } = req.auth!;
    return db
      .select()
      .from(conversations)
      .where(and(eq(conversations.tenantId, tenantId), eq(conversations.status, 'awaiting_review')))
      .orderBy(desc(conversations.updatedAt))
      .limit(100);
  });

  /**
   * Reviewer bertindak atas draf agent (approve / edit / reject).
   * Setiap aksi tercatat sebagai feedback = sinyal pembelajaran (FR-14, Handbook §8).
   */
  app.post(
    '/v1/conversations/:id/review',
    { onRequest: [requireRole('reviewer', 'operator')] },
    async (req) => {
      const { tenantId, userId } = req.auth!;
      const { id } = req.params as { id: string };
      const body = actionSchema.parse(req.body);

      const [conv] = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
        .limit(1);
      if (!conv) throw Errors.notFound('Percakapan');
      if (conv.status !== 'awaiting_review') throw Errors.badRequest('Percakapan tidak sedang menunggu review');

      // draf agent terakhir
      const [agentMsg] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.conversationId, id), eq(messages.role, 'agent')))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      if (body.action === 'reject') {
        await setStatus(tenantId, id, 'escalated');
        await db.insert(feedback).values({
          tenantId,
          conversationId: id,
          reviewerId: userId,
          action: 'reject',
          editDiff: body.reason ?? null,
        });
        await emitEvent({ tenantId, conversationId: id, type: 'review.rejected', payload: { reason: body.reason } });
        return { ok: true, status: 'escalated' };
      }

      // approve atau edit → kirim ke pelanggan & resolve
      const finalBody = body.action === 'edit' && body.editedBody ? body.editedBody : agentMsg?.body ?? '';
      if (body.action === 'edit') {
        await addMessage({ tenantId, conversationId: id, role: 'reviewer', body: finalBody });
      }
      await setStatus(tenantId, id, 'resolved');

      await db.insert(feedback).values({
        tenantId,
        conversationId: id,
        reviewerId: userId,
        action: body.action,
        editDiff: body.action === 'edit' ? diff(agentMsg?.body ?? '', finalBody) : null,
      });

      await emitEvent({
        tenantId,
        conversationId: id,
        type: body.action === 'edit' ? 'review.edited' : 'review.approved',
        payload: { reviewerId: userId },
      });
      await emitEvent({ tenantId, conversationId: id, type: 'agent.sent', payload: { via: 'review', action: body.action } });

      return { ok: true, status: 'resolved', sent: finalBody };
    },
  );
}

/** Diff naif untuk menyimpan perubahan reviewer (sinyal training sederhana). */
function diff(before: string, after: string): string {
  if (before === after) return '';
  return `--- sebelum\n${before}\n+++ sesudah\n${after}`;
}
