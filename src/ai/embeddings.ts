import { createHash } from 'node:crypto';
import { config } from '../config/index.js';

/**
 * Lapisan embedding model-agnostic.
 * - provider 'stub': embedding deterministik berbasis hash (untuk dev/test tanpa kunci).
 *   BUKAN semantik — hanya supaya pipeline bisa jalan end-to-end.
 * - provider 'voyage'/'anthropic': sambungkan SDK di sini (TODO produksi).
 *
 * Kontrak: input teks → vektor float panjang EMBED_DIM, ter-normalisasi.
 */
export async function embed(text: string): Promise<number[]> {
  switch (config.EMBED_PROVIDER) {
    case 'stub':
      return stubEmbed(text);
    default:
      // Placeholder: di produksi panggil API embedding sungguhan.
      return stubEmbed(text);
  }
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(embed));
}

/**
 * Embedding deterministik: hash → seed → vektor pseudo-acak ter-normalisasi.
 * Teks identik selalu menghasilkan vektor identik (cukup untuk uji pipeline).
 */
function stubEmbed(text: string): number[] {
  const dim = config.EMBED_DIM;
  const vec = new Array<number>(dim).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);

  for (const tok of tokens) {
    const h = createHash('sha256').update(tok).digest();
    for (let i = 0; i < dim; i++) {
      // sebar pengaruh token ke beberapa dimensi
      const b = h[i % h.length] ?? 0;
      vec[i] = (vec[i] ?? 0) + ((b / 255) * 2 - 1);
    }
  }

  // normalisasi L2
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
