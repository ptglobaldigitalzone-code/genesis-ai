# Genesis AI — High-Level Architecture

> **Versi:** 1.0 · **Owner:** CTO · **Tanggal:** 2026-06-26
> **Status:** Pandangan tingkat-tinggi (C4-style). Detail mendalam ada di [ARCHITECTURE.md](ARCHITECTURE.md).
> **Terkait:** [PRD-MASTER.md](PRD-MASTER.md) · [PRODUCT-PRINCIPLES.md](PRODUCT-PRINCIPLES.md) · [ENGINEERING-BIBLE.md](ENGINEERING-BIBLE.md)
> **Catatan:** Diagram memakai Mermaid — ter-render otomatis di GitHub/GitLab/IDE.

---

## 1. System Context

Siapa memakai Genesis dan dengan sistem luar apa ia bicara. (C4 Level 1.)

```mermaid
flowchart TB
    Operator([👤 Operator<br/>buat & awasi agent])
    Reviewer([👤 Reviewer<br/>approve/edit draf])
    Customer([👤 End Customer<br/>kirim pertanyaan])

    subgraph Genesis[Genesis AI Platform]
        Core[AI Workforce Platform<br/>agent otonom + pengawasan manusia]
    end

    Channel[[Support Channel<br/>email / help-desk]]
    Models[[Foundation Model Provider<br/>Anthropic Claude — model-agnostic]]
    Embed[[Embedding Provider<br/>stub / voyage]]

    Operator -->|kelola agent, lihat metrik| Core
    Reviewer -->|tindak review queue| Core
    Customer -->|tiket masuk| Channel
    Channel <-->|webhook in / balasan out| Core
    Core -->|panggilan reasoning| Models
    Core -->|embed knowledge & query| Embed
    Core -->|notifikasi/balasan| Channel
```

**Inti:** End Customer tidak pernah menyentuh Genesis langsung — ia berinteraksi lewat channel bisnis. Operator & Reviewer adalah pengguna sebenarnya. Model & embedding adalah dependency yang **bisa ditukar** (No Vendor Lock-In).

---

## 2. Microservices (Container View)

Modular monolith dengan batas modul tegas — siap diekstrak. (C4 Level 2.)

```mermaid
flowchart TB
    Web[Web Console<br/>React/Next.js]

    subgraph GW[API Gateway · Fastify]
        Auth[AuthN/Z · rate limit · routing · tenant scope]
    end

    subgraph Core[Core Services · modular monolith]
        Ident[Identity & Tenant]
        Agent[Agent / Workspace]
        Conv[Conversation / Ticket]
        KB[Knowledge Base]
        WF[Workflow Engine]
        AIRT[AI Runtime]
        Metrics[Metrics / Cost]
    end

    Ingress[Channel Ingress<br/>webhook / email]
    Queue[(Queue · BullMQ/Redis)]
    Worker[Agent Workers<br/>Workflow + AI Runtime]
    Bus[(Event Bus · append-only log)]
    DB[(PostgreSQL + pgvector)]
    Redis[(Redis · cache)]

    Web --> GW
    Ingress --> GW
    GW --> Core
    Ingress -->|enqueue| Queue
    Queue --> Worker
    Worker --> AIRT
    Worker --> WF
    Core --> DB
    Worker --> DB
    Core -->|emit| Bus
    Worker -->|emit| Bus
    Bus --> Metrics
    AIRT -->|model-agnostic| Models[[Claude]]
    Core --> Redis
```

| Service | Tanggung jawab | Fase 1 |
|---|---|---|
| Identity & Tenant | org, user, role, isolasi | modul + managed auth |
| Agent / Workspace | config agent, autonomy | modul |
| Channel Ingress | webhook/email in-out | modul + worker |
| Conversation/Ticket | thread, status, eskalasi | modul |
| Knowledge Base | ingest + retrieval (RAG) | modul + ingest worker |
| Workflow Engine | orkestrasi tiket | worker (state machine) |
| AI Runtime | panggilan model + guardrail | library |
| Metrics/Cost | agregasi event → KPI | consumer |

---

## 3. Data Flow — Siklus Hidup Satu Tiket

Jalur kritis end-to-end, async. (C4 dynamic view.)

