# Genesis AI — Arsitektur Sistem

> **Versi:** 1.0 (DRAFT — menunggu persetujuan founder) · **Bahasa:** Indonesia (terjemahan dari ARCHITECTURE.md)
> **Cakupan:** v1.0 AI Customer Support Agent → dirancang untuk digeneralisasi menjadi AI Workforce Platform penuh
> **Pemilik:** CTO · **Tanggal:** 2026-06-26
> **Dokumen pendamping:** [FOUNDATION.md](FOUNDATION.md) · [PRD.md](PRD.md)

---

## 0. Prinsip Arsitektur (aturan yang dipatuhi setiap keputusan di bawah)

1. **Inti yang model-agnostic.** Platform mengorkestrasi model; tidak ada provider yang bersifat load-bearing. Default-nya menggunakan model Claude yang paling capable; bisa diganti tanpa penulisan ulang.
2. **Kebenaran yang event-sourced.** Setiap aksi agent adalah event yang immutable. Replay, audit, eval, dan training di masa depan semuanya diturunkan dari satu log.
3. **Shell deterministik mengelilingi inti non-deterministik.** Pemanggilan LLM dibungkus dalam validasi deterministik, retry, idempotency, dan guardrails.
4. **Multi-tenant sejak baris pertama.** `tenant_id` ada di setiap row; isolasi ditegakkan di data layer.
5. **Beli yang tidak terdiferensiasi, bangun yang menjadi moat.** Beli auth, infra, queue. Bangun hanya lapisan orkestrasi agent + reliability.
6. **Mulai sederhana, dirancang untuk dipecah.** Modular monolith sekarang; batas-batas yang bersih sehingga kita mengekstraksi microservices sesuai kebutuhan, bukan atas spekulasi.
7. **Cost & reliability diinstrumentasi, bukan diasumsikan.** Cost-per-job dan action-success-rate adalah telemetri kelas satu.

---

## 1. Desain Tingkat Tinggi

```
                            ┌──────────────────────────────┐
        Operator / Reviewer │   Web App (React/Next.js)    │
        (browser)           │   Operator console + queues  │
                            └───────────────┬──────────────┘
                                            │ HTTPS
                                            ▼
                              ┌──────────────────────────┐
   External support channel   │       API GATEWAY        │  ◄── AuthN/Z, rate limit,
   (email / help-desk)        │  routing · authz · quotas│      routing, request log
        │  webhooks           └─────────────┬────────────┘
        ▼                                    │
 ┌───────────────┐                           ▼
 │ Channel       │   internal calls  ┌───────────────────────────────────────────┐
 │ Ingress svc   │──────────────────▶│            CORE SERVICES                  │
 │ (webhooks/    │                   │                                           │
 │  email poll)  │                   │  • Identity & Tenant svc                  │
 └──────┬────────┘                   │  • Agent / Workspace svc                  │
        │ enqueue                    │  • Conversation / Ticket svc              │
        ▼                            │  • Knowledge Base svc (ingest + retrieval)│
 ┌───────────────┐                   │  • Workflow Engine (agent orchestration)  │
 │     QUEUE     │  jobs             │  • AI Runtime (model calls + guardrails)  │
 │  (BullMQ /    │◀─────────────────▶│  • Metrics / Cost svc                     │
 │   Redis)      │                   └──────────────┬────────────────────────────┘
 └──────┬────────┘                                  │ emits
        │ workers consume                           ▼
        ▼                              ┌──────────────────────────┐
 ┌───────────────┐   publish events    │        EVENT BUS         │  append-only
 │ Agent Workers │────────────────────▶│  (Postgres outbox →      │  action log =
 │ (AI Runtime + │                     │   Redis Streams / Kafka) │  system of record
 │  Workflow)    │                     └─────────┬────────────────┘
 └───────┬───────┘                               │ consumers
         │ reads/writes                          ▼
         ▼                          metrics · audit · eval capture · feedback loop
 ┌─────────────────────────────────────────────────────────────────┐
 │  DATA LAYER                                                       │
 │  PostgreSQL (tenants, agents, tickets, events) + pgvector (KB)   │
 │  Redis (cache, queue, rate-limit)   Object store (raw docs)      │
 │  Secrets manager (channel creds, API keys)                       │
 └─────────────────────────────────────────────────────────────────┘
                         │ outbound (model-agnostic)
                         ▼
            ┌────────────────────────────┐
            │  Foundation Model providers │  Claude (default) · swappable
            └────────────────────────────┘
```

