/**
 * Chunking sederhana berbasis paragraf dengan batas ukuran & overlap.
 * Iterasi berikutnya: chunking semantik (per heading/struktur).
 */
export function chunkText(text: string, opts?: { maxChars?: number; overlap?: number }): string[] {
  const maxChars = opts?.maxChars ?? 1200;
  const overlap = opts?.overlap ?? 150;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = '';

  for (const para of paragraphs) {
    if ((buffer + '\n\n' + para).length > maxChars && buffer) {
      chunks.push(buffer.trim());
      // mulai buffer baru dengan overlap dari ekor sebelumnya
      buffer = buffer.slice(Math.max(0, buffer.length - overlap)) + '\n\n' + para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());

  // pecah chunk yang masih terlalu panjang (paragraf tunggal raksasa)
  const final: string[] = [];
  for (const c of chunks) {
    if (c.length <= maxChars) {
      final.push(c);
    } else {
      for (let i = 0; i < c.length; i += maxChars - overlap) {
        final.push(c.slice(i, i + maxChars));
      }
    }
  }
  return final;
}
