import { Worker } from 'bullmq';
import { connection, TICKET_QUEUE, type TicketJobData } from './index.js';
import { runSupportWorkflow } from '../workflow/support-agent.js';
import { logger } from '../lib/logger.js';

/**
 * Agent Worker (ARCHITECTURE.md §2). Mengonsumsi job tiket dari queue dan
 * menjalankan Workflow Engine. Job idempotent + retry dengan backoff (di index.ts).
 *
 * Jalankan terpisah dari server: `npm run dev:worker`.
 */
const worker = new Worker<TicketJobData>(
  TICKET_QUEUE,
  async (job) => {
    const { tenantId, agentId, conversationId } = job.data;
    logger.info({ jobId: job.id, conversationId }, 'Memproses tiket...');
    const outcome = await runSupportWorkflow({ tenantId, agentId, conversationId });
    logger.info({ jobId: job.id, conversationId, outcome }, 'Tiket selesai diproses');
    return { outcome };
  },
  { connection, concurrency: 8 },
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job gagal');
});

worker.on('completed', (job, result) => {
  logger.debug({ jobId: job.id, result }, 'Job selesai');
});

logger.info('🛠️  Agent worker berjalan, menunggu tiket...');
