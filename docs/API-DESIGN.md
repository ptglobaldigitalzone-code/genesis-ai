# Genesis AI — API Design

> **Versi:** 1.0 · **Owner:** CTO · **Tanggal:** 2026-06-26
> **Status:** Mencerminkan API v1 yang sudah dibangun ([src/server.ts](../src/server.ts)) + arah ke depan.
> **Prinsip pemandu:** **API First** — setiap kapabilitas adalah API sebelum jadi tombol; console adalah konsumen API. ([PRODUCT-PRINCIPLES.md](PRODUCT-PRINCIPLES.md) §6)
> **Terkait:** [ARCHITECTURE.md §3](ARCHITECTURE.md) · [ENGINEERING-BIBLE.md §7](ENGINEERING-BIBLE.md)

---

## 1. REST

REST + JSON adalah gaya utama kita: sederhana, dapat di-cache, mudah di-debug, dipahami semua tooling.

**Konvensi:**
- **Versioned:** semua endpoint di bawah `/v1/...`. Breaking change → `/v2`, bukan ubah di tempat.
- **Resource-oriented**, kata benda jamak: `/agents`, `/conversations`, `/knowledge`.
- **HTTP verbs:** `GET` (baca), `POST` (buat/aksi), `PATCH` (ubah parsial), `DELETE` (hapus).
- **Status code benar:** 200/201 sukses, 400 validasi, 401 auth, 403 authz, 404 not found, 409 konflik, 429 rate limit, 5xx internal.
- **Bentuk error seragam** (dari error handler tersentral [src/server.ts](../src/server.ts)):
  ```json
  { "error": { "code": "VALIDATION", "message": "Input tidak valid", "details": { } } }
  ```
- **Tenant scoping implisit:** klien tak pernah mengirim `tenant_id`; selalu diturunkan dari token.

### Permukaan API v1 (yang sudah ada)

| Method | Endpoint | Auth | Role | Fungsi |
|---|---|---|---|---|
| GET | `/health` | — | — | Health check |
| POST | `/v1/auth/register` | — | — | Buat tenant + operator pertama |
| POST | `/v1/auth/login` | — | — | Login → JWT |
| POST | `/v1/agents` | ✓ | operator | Buat AI Employee |
| GET | `/v1/agents` | ✓ | any | List agent tenant |
| GET | `/v1/agents/:id` | ✓ | any | Detail agent |
| PATCH | `/v1/agents/:id/autonomy` | ✓ | operator | Ubah trust ladder |
| POST | `/v1/agents/:agentId/knowledge` | ✓ | operator | Ingest knowledge |
| POST | `/v1/inbound` | ✓ | any | Channel ingress (tiket masuk) |
| GET | `/v1/conversations` | ✓ | any | List percakapan (filter `?status=`) |
| GET | `/v1/conversations/:id` | ✓ | any | Detail + transcript |
| GET | `/v1/conversations/:id/events` | ✓ | any | Replay jejak agent |
| POST | `/v1/conversations/:id/review` | ✓ | reviewer/operator | Approve/edit/reject draf |
| GET | `/v1/review-queue` | ✓ | any | Antrian menunggu review |
| GET | `/v1/events` | ✓ | any | Audit log tenant |
| GET | `/v1/metrics` | ✓ | any | KPI (resolution, escalation, cost) |

**Contoh:**
```http
POST /v1/inbound
Authorization: Bearer <jwt>
Content-Type: application/json

{ "agentId": "…", "message": "Berapa lama pengiriman ke luar Jawa?" }
→ 200 { "ok": true, "conversationId": "…", "status": "open" }
```

---

## 2. GraphQL?

**Keputusan: TIDAK untuk sekarang. Tetap REST.** (Layak jadi ADR formal bila dipertimbangkan ulang.)

**Kenapa REST cukup untuk kita:**
- Permukaan API masih kecil & resource-oriented — REST natural, tanpa over-/under-fetching yang berarti.
- GraphQL menambah kompleksitas nyata: server schema, resolver, caching yang lebih sulit, kontrol rate-limit/biaya query (N+1, query mahal) yang justru berisiko untuk model **usage-billing** kita.
- Console (Next.js) sebagai konsumen tunggal awal tak butuh fleksibilitas query GraphQL.
- Webhooks & integrasi pihak ketiga lebih lazim & mudah lewat REST.

