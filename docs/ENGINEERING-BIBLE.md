# Genesis AI — Engineering Bible

> **Versi:** 1.0 · **Owner:** CTO · **Tanggal:** 2026-06-26
> **Status:** Living document — wajib dibaca setiap engineer di hari pertama.
> **Dokumen terkait:** [FOUNDATION.md](FOUNDATION.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [AI-EMPLOYEE-HANDBOOK.md](AI-EMPLOYEE-HANDBOOK.md) · [SPRINT-PLAN.md](SPRINT-PLAN.md)

---

## 0. Cara memakai dokumen ini

Ini adalah **standar rekayasa yang mengikat** di Genesis AI. Bukan saran. Kalau Anda hendak melanggar sebuah aturan di sini, itu boleh — **tapi harus lewat ADR** (§14) yang menjelaskan kenapa. Aturan tanpa alasan adalah dogma; di sini setiap aturan punya *kenapa*.

Hierarki otoritas saat ada konflik:
> **Keamanan & hukum > Keandalan (reliability) > Kebenaran (correctness) > Kesederhanaan > Kecepatan > Gaya.**

Kalau ragu, naik ke kiri.

---

## 1. Filosofi Engineering (turunan dari Engineering Principles)

1. **Reliability adalah produk, bukan fitur.** Kita menjual *tenaga kerja*. Demo yang gagal 5% tidak layak jual. Kode yang "jalan di laptop saya" bukan kode yang selesai.
2. **Determinisme membungkus non-determinisme.** Model itu non-deterministik; semua di sekitarnya (validasi, retry, guardrail, idempotency) wajib deterministik dan teruji. (Lihat `src/ai/runtime.ts`.)
3. **Event adalah sumber kebenaran.** Setiap aksi penting → event. Replay, audit, metrik, training data lahir dari satu log. (Lihat `src/modules/events/service.ts`.)
4. **Multi-tenant sejak baris pertama.** `tenant_id` ada di setiap baris & setiap query. Tidak ada "nanti".
5. **Beli yang bukan pembeda, bangun yang jadi moat.** Auth, queue, infra → beli. AI Runtime + reliability layer → bangun.
6. **Biaya adalah metrik kelas satu.** Token-per-job dipantau seperti latency. Agent yang bekerja tapi lebih mahal dari tenaga yang digantikannya = gagal.
7. **Boring is a feature.** Inovasi disimpan untuk lapisan agent. Untuk storage, auth, queue: pakai yang terbukti & membosankan.
8. **Selesai = terverifikasi.** "Selesai" berarti ada bukti ia bekerja (test/eval lulus), bukan klaim.

---

## 2. Canonical Stack (jangan menambah teknologi tanpa ADR)

| Layer | Teknologi | Catatan |
|---|---|---|
| Bahasa | **TypeScript** (strict) | Satu bahasa end-to-end. Python hanya untuk ML/eval bila perlu (butuh ADR). |
| Runtime | Node ≥ 20, ESM | |
| API | **Fastify** | API Gateway / BFF (`src/server.ts`) |
| DB | **PostgreSQL + pgvector** | Relational + vektor satu tempat |
| ORM/migrasi | **Drizzle** | Schema = `src/db/schema.ts`, migrasi versioned |
| Queue/cache | **Redis + BullMQ** | Pemrosesan agent async |
| Validasi | **Zod** | Di **batas** sistem (HTTP, config, output model) |
| AI | **Anthropic Claude** via runtime model-agnostic | `claude-opus-4-8` reasoning, `claude-haiku-4-5` klasifikasi |
| Auth | JWT (v1) → managed (Clerk/Auth0/WorkOS) | |
| Logging | **pino** | Structured logging |

**Aturan penambahan dependency:** sebelum `npm install <X>`, jawab: (a) apakah ini menggantikan kode yang jadi moat kita? Kalau ya, jangan. (b) apakah maintained & populer? (c) berapa ukuran & risiko keamanannya? Tambah library besar = butuh ADR.

---

## 3. Struktur Repository & Modul

Kita **modular monolith** dengan batas modul tegas (siap diekstrak jadi microservices).

```
src/
  config/      # konfigurasi tervalidasi (fail-fast)
  lib/         # util lintas-modul: logger, errors, password, context
  db/          # schema, migrate, seed — SATU-SATUNYA definisi skema
  auth/        # JWT + middleware
  ai/          # AI Runtime (moat): provider, embeddings, guardrails, runtime
  modules/<x>/ # modul domain: routes.ts (HTTP) + service.ts (logika)
  workflow/    # Workflow Engine (orkestrasi)
  queue/       # BullMQ queue + worker
  server.ts    # komposisi API Gateway
```

**Aturan batas modul (penting untuk masa depan microservices):**
- Modul **tidak boleh** meng-`import` tabel/skema internal modul lain dan menulis langsung ke sana. Interaksi lintas-modul lewat **service function** atau **event**.
- `routes.ts` = lapisan tipis: validasi input (Zod) → panggil service → bentuk respons. **Tidak ada logika bisnis di routes.**
- `service.ts` = logika domain. Tidak tahu soal HTTP (tidak ada `req`/`reply`).
- Util benar-benar generik → `lib/`. Jangan jadikan `lib/` tempat sampah.

---

## 4. Standar Penulisan Kode (TypeScript)

### Wajib
- **`strict: true`** + `noUncheckedIndexedAccess`. Akses array/objek by index → selalu cek `undefined`. (Lihat pola `vec[i] ?? 0` di `src/ai/embeddings.ts`.)
- **Tidak ada `any` diam-diam.** Kalau terpaksa cast (mis. mismatch tipe lintas-paket), beri komentar *kenapa*. Contoh: cast `ConnectionOptions` di `src/queue/index.ts`.
- **Validasi di batas, percayai di dalam.** Semua input eksternal (body HTTP, env, output model) di-parse Zod di tepi. Setelah itu, tipe dipercaya. Jangan validasi defensif berulang di tiap lapisan.
- **Error pakai `AppError`** (`src/lib/errors.ts`), bukan `throw new Error('...')` mentah untuk error yang menghadap user. Error punya statusCode + code mesin-readable.
- **Async/await**, bukan `.then()` berantai. Tangani error di tepi (error handler Fastify tersentral), jangan `try/catch` di mana-mana.
- **Penamaan:** `camelCase` variabel/fungsi, `PascalCase` tipe/kelas, `UPPER_SNAKE` konstanta env, `kebab-case` nama file. Nama menjelaskan *maksud*, bukan tipe (`draftReply`, bukan `processString`).

### Larangan
- ❌ `console.log` di kode produksi → pakai `logger`.
- ❌ Menyembunyikan error (catch kosong). Kalau menelan error, log + alasan.
- ❌ Komentar yang mengulang kode. Komentar menjelaskan **kenapa**, bukan **apa**. (Gaya komentar di codebase ini adalah standarnya — tiru kepadatannya.)
- ❌ Magic number/string tersebar. Naikkan ke config/konstanta bernama (mis. `CONFIDENCE_ESCALATION_THRESHOLD`).

### Komentar & Bahasa
- Komentar & pesan error yang menghadap pengguna: **Bahasa Indonesia** (konsisten dengan codebase saat ini).
- Identifier kode: Bahasa Inggris (konvensi universal).

---

## 5. Standar Keamanan (NON-NEGOTIABLE)

> Keamanan ada di puncak hierarki. Pelanggaran di sini memblokir merge tanpa kecuali.

1. **Isolasi tenant.** SETIAP query yang menyentuh data tenant **wajib** difilter `tenant_id`. `tenant_id` **selalu** diambil dari token (`req.auth.tenantId`), **tidak pernah** dari body/param klien. (Lihat `src/lib/context.ts`.) Roadmap: tegakkan juga via Postgres RLS.
2. **Secrets.** Tidak ada kredensial di kode/commit. Hanya lewat env/secrets manager. `.env` ada di `.gitignore`. Kunci channel/provider → secrets manager, bukan tabel plaintext.
3. **PII minimal.** Jangan kirim data pelanggan ke model lebih dari yang diperlukan. Enkripsi at-rest & in-transit. Dukung penghapusan (GDPR-ready).
4. **Guardrails AI ditegakkan deterministik** (`src/ai/guardrails.ts`): anti prompt-injection, blokir tindakan tak-berwenang (refund dll) → eskalasi. Tidak boleh dilemahkan tanpa review keamanan.
5. **Authz eksplisit.** Endpoint sensitif pakai `requireRole(...)`. Default deny.
6. **Validasi input.** Semua body HTTP lewat Zod. Tidak ada query string mentah ke SQL (Drizzle parametrized).
7. **Audit.** Aksi administratif & aksi agent → event log.
8. **Dependency.** Pantau `npm audit`; kerentanan critical/high diberesi sebelum rilis produksi.

---

## 6. Standar Database & Migrasi

- **Satu sumber skema:** `src/db/schema.ts`. Perubahan skema **selalu** lewat migrasi Drizzle versioned (`npm run db:generate` → review SQL → `db:migrate`). **Tidak ada** perubahan skema manual di DB.
- **`tenant_id` wajib** di setiap tabel data tenant, dengan index.
- **Tabel `events` APPEND-ONLY.** Dilarang `UPDATE`/`DELETE` event. Itu system of record.
- **Index dari awal** untuk kolom yang sering difilter (`tenant_id`, `status`, foreign key). Vektor pakai HNSW (`kbchunks_embedding_idx`).
- **Migrasi harus reversible-aware & forward-only di produksi.** Hindari migrasi destruktif (drop kolom) tanpa langkah deprecate dulu.
- **Tidak ada raw SQL** kecuali untuk hal yang ORM tak dukung (mis. operator vektor `<=>`), dan harus tetap parametrized.

---

## 7. Standar Desain API

- **REST + JSON**, versioned: `/v1/...`. Breaking change → versi baru, bukan ubah di tempat.
- **Bentuk error seragam** (dari error handler tersentral): `{ error: { code, message, details? } }`.
- **Status code benar:** 400 validasi, 401 auth, 403 authz, 404 tidak ada, 409 konflik, 5xx internal.
- **Idempotency** untuk operasi yang memicu kerja (mis. `enqueueTicket` pakai `jobId` = `ticket:<id>`).
- **Rate limit / kuota** di gateway — usage billing berarti abuse = biaya langsung.
- **Jangan bocorkan internal** di pesan error ke klien (stack trace hanya di log).
- Endpoint baru wajib: skema Zod input, scope tenant, role check bila perlu, dan emit event bila mengubah state penting.

---

## 8. Standar AI Engineering (bagian khusus & terpenting)

Ini pembeda kita. Aturan di sini lebih ketat dari kode biasa.

1. **Semua panggilan model lewat provider abstraction** (`src/ai/provider.ts`). Tidak ada `import Anthropic` tersebar. Ini yang menjaga kita model-agnostic.
2. **Output model diperlakukan sebagai untrusted input.** Selalu parse + validasi (Zod) dengan fallback aman. (Lihat `modelOutputSchema` di `runtime.ts`.) Model bisa mengembalikan apa saja.
3. **Grounding wajib.** Jawaban harus bersumber dari knowledge base. Bila retrieval kosong/lemah → eskalasi, bukan menebak. (FR-9/FR-10.)
4. **Guardrails deterministik, bukan diserahkan ke model.** Aturan keras (injection, tindakan terlarang) ditegakkan kode (`guardrails.ts`), bukan sekadar "minta model jangan".
5. **Confidence + eskalasi** adalah kontrak, bukan opsi. Di bawah `CONFIDENCE_ESCALATION_THRESHOLD` → eskalasi.
6. **Evals adalah tests.** Tidak ada perubahan prompt/logika agent yang naik ke autonomy lebih tinggi tanpa lolos eval suite. Eval coverage diperlakukan seperti code coverage. (Belum dibangun — item prioritas; lihat §13 Definition of Done untuk fitur AI.)
7. **Cost capture wajib** di setiap panggilan model (`ticketCosts`). Tak ada panggilan model "gelap" tanpa pencatatan token.
8. **Model selection sadar-biaya:** model besar untuk reasoning, model kecil untuk klasifikasi/routing. Default ke model Claude paling mampu untuk tugas yang menuntut kualitas.
9. **Determinisme dalam test:** pakai mode offline + embedding stub untuk uji pipeline tanpa kunci & tanpa flakiness.

---

## 9. Standar Testing

Piramida: banyak unit (logika murni), secukupnya integrasi (alur lintas-modul), sedikit e2e, plus **eval** khusus AI.

- **Logika murni wajib di-test** tanpa I/O: chunker, embeddings, guardrails, kalkulasi biaya, keputusan trust ladder. (Lihat `scripts/verify-core.ts` sebagai contoh smoke test — 11 cek lulus.)
- **Integrasi** menyentuh DB/queue nyata (lewat container test), bukan mock berlebihan. Mock hanya batas eksternal (provider model, API channel).
- **AI behavior → eval suite**, bukan assertion exact-match (output non-deterministik). Uji properti: "apakah dieskalasi saat harus", "apakah grounded", "apakah tidak melanggar guardrail".
- **Determinisme test:** tidak ada `Date.now()`/random tak-terkontrol dalam test; tidak bergantung jaringan eksternal.
- **CI menjalankan:** typecheck → lint → unit → integrasi → eval (untuk perubahan AI). Merah = tidak merge.

---

## 10. Git Workflow

- **Trunk-based ringan.** Branch pendek dari `main`: `feat/...`, `fix/...`, `chore/...`, `docs/...`.
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Pesan menjelaskan *kenapa*.
- **Commit kecil & atomik.** Satu commit = satu perubahan logis yang lulus typecheck.
- **Jangan commit:** `.env`, secrets, `node_modules/`, `dist/`. (Sudah di `.gitignore`.)
- **`main` selalu hijau & deployable.** Tidak push langsung ke `main` di luar setup awal — lewat PR.
- **Rebase untuk merapikan sebelum merge**, hindari merge commit berisik (preferensi tim, boleh diubah via ADR).

---

## 11. Code Review

Tujuan review: kebenaran, keamanan, keandalan, kesederhanaan — bukan selera.

**Checklist reviewer:**
- [ ] Apakah query data tenant difilter `tenant_id` dari token?
- [ ] Input divalidasi di batas? Output model divalidasi?
- [ ] Error pakai `AppError`? Tidak ada catch kosong / `console.log`?
- [ ] Perubahan state penting emit event?
- [ ] Ada test/eval yang membuktikan ini bekerja?
- [ ] Panggilan model lewat provider abstraction + cost dicatat?
- [ ] Skema berubah lewat migrasi, bukan manual?
- [ ] Kompleksitas sepadan dengan masalah? (Tolak over-engineering.)

**Aturan:** minimal 1 approval untuk merge. PR keamanan/AI-core → review lebih ketat. Author tidak self-approve. Komentar review bersifat *blocking* vs *nit* harus jelas (tandai `nit:`).

---

## 12. Observability

- **Structured logging (pino).** Sertakan konteks: `tenantId`, `conversationId`, `jobId`. Jangan log PII/secret.
- **Level benar:** `error` (butuh aksi), `warn` (anomali tertangani — mis. retry model), `info` (peristiwa bisnis), `debug` (detail dev).
- **Domain telemetry** sama pentingnya dengan teknis: resolution rate, escalation accuracy, cost-per-ticket, action-success-rate — diturunkan dari event log (`/v1/metrics`).
- **Tracing** (roadmap): satu tiket bisa ditelusuri lintas gateway → queue → worker → model.

---

## 13. Definition of Done (DoD)

Sebuah unit kerja **selesai** hanya bila SEMUA terpenuhi:
- [ ] Kode lulus `tsc --noEmit` (typecheck) & lint.
- [ ] Test/eval relevan ditulis & lulus.
- [ ] Keamanan: scope tenant, validasi input, tidak ada secret bocor.
- [ ] Event diemit untuk perubahan state penting.
- [ ] Cost dicatat (untuk fitur yang memanggil model).
- [ ] Dokumentasi/README diperbarui bila perilaku berubah.
- [ ] Tidak ada TODO/`any` tak-terjelaskan yang tertinggal.
- [ ] **Untuk fitur AI:** lolos eval suite sebelum naik autonomy level.

"Selesai" tanpa bukti = belum selesai.

---

## 14. Architecture Decision Records (ADR)

Keputusan teknis signifikan (pilih teknologi, ubah batas modul, langgar aturan Bible ini) **wajib** ADR singkat di `docs/adr/NNNN-judul.md`:

```
# ADR-0001: Judul keputusan
Status: Diusulkan | Diterima | Digantikan oleh ADR-XXXX
Tanggal: YYYY-MM-DD
## Konteks    — masalah & batasan
## Keputusan  — apa yang diputuskan
## Alternatif — yang dipertimbangkan & kenapa ditolak
## Konsekuensi — trade-off, termasuk yang negatif
## Reversibilitas — seberapa mahal di-undo (one-way door?)
```

ADR adalah memori institusional. Tanpa ini, tim mengulang debat yang sama.

---

## 15. Manajemen Biaya & Performa (Budgets)

- **Cost-per-resolved-ticket** dipantau; harus < harga jual dengan jalur margin ≥70%.
- Setiap fitur AI baru menyebutkan **estimasi token/biaya**-nya.
- Teknik turunkan biaya = first-class: caching prompt/respons, model tiering, batasi konteks yang dikirim.
- Performa: jalur tiket async (queue) supaya beban tinggi tidak memblokir; service stateless agar bisa scale horizontal.

---

## 16. Incident Response (ringan, sesuai tahap)

- **Severity:** SEV1 (agent kirim jawaban salah/berbahaya ke pelanggan, atau kebocoran data) — tertinggi. SEV2 (downtime/processing macet). SEV3 (degradasi minor).
- **SEV1 keamanan/AI:** hentikan dampak dulu (turunkan agent ke autonomy lebih rendah / pause queue), baru investigasi.
- **Postmortem blameless** untuk SEV1/2: timeline, akar masalah, aksi pencegahan → sering jadi ADR atau eval baru.
- **Kill switch:** kemampuan menurunkan semua agent ke `draft_for_approval`/`suggest` secara cepat adalah fitur keselamatan wajib (roadmap bila belum ada).

---

## 17. Onboarding Engineer Baru (hari pertama)

1. Baca: ini, [FOUNDATION.md](FOUNDATION.md), [ARCHITECTURE.md](ARCHITECTURE.md), [AI-EMPLOYEE-HANDBOOK.md](AI-EMPLOYEE-HANDBOOK.md).
2. Jalankan stack lokal (lihat [README.md](../README.md)): infra → migrate → seed → dev → worker.
3. Jalankan `scripts/verify-core.ts` — pastikan hijau.
4. Telusuri satu tiket end-to-end: `/v1/inbound` → worker → review → `/v1/metrics`, sambil baca event log.
5. PR pertama: perbaikan kecil + 1 test. Rasakan alur review.

---

## 18. Prinsip Penutup

> **Kita tidak menjual software. Kita menjual pekerjaan yang selesai dengan andal.**
> Setiap keputusan engineering tunduk pada satu pertanyaan: *apakah ini membuat AI employee kita lebih bisa dipercaya untuk pekerjaan nyata?* Kalau tidak, pertimbangkan ulang.

Dokumen ini hidup. Usulkan perubahan lewat PR + ADR. Aturan yang tidak lagi melayani keandalan harus dicabut, bukan diwariskan buta.
