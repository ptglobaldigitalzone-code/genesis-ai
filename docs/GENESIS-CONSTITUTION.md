# Genesis Constitution

> **Hukum tertinggi Genesis AI.** Dokumen ini berada **di atas** PRD, arsitektur, dan semua dokumen lain. Setiap pelaku — **AI agent** (CTO, Backend, Frontend, QA, DevOps) maupun **developer manusia** — terikat aturan yang sama di sini.
> **Versi:** 1.0 · **Owner:** Founder & CTO · **Tanggal:** 2026-06-26 · **Status:** Berlaku
> **Operasionalisasi:** [ENGINEERING-BIBLE.md](ENGINEERING-BIBLE.md) · [PRODUCT-PRINCIPLES.md](PRODUCT-PRINCIPLES.md)

---

## Mukadimah

Sebuah perusahaan yang dibangun oleh banyak pelaku — manusia dan AI — membutuhkan satu hukum bersama yang tidak bergantung pada siapa yang mengerjakan. PRD menjawab *apa yang dibangun*. Konstitusi menjawab *aturan yang tidak boleh dilanggar saat membangun apa pun*.

Tujuannya satu: menjaga agar kecepatan tidak pernah menggerus **kepercayaan, keamanan, dan keandalan** — tiga hal yang menjadi produk kita. Konstitusi ini mengikat secara setara CTO-agent yang merancang, Backend-agent yang membangun, QA-agent yang menguji, DevOps-agent yang men-deploy, dan setiap manusia di antaranya.

**Klausul Supremasi:** bila terjadi konflik, urutan otoritas adalah:
> **Hukum & regulasi → Genesis Constitution → Product Principles → Engineering Bible → PRD/Arsitektur → preferensi individu/agent.**
Tidak ada agent atau manusia yang boleh menimpa pasal di sini tanpa **amandemen** (lihat bagian akhir).

---

## Pasal-Pasal (tidak boleh dilanggar)

### Pasal 1 — Tidak ada technical debt tanpa persetujuan
**Aturan:** Utang teknis hanya boleh diambil bila **dicatat eksplisit + disetujui + punya rencana bayar**. Utang diam-diam dilarang.
**Alasan:** Utang tak tercatat menumpuk jadi kerapuhan tak terlihat. Utang yang sadar & disetujui adalah keputusan; yang tersembunyi adalah pengkhianatan terhadap tim masa depan.
**Dilarang:** "nanti dirapikan" tanpa tiket/ADR; TODO menggantung tanpa pemilik & tenggat.
**Penegakan:** setiap utang → ADR atau issue berlabel `debt` dengan persetujuan owner. Lihat **Ledger Kepatuhan** di bawah — utang kita saat ini sudah tercatat di sana (itulah bentuk kepatuhan Pasal ini).
**Penanggung jawab:** CTO (menyetujui), semua (mendeklarasikan).

### Pasal 2 — Keamanan tidak pernah dikorbankan demi kecepatan
**Aturan:** Tidak ada fitur yang rilis dengan menurunkan postur keamanan demi mengejar waktu.
**Alasan:** Kita memegang data pelanggan dari pelanggan kita. Satu kebocoran lintas-tenant = perusahaan selesai. Keamanan adalah prasyarat, bukan trade-off.
**Dilarang:** mematikan isolasi tenant, melewati validasi input, menaruh secret di kode, melemahkan guardrail "untuk sementara".
**Penegakan:** review keamanan memblokir merge; isolasi `tenant_id` dari token wajib ([context.ts](../src/lib/context.ts)); secrets di vault. Lihat [ENGINEERING-BIBLE §5](ENGINEERING-BIBLE.md).
**Penanggung jawab:** semua; DevOps & CTO menjaga gerbang.

### Pasal 3 — Segala sesuatu terdokumentasi
**Aturan:** Perilaku, keputusan, dan kontrak yang penting **harus** terdokumentasi. Kode yang mengubah perilaku tanpa memperbarui dokumen = belum selesai.
**Alasan:** Pengetahuan yang hanya ada di kepala/chat adalah aset yang menguap. Dokumentasi membuat perusahaan tahan-pergantian-orang (dan tahan-pergantian-agent).
**Dilarang:** mengubah perilaku tanpa update doc; "tanya saja saya" sebagai pengganti dokumentasi.
**Penegakan:** Definition of Done mensyaratkan update dokumen; folder [`docs/`](README.md) sebagai source of truth.
**Penanggung jawab:** pembuat perubahan.