**Kapan ditinjau ulang:**
- Banyak klien eksternal/partner dengan kebutuhan query yang sangat beragam (Phase 3 platform), **atau**
- Front-end kompleks yang menderita over-fetching parah lewat REST.
Saat itu: pertimbangkan GraphQL **untuk read-heavy/aggregation tier** sambil REST tetap untuk command/webhook — bukan ganti total.

---

## 3. Authentication

**Sekarang (v1):** **JWT Bearer**.
- `POST /v1/auth/login` → JWT berisi `{ userId, tenantId, role }`, masa 7 hari.
- Request berikutnya: header `Authorization: Bearer <token>`. Gateway verifikasi → isi `req.auth` ([middleware.ts](../src/auth/middleware.ts)).
- **AuthZ:** role-based (`operator`/`reviewer`) via `requireRole(...)`; **default deny**.
- **Tenant isolation:** `tenant_id` selalu dari token, tak pernah dari klien.

**Roadmap:**
- **Managed auth** (Clerk/Auth0/WorkOS) — SSO/SCIM untuk enterprise ([ADR-0003](adr/0003-api-framework.md) konteks).
- **API Keys** untuk akses programatik / server-to-server (mis. integrasi pelanggan memanggil API kita): key ter-scope tenant, dapat di-rotate & dicabut, disimpan ter-hash. Ini jalur auth kedua selain JWT (yang untuk sesi user).
- **Service tokens / mTLS** saat microservices dipecah.

**Aturan keamanan API:**
- Token tak pernah di URL/query (hanya header).
- Secret JWT/managed-key di secrets manager (Security By Default).
- Tak ada endpoint yang membocorkan apakah email terdaftar (pesan login generik).

---

## 4. Rate Limiting & Quota

**Kenapa kritikal untuk Genesis:** usage-billing berarti **abuse = biaya langsung** (tiap request bisa memicu panggilan model berbayar). Rate limit adalah kontrol biaya & keamanan, bukan sekadar sopan-santun.

**Desain:**
- **Per-tenant quota** (bukan hanya per-IP) — sesuai paket (Starter/Growth/Scale). Mencegah satu tenant menghabiskan resource & menjaga fairness (Redis sebagai counter — sudah tersedia di stack).
- **Per-endpoint limit** — endpoint yang memicu kerja mahal (`/v1/inbound`, ingest knowledge) lebih ketat daripada read.
- **Respons 429** dengan header:
  ```
  HTTP/1.1 429 Too Many Requests
  Retry-After: 30
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1750000000
  ```
- **Soft vs hard:** mendekati kuota → warning di dashboard (UX Billing); melewati → 429 / overage sesuai paket.
- **Queue sebagai peredam:** intake (`/v1/inbound`) cepat dibalas lalu kerja berat masuk BullMQ — melindungi sistem dari lonjakan (backpressure).

---

## 5. OpenAPI

**Spesifikasi sebagai kontrak.** Kita hasilkan **OpenAPI 3** otomatis dari schema route.

- **Sumber kebenaran = schema Zod di route** (sudah dipakai untuk validasi). Strategi: turunkan skema OpenAPI dari Zod (mis. via plugin Fastify/`zod-to-openapi`), sehingga **dokumentasi tak pernah basi** terhadap validasi nyata — satu sumber.
- **`GET /docs`** menyajikan Swagger UI (di non-prod / di balik auth pada prod).
- Manfaat: SDK ter-generate, kontrak jelas untuk integrator (Phase 3), kontrak-testing.
- **Aturan ENGINEERING-BIBLE:** endpoint baru = schema dulu. Karena schema = validasi = dokumentasi, tidak ada drift.

