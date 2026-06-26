import type { FastifyInstance } from 'fastify';
import { sql, eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { conversations, events, ticketCosts } from '../../db/schema.js';
import { authenticate } from '../../auth/middleware.js';

/**
 * Metrics (FR-17/FR-18) — diturunkan dari event log & cost table.
 * KPI selaras dengan PRD §4 / Handbook §7.
 */
export async function metricsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate);

  app.get('/v1/metrics', async (req) => {
    const { tenantId } = req.auth!;

    const [statusCounts, sentCount, escalatedCount, reviewCount, cost] = await Promise.all([
      db
        .select({ status: conversations.status, n: sql<number>`count(*)::int` })
        .from(conversations)
        .where(eq(conversations.tenantId, tenantId))
        .groupBy(conversations.status),
      countEvents(tenantId, 'agent.sent'),
      countEvents(tenantId, 'agent.escalated'),
      countEvents(tenantId, 'agent.queued_for_review'),
      db
        .select({
          totalUsd: sql<number>`coalesce(sum(${ticketCosts.costUsd}),0)`,
          tickets: sql<number>`count(distinct ${ticketCosts.conversationId})::int`,
        })
        .from(ticketCosts)
        .where(eq(ticketCosts.tenantId, tenantId)),
    ]);

    const totalTickets = statusCounts.reduce((s, r) => s + Number(r.n), 0);
    const resolved = Number(statusCounts.find((r) => r.status === 'resolved')?.n ?? 0);
    const escalated = Number(statusCounts.find((r) => r.status === 'escalated')?.n ?? 0);
    const totalCost = Number(cost[0]?.totalUsd ?? 0);
    const costTickets = Number(cost[0]?.tickets ?? 0);

    return {
      totalTickets,
      byStatus: Object.fromEntries(statusCounts.map((r) => [r.status, Number(r.n)])),
      resolutionRate: totalTickets ? +(resolved / totalTickets).toFixed(3) : 0,
      escalationRate: totalTickets ? +(escalated / totalTickets).toFixed(3) : 0,
      counts: { sent: sentCount, escalated: escalatedCount, queuedForReview: reviewCount },
      cost: {
        totalUsd: +totalCost.toFixed(6),
        costPerTicketUsd: costTickets ? +(totalCost / costTickets).toFixed(6) : 0,
      },
    };
  });
}

async function countEvents(tenantId: string, type: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(events)
    .where(and(eq(events.tenantId, tenantId), eq(events.type, type)));
  return Number(row?.n ?? 0);
}