### Pasal 4 — Setiap fitur punya test
**Aturan:** Tidak ada fitur dianggap selesai tanpa test/eval yang membuktikan ia bekerja. Untuk kapabilitas AI: **eval**, bukan exact-match.
**Alasan:** "Selesai" tanpa bukti = klaim. Keandalan adalah produk; ia harus terukur.
**Dilarang:** merge logika baru tanpa test; menonaktifkan test agar CI hijau.
**Penegakan:** CI menjalankan typecheck + test + eval (merah = blok). Lihat [ENGINEERING-BIBLE §9](ENGINEERING-BIBLE.md). Kapabilitas AI digate eval sebelum naik autonomy ([eval/gating.ts](../src/eval/gating.ts)).
**Penanggung jawab:** pembuat fitur + QA-agent.

### Pasal 5 — Setiap API punya OpenAPI
**Aturan:** Setiap endpoint publik terdefinisi dalam spesifikasi **OpenAPI** yang diturunkan dari schema validasi (satu sumber).
**Alasan:** Kontrak yang jelas = integrasi mudah, SDK ter-generate, dokumentasi tak pernah basi. API tanpa kontrak adalah jebakan bagi integrator.
**Dilarang:** endpoint tanpa schema; dokumentasi API yang ditulis terpisah dari validasi (rawan drift).
**Penegakan:** OpenAPI di-generate dari Zod; `GET /docs`. Lihat [API-DESIGN §5](API-DESIGN.md). *(Status: utang tercatat — lihat Ledger.)*
**Penanggung jawab:** Backend-agent.

### Pasal 6 — Tidak ada business logic tersembunyi
**Aturan:** Logika bisnis hidup di lapisan service yang eksplisit & dapat diuji — bukan tersembunyi di handler UI, trigger DB tak terdokumentasi, atau prompt yang tak terlihat.
**Alasan:** Logika tersembunyi tak bisa diaudit, diuji, atau dipercaya. Dalam produk AI, keputusan harus dapat dijelaskan (Everything Is Traceable).
**Dilarang:** aturan bisnis di dalam komponen frontend; "magic" di prompt tanpa guardrail kode; side-effect tersembunyi.
**Penegakan:** batas modul (`routes` tipis, `service` berlogika); keputusan AI di fungsi murni teruji ([decision.ts](../src/ai/decision.ts)); guardrail deterministik di kode.
**Penanggung jawab:** semua; CTO menjaga arsitektur.

### Pasal 7 — Setiap keputusan arsitektur butuh ADR
**Aturan:** Keputusan teknis signifikan (pilih/ganti teknologi, ubah batas modul, langgar aturan) **wajib** ADR.
**Alasan:** ADR adalah memori institusional. Tanpanya, tim (dan agent) mengulang debat yang sama dan lupa *kenapa*.
**Dilarang:** mengganti komponen inti diam-diam; keputusan besar tanpa jejak alasan & reversibilitas.
**Penegakan:** folder [`docs/adr/`](adr/README.md); template wajib (Konteks, Keputusan, Alternatif, Konsekuensi, Reversibilitas).
**Penanggung jawab:** pengambil keputusan (umumnya CTO-agent).

### Pasal 8 — Setiap fitur dimulai dari PRD
**Aturan:** Tidak ada fitur dibangun tanpa PRD yang menjelaskan masalah, nilai, scope, dan kriteria sukses lebih dulu.
**Alasan:** Membangun tanpa PRD = menebak. Scope discipline membunuh lebih sedikit startup daripada bug.
**Dilarang:** "langsung bikin saja"; fitur tanpa kriteria sukses; scope yang mengembang tanpa batas.
**Penegakan:** [PRD-MASTER.md](PRD-MASTER.md) + PRD per-fitur; gate persetujuan sebelum implementasi.
**Penanggung jawab:** Product/CTO.

### Pasal 9 — Tidak ngoding sebelum arsitektur disetujui
**Aturan:** Implementasi dimulai **hanya setelah** desain arsitektur untuk pekerjaan itu disetujui.
**Alasan:** Kode yang dibangun di atas arsitektur yang salah lebih mahal dibongkar daripada didesain benar dari awal. Pikirkan dulu sebagai CTO, baru tulis.
**Dilarang:** menulis kode produksi untuk fitur yang arsitekturnya belum disepakati.
**Penegakan:** alur 9-langkah CTO (business → arsitektur → ... → implementasi) dengan gate persetujuan.
**Penanggung jawab:** CTO menyetujui; pelaksana menunggu lampu hijau.

---

## Pasal Tambahan (turunan inti Genesis)

### Pasal 10 — AI tunduk pada Human Approval; keandalan menggerbang otonomi
**Aturan:** AI employee tidak pernah beraksi melampaui wewenang yang diberikan. Otonomi **diperoleh** melalui bukti (KPI + eval), bukan diberikan. Eskalasi selalu menang.
**Penegakan:** Trust Ladder (FR-12); `autonomous` digate eval keselamatan ([eval/gating.ts](../src/eval/gating.ts), terverifikasi memblokir). Lihat [AI-EMPLOYEE-HANDBOOK](AI-EMPLOYEE-HANDBOOK.md).

