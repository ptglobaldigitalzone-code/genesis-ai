# Genesis AI — Product Principles

> **Versi:** 1.0 · **Owner:** CTO · **Tanggal:** 2026-06-26
> **Status:** Living document — acuan pengambilan keputusan produk & teknis.
> **Terkait:** [VISION-2030.md](VISION-2030.md) · [FOUNDATION.md](FOUNDATION.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [AI-EMPLOYEE-HANDBOOK.md](AI-EMPLOYEE-HANDBOOK.md) · [ENGINEERING-BIBLE.md](ENGINEERING-BIBLE.md)

---

## Cara memakai dokumen ini

Prinsip bukan slogan. Prinsip adalah **alat memutuskan saat ada trade-off**. Setiap kali ada dua jalan dan tidak jelas mana yang benar, dokumen inilah yang menjawab. Kalau sebuah prinsip tidak pernah memaksa kita menolak sesuatu yang menggoda, ia tidak berguna — ia hanya hiasan.

Tiap prinsip di bawah punya: **arti**, **kenapa**, **wujud di Genesis** (bukti ia nyata di produk/kode kita), dan **anti-pattern** (yang ia larang). Bagian terakhir — *Saat Prinsip Bertabrakan* — adalah yang paling penting: prinsip yang tidak berurutan prioritas akan saling membatalkan.

---

## 1. AI First

**AI yang mengerjakan, manusia yang mengawasi — bukan sebaliknya.**

- **Arti:** Default setiap pekerjaan adalah AI employee yang menyelesaikannya end-to-end. Manusia masuk untuk mengawasi, menyetujui, dan menangani kasus sulit — bukan jadi pelaku utama yang dibantu AI.
- **Kenapa:** Kita menjual *tenaga kerja*, bukan *alat bantu*. Copilot yang sekadar membantu manusia tidak mengurangi beban kerja nyata — itu kategori yang kalah. Produk kita dirancang dari sudut "AI yang bertanggung jawab atas hasil".
- **Wujud di Genesis:** Workflow Engine (`src/workflow/support-agent.ts`) menjadikan agent sebagai aktor utama; manusia adalah reviewer/penjaga, bukan pengetik.
- **Anti-pattern:** Mendesain fitur di mana manusia tetap mengerjakan 80% pekerjaan dan AI "menyarankan". Itu copilot, bukan AI employee.

## 2. Human Approval

**Otonomi diperoleh, bukan diberikan. Manusia memegang kendali sampai kepercayaan terbukti.**

- **Arti:** AI tidak langsung bertindak bebas. Ia naik dari Suggest → Draft-for-approval → Act-with-review → Autonomous, dan operator yang memutuskan kapan naik.
- **Kenapa:** AI yang mengerjakan pekerjaan nyata itu menakutkan bagi pembeli. Kontrol yang terlihat adalah pintu adopsi. Ini juga rem keselamatan: jawaban salah ke pelanggan = kepercayaan runtuh.
- **Wujud di Genesis:** Trust Ladder (FR-12), default agent baru = `draft_for_approval`, review queue (`src/modules/review`), dan gerbang eval sebelum boleh `autonomous`.
- **Anti-pattern:** "Fully autonomous on day one." Melewati persetujuan demi kesan canggih. Menjual otonomi yang belum terbukti.

## 3. Everything Is Traceable

**Tidak ada tindakan agent yang tidak bisa dilihat, dijelaskan, dan diputar ulang.**

- **Arti:** Setiap keputusan agent — apa yang dilihat, diambil dari knowledge, diputuskan — tercatat sebagai event yang immutable. Operator bisa replay percakapan apa pun.
- **Kenapa:** Dalam produk AI, *bisa menjelaskan apa yang agent lakukan* adalah fitur kepercayaan sekaligus kebutuhan rekayasa (debug non-determinisme, bangun eval, audit). Tanpa jejak, tak ada kepercayaan dan tak ada perbaikan.
- **Wujud di Genesis:** Event log append-only sebagai system of record (`src/modules/events`), endpoint replay & audit (`/v1/conversations/:id/events`), metrics diturunkan dari log.
- **Anti-pattern:** Black box. Tindakan agent yang tidak ter-log. `UPDATE`/`DELETE` pada tabel events.

## 4. Security By Default

**Aman adalah keadaan awal, bukan fitur yang diaktifkan nanti.**

- **Arti:** Isolasi tenant, enkripsi, secrets management, dan guardrail aktif sejak baris pertama — bukan ditambahkan saat enterprise meminta.
- **Kenapa:** Kita memegang data pelanggan dari pelanggan kita. Satu kebocoran lintas-tenant = perusahaan selesai. Keamanan adalah prasyarat menjual ke bisnis, bukan upsell.
- **Wujud di Genesis:** `tenant_id` di setiap baris & query, diambil dari token (`src/lib/context.ts`), roadmap RLS; guardrail deterministik (`src/ai/guardrails.ts`); secrets di vault, bukan plaintext; default deny pada authz.
- **Anti-pattern:** "Nanti kita amankan saat scale." Mengambil `tenantId` dari input klien. Menyimpan kunci di kode.

## 5. Offline First (Resilient By Default)

**Sistem terdegradasi dengan anggun, tidak gagal total saat sebuah dependency tumbang — dan bisa dikembangkan/diuji tanpa ketergantungan eksternal.**

- **Arti:** Ketergantungan eksternal (model provider, embedding, channel) bukan titik kegagalan keras. Saat tak tersedia, sistem memilih jalur aman (eskalasi, antrian, fallback), bukan crash. Developer bisa menjalankan seluruh alur secara lokal tanpa kunci API.
- **Kenapa:** Keandalan adalah produk (Vision). Tenaga kerja yang "berhenti bekerja saat OpenAI down" tidak bisa dijual. Dan loop pengembangan yang tergantung jaringan itu lambat & rapuh.
- **Wujud di Genesis:** Mode offline deterministik di AI Runtime saat tak ada `ANTHROPIC_API_KEY` (`src/ai/provider.ts`), embedding stub deterministik (`src/ai/embeddings.ts`), retry+backoff, queue async sebagai buffer. Smoke test jalan tanpa infra (`scripts/verify-core.ts`).
- **Catatan jujur:** "Offline First" di sini berarti *resilient & dependency-optional untuk dev/test serta graceful degradation*, bukan aplikasi yang berjalan penuh tanpa cloud. Bila yang Anda maksud adalah deployment on-prem / data residency lokal, itu keputusan terpisah — beri tahu dan saya angkat jadi ADR.
- **Anti-pattern:** Hard-fail saat satu API mati. Test yang butuh jaringan dan jadi flaky. Tidak ada jalur degradasi.

## 6. API First

**Setiap kapabilitas adalah API sebelum ia jadi tombol. UI adalah klien dari API, bukan sebaliknya.**

- **Arti:** Fungsionalitas didefinisikan sebagai API berversi yang bersih lebih dulu; console operator hanyalah salah satu konsumennya. Integrasi pihak ketiga & ekspansi platform jadi mungkin.
- **Kenapa:** Visi kita adalah *platform*. Platform tanpa API hanyalah aplikasi. API-first membuat ekspansi (Phase 3: pelanggan/partner membangun agent sendiri) dan integrasi channel jadi natural, bukan retrofit.
- **Wujud di Genesis:** Semua kapabilitas terekspos via REST berversi `/v1/...` (`src/server.ts`), logika ada di service yang independen dari HTTP; console nantinya memakai API yang sama.
- **Anti-pattern:** Logika bisnis tertanam di handler UI. Endpoint tak berversi. Fitur yang hanya bisa lewat layar, tak bisa lewat API.

## 7. No Vendor Lock-In

**Kita mengorkestrasi vendor; tak satu pun vendor memiliki roadmap atau margin kita.**

- **Arti:** Model, infra, dan layanan bisa ditukar tanpa menulis ulang. Terutama: kita tidak menikah dengan satu foundation-model provider.
- **Kenapa:** Risiko eksistensial bila satu vendor mengubah harga/limit/kebijakan, atau naik ke stack kita. Independensi = daya tawar + ketahanan. Moat kita ada di lapisan orkestrasi & data, bukan di model orang lain.
- **Wujud di Genesis:** Provider abstraction model-agnostic (`src/ai/provider.ts`) — semua panggilan model lewat satu antarmuka; auth dirancang siap pindah ke managed; queue/DB pakai standar yang portabel.
- **Anti-pattern:** `import Anthropic` tersebar di seluruh kode. Memakai fitur proprietary vendor yang mengunci. Asumsi "selamanya pakai X".

## 8. Automation Before Manual Work

**Sebelum manusia mengerjakan sesuatu berulang, tanya: kenapa ini belum diotomatisasi?**

- **Arti:** Pekerjaan repetitif — baik untuk pelanggan maupun untuk tim kita sendiri — default-nya diotomatisasi. Kerja manual adalah pengecualian yang harus dibenarkan, bukan kebiasaan.
- **Kenapa:** Ini inti produk *dan* cara kerja kita. Perusahaan yang menjual otomasi tapi menjalankan operasinya secara manual itu munafik dan tidak scale. Setiap proses manual berulang adalah utang.
- **Wujud di Genesis:** Pipeline tiket async otomatis (queue→worker→workflow), ingestion knowledge otomatis (chunk→embed), metrik & cost terhitung otomatis dari event log. Untuk tim: migrasi, seed, verifikasi via skrip.
- **Anti-pattern:** Menerima "ya nanti dikerjakan manual tiap minggu" sebagai solusi permanen. Menumpuk toil tanpa rencana otomasi.

## 9. Every Action Has Context

**Tidak ada tindakan tanpa konteks — siapa, tenant mana, percakapan mana, kenapa.**

- **Arti:** Setiap operasi membawa konteksnya: tenant, pengguna/role, percakapan, dan alasan keputusan. Eskalasi membawa konteks lengkap agar manusia tak mengulang. Log membawa konteks agar bisa ditelusuri.
- **Kenapa:** Konteks adalah yang membuat traceability, keamanan, dan kepercayaan bisa bekerja. Tindakan tanpa konteks tak bisa diaudit, tak bisa diisolasi, tak bisa dijelaskan.
- **Wujud di Genesis:** `AuthContext` (tenant+user+role) mengalir di setiap request; event membawa `tenantId`/`conversationId`/`agentId`/`payload`; eskalasi menyertakan alasan & sumber (Handbook §4); logging terstruktur menyertakan konteks.
- **Anti-pattern:** Aksi global tanpa tenant. Eskalasi "tolong dibantu" tanpa konteks. Log telanjang tanpa korelasi.

## 10. Knowledge Is Company Asset

**Pengetahuan — milik pelanggan dan milik kita — adalah aset yang dikelola, dilindungi, dan dibuat menumpuk.**

- **Arti:** Knowledge base pelanggan diperlakukan sebagai aset bernilai: ter-kurasi, ter-isolasi, ter-versi. Setiap koreksi reviewer memperkaya aset itu. Pengetahuan operasional kita sendiri hidup di dokumen source-of-truth, bukan di kepala satu orang.
- **Kenapa:** Pengetahuan yang menumpuk adalah moat kita (Vision: *compounding data moat*). Agent tanpa pengetahuan = jawaban generik/salah. Pengetahuan yang tersebar/hilang = perusahaan yang rapuh.
- **Wujud di Genesis:** Knowledge Base ter-scope tenant+agent dengan metadata otoritas (`src/modules/knowledge`), grounding wajib pada KB, feedback reviewer sebagai sinyal pembelajaran; dan `docs/` sebagai source-of-truth perusahaan.
- **Anti-pattern:** Membiarkan agent menjawab tanpa grounding. Pengetahuan tim yang hanya ada di chat/kepala. Tidak mengubah koreksi jadi perbaikan permanen.

---

## Saat Prinsip Bertabrakan (urutan prioritas)

Prinsip-prinsip ini kadang menarik ke arah berlawanan. Saat itu terjadi, urutan ini yang memutuskan — dari yang **selalu menang**:

1. **Security By Default & Every Action Has Context** — fondasi. Tidak pernah dikorbankan demi apa pun.
2. **Human Approval** — menang atas **AI First** dan **Automation Before Manual Work**. Saat otomasi belum terbukti aman, manusia tetap memegang kendali. *Kepercayaan mengalahkan kecanggihan.*
3. **Everything Is Traceable** — menang atas kecepatan. Fitur yang tak bisa di-audit tidak rilis.
4. **AI First & Automation Before Manual Work** — default kuat, tapi tunduk pada tiga di atas.
5. **No Vendor Lock-In & API First** — arah arsitektural; boleh dikompromikan sementara demi *time-to-learn* di fase awal, **asalkan lewat ADR** yang menyatakan utang & rencana bayarnya.
6. **Offline First (Resilient)** — sifat yang dikejar; tingkat ketahanan dikalibrasi sesuai tahap.

**Contoh konkret:** AI First bilang "biarkan agent kirim sendiri". Human Approval bilang "belum, agent ini baru". → **Human Approval menang**: tetap di `draft_for_approval` sampai eval & KPI membuktikan layak naik. Kecanggihan tidak pernah mengalahkan kepercayaan.

---

*Dokumen ini hidup. Prinsip yang tak lagi memaksa keputusan yang benar harus diperbaiki atau dicabut lewat PR + ADR — bukan diwariskan sebagai slogan.*
