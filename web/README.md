# Genesis AI — Operator Console (web)

Sprint 5 scaffold. Next.js (App Router) sebagai **konsumen API `/v1`** (API First) — tidak ada business logic di sini, semua lewat backend.

## Layar (UX blueprint)
- `/login` — masuk (JWT).
- `/dashboard` — KPI (resolution, escalation, cost) + AI Employees dengan **Trust Ladder control** (ubah autonomy; gate eval backend bisa menolak → ditampilkan).
- `/review` — Review Queue (approve/reject draf, Human Approval).

## Menjalankan (butuh backend hidup)
```bash
# 1) Jalankan backend dulu (folder root): npm run dev  (port 3000)
cd web
cp .env.example .env        # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                 # console di http://localhost:3001
```
Login demo (hasil `npm run db:seed` di backend): `operator@demo.test` / `password123`.

## Status
Scaffold fondasi Sprint 5: login + dashboard + review queue + API client typed.
**Belum**: workspace lengkap, knowledge UI, conversation replay, settings, billing,
onboarding wizard — lihat [../docs/UX.md](../docs/UX.md) & [../docs/SPRINT-PLAN.md](../docs/SPRINT-PLAN.md).