```mermaid
sequenceDiagram
    participant C as Customer
    participant CH as Channel Ingress
    participant GW as API Gateway
    participant Q as Queue (BullMQ)
    participant W as Agent Worker
    participant WF as Workflow Engine
    participant KB as Knowledge Base
    participant AI as AI Runtime
    participant M as Model (Claude)
    participant DB as Postgres
    participant EV as Event Log

    C->>CH: kirim pertanyaan
    CH->>GW: POST /v1/inbound
    GW->>DB: buat conversation + message (tenant-scoped)
    GW->>EV: ticket.received
    GW->>Q: enqueue (jobId = ticket:<id>)
    Q->>W: dispatch job
    W->>WF: runSupportWorkflow()
    WF->>KB: retrieve(query) — tenant+agent scoped
    KB-->>WF: top-k chunks (grounding)
    WF->>AI: draftReply(context)
    AI->>M: complete() + guardrails
    M-->>AI: jawaban + confidence
    AI->>DB: catat cost (token, $)
    AI-->>WF: draft + shouldEscalate
    EV-->>EV: agent.retrieved / agent.drafted
    alt escalate (guardrail / low confidence)
        WF->>DB: status = escalated
        WF->>EV: agent.escalated
    else trust ladder
        WF->>DB: kirim / antri review sesuai autonomy
        WF->>EV: agent.sent / queued_for_review
    end
    WF-->>W: outcome
```

**Prinsip yang terlihat:** async (Queue), grounded (KB sebelum model), deterministic shell (guardrail di AI Runtime), traceable (setiap langkah → Event Log), cost tercatat tiap panggilan.

---

## 4. Workflow Engine & Trust Ladder

Mesin keputusan tiap tiket — dan jenjang otonomi yang ditegakkannya.

```mermaid
stateDiagram-v2
    [*] --> Classify
    Classify --> Retrieve
    Retrieve --> Draft
    Draft --> Guardrail
    Guardrail --> Decide

    Decide --> Escalated: guardrail / low confidence / no knowledge
    Decide --> Suggest: autonomy = suggest
    Decide --> Review: autonomy = draft_for_approval
    Decide --> Sent: autonomy = act_with_review / autonomous

    Suggest --> [*]: draf internal saja
    Review --> Sent: reviewer approve/edit
    Review --> Escalated: reviewer reject
    Escalated --> [*]: ditangani manusia
    Sent --> [*]: resolved
```

**Aturan keras:** eskalasi **selalu menang** apa pun autonomy level (Human Approval > AI First). Naik ke `autonomous` digate eval (Engineering Bible §8).

---

## 5. Authentication & Tenant Scoping

```mermaid
sequenceDiagram
    participant U as Operator/Reviewer
    participant GW as API Gateway
    participant A as Auth (JWT)
    participant DB as Postgres

    U->>GW: POST /v1/auth/login (email, password)
    GW->>DB: cek user + verify scrypt hash
    DB-->>GW: user {id, tenantId, role}
    GW->>A: sign JWT {userId, tenantId, role}
    A-->>U: token (7d)
    Note over U,GW: request berikutnya
    U->>GW: Bearer token
    GW->>A: verify → req.auth {tenantId, role}
    GW->>GW: requireRole(...) bila perlu
    GW->>DB: query SELALU difilter req.auth.tenantId
```

**Non-negotiable:** `tenantId` selalu dari token, tak pernah dari input klien. Default deny. Roadmap: managed auth (Clerk/Auth0/WorkOS) + Postgres RLS sebagai lapis kedua.

---

## 6. Knowledge Base (RAG)

Dua jalur: ingestion (write) & retrieval (read).

```mermaid
flowchart LR
    subgraph Ingest[Ingestion · write path]
        Src[Source<br/>docs / help-center / Q&A] --> Chunk[Chunk]
        Chunk --> Emb[Embed]
        Emb --> Store[(pgvector<br/>tenant+agent scoped)]
    end
    subgraph Retrieve[Retrieval · read path]
        Qy[Query tiket] --> QEmb[Embed query]
        QEmb --> Search{{Similarity search<br/>cosine, tenant-scoped}}
        Store --> Search
        Search --> TopK[Top-k chunks + authority]
        TopK --> Ground[Grounding → AI Runtime]
    end
```

**Kontrak grounding:** jawaban harus bersumber dari KB; bila kosong/lemah → eskalasi, bukan menebak. Koreksi reviewer memperkaya aset ini (Knowledge Is Company Asset).

---

## 7. AI Runtime — Deterministic Shell

Lapisan moat: membungkus model non-deterministik dengan scaffolding deterministik.

```mermaid
flowchart TB
    In[Pesan pelanggan + konteks KB] --> PA[Prompt Assembly<br/>voice + knowledge + aturan]
    PA --> Prov[Provider Abstraction<br/>model-agnostic]
    Prov --> M[[Claude · retry+backoff]]
    M --> Parse[Validasi output Zod<br/>untrusted → safe fallback]
    Parse --> GR[Guardrails deterministik<br/>injection / tindakan terlarang]
    GR --> Conf[Confidence + keputusan eskalasi]
    Conf --> Cost[Cost capture · token/$]
    Cost --> Out[Draft + shouldEscalate + sources]
```

**Prinsip:** output model = untrusted input (selalu divalidasi); guardrail ditegakkan kode bukan diserahkan ke model; tiap panggilan dicatat biayanya.

---

## 8. Event Bus

