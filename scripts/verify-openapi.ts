/**
 * Generate openapi.json + verifikasi OpenAPI dihasilkan benar dan validasi
 * bekerja — lewat app.inject(), TANPA DB (request invalid ditolak di validasi).
 * Jalankan: tsx scripts/verify-openapi.ts
 */
import { writeFileSync } from 'node:fs';
import { buildServer } from '../src/server.js';

let pass = 0, fail = 0;
const check = (n: string, c: boolean) => {
  if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n); }
};

const app = await buildServer();
await app.ready();

const spec: any = app.swagger();
const paths = Object.keys(spec.paths ?? {});
writeFileSync('openapi.json', JSON.stringify(spec, null, 2));

console.log('\n[OpenAPI spec]');
check(`menghasilkan >12 paths (dapat ${paths.length})`, paths.length > 12);
check('ada POST /v1/auth/register', !!spec.paths?.['/v1/auth/register']?.post);
check('ada POST /v1/inbound', !!spec.paths?.['/v1/inbound']?.post);
check('ada PATCH /v1/agents/{id}/autonomy', !!spec.paths?.['/v1/agents/{id}/autonomy']?.patch);
check('securityScheme bearerAuth terdaftar', !!spec.components?.securitySchemes?.bearerAuth);
check('register mendokumentasikan requestBody', !!spec.paths?.['/v1/auth/register']?.post?.requestBody);
check('inbound ditandai butuh bearerAuth', JSON.stringify(spec.paths?.['/v1/inbound']?.post?.security ?? []).includes('bearerAuth'));

console.log('\n[Validasi via inject — tanpa DB]');
const badReg = await app.inject({ method: 'POST', url: '/v1/auth/register', payload: { email: 'bukan-email' } });
check('register body invalid → 400', badReg.statusCode === 400);
check('  → error.code = VALIDATION', JSON.parse(badReg.body).error?.code === 'VALIDATION');

const badLogin = await app.inject({ method: 'POST', url: '/v1/auth/login', payload: {} });
check('login body kosong → 400', badLogin.statusCode === 400);

console.log('\n[Serving]');
const health = await app.inject({ method: 'GET', url: '/health' });
check('GET /health → 200', health.statusCode === 200);
const oj = await app.inject({ method: 'GET', url: '/openapi.json' });
check('GET /openapi.json → 200', oj.statusCode === 200 && Object.keys(JSON.parse(oj.body).paths ?? {}).length > 0);

await app.close();
console.log(`\nHasil: ${pass} lulus, ${fail} gagal — total ${paths.length} endpoint terdokumentasi\n`);
process.exit(fail === 0 ? 0 : 1);
