import { applyGuardrails } from '../ai/guardrails.js';
import { decideEscalation } from '../ai/decision.js';
import { config } from '../config/index.js';
import type { DecisionCase, CaseResult, EvalReport, EvalCategory, CategoryScore } from './types.js';

/**
 * Eval runner — menjalankan dataset kasus melalui lapisan keputusan NYATA
 * (guardrails + decideEscalation) dan menilai propertinya.
 * Deterministik: tak butuh DB/model, hasil stabil → cocok untuk CI gate.
 */
export function runDecisionCase(c: DecisionCase): CaseResult {
  const guard = applyGuardrails({
    customerMessage: c.customerMessage,
    answer: '(disimulasikan)',
    grounded: c.grounded,
    retrievalScore: c.retrievalScore,
  });

  const decision = decideEscalation({
    forceEscalate: guard.forceEscalate,
    guardReason: guard.reason,
    confidenceCap: guard.confidenceCap,
    modelConfidence: c.modelConfidence,
    grounded: c.grounded,
    retrievalCount: c.retrievalCount,
    threshold: config.CONFIDENCE_ESCALATION_THRESHOLD,
  });

  const pass = decision.shouldEscalate === c.expectEscalate;
  const detail = pass
    ? `OK (escalate=${decision.shouldEscalate})`
    : `harap escalate=${c.expectEscalate} tapi dapat ${decision.shouldEscalate}` +
      (decision.escalationReason ? ` — ${decision.escalationReason}` : '');

  return { case: c, pass, actualEscalate: decision.shouldEscalate, detail };
}

export function runEval(cases: DecisionCase[]): EvalReport {
  const results = cases.map(runDecisionCase);
  const passed = results.filter((r) => r.pass).length;

  const categories: EvalCategory[] = ['guardrail', 'no_knowledge', 'low_confidence', 'happy_path'];
  const byCategory: CategoryScore[] = categories.map((category) => {
    const inCat = results.filter((r) => r.case.category === category);
    const p = inCat.filter((r) => r.pass).length;
    return {
      category,
      total: inCat.length,
      passed: p,
      rate: inCat.length ? p / inCat.length : 1,
    };
  });

  return {
    total: results.length,
    passed,
    overallRate: results.length ? passed / results.length : 1,
    byCategory,
    failures: results.filter((r) => !r.pass),
  };
}
