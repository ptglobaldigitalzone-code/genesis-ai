/**
 * Keputusan eskalasi — fungsi MURNI & deterministik (Engineering Bible §8).
 * Diekstrak dari AI Runtime agar bisa diuji & dievaluasi tanpa DB/model.
 * Inilah inti "deterministic shell around non-determinism": konten dari model,
 * tapi KEPUTUSAN (kirim / eskalasi) ditegakkan kode yang teruji.
 */
export interface DecisionInput {
  /** Guardrail memaksa eskalasi (injection / tindakan terlarang). */
  forceEscalate: boolean;
  /** Alasan dari guardrail bila forceEscalate. */
  guardReason?: string;
  /** Batas atas confidence dari guardrail (0..1). */
  confidenceCap: number;
  /** Confidence mentah dari model (0..1). */
  modelConfidence: number;
  /** Apakah jawaban grounded pada knowledge. */
  grounded: boolean;
  /** Jumlah chunk knowledge yang ter-retrieve. */
  retrievalCount: number;
  /** Ambang confidence minimum untuk tidak eskalasi. */
  threshold: number;
}

export interface Decision {
  confidence: number;
  shouldEscalate: boolean;
  escalationReason?: string;
}

export function decideEscalation(i: DecisionInput): Decision {
  const confidence = Math.min(i.modelConfidence, i.confidenceCap);
  const noKnowledge = !i.grounded || i.retrievalCount === 0;
  const lowConfidence = confidence < i.threshold;
  const shouldEscalate = i.forceEscalate || noKnowledge || lowConfidence;

  let escalationReason: string | undefined;
  if (i.forceEscalate) escalationReason = i.guardReason;
  else if (noKnowledge) escalationReason = 'Pengetahuan tidak memadai untuk menjawab dengan yakin';
  else if (lowConfidence) escalationReason = 'Confidence di bawah ambang';

  return { confidence, shouldEscalate, escalationReason };
}
