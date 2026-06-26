# Genesis AI — Sprint Plan (Sprint 1–5)

> **Versi:** 2.0 · **Owner:** CTO · **Tanggal:** 2026-06-26
> Mengacu ke [PRD.md](PRD.md), [PRD-MASTER.md](PRD-MASTER.md), [ARCHITECTURE.md](ARCHITECTURE.md), [UX.md](UX.md), [ENGINEERING-BIBLE.md](ENGINEERING-BIBLE.md)

## Status ringkas

| Sprint | Fokus | Status | PRD milestone |
|---|---|---|---|
| **1** | Fondasi & Multi-tenancy | ✅ **Selesai** | M1 |
| **2** | Knowledge Base & AI Runtime | ✅ **Selesai** | M1→M2 |
| **3** | Workflow, Trust Ladder, Queue, Review, Metrics | ✅ **Selesai** | M2 |
| **4** | Quality & Safety: Eval harness + hardening + keamanan | 🚧 **Berjalan** (eval, gating, rate limit, kill switch, erasure, OpenAPI ✅; sisa: RLS, CI/e2e) | M2→M3 |
| **5** | Operator Console (UI) + onboarding self-serve | 🚧 **Mulai** (scaffold: login, dashboard+trust ladder, review queue) | M3 (v1.0) |

> Sprint sequensial, di-gate oleh pembelajaran (bukan tanggal kaku). Definition of Done global: [ENGINEERING-BIBLE.md §13](ENGINEERING-BIBLE.md).

## Stack yang dikunci

| Layer | Pilihan |
|---|---|
| Bahasa | TypeScript end-to-end |
| API / server | Fastify |
| DB | PostgreSQL + pgvector |
| ORM / migrasi | Drizzle ORM |
| Cache / Queue | Redis + BullMQ |
| Validasi | Zod |
| Model AI | Anthropic Claude (model-agnostic runtime) |
| Auth | JWT (v1) → managed (Clerk/Auth0/WorkOS) |
| UI | Next.js (React) |

---

## ✅ Sprint 1 — Fondasi & Multi-tenancy  *(Selesai)*

**Goal:** kerangka aplikasi jalan, tenant terisolasi, agent bisa dibuat.
- Project scaffolding (modular monolith), config fail-fast, Docker (Postgres+Redis).
- DB schema + migrasi (9 tabel), event log append-only.
- Multi-tenancy `tenant_id` + tenant context dari token.
- Auth JWT + role (operator/reviewer), API Gateway Fastify, modul Agent.

**DoD:** ✅ register → login → buat agent → set autonomy, semua ter-scope tenant, tiap aksi tercatat di event log. (Typecheck bersih.)

## ✅ Sprint 2 — Knowledge Base & AI Runtime  *(Selesai)*

**Goal:** agent bisa belajar & menjawab grounded.
- Ingestion: chunk → embed → pgvector. Retrieval RAG ter-scope tenant+agent.
- AI Runtime: provider abstraction (Claude), grounding, guardrails, confidence/escalation, cost capture.

**DoD:** ✅ pertanyaan → retrieve → draf grounded + confidence; knowledge kosong → escalate. (11/11 core test lulus.)

## ✅ Sprint 3 — Workflow, Trust Ladder, Queue, Review, Metrics  *(Selesai)*

**Goal:** alur end-to-end satu tiket sesuai trust ladder, async.
- Channel ingress (webhook simulasi), Queue BullMQ + worker, Workflow Engine (state machine).
- Trust ladder (4 level), review queue (approve/edit/reject), metrics dari event log.

**DoD:** ✅ tiket → worker → sesuai autonomy: draf ke review queue ATAU terkirim; semua jadi event; reviewer bertindak; metrik terbaca.

---

## 🚧 Sprint 4 — Quality & Safety (Eval Harness + Hardening)  *(berjalan)*

**Goal:** membuat keandalan **terukur & ter-gate** — prasyarat menjual AI sebagai tenaga kerja, dan gerbang sebelum agent boleh `autonomous`. Ini membayar utang prioritas yang ditandai sejak awal.

