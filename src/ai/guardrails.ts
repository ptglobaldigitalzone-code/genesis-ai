/**
 * Guardrails deterministik (Handbook §5 — Hard Guardrails).
 * Lapisan ini TIDAK memakai model: aturan keras yang selalu ditegakkan,
 * dapat memaksa eskalasi atau membatasi confidence.
 */

export interface GuardrailInput {
  customerMessage: string;
  answer: string;
  grounded: boolean;
  retrievalScore: number;
}

export interface GuardrailResult {
  forceEscalate: boolean;
  confidenceCap: number;
  reason?: string;
}

// Kata kunci yang menandakan permintaan tindakan/topik sensitif → wajib eskalasi.
const SENSITIVE_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b(refund|pengembalian dana|uang kembali|chargeback)\b/i, reason: 'Permintaan refund di luar wewenang agent' },
  { re: /\b(hukum|legal|tuntut|pengacara|lawsuit|sue)\b/i, reason: 'Topik hukum' },
  { re: /\b(hapus akun|delete account|tutup akun|gdpr|data saya)\b/i, reason: 'Tindakan akun sensitif / privasi' },
  { re: /\b(ancam|bunuh|bahaya|darurat|emergency|threat)\b/i, reason: 'Topik keselamatan/darurat' },
];

// Indikasi prompt-injection di pesan pelanggan.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all )?(previous|above) instructions/i,
  /abaikan (semua )?(instruksi|aturan) (sebelum|di atas)/i,
  /you are now/i,
  /system prompt/i,
];

export function applyGuardrails(input: GuardrailInput): GuardrailResult {
  // 1. Prompt-injection → eskalasi
  for (const re of INJECTION_PATTERNS) {
    if (re.test(input.customerMessage)) {
      return { forceEscalate: true, confidenceCap: 0, reason: 'Terdeteksi indikasi prompt-injection' };
    }
  }

  // 2. Topik sensitif / tindakan di luar wewenang → eskalasi
  for (const p of SENSITIVE_PATTERNS) {
    if (p.re.test(input.customerMessage)) {
      return { forceEscalate: true, confidenceCap: 0.3, reason: p.reason };
    }
  }

  // 3. Tidak grounded atau retrieval lemah → batasi confidence
  if (!input.grounded || input.retrievalScore < 0.2) {
    return { forceEscalate: false, confidenceCap: 0.4 };
  }

  return { forceEscalate: false, confidenceCap: 1 };
}
