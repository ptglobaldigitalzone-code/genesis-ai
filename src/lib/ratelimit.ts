import type { FastifyRequest, FastifyReply } from 'fastify';
import type IORedis from 'ioredis';
import { AppError } from './errors.js';

/**
 * Rate limiting (Sprint 4, API-DESIGN §4).
 * Usage-billing → abuse = biaya model langsung, jadi ini kontrol biaya & keamanan.
 *
 * Algoritma: fixed-window counter. Key = id + indeks window (deterministik dari waktu).
 * Logika inti MURNI & teruji; store di-abstraksi (Redis untuk prod, in-memory untuk dev).
 */

export interface RateLimitConfig {
  limit: number;
  windowSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSec: number;
  count: number;
}

export interface RateLimitStore {
  /** Naikkan counter untuk `key`, set kedaluwarsa `windowSec` bila baru. Kembalikan count. */
  hit(key: string, windowSec: number): Promise<number>;
}

/** Store in-memory (dev/test, single instance). */
export class InMemoryStore implements RateLimitStore {
  private buckets = new Map<string, number>();
  private timers = new Set<string>();

  async hit(key: string, windowSec: number): Promise<number> {
    const next = (this.buckets.get(key) ?? 0) + 1;
    this.buckets.set(key, next);
    if (!this.timers.has(key)) {
      this.timers.add(key);
      const t = setTimeout(() => {
        this.buckets.delete(key);
        this.timers.delete(key);
      }, windowSec * 1000);
      // jangan menahan proses tetap hidup
      if (typeof t.unref === 'function') t.unref();
    }
    return next;
  }
}

/** Store Redis (produksi, multi-instance). */
export class RedisStore implements RateLimitStore {
  constructor(private redis: IORedis) {}
  async hit(key: string, windowSec: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, windowSec);
    return count;
  }
}

/**
 * Inti keputusan rate limit — MURNI (kecuali store.hit). `nowMs` di-inject → testable.
 */
export async function checkRateLimit(
  store: RateLimitStore,
  id: string,
  cfg: RateLimitConfig,
  nowMs: number,
): Promise<RateLimitResult> {
  const windowMs = cfg.windowSec * 1000;
  const windowIndex = Math.floor(nowMs / windowMs);
  const key = `rl:${id}:${windowIndex}`;
  const count = await store.hit(key, cfg.windowSec);

  const allowed = count <= cfg.limit;
  const remaining = Math.max(0, cfg.limit - count);
  const resetSec = Math.ceil(((windowIndex + 1) * windowMs - nowMs) / 1000);
  return { allowed, limit: cfg.limit, remaining, resetSec, count };
}

// Store default (in-memory). Prod: ganti ke RedisStore via setRateLimitStore().
let activeStore: RateLimitStore = new InMemoryStore();
export function setRateLimitStore(store: RateLimitStore): void {
  activeStore = store;
}

/**
 * Factory Fastify hook. `by: 'tenant'` butuh req.auth (pasang SETELAH authenticate);
 * `by: 'ip'` untuk endpoint publik.
 */
export function makeRateLimit(cfg: RateLimitConfig & { by: 'ip' | 'tenant' }) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const id = cfg.by === 'tenant' && req.auth ? `t:${req.auth.tenantId}` : `ip:${req.ip}`;
    const res = await checkRateLimit(activeStore, id, cfg, Date.now());

    reply.header('X-RateLimit-Limit', String(res.limit));
    reply.header('X-RateLimit-Remaining', String(res.remaining));
    reply.header('X-RateLimit-Reset', String(res.resetSec));

    if (!res.allowed) {
      reply.header('Retry-After', String(res.resetSec));
      throw new AppError(429, 'RATE_LIMITED', 'Terlalu banyak permintaan, coba lagi nanti');
    }
  };
}