**Jalur request yang kritis:** pesan masuk → Channel Ingress → Queue → Agent Worker (Workflow Engine menggerakkan langkah-langkahnya; AI Runtime mengeksekusi pemanggilan model dengan guardrails; Knowledge Base menyuplai grounding) → respons dikirim → setiap langkah ditambahkan ke Event Bus → Metrics diperbarui.

---

## 2. Microservices (batas-batas target + phased rollout)

> **Phased rollout — baca ini lebih dulu.** Phase 1 merilis komponen-komponen ini sebagai **modul di dalam satu aplikasi yang dapat di-deploy** (sebuah modular monolith) ditambah **satu proses worker terpisah** untuk eksekusi agent. Batas-batas di bawah ini nyata (modul kode terpisah, schema DB terpisah, tidak ada akses tabel lintas-modul) sehingga ekstraksi menjadi service independen bersifat mekanis ketika skala menuntutnya. Kita **tidak** menjalankan 9 service dengan 9 pipeline pada hari pertama.

| Service | Tanggung jawab | Bentuk Phase 1 | Ekstraksi ketika |
|---|---|---|---|
| **Identity & Tenant** | Org, user, role, isolasi tenant | Modul (+ managed auth provider) | Jarang — tetap di core |
| **Agent / Workspace** | Konfigurasi agent, autonomy level, tautan knowledge, brand voice | Modul | Pertumbuhan multi-agent-type |
| **Channel Ingress** | Webhooks / email polling, normalisasi pesan masuk, pengiriman pesan keluar | Modul + worker ringan | Volume channel tinggi / banyak integrasi |
| **Conversation / Ticket** | Thread, pesan, status, escalation routing | Modul | Volume write tinggi |
| **Knowledge Base** | Ingest, chunk, embed, retrieve (RAG) | Modul + ingest worker | Beban ingest berat / vector infra khusus |
| **Workflow Engine** | Mengorkestrasi pekerjaan agent yang multi-step | Worker (state machine lib) | Kebutuhan eksekusi long-running / durable → Temporal |
| **AI Runtime** | Pemanggilan model-agnostic, guardrails, retry, cost capture | Library yang dipakai worker | Scaling independen untuk beban inference |
| **Metrics / Cost** | Mengagregasi event → dashboard, cost-per-ticket | Modul + event consumer | Skala analytics |
| **Event Bus consumers** | Audit, eval capture, feedback loop, proyeksi | Consumers | Volume stream |

**Komunikasi antar-service:** synchronous = HTTP/RPC internal di belakang gateway untuk request/response; asynchronous = event di Event Bus + jobs di Queue untuk segala hal terkait agent (pekerjaan agent secara alami bersifat async). **Default-nya async** untuk eksekusi agent — inilah yang membuat sistem reliable di bawah beban.

---

## 3. API Gateway

