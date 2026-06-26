/**
 * Verifikasi runtime logika rate limiter (murni, tanpa Redis).
 * Jalankan: tsx scripts/verify-ratelimit.ts
 */
import { InMemoryStore, checkRateLimit } from '../src/lib/ratelimit.js';

let pass = 0, fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

const store = new InMemoryStore();
const cfg = { limit: 3, windowSec: 60 };
const now = 1_000_000_000_000; // waktu tetap → deterministik

console.log('\n[Rate limiter]');
const r1 = await checkRateLimit(store, 'tenantA', cfg, now);
const r2 = await checkRateLimit(store, 'tenantA', cfg, now);
const r3 = await checkRateLimit(store, 'tenantA', cfg, now);
const r4 = await checkRateLimit(store, 'tenantA', cfg, now);

check('request 1 allowed, remaining 2', r1.allowed && r1.remaining === 2);
check('request 3 allowed, remaining 0', r3.allowed && r3.remaining === 0);
check('request 4 DIBLOKIR (melebihi limit)', r4.allowed === false);
check('resetSec di dalam window (0..60)', r4.resetSec > 0 && r4.resetSec <= 60);

// Tenant lain tidak terpengaruh (isolasi per-id)
const b1 = await checkRateLimit(store, 'tenantB', cfg, now);
check('tenant lain punya kuota sendiri', b1.allowed && b1.remaining === 2);

// Window berikutnya → kuota reset
const next = now + 60_000;
const n1 = await checkRateLimit(store, 'tenantA', cfg, next);
check('window baru → kuota reset (allowed lagi)', n1.allowed && n1.remaining === 2);

console.log(`\nHasil: ${pass} lulus, ${fail} gagal\n`);
process.exit(fail === 0 ? 0 : 1);
