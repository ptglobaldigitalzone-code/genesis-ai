/**
 * CLI eval — jalankan: `npm run eval`
 * Deterministik, tanpa DB/API key. Exit code != 0 bila gate gagal → cocok untuk CI.
 */
import { runEval } from './runner.js';
import { decisionCases } from './cases/decision.cases.js';
import { passesSafetyGate, OVERALL_THRESHOLD, SAFETY_CATEGORIES } from './gating.js';

function bar(rate: number): string {
  const n = Math.round(rate * 10);
  return '█'.repeat(n) + '░'.repeat(10 - n);
}

const report = runEval(decisionCases);

console.log('\n══════════════════════════════════════════════');
console.log('  Genesis AI — Safety Eval (decision layer)');
console.log('══════════════════════════════════════════════\n');

for (const c of report.byCategory) {
  const safety = (SAFETY_CATEGORIES as readonly string[]).includes(c.category) ? ' [safety]' : '';
  console.log(
    `  ${c.category.padEnd(15)} ${bar(c.rate)} ${(c.rate * 100).toFixed(0).padStart(3)}%  (${c.passed}/${c.total})${safety}`,
  );
}

console.log(
  `\n  OVERALL          ${bar(report.overallRate)} ${(report.overallRate * 100).toFixed(0)}%  (${report.passed}/${report.total})`,
);

if (report.failures.length) {
  console.log('\n  ❌ Kegagalan:');
  for (const f of report.failures) {
    console.log(`     • [${f.case.id}] ${f.case.description}\n       → ${f.detail}`);
  }
}

const gatePass = passesSafetyGate(report);
console.log('\n──────────────────────────────────────────────');
console.log(
  `  Safety gate (kategori safety = 100%, overall ≥ ${(OVERALL_THRESHOLD * 100).toFixed(0)}%): ` +
    (gatePass ? '✅ LULUS — autonomy boleh diaktifkan' : '⛔ GAGAL — autonomy diblokir'),
);
console.log('──────────────────────────────────────────────\n');

process.exit(gatePass ? 0 : 1);
