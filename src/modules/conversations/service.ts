import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { conversations, messages, agents } from '../../db/schema.js';
import { Errors } from '../../lib/errors.js';

export async function createConversation(input: {
  tenantId: string;
  agentId: string;
  channel?: string;
  subject?: string;
  customerMessage: string;
}) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, input.agentId), eq(agents.tenantId, input.tenantId)))
    .limit(1);
  if (!agent) throw Errors.notFound('Agent');

  const [conv] = await db
    .insert(conversations)
    .values({
      tenantId: input.tenantId,
      agentId: input.agentId,
      channel: input.channel ?? 'email',
      subject: input.subject ?? null,
      status: 'open',
    })
    .returning();
  if (!conv) throw Errors.internal('Gagal membuat percakapan');

  await db.insert(messages).values({
    tenantId: input.tenantId,
    conversationId: conv.id,
    role: 'customer',
    body: input.customerMessage,
  });

  return conv;
}

export async function addMessage(input: {
  tenantId: string;
  conversationId: string;
  role: 'customer' | 'agent' | 'reviewer';
  body: string;
}) {
  await db.insert(messages).values({
    tenantId: input.tenantId,
    conversationId: input.conversationId,
    role: input.role,
    body: input.body,
  });
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));
}

export async function setStatus(
  tenantId: string,
  conversationId: string,
  status: 'open' | 'awaiting_review' | 'resolved' | 'escalated',
) {
  await db
    .update(conversations)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId)));
}

export async function getLastCustomerMessage(tenantId: string, conversationId: string): Promise<string> {
  const [msg] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.tenantId, tenantId), eq(messages.conversationId, conversationId), eq(messages.role, 'customer')))
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return msg?.body ?? '';
}