- **Peran:** ingress tunggal untuk seluruh traffic client + webhook. Menangani **authentication, authorization, rate limiting / quota (kritis — usage billing berarti penyalahgunaan = cost langsung), validasi request, routing, dan request logging**.
- **Phase 1:** lapisan gateway/BFF tipis di dalam aplikasi (mis. lapisan API Next.js/Node atau gateway Fastify kecil) — belum perlu infra yang berat.
- **Phase 2+:** gateway khusus (Kong / cloud-managed API Gateway / Envoy) setelah kita punya banyak service dan partner yang mengakses API publik.
- **Gaya API:** REST + JSON untuk operator console dan webhooks (sederhana, debuggable). Pemanggilan service internal dapat beralih ke typed RPC nanti. API publik/partner di-versioning (`/v1/...`) sejak hari pertama.
- **Konteks tenant:** gateway me-resolve `tenant_id` dari auth token dan menyuntikkannya ke setiap downstream call — tidak ada service yang mempercayai tenant id yang disuplai client.

---

## 4. Database

- **Primer: PostgreSQL.** Satu DB relasional yang battle-tested untuk tenant, agent, conversation, event, metrics. Sengaja membosankan.
- **Model multi-tenancy:** **shared database, shared schema, `tenant_id` di setiap row, ditegakkan oleh Postgres Row-Level Security (RLS).** Paling murah dioperasikan, isolasi kuat ketika RLS benar. *Jalur menuju isolasi yang lebih ketat (schema-per-tenant atau DB-per-tenant) dicadangkan untuk pelanggan enterprise besar di Phase 3 — bukan sekarang.*
- **Vector store: pgvector di dalam Postgres yang sama.** Keputusan yang disengaja: vector DB terpisah (Pinecone/Weaviate) adalah overhead ops yang prematur pada skala kita. pgvector menangani jutaan chunk dengan baik dan menjaga knowledge tetap co-located dengan data tenant. Ekstraksi ke vector DB khusus hanya jika skala retrieval memaksanya.
- **Redis:** caching, backing store queue, counter rate-limit, state ephemeral.
- **Object storage (kompatibel-S3):** dokumen mentah yang diunggah sebelum chunking; artefak berukuran besar.
- **Secrets manager:** API key channel, key provider — tidak pernah disimpan plaintext di DB.
- **Kelas data & retensi:** data conversation yang mengandung PII dienkripsi at rest, dapat dihapus per tenant (GDPR-ready). Event log bersifat append-only/immutable.

**Schema inti (ilustratif, belum final):**
```
tenants(id, name, plan, created_at)
users(id, tenant_id, email, role, ...)                 -- role: operator | reviewer
agents(id, tenant_id, name, autonomy_level, voice, ...) -- autonomy: suggest|draft|act_review|autonomous
knowledge_sources(id, tenant_id, agent_id, type, status, ...)
kb_chunks(id, tenant_id, source_id, content, embedding vector, authority, ...)
conversations(id, tenant_id, agent_id, channel, status, ...)
messages(id, tenant_id, conversation_id, role, body, created_at)  -- role: customer|agent|reviewer
events(id, tenant_id, conversation_id, type, payload jsonb, created_at)  -- APPEND ONLY (action log)
feedback(id, tenant_id, conversation_id, reviewer_id, action, edit_diff, ...) -- approve|edit|reject
ticket_costs(id, tenant_id, conversation_id, tokens_in, tokens_out, cost, model)
```
Setiap tabel membawa `tenant_id`; policy RLS bertumpu padanya.

---

## 5. Authentication & Authorization

- **Build vs buy = BUY.** Kita tidak meracik auth sendiri. Gunakan managed provider (**Clerk / Auth0 / Supabase Auth / WorkOS**). Alasannya: auth adalah ladang ranjau keamanan, sepenuhnya tidak terdiferensiasi, dan vendor melakukannya lebih baik. (WorkOS/Auth0 juga memberi kita enterprise SSO nanti secara gratis — Phase 3.)
- **AuthN:** email/password atau magic link untuk v1.0; token sebagai JWT.
- **AuthZ:** role-based — **Operator** (admin: mengonfigurasi agent, mengatur autonomy, melihat semua) dan **Reviewer** (bertindak atas review queue). Ditegakkan di gateway dan diperiksa ulang di service. Tenant scoping tidak bisa ditawar pada setiap request.
- **Service-to-service:** pemanggilan internal di-autentikasi via signed service token / mTLS (Phase 2 saat dipecah).
- **Kredensial channel:** disimpan di secrets manager, di-scope per tenant, dapat dirotasi.
- **Roadmap:** SSO/SCIM, RBAC granular, ekspor audit-log → Phase 3 enterprise, posisinya didokumentasikan sekarang.