```mermaid
flowchart LR
    P1[Core Services] -->|emit| OB[(events table<br/>APPEND ONLY)]
    P2[Agent Workers] -->|emit| OB
    OB -->|outbox → fan-out| Stream[(Redis Streams<br/>→ Kafka kelak)]
    Stream --> Cm[Metrics/Cost projector]
    Stream --> Ca[Audit / Replay]
    Stream --> Ce[Eval capture]
    Stream --> Cf[Feedback loop]
```

**Keystone:** event log = system of record. Replay, audit, metrik, training data — semua lahir dari satu sumber. Immutable, at-least-once, idempotent consumer.

---

## 9. Database

```mermaid
erDiagram
    tenants ||--o{ users : memiliki
    tenants ||--o{ agents : memiliki
    agents ||--o{ knowledge_sources : punya
    knowledge_sources ||--o{ kb_chunks : dipecah
    agents ||--o{ conversations : menangani
    conversations ||--o{ messages : berisi
    conversations ||--o{ events : menghasilkan
    conversations ||--o{ feedback : direview
    conversations ||--o{ ticket_costs : membebani
```

- **PostgreSQL + pgvector** — relational + vektor satu tempat (No premature vector DB).
- **`tenant_id` di setiap baris** + RLS (roadmap) → isolasi multi-tenant.
- **`events` APPEND-ONLY** = system of record.
- **HNSW index** pada `kb_chunks.embedding` untuk retrieval cepat.

---

## 10. Security (lintas lapisan)

```mermaid
flowchart TB
    A[Tenant Isolation<br/>tenant_id dari token + RLS] 
    B[Encryption<br/>in-transit TLS · at-rest]
    C[Secrets Manager<br/>kunci channel/provider]
    D[AI Guardrails<br/>injection · tindakan terlarang]
    E[AuthZ<br/>role-based · default deny]
    F[Audit Log<br/>setiap aksi → events]
    G[PII Minimization<br/>kirim seperlunya ke model]
    A --- B --- C --- D --- E --- F --- G
```

Security By Default: semua aktif sejak baris pertama, bukan upsell enterprise. SEV1 = kebocoran lintas-tenant / jawaban berbahaya ke pelanggan.

---

## 11. Deployment

```mermaid
flowchart TB
    subgraph Cloud[Managed Cloud · 1 region awal]
        subgraph App[Containers]
            API[API Service<br/>Fastify · stateless · scale horizontal]
            WK[Agent Workers<br/>scale by queue depth]
        end
        PG[(PostgreSQL + pgvector<br/>+ read replica kelak)]
        RD[(Redis · cache + queue)]
        OBJ[(Object Store · raw docs)]
        SEC[(Secrets Manager)]
    end
    CDN[CDN / Web Console] --> API
    API --> PG
    API --> RD
    WK --> PG
    WK --> RD
    API --> OBJ
    API --> SEC
    WK --> EXT[[Claude API]]
```

**Keputusan:** container di managed host (BUKAN Kubernetes dulu — pre-revenue). IaC sejak awal. Env: dev/staging/prod terisolasi. CI jalankan typecheck + test + **eval** sebelum deploy.

---

## 12. Monitoring & Observability

```mermaid
flowchart LR
    subgraph Sources
        Logs[Structured Logs · pino<br/>tenantId/convId/jobId]
        Trace[Tracing<br/>tiket lintas service]
        Dom[Domain Telemetry<br/>dari event log]
    end
    Logs --> Obs[(Observability Platform)]
    Trace --> Obs
    Dom --> Obs
    Obs --> Dash[Dashboards]
    Obs --> Alert[Alerts]
    Dom --> KPI[Resolution rate · Escalation accuracy<br/>Cost/ticket · Action success]
```

**Dua kelas metrik sama penting:**
- **Teknis:** latency, error rate, queue depth, uptime (≥99.9% target).
- **Domain (dari event log):** resolution rate, escalation accuracy, cost-per-ticket, action-success-rate — KPI bisnis = KPI produk.

**Alert kritikal:** lonjakan escalation/error agent, kebocoran isolasi, cost-per-ticket > ambang, queue backlog. Kill switch: turunkan semua agent ke `draft_for_approval` cepat.

---

## Ringkasan Prinsip → Arsitektur

| Prinsip Produk | Diwujudkan oleh |
|---|---|
| Human Approval | Workflow Engine + Trust Ladder (§4) |
| Everything Is Traceable | Event Bus append-only (§8) |
| Security By Default | Lapisan keamanan (§10) + tenant scoping (§5) |
| No Vendor Lock-In | Provider abstraction di AI Runtime (§7) |
| Knowledge Is Company Asset | Knowledge Base + feedback loop (§6) |
| Offline/Resilient | Async queue + retry + mode offline (§3, §7) |

*Dokumen ini adalah peta. Untuk detail implementasi, lihat [ARCHITECTURE.md](ARCHITECTURE.md) dan kode di `src/`.*
