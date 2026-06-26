# ADR-0006: Orkestrasi Workflow — State Machine dulu, Temporal diadopsi nanti

**Status:** Accepted (deferred adoption of Temporal)
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Workflow Engine mengorkestrasi pekerjaan tiap tiket: classify → retrieve → draft → guardrail → decide → deliver → log, termasuk **jeda human-in-the-loop** (menunggu review) yang harus tahan restart. Permintaan awal menyebut **Temporal** (durable execution engine).

## Keputusan
Untuk v1, memakai **state machine eksplisit & deterministik** di worker (`src/workflow/support-agent.ts`), state didukung DB. **Temporal diadopsi nanti** saat workflow menuntut durable execution sungguhan.

## Alternatif yang dipertimbangkan
- **Temporal sekarang** — sangat kuat untuk durable, long-running, resumable workflow + visibilitas. **Ditunda** karena: menambah server Temporal + worker SDK + model mental baru — kompleksitas operasional besar untuk alur v1 yang masih sederhana dan berjalan di bawah detik per tiket.
- **Hanya antrian job (tanpa engine)** — terlalu tipis; sulit mengelola state multi-langkah & jeda review secara bersih.
- **Step Functions (cloud)** — mengikat ke satu cloud (lawan No Vendor Lock-In).

## Konsekuensi
- (+) Sederhana, debuggable, tanpa infra tambahan; cukup untuk trust ladder & jeda review v1.
- (+) Batas bersih → adopsi Temporal kelak terlokalisasi di Workflow Engine.
- (−) State machine buatan sendiri tak punya durability/visibility sekuat Temporal.
- (−) Workflow yang sangat panjang / banyak jeda manusia / butuh resumability bulletproof akan menekan batas pendekatan ini.

## Pemicu untuk meninjau ulang (adopsi Temporal)
- Workflow jadi long-running (menit–jam) atau melintasi banyak jeda human-in-the-loop, **atau**
- Butuh resumability tahan-crash & observability eksekusi tingkat tinggi, **atau**
- Jumlah jenis workflow (multi-job) membuat orkestrasi manual rapuh.

## Reversibilitas
Tinggi. Orkestrasi terisolasi di `src/workflow/`. Mengganti state machine dengan Temporal = menulis ulang satu modul, bukan aplikasi.