---

## 6. Queue

- **Peran:** memisahkan pesan masuk dari pemrosesan agent. **Pekerjaan agent bersifat async** — sebuah ticket di-enqueue, sebuah worker memprosesnya. Inilah yang memberi kita reliability, retry, backpressure, dan horizontal scale.
- **Phase 1: BullMQ di Redis.** Sederhana, cukup durable, DX bagus, mendukung retry/delay/prioritas/rate-limit. Tool yang tepat pada skala kita.
- **Phase 2+: managed queue** (SQS / Cloud Tasks) atau Kafka jika kita butuh throughput lebih tinggi / jaminan durability lebih kuat.
- **Pola:** idempotent jobs (setiap ticket diproses secara efektif exactly-once via idempotency key), dead-letter queue untuk poison message, fairness/rate-limit per tenant agar satu tenant tidak menggerus tenant lain, retry dengan backoff pada kegagalan model/infra yang transient.

---

## 7. AI Runtime

**Lapisan eksekusi yang model-agnostic** — jantung dari moat kita. Membungkus setiap interaksi model dalam scaffolding deterministik.

Tanggung jawab:
- **Abstraksi provider:** antarmuka seragam di atas Claude (default) dan alternatifnya. Pemilihan model per-task — model besar untuk reasoning/drafting, model kecil/murah untuk klasifikasi/routing.
- **Perakitan prompt:** menyuntikkan konfigurasi agent, brand voice, knowledge yang di-retrieve (dari KB), riwayat conversation, dan definisi tool.
- **Guardrails (deterministik):** validasi input/output, pengecekan policy (FR-11), penegakan grounding (jawaban harus berasal dari KB — tidak ada policy yang dikarang), minimisasi PII sebelum dikirim ke provider.
- **Confidence & escalation:** menghasilkan sinyal confidence; di bawah threshold atau knowledge yang hilang → eskalasi ke manusia (FR-10).
- **Reliability:** retry dengan backoff, timeout, fallback, idempotency, pertahanan prompt-injection.
- **Eksekusi Tool/Action:** aksi yang terkontrol, hanya yang allow-listed; tidak pernah aksi yang tidak terotorisasi — eskalasi saja sebagai gantinya.
- **Cost & token capture:** setiap call merekam token + cost → Metrics (FR-18). Caching (prompt/response) untuk menekan cost-per-job.
- **Eval hooks:** perubahan kapabilitas dijalankan terhadap eval suite di CI sebelum dipromosikan ke autonomy yang lebih tinggi.

> AI Runtime secara sengaja adalah tempat kita **build, bukan buy**. Untuk segala hal lain kita bersandar pada vendor; di sinilah reliability menjadi produk.

---

## 8. Workflow Engine

- **Peran:** mengorkestrasi pekerjaan agent yang multi-step — *classify → retrieve → draft → guardrail-check → decide (send / queue for review / escalate) → deliver → log*. Mengelola state, branching, jeda human-in-the-loop, dan retry lintas langkah.
- **Trust ladder berada di sini.** Autonomy level (FR-12) adalah sebuah branch dalam workflow: *Suggest* berhenti setelah draft; *Draft-for-approval* berhenti untuk reviewer; *Act-with-review* mengirim lalu mencatat untuk review async; *Autonomous* mengirim kecuali low-confidence/flagged.
- **Human-in-the-loop = durable pause.** Sebuah workflow dapat ditangguhkan menunggu aksi reviewer dan dilanjutkan saat persetujuan/edit — ini harus bertahan melewati restart.
- **Phase 1:** sebuah **state machine** yang ringan dan eksplisit di dalam worker (mis. gaya XState atau sebuah typed step runner sederhana) yang didukung state DB. Cukup dan debuggable.
- **Phase 2+: Temporal** (durable execution) ketika workflow menjadi long-running, melewati banyak jeda manusia, atau kita butuh resumability dan visibilitas yang antipeluru. Dirancang untuk swap ini sekarang; belum membayar pajak kompleksitasnya.
- **Mengapa eksplisit, bukan "biarkan LLM memutuskan segalanya":** determinisme mengelilingi non-determinisme. *Control flow* direkayasa dan dapat di-test; *content* adalah tugas model. Beginilah cara kita memperoleh reliability eval.

