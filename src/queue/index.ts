import { Queue, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/index.js';

/**
 * Koneksi Redis + definisi queue (ARCHITECTURE.md §6).
 * Pekerjaan agent diproses async untuk keandalan, retry, dan backpressure.
 *
 * Catatan: cast ke ConnectionOptions karena BullMQ membundel ioredis-nya sendiri;
 * instance dari paket ioredis top-level identik secara runtime, hanya beda nominal tipe.
 */
export const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
}) as unknown as ConnectionOptions;

export interface TicketJobData {
  tenantId: string;
  conversationId: string;
  agentId: string;
}

export const TICKET_QUEUE = 'ticket-processing';

export const ticketQueue = new Queue<TicketJobData>(TICKET_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

/** Enqueue tiket untuk diproses worker. idempotencyKey mencegah pemrosesan ganda. */
export async function enqueueTicket(data: TicketJobData, idempotencyKey: string): Promise<void> {
  await ticketQueue.add('process', data, { jobId: idempotencyKey });
}
