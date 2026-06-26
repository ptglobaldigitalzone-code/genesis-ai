import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';
import { draftReply } from '../ai/runtime.js';
import { addMessage, setStatus, getLastCustomerMessage } from '../modules/conversations/service.js';
import { emitEvent } from '../modules/events/service.js';
import { logger } from '../lib/logger.js';

/**
 * Workflow Engine — orkestrasi pekerjaan satu tiket (ARCHITECTURE.md §8).
 * Alur: classify → retrieve → draft → guardrail → decide (send/review/escalate) → deliver → log.
 *
 * Implementasi v1: state machine eksplisit & deterministik. Trust ladder (FR-12)
 * ditegakkan di langkah DECIDE. Bisa ditukar ke Temporal saat butuh durable execution.
 */
export type WorkflowOutcome = 'sent' | 'queued_for_review' | 'escalated' | 'drafted_internal';

export async function runSupportWorkflow(input: {
  tenantId: string;
  agentId: string;
  conversationId: string;
}): Promise<WorkflowOutcome> {
  const { tenantId, agentId, conversationId } = input;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)))
    .limit(1);
  if (!agent) throw new Error('Agent tidak ditemukan');

  // ── STEP: input ──────────────────────────────────────
  const customerMessage = await getLastCustomerMessage(tenantId, conversationId);
  await emitEvent({ tenantId, agentId, conversationId, type: 'agent.classified', payload: { len: customerMessage.length } });

  // ── STEP: draft (retrieve + model + guardrail di dalam AI Runtime) ──
  const draft = await draftReply({
    tenantId,
    agentId,
    agentVoice: agent.voice,
    conversationId,
    customerMessage,
  });

  await emitEvent({
    tenantId,
    agentId,
    conversationId,
    type: 'agent.retrieved',
    payload: { sources: draft.sources.length, topScore: draft.sources[0]?.score ?? 0 },
  });
  await emitEvent({
    tenantId,
    agentId,
    conversationId,
    type: 'agent.drafted',
    payload: { confidence: draft.confidence, grounded: draft.grounded, cost: draft.cost.costUsd },
  });

  // ── STEP: decide (TRUST LADDER, FR-12 + Handbook §3) ──
  // 1) Eskalasi selalu menang, apa pun autonomy level-nya.
  if (draft.shouldEscalate) {
    await setStatus(tenantId, conversationId, 'escalated');
    await emitEvent({
      tenantId,
      agentId,
      conversationId,
      type: 'agent.escalated',
      payload: { reason: draft.escalationReason, confidence: draft.confidence },
    });
    logger.info({ conversationId, reason: draft.escalationReason }, 'Tiket dieskalasi ke manusia');
    return 'escalated';
  }

  // 2) Perilaku per autonomy level
  switch (agent.autonomy) {
    case 'suggest': {
      // Draf internal saja — tidak pernah dikirim/diantri. Manusia melihat di log.
      await emitEvent({ tenantId, agentId, conversationId, type: 'agent.drafted', payload: { mode: 'suggest_internal', draft: draft.answer } });
      return 'drafted_internal';
    }

    case 'draft_for_approval': {
      // Masuk review queue; draf disimpan sebagai pesan agent, status awaiting_review.
      await addMessage({ tenantId, conversationId, role: 'agent', body: draft.answer });
      await setStatus(tenantId, conversationId, 'awaiting_review');
      await emitEvent({ tenantId, agentId, conversationId, type: 'agent.queued_for_review', payload: { confidence: draft.confidence } });
      return 'queued_for_review';
    }

    case 'act_with_review':
    case 'autonomous': {
      // Agent mengirim sendiri. (act_with_review: review async/sampling dilakukan terpisah.)
      await addMessage({ tenantId, conversationId, role: 'agent', body: draft.answer });
      await setStatus(tenantId, conversationId, 'resolved');
      await emitEvent({
        tenantId,
        agentId,
        conversationId,
        type: 'agent.sent',
        payload: { confidence: draft.confidence, autonomy: agent.autonomy },
      });
      return 'sent';
    }

    default:
      return 'drafted_internal';
  }
}