---

## 9. Knowledge Base (RAG)

Dua bagian: **ingestion** (write path) dan **retrieval** (read path).

- **Pipeline ingestion (worker async):** source (dokumen yang diunggah / crawl help-center / Q&A CSV — FR-2) → parse → **chunk** (semantic-aware) → **embed** → simpan di `kb_chunks` (pgvector) dengan metadata source + **authority**. Re-ingest/refresh didukung; operator dapat melakukan kurasi (FR-3).
- **Retrieval (read path):** pada setiap ticket, embed query → vector similarity search yang di-scope berdasarkan `tenant_id` + `agent_id` → re-ranking opsional → konteks grounded top-k diserahkan ke AI Runtime. **Hybrid search** (vector + keyword) untuk presisi pada nama/ID.
- **Kontrak grounding:** agent menjawab *dari knowledge yang di-retrieve*; jika retrieval kosong/lemah, ia eskalasi alih-alih mengarang (terhubung ke FR-9/FR-10).
- **Isolasi per-tenant:** retrieval selalu di-scope per tenant — sebuah batas keamanan yang keras, ditegakkan oleh RLS + query scoping.
- **Feedback loop:** koreksi reviewer (FR-13/14) diumpankan balik sebagai knowledge yang lebih baik / jawaban yang disukai → data moat yang berlipat (sebuah prinsip Foundation).

---

## 10. Event Bus

- **Peran:** **action log yang append-only adalah system of record** untuk segala hal yang dilakukan agent — menggerakkan replay (FR-16), audit (FR-15), metrics (FR-17), eval capture, dan training data di masa depan. Ini adalah keystone arsitektur, bukan sekadar nice-to-have.
- **Phase 1: tabel `events` Postgres + transactional outbox pattern → Redis Streams** untuk fan-out ke consumer. Memberi kita durability (event di-commit dalam transaksi yang sama dengan perubahan state — tidak ada event yang hilang) tanpa harus mendirikan Kafka.
- **Phase 2+: Kafka / managed streaming** ketika volume event atau jumlah consumer independen membenarkannya. Outbox pattern berarti producer tidak berubah ketika bus-nya berubah.
- **Consumers:** Metrics/Cost projector, Audit/replay store, Eval capture, Feedback-loop processor, ekspor ML/training di masa depan.
- **Jaminan:** at-least-once delivery + idempotent consumers; event bersifat immutable; urutan dipertahankan per conversation.
- **Mengapa event-sourced:** dalam produk AI, *kemampuan untuk menjelaskan dan me-replay persis apa yang dilakukan agent* adalah sekaligus fitur trust (operator mengaudit) dan keharusan engineering (men-debug non-determinisme, membangun eval). Kita memperolehnya secara gratis dengan menjadikan event sebagai source of truth.

---

## 11. Cross-Cutting Concerns

