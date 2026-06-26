# Genesis AI — Indeks Dokumentasi

> Status keseluruhan: **DRAFT** — menunggu konfirmasi founder atas 2 asumsi inti (thesis = *AI workforce*, wedge = *customer support*). Begitu dikonfirmasi, semua naik ke **v1.0**.

## Dokumen Inti

| Dokumen | EN | ID | Isi |
|---|---|---|---|
| **Vision 2030** ⭐ | [VISION-2030.md](VISION-2030.md) | — | North Star perusahaan — why we exist, visi 10-tahun, mission, market, competitive advantage, core values |
| **Foundation** | [FOUNDATION.md](FOUNDATION.md) | [FOUNDATION.id.md](FOUNDATION.id.md) | Vision, Mission, Values, Product/Engineering Principles, Business Model, Revenue, GTM, Competitive, Pricing, Target Customer |
| **Master PRD** | [PRD-MASTER.md](PRD-MASTER.md) | — | Single source of truth tingkat-perusahaan — 19 bagian (exec summary → roadmap), seluruh produk |
| **PRD (v1.0)** | [PRD.md](PRD.md) | [PRD.id.md](PRD.id.md) | Requirement produk v1.0 (AI Customer Support Agent) — 21 FR, KPI, persona, risiko, rilis |
| **High-Level Architecture** | — | [HIGH-LEVEL-ARCHITECTURE.md](HIGH-LEVEL-ARCHITECTURE.md) | Pandangan C4 + diagram Mermaid: system context, data flow, deployment, monitoring, dll |
| **Database** | — | [DATABASE.md](DATABASE.md) | ERD, desain, normalisasi, index, relasi, data ownership — formalisasi `src/db/schema.ts` |
| **API Design** | — | [API-DESIGN.md](API-DESIGN.md) | REST, GraphQL?, auth, rate limit, OpenAPI, webhooks, events — cerminan API v1 |
| **Architecture (detail)** | [ARCHITECTURE.md](ARCHITECTURE.md) | [ARCHITECTURE.id.md](ARCHITECTURE.id.md) | System design: microservices, API Gateway, DB, Auth, Queue, AI Runtime, Workflow Engine, Knowledge Base, Event Bus |
| **AI Employee Handbook** | — | [AI-EMPLOYEE-HANDBOOK.md](AI-EMPLOYEE-HANDBOOK.md) | Standar perilaku, kode etik, trust ladder, eskalasi, guardrail, KPI AI employee |
| **Product Principles** | — | [PRODUCT-PRINCIPLES.md](PRODUCT-PRINCIPLES.md) | 10 prinsip produk + urutan prioritas saat bertabrakan (AI First, Human Approval, Traceable, dst) |
| **UX** | — | [UX.md](UX.md) | Blueprint UX: user/customer journey, navigasi, dan wireframe tiap layar (dashboard, workspace, dll) |
| **Engineering Bible** | — | [ENGINEERING-BIBLE.md](ENGINEERING-BIBLE.md) | Standar rekayasa: coding, keamanan, DB, API, AI engineering, testing, git, review, DoD, ADR |
| **Sprint Plan** | — | [SPRINT-PLAN.md](SPRINT-PLAN.md) | Stack terkunci + roadmap Sprint 1–5 (1–3 selesai, 4–5 direncanakan) |
| **ADR** | — | [adr/README.md](adr/README.md) | Architecture Decision Records (ADR-0001…0008) — keputusan teknis + alternatif yang ditolak |

## Alur Proses (gate persetujuan)

```
Foundation  →  PRD  →  Architecture  →  Handbook  →  [BUTUH APPROVAL]
                                                          ↓
                                    Data Schema + API Contracts  →  Sprint 1 Backlog  →  BUILD
```

## Keputusan yang Masih Menunggu Founder

1. Konfirmasi **thesis** (AI workforce platform) — atau arahkan ke produk lain.
2. Konfirmasi **wedge vertical** (customer support) — atau pilih lain (SDR / document ops).
3. Keputusan arsitektur: modular-monolith-first, pgvector, managed auth, TypeScript end-to-end.
4. Channel v1.0 (email/shared inbox vs help-desk tertentu) + akses 3–5 design partner.
5. Constraint: cloud/region, kepatuhan (GDPR/SOC2), budget, preferensi stack.
