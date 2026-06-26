import { db } from '../../db/index.js';
import { events } from '../../db/schema.js';

/**
 * Event service — satu-satunya pintu menulis ke action log (APPEND ONLY).
 * Ini system of record: replay, audit, metrics, dan training data
 * semua diturunkan dari sini (ARCHITECTURE.md §10).
 *
 * Catatan: di v1 kita tulis langsung ke tabel `events`. Untuk fan-out ke
 * consumer (metrics, eval) gunakan transactional outbox → Redis Streams
 * pada iterasi berikutnya.
 */
export type EventType =
  | 'tenant.created'
  | 'user.registered'
  | 'agent.created'
  | 'agent.autonomy_changed'
  | 'knowledge.ingested'
  | 'ticket.received'
  | 'agent.classified'
  | 'agent.retrieved'
  | 'agent.drafted'
  | 'agent.sent'
  | 'agent.escalated'
  | 'agent.queued_for_review'
  | 'review.approved'
  | 'review.edited'
  | 'review.rejected';

export interface EmitEventInput {
  tenantId: string;
  type: EventType;
  conversationId?: string;
  agentId?: string;
  payload?: Record<string, unknown>;
}

export async function emitEvent(input: EmitEventInput): Promise<void> {
  await db.insert(events).values({
    tenantId: input.tenantId,
    type: input.type,
    conversationId: input.conversationId ?? null,
    agentId: input.agentId ?? null,
    payload: input.payload ?? {},
  });
}