- **Observability:** structured logging, distributed tracing (melacak sebuah ticket end-to-end lintas queue + workers + pemanggilan model), dashboard metrics. Ditambah telemetri domain: resolution rate, escalation accuracy, cost-per-ticket, action-success-rate.
- **Security:** TLS di mana-mana, enkripsi at rest, secrets manager, isolasi tenant via RLS, kredensial service least-privilege, guardrail prompt-injection & PII di AI Runtime, audit log admin. Posisi SOC 2 didokumentasikan sekarang, disertifikasi ketika enterprise menuntut (Phase 3).
- **Deployment:** container (Docker) pada satu managed platform untuk awalnya (mis. managed container/serverless host) — **jangan menjalankan Kubernetes untuk produk pre-revenue.** Adopsi orchestration ketika jumlah service + skala membenarkannya. IaC sejak awal agar environment dapat direproduksi.
- **Environments:** dev / staging / prod, data terisolasi. CI menjalankan test **dan eval** sebelum deploy.
- **Jalur scalability:** service stateless di-scale secara horizontal; worker di-scale berdasarkan kedalaman queue; Postgres di-scale via read replica → partitioning tabel bervolume tinggi (`events`, `messages`) → managed/distributed Postgres hanya jika diperlukan. Cost di-scale seiring usage secara desain (dan di-meter).

---

## 12. Technology Stack yang Direkomendasikan (v1.0 — pragmatis, satu tim)

| Lapisan | Pilihan | Mengapa |
|---|---|---|
| Language | **TypeScript** end-to-end (web + services + workers) | Satu bahasa = velocity untuk tim kecil; tambahkan Python hanya untuk ML/eval nanti |
| Web/console | Next.js + React | Cepat membangun operator console + review queue |
| API/services | Node (Fastify/Nest) | Bahasa yang sama, matang, baik untuk gateway + services |
| DB | **PostgreSQL + pgvector** | Satu DB untuk relasional + vektor; RLS untuk tenancy |
| Cache/Queue | **Redis + BullMQ** | Jobs yang sederhana dan cukup durable pada skala kita |
| Auth | **Managed (Clerk/Auth0/WorkOS)** | Beli, jangan bangun; SSO-ready untuk nanti |
| AI | **Claude (default) via runtime yang model-agnostic** | Model paling capable; inti yang swappable |
| Events | **Postgres outbox → Redis Streams** | Event durable tanpa overhead Kafka |
| Workflow | **State machine lib** (→ Temporal nanti) | Durability yang tepat ukuran sekarang |
| Infra | Container pada managed host + IaC | Tanpa Kubernetes prematur |
| Object store | Kompatibel-S3 | Dokumen mentah |

*(Pilihan stack final bersifat reversible dan terbuka terhadap preferensi/kendala Anda — Open Question #5 di PRD.)*

---

## 13. Build Sequence (memetakan ke milestone PRD)

1. **M1 (alpha):** Postgres + auth + Agent/Tenant + Knowledge ingest/retrieval + AI Runtime (draft saja) + Event log + console minimal. Autonomy: Suggest/Draft.
2. **M2 (beta):** Queue + Channel Ingress (satu channel) + Workflow Engine (trust ladder penuh) + Review queue + Metrics dashboard + eval di CI.
3. **M3 (v1.0):** Tier Autonomous yang di-gate di belakang threshold eval + dashboard cost + onboarding self-serve <1-hari + hardening.

---

## 14. Keputusan Arsitektur Utama yang Memerlukan Sign-off Anda

1. **Modular monolith dulu, ekstraksi service nanti** — disetujui, atau Anda ingin microservices penuh sekarang? *(Sangat merekomendasikan modular-monolith-dulu.)*
2. **pgvector ketimbang vector DB khusus** untuk v1.0 — disetujui?
3. **Beli managed auth** (Clerk/Auth0/WorkOS) — disetujui?
4. **TypeScript end-to-end** — atau Anda/tim Anda punya preferensi stack? *(Reversible, tapi pilih sekarang.)*
5. **Preferensi cloud/host & kendala region/compliance apa pun?** (PRD Open Q #5 — masih terbuka.)

Setujui ini dan artefak berikutnya adalah **detailed data schema + API contracts** dan **Sprint 1 backlog** untuk build gate.
