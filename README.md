# Genesis AI — AI Workforce Platform

Backend v1.0 (wedge: **AI Customer Support Agent**). Modular monolith TypeScript sesuai [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

> Dokumentasi produk & strategi lengkap ada di [`docs/`](docs/README.md).

## Arsitektur kode

```
src/
  config/         # konfigurasi tervalidasi (Zod, fail-fast)
  lib/            # logger, errors, password, context multi-tenant
  db/             # schema (Drizzle), migrate, seed  ← Postgres + pgvector
  auth/           # JWT, middleware autentikasi & otorisasi role
  ai/             # AI Runtime (moat): provider Claude, embeddings, guardrails
  modules/
    agents/       # CRUD agent + trust ladder (autonomy)
    knowledge/    # ingestion (chunk+embed) & retrieval (RAG)
    conversations/# channel ingress (webhook), transcript
    review/       # review queue: approve/edit/reject
    events/       # action log (system of record) + audit/replay
    metrics/      # KPI dari event log + cost
  workflow/       # Workflow Engine (state machine) — orkestrasi tiket
  queue/          # BullMQ queue + worker (pemrosesan async)
  server.ts       # API Gateway (Fastify)
```

## Menjalankan (lokal)

Prasyarat: Node ≥ 20, Docker.

```bash
cp .env.example .env          # isi ANTHROPIC_API_KEY (opsional — ada mode offline)
npm install
npm run infra:up              # Postgres (pgvector) + Redis via Docker
npm run db:generate           # generate migrasi dari schema
npm run db:migrate            # jalankan migrasi (+ aktifkan ekstensi vector)
npm run db:seed               # data demo (tenant, user, agent, knowledge)

npm run dev                   # API di :3000
npm run dev:worker            # worker pemroses tiket (terminal terpisah)
```

> Tanpa `ANTHROPIC_API_KEY`, AI Runtime memakai **mode offline deterministik** dan
> embedding **stub** — seluruh alur tetap bisa diuji end-to-end tanpa kunci.

## Alur demo (vertical slice Sprint 1–3)

```bash
# 1. Login operator (hasil seed)
curl -s localhost:3000/v1/auth/login -H 'content-type: application/json' \
  -d '{"email":"operator@demo.test","password":"password123"}'
# → simpan token & agentId (ambil agentId dari GET /v1/agents)

TOKEN=...; AGENT=...

# 2. Kirim tiket masuk (channel ingress) → diproses async oleh worker
curl -s localhost:3000/v1/inbound -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d "{\"agentId\":\"$AGENT\",\"message\":\"Berapa lama pengiriman ke luar Jawa?\"}"

# 3. Lihat review queue (agent default = draft_for_approval)
curl -s localhost:3000/v1/review-queue -H "authorization: Bearer $TOKEN"

# 4. Reviewer approve draf  (CONV = conversationId)
curl -s localhost:3000/v1/conversations/$CONV/review -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"action":"approve"}'

# 5. Replay jejak penalaran agent (action log)
curl -s localhost:3000/v1/conversations/$CONV/events -H "authorization: Bearer $TOKEN"

# 6. Metrik (resolution rate, escalation rate, cost per ticket)
curl -s localhost:3000/v1/metrics -H "authorization: Bearer $TOKEN"
```

Coba juga eskalasi otomatis: kirim pesan `"Saya minta refund sekarang"` → guardrail
memaksa **escalated** apa pun autonomy level-nya (Handbook §4–§5).

## Peta Sprint → kode

| Sprint | Cakupan | Lokasi |
|---|---|---|
| **1** | Fondasi, multi-tenancy, auth, agent, event log | `config`, `db`, `auth`, `modules/agents`, `modules/events` |
| **2** | Knowledge Base (RAG) + AI Runtime + guardrails | `modules/knowledge`, `ai/` |
| **3** | Workflow Engine, trust ladder, queue, review, metrics | `workflow`, `queue`, `modules/{conversations,review,metrics}` |
| **4** | Eval harness + autonomy gating *(inti — sebagian)* | `ai/decision.ts`, `eval/` |

Jalankan eval: `npm run eval` (deterministik, tanpa DB/API key; exit≠0 bila safety gate gagal → siap CI).

## Status

Backend vertical slice yang runnable + eval harness keselamatan dengan autonomy gating
(naik ke `act_with_review`/`autonomous` diblokir bila eval belum lolos — terverifikasi).
Yang **belum** dari Sprint 4: Postgres RLS, rate limiting, OpenAPI, prosedur tenant data
erasure, integration test (butuh Docker). Sprint 5 (UI console) belum mulai.
Lihat [docs/SPRINT-PLAN.md](docs/SPRINT-PLAN.md).
