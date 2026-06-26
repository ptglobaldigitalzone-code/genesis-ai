import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

/**
 * Provider abstraction (model-agnostic core, ARCHITECTURE.md §7).
 * Semua pemanggilan model lewat sini → mudah menukar provider tanpa rewrite.
 */
export interface CompletionRequest {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

// Tarif per 1M token (USD) — disederhanakan; sumber tunggal untuk kalkulasi biaya.
const PRICING: Record<string, { in: number; out: number }> = {
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5 },
};

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!config.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return client;
}

function priceFor(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICING[model] ?? { in: 5, out: 25 };
  return (tokensIn / 1_000_000) * p.in + (tokensOut / 1_000_000) * p.out;
}

/**
 * Memanggil model dengan retry + backoff (deterministic shell, ARCHITECTURE.md §0).
 * Bila ANTHROPIC_API_KEY tidak ada, jatuh ke mode offline deterministik supaya
 * pipeline tetap bisa diuji end-to-end.
 */
export async function complete(req: CompletionRequest): Promise<CompletionResult> {
  const model = req.model ?? config.AI_MODEL_REASONING;
  const c = getClient();

  if (!c) {
    return offlineFallback(req, model);
  }

  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await c.messages.create({
        model,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.2,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
      });
      const text = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      const tokensIn = resp.usage.input_tokens;
      const tokensOut = resp.usage.output_tokens;
      return { text, model, tokensIn, tokensOut, costUsd: priceFor(model, tokensIn, tokensOut) };
    } catch (err) {
      lastErr = err;
      logger.warn({ err, attempt }, 'Pemanggilan model gagal, retry...');
      await new Promise((r) => setTimeout(r, 250 * attempt * attempt));
    }
  }
  throw lastErr;
}

/**
 * Mode offline: respons deterministik berbasis konteks yang diberikan,
 * supaya developer bisa menjalankan alur tanpa kunci API.
 */
function offlineFallback(req: CompletionRequest, model: string): CompletionResult {
  const text = JSON.stringify({
    answer:
      'Terima kasih sudah menghubungi kami. Berdasarkan informasi yang tersedia, tim kami akan membantu menyelesaikan kendala Anda.',
    confidence: 0.4,
    grounded: false,
    note: 'OFFLINE_FALLBACK: ANTHROPIC_API_KEY tidak diset.',
  });
  return { text, model, tokensIn: 0, tokensOut: 0, costUsd: 0 };
}
