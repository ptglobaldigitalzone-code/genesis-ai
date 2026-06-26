import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { conversations, messages } from '../../db/schema.js';
import { authenticate } from '../../auth/middleware.js';
import { makeRateLimit } from '../../lib/ratelimit.js';
import { Errors } from '../../lib/errors.js';
import { createConversation } from './service.js';
import { emitEvent } from '../events/service.js';
import { enqueueTicket } from '../../queue/index.js';

// Limiter per-tenant untuk jalur mahal (tiap inbound memicu kerja model berbayar).
const inboundLimit = makeRateLimit({ by: 'tenant', limit: 120, windowSec: 60 });

const inboundSchema = z.object({
  agentId: z.string().uuid(),
  channel: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1),
});

export async function conversationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate);

  /**
   * Channel Ingress (FR-5/FR-6) — simulasi webhook tiket masuk.
   * Membuat percakapan + pesan pelanggan, lalu enqueue untuk diproses async.
   */
  app.post('/v1/inbound', { onRequest: [inboundLimit], schema: { tags: ['Conversations'], summary: 'Channel ingress — tiket masuk', security: [{ bearerAuth: [] }], body: inboundSchema } }, async (req) => {
    const { tenantId } = req.auth!;
    const body = inboundSchema.parse(req.body);

    const conv = await createConversation({
      tenantId,
      agentId: body.agentId,
      channel: body.channel,
      subject: body.subject,
      customerMessage: body.message,
    });

    await emitEvent({
      tenantId,
      agentId: body.agentId,
      conversationId: conv.id,
      type: 'ticket.received',
      payload: { channel: conv.channel, subject: conv.subject },
    });

    // idempotencyKey unik per percakapan baru → exactly-once-effective
    await enqueueTicket({ tenantId, agentId: body.agentId, conversationId: conv.id }, `ticket:${conv.id}`);

    return { ok: true, conversationId: conv.id, status: conv.status };
  });

  /** List percakapan tenant (opsional filter status). */
  app.get('/v1/conversations', { schema: { tags: ['Conversations'], summary: 'List percakapan', security: [{ bearerAuth: [] }], querystring: z.object({ status: z.string().optional() }) } }, async (req) => {
    const { tenantId } = req.auth!;
    const { status } = req.query as { status?: string };
    const rows = await db
      .select()
      .from(conversations)
      .where(
        status
          ? and(eq(conversations.tenantId, tenantId), eq(conversations.status, status as any))
          : eq(conversations.tenantId, tenantId),
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(100);
    return rows;
  });

  /** Detail percakapan + transcript (replay manusiawi, FR-16). */
  app.get('/v1/conversations/:id', { schema: { tags: ['Conversations'], summary: 'Detail + transcript', security: [{ bearerAuth: [] }], params: z.object({ id: z.string().uuid() }) } }, async (req) => {
    const { tenantId } = req.auth!;
    const { id } = req.params as { id: string };

    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
      .limit(1);
    if (!conv) throw Errors.notFound('Percakapan');

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    return { conversation: conv, messages: msgs };
  });
}
