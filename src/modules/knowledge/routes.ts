import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { agents } from '../../db/schema.js';
import { authenticate, requireRole } from '../../auth/middleware.js';
import { Errors } from '../../lib/errors.js';
import { ingestKnowledge } from './service.js';

const ingestSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['document', 'text', 'url', 'qa_csv']).default('text'),
  content: z.string().min(1),
  authority: z.number().min(0).max(1).optional(),
});

async function assertAgent(tenantId: string, agentId: string) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)))
    .limit(1);
  if (!agent) throw Errors.notFound('Agent');
  return agent;
}

export async function knowledgeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate);

  /** Ingest pengetahuan untuk sebuah agent (FR-2). Hanya operator. */
  app.post('/v1/agents/:agentId/knowledge', { onRequest: [requireRole('operator')], schema: { tags: ['Knowledge'], summary: 'Ingest knowledge (RAG)', security: [{ bearerAuth: [] }], params: z.object({ agentId: z.string().uuid() }), body: ingestSchema } }, async (req) => {
    const { tenantId } = req.auth!;
    const { agentId } = req.params as { agentId: string };
    await assertAgent(tenantId, agentId);

    const body = ingestSchema.parse(req.body);
    const result = await ingestKnowledge({
      tenantId,
      agentId,
      title: body.title,
      type: body.type,
      content: body.content,
      authority: body.authority,
    });
    return { ok: true, ...result };
  });
}