**Scope & status:**
1. ✅ **Eval harness (inti sprint)** — `src/eval/`: dataset 12 kasus (guardrail, no_knowledge, low_confidence, happy_path), penilaian berbasis properti, skor agregat + ambang. `npm run eval` (deterministik, exit≠0 bila gagal). 12/12 lulus.
2. ✅ **Autonomy gating** — `act_with_review`/`autonomous` di-gate eval keselamatan (`src/eval/gating.ts`), tersambung ke route autonomy. Terverifikasi memblokir saat safety bocor.
3. ✅ **Rate limiting** — IP global + per-tenant di jalur mahal (`src/lib/ratelimit.ts`), respons 429. 6/6 test lulus.
4. ✅ **Kill switch** — `POST /v1/kill-switch` turunkan semua agent ke level aman seketika.
5. ✅ **Tenant data erasure** — `POST /v1/tenant/erase` (`src/modules/tenants/erasure.ts`): cascade inti + hapus eksplisit tabel log tanpa-FK, transaksional. Membayar utang GDPR DATABASE §6.
6. 🟡 **Postgres RLS** — ditulis: `src/db/rls.sql` (policies + FORCE) + helper `withTenant()` + `npm run db:rls`. Sengaja **belum auto-enable** (agar app jalan tak terganggu); aktivasi & verifikasi menunggu DB.
7. ✅ **OpenAPI** dari schema Zod (single source) → `/openapi.json` + Swagger UI `/docs`. 18 endpoint, terverifikasi via `app.inject()` tanpa DB (`npm run openapi`).
8. ⏳ **CI integration** + **integration tests** end-to-end *(belum — butuh Docker untuk DB+Redis)*.
9. ⏳ Audit `npm audit` kritikal beres *(belum)*.

**DoD (sebagian tercapai):** eval harness ✅; `autonomous` ter-gate ✅; rate limit ✅; kill switch ✅; erasure ✅; **OpenAPI ✅**. Sisa: RLS, CI/integration test, audit.

**Dependency:** Sprint 1–3. **Risiko:** kualitas dataset eval menentukan nilai gate — butuh contoh nyata dari design partner. Item tersisa butuh Docker/DB untuk verifikasi runtime.

## 🚧 Sprint 5 — Operator Console (UI) + Onboarding Self-Serve  *(scaffold dimulai)*

**Goal:** mewujudkan [UX blueprint](UX.md) jadi console nyata sehingga operator non-teknis bisa jalan **< 1 hari** tanpa bantuan (target M3 / v1.0).

**Status awal (sudah ada di `web/`, Next.js, typecheck bersih):** `/login`, `/dashboard` (KPI + Trust Ladder control), `/review` (review queue approve/reject), API client typed (konsumen `/v1`). **Belum:** workspace lengkap, knowledge UI, conversation replay, settings, billing, onboarding wizard, managed auth.

**Scope (Next.js, konsumen API `/v1` — API First):**
1. **Auth & onboarding wizard** — signup → buat agent ("Hire Agent") → ingest knowledge → set channel → live. Target TTV < 1 hari.
2. **Dashboard** — KPI (resolution, escalation accuracy, cost/ticket, CSAT, action success), tiap kartu dapat ditelusuri.
3. **Workspace & AI Employee detail** — kelola agent, **Trust Ladder control** (gate bukti terlihat), riwayat perubahan.
4. **Review Queue** — approve/edit/reject cepat, confidence + sumber knowledge terlihat.
5. **Knowledge** — ingest/kurasi, **gap detection** dari pola eskalasi, "uji pertanyaan".
6. **Conversation replay** — visualisasi jejak event (traceability di UI).
7. **Settings** — team & roles, channel integration, escalation/disclosure policy.
8. **Billing (dasar)** — penggunaan vs kuota, nilai (jam dihemat) vs biaya, invoice.
9. **Managed auth** — migrasi JWT → Clerk/Auth0/WorkOS (siap SSO enterprise).

**DoD:** operator baru bisa onboarding sampai tiket pertama tertangani **tanpa bantuan dalam < 1 hari**; semua layar UX inti berfungsi sebagai konsumen API; replay & dashboard terhubung ke data nyata.

**Dependency:** Sprint 4 (API stabil, OpenAPI, rate limit). **Catatan:** integrasi channel **nyata** (email/help-desk produksi dengan HMAC) bisa masuk akhir Sprint 5 atau Sprint 6, tergantung kebutuhan design partner.

---

## Setelah Sprint 5 (backlog Phase 1→2)

- Integrasi channel produksi (email/help-desk) + signed inbound webhooks.
- Outbound webhooks & event subscription (API-DESIGN §6–§7).
- Feedback loop → perbaikan retrieval/prompt otomatis dari koreksi reviewer.
- Agent/job kedua (mis. AI SDR) → mesin ekspansi (NRR).
- SOC 2 readiness saat permintaan enterprise muncul.

## Peta Sprint → kode/dokumen

| Sprint | Lokasi utama |
|---|---|
| 1 | `config`, `db`, `auth`, `modules/agents`, `modules/events` |
| 2 | `modules/knowledge`, `ai/` |
| 3 | `workflow`, `queue`, `modules/{conversations,review,metrics}` |
| 4 | `eval/` (baru), `test/` (baru), RLS migration, rate-limit middleware |
| 5 | `web/` (Next.js, baru) |

*Implementasi tetap modular monolith; batas modul bersih agar bisa dipecah jadi microservices saat skala menuntut.*
