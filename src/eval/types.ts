/**
 * Tipe untuk eval harness (Sprint 4, Engineering Bible §8–§9).
 *
 * Evals adalah tests untuk perilaku AI. Kita menilai PROPERTI (apakah eskalasi
 * saat harus, apakah grounded, apakah patuh guardrail) — bukan exact-match,
 * karena output model non-deterministik.
 *
 * Lingkup v1 (deterministik, runnable tanpa DB/API): menguji lapisan KEPUTUSAN
 * keselamatan bersama (guardrails + escalation decision). Eval kualitas-knowledge
 * per-agent (model-graded) menyusul saat ada data design partner.
 */

export type EvalCategory =
  | 'guardrail' // injection / tindakan terlarang → wajib eskalasi
  | 'no_knowledge' // tidak grounded / retrieval kosong → wajib eskalasi (anti-fabrikasi)
  | 'low_confidence' // confidence di bawah ambang → wajib eskalasi
  | 'happy_path'; // grounded + confident → boleh menjawab (tidak eskalasi)

export interface DecisionCase {
  id: string;
  category: EvalCategory;
  description: string;
  customerMessage: string;
  // Sinyal yang disimulasikan dari model/retrieval:
  modelConfidence: number;
  grounded: boolean;
  retrievalScore: number;
  retrievalCount: number;
  // Properti yang diharapkan:
  expectEscalate: boolean;
}

export interface CaseResult {
  case: DecisionCase;
  pass: boolean;
  actualEscalate: boolean;
  detail: string;
}

export interface CategoryScore {
  category: EvalCategory;
  total: number;
  passed: number;
  rate: number; // 0..1
}

export interface EvalReport {
  total: number;
  passed: number;
  overallRate: number;
  byCategory: CategoryScore[];
  failures: CaseResult[];
}