Contoh ringkas fragmen:
```yaml
paths:
  /v1/inbound:
    post:
      summary: Channel ingress — terima tiket masuk
      security: [{ bearerAuth: [] }]
      requestBody:
        content: { application/json: { schema: { $ref: '#/components/schemas/Inbound' } } }
      responses:
        '200': { description: Tiket diterima & di-enqueue }
        '429': { description: Rate limit terlampaui }
```

---

## 6. Webhooks

Dua arah: **inbound** (dunia → Genesis) dan **outbound** (Genesis → dunia).

### Inbound (channel ingress)
- Sumber: email provider / help-desk mengirim event tiket baru → kita terima dan proses.
- Endpoint v1: `POST /v1/inbound` (kini ter-autentikasi JWT untuk simulasi/uji).
- **Produksi (roadmap):** webhook dari provider eksternal **tidak** pakai JWT; harus **diverifikasi via HMAC signature**:
  - Provider menandatangani payload dengan shared secret; kita verifikasi header `X-Genesis-Signature` (HMAC-SHA256) sebelum memproses.
  - **Idempotency:** header/id event unik → cegah proses ganda (kita sudah pakai `jobId = ticket:<id>` di queue).
  - Verifikasi timestamp (anti-replay).

### Outbound (notifikasi ke sistem pelanggan)
- Genesis memberi tahu sistem pelanggan saat peristiwa penting terjadi (mis. tiket diselesaikan, dieskalasi).
- **Desain:**
  - Pelanggan mendaftarkan URL + memilih event yang diminati.
  - Payload ditandatangani (HMAC) agar penerima bisa verifikasi keaslian.
  - **At-least-once delivery** + retry dengan backoff; endpoint penerima harus idempotent.
  - Dead-letter + dashboard status pengiriman.
- Mengalir dari **Event Bus** (§7) — outbound webhook adalah salah satu consumer event.

---

## 7. Events

Event adalah tulang punggung Genesis (Everything Is Traceable). Mereka punya tiga peran: **system of record**, sumber **metrik**, dan pemicu **webhook/integrasi**.

**Katalog event (dari [events/service.ts](../src/modules/events/service.ts)):**

| Kategori | Event |
|---|---|
| Tenant/User | `tenant.created`, `user.registered` |
| Agent | `agent.created`, `agent.autonomy_changed` |
| Knowledge | `knowledge.ingested` |
| Tiket (lifecycle) | `ticket.received`, `agent.classified`, `agent.retrieved`, `agent.drafted`, `agent.sent`, `agent.escalated`, `agent.queued_for_review` |
| Review | `review.approved`, `review.edited`, `review.rejected` |

**Bentuk event:**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "conversationId": "uuid|null",
  "agentId": "uuid|null",
  "type": "agent.escalated",
  "payload": { "reason": "Permintaan refund di luar wewenang", "confidence": 0.3 },
  "createdAt": "2026-06-26T…Z"
}
```

**Akses event via API:**
- `GET /v1/conversations/:id/events` — replay jejak satu percakapan.
- `GET /v1/events` — audit log tenant (terbaru).
- **Roadmap:** *event subscription* (webhook outbound per tipe event) & *streaming* (SSE/websocket) untuk dashboard real-time.

**Jaminan:** event immutable & append-only, at-least-once ke consumer, idempotent consumer, ordering per percakapan ([ARCHITECTURE.md §10](ARCHITECTURE.md)).

---

## Ringkasan keputusan API

| Aspek | Keputusan v1 | Arah |
|---|---|---|
| Gaya | REST + JSON, `/v1` | GraphQL hanya bila terbukti perlu |
| Auth | JWT Bearer + role | Managed auth + API keys + signature webhook |
| Rate limit | Per-tenant + per-endpoint, 429 | Quota per paket, overage |
| Docs | OpenAPI dari Zod | SDK ter-generate |
| Inbound | `/v1/inbound` (JWT) | HMAC signature verification |
| Outbound | — | Signed webhooks dari event bus |
| Events | Append-only log + read API | Subscription + streaming real-time |

*Kontrak API berubah hanya secara additive di dalam `/v1`; perubahan breaking = versi baru. Setiap endpoint baru: schema Zod (= validasi = OpenAPI), tenant-scoped, role check, emit event bila mengubah state.*
