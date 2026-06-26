import 'dotenv/config';
import { z } from 'zod';

/**
 * Konfigurasi tersentral & tervalidasi.
 * Aplikasi gagal cepat (fail-fast) bila env penting tidak lengkap.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET minimal 16 karakter'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_REASONING: z.string().default('claude-opus-4-8'),
  AI_MODEL_CLASSIFY: z.string().default('claude-haiku-4-5-20251001'),

  EMBED_PROVIDER: z.enum(['stub', 'anthropic', 'voyage']).default('stub'),
  EMBED_DIM: z.coerce.number().default(1024),

  CONFIDENCE_ESCALATION_THRESHOLD: z.coerce.number().min(0).max(1).default(0.6),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Konfigurasi environment tidak valid:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