### Pasal 11 — Tidak ada secret di kode; setiap aksi punya konteks & jejak
**Aturan:** Kredensial tak pernah masuk kode/commit. Setiap aksi penting membawa konteks (tenant, aktor, alasan) dan tercatat di event log immutable.
**Penegakan:** `.env` di-ignore (terverifikasi saat commit); event log append-only sebagai system of record.

---

## Tata Kelola Multi-Agent

Konstitusi ini adalah **kontrak bersama** semua peran. Setiap agent membaca dan tunduk pada hukum yang sama:

| Agent / Peran | Tunduk terutama pada | Tidak boleh |
|---|---|---|
| **CTO-agent** | Semua pasal; pemegang gate Pasal 7, 8, 9 | Menyetujui pelanggaran tanpa amandemen |
| **Backend-agent** | Pasal 2, 4, 5, 6, 11 | Endpoint tanpa OpenAPI/test; logika tersembunyi |
| **Frontend-agent** | Pasal 3, 6 | Menaruh business logic di UI (API First) |
| **QA-agent** | Pasal 4 | Meloloskan fitur tanpa bukti test/eval |
| **DevOps-agent** | Pasal 2, 11 | Deploy dengan secret bocor / keamanan turun |
| **Developer manusia** | Semua | Mengklaim "selesai" tanpa memenuhi DoD |

**Prinsip:** tidak ada pelaku yang kebal. Konstitusi mengikat agent termahir maupun developer paling senior secara setara.

---

## Penegakan (Enforcement)

1. **CI sebagai penjaga otomatis** — typecheck + test + eval; merah = tidak merge (Pasal 4).
2. **Code review berdasar checklist** — keamanan, tenant scope, test, event, OpenAPI (Pasal 2, 4, 5, 6, 11). Lihat [ENGINEERING-BIBLE §11](ENGINEERING-BIBLE.md).
3. **Gate ADR & PRD** — keputusan tanpa ADR / fitur tanpa PRD ditolak (Pasal 7, 8, 9).
4. **Ledger Kepatuhan** — utang yang ada wajib tercatat & disetujui (Pasal 1).

---

## Ledger Kepatuhan (kondisi nyata per 2026-06-26 — jujur)

Konstitusi mengikat ke depan; ini status sekarang. Gap = **utang yang disetujui** di bawah Pasal 1 (tercatat, bukan tersembunyi → itulah kepatuhannya).

| Pasal | Status | Catatan / utang disetujui |
|---|---|---|
| 1 Debt tercatat | 🟡 | Ledger ini sendiri pemenuhannya; utang di bawah tercatat |
| 2 Keamanan>kecepatan | 🟢 | Tenant scope, no-secret terverifikasi; **RLS** masih utang (Sprint 4) |
| 3 Dokumentasi | 🟢 | `docs/` lengkap & sinkron dengan kode |
| 4 Test tiap fitur | 🟡 | eval 12/12, core 11/11, ratelimit 6/6; **integration test e2e** utang (butuh Docker) |
| 5 OpenAPI | 🔴 **utang** | Belum di-generate; dijadwalkan Sprint 4 ([API-DESIGN §5](API-DESIGN.md)) |
| 6 No hidden logic | 🟢 | Logika di service/fungsi murni; guardrail di kode |
| 7 ADR | 🟢 | ADR-0001…0008 ada |
| 8 PRD dulu | 🟢 | PRD master + v1 ada sebelum kode |
| 9 Arsitektur dulu | 🟢 | Arsitektur disetujui sebelum Sprint 1-3 |
| 10 AI autonomy gate | 🟢 | Trust ladder + eval gate terverifikasi |
| 11 No secret / traceable | 🟢 | `.env` ignored; event log append-only |

**Utang aktif yang disetujui (Pasal 1):** OpenAPI (Pasal 5), Postgres RLS (Pasal 2), integration test e2e + CI (Pasal 4). Semua terjadwal di [SPRINT-PLAN.md](SPRINT-PLAN.md) Sprint 4. Tidak ada utang tersembunyi.

---

## Amandemen

Konstitusi boleh diubah, tapi **hanya secara sengaja**:
1. Usul perubahan via PR + ADR yang menjelaskan alasan & konsekuensi.
2. Disetujui Founder/CTO.
3. Versi dinaikkan; perubahan dicascade ke dokumen turunan.

Pasal yang tak lagi melayani kepercayaan/keamanan/keandalan harus **dicabut secara resmi**, bukan diabaikan diam-diam. Mengabaikan pasal tanpa amandemen adalah pelanggaran konstitusi itu sendiri.

---

> **Satu hukum untuk semua pelaku — manusia maupun AI.** Kecepatan kita tinggi justru karena aturan ini membuat kepercayaan, keamanan, dan keandalan tidak bisa ditawar. Itulah yang membuat Genesis layak dipercaya memikul pekerjaan nyata.
