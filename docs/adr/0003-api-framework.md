# ADR-0003: API Framework — Fastify/TypeScript (FastAPI/Python ditolak untuk API tier)

**Status:** Accepted (Fastify) · FastAPI ❌ Rejected (untuk API tier)
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Permintaan awal menyebut **FastAPI**. Ini keputusan **berbahasa**, bukan sekadar framework: **FastAPI adalah Python**, sedangkan stack kita dikunci **TypeScript end-to-end** (web + API + worker). Memilih FastAPI berarti menambahkan runtime & ekosistem bahasa kedua untuk lapisan API.

## Keputusan
Memakai **Fastify (TypeScript)** untuk API Gateway/BFF dan seluruh service tier. **FastAPI/Python tidak dipakai untuk API tier.** Python (kemungkinan FastAPI) **dicadangkan** untuk *future ML/eval tier* bila kebutuhan ML menuntutnya — itu akan jadi service terpisah dengan batas jelas, bukan menggantikan API tier.

## Alternatif yang dipertimbangkan
- **FastAPI (Python)** — sangat baik, ekosistem ML kaya, async, validasi Pydantic. **Ditolak untuk API tier** karena memecah tim kecil ke dua bahasa, dua toolchain, dua pola — menghancurkan velocity. Tidak ada keuntungan yang sepadan untuk lapisan API kita (kita memanggil model via HTTP SDK, bukan menjalankan model in-process).
- **Express** — populer, tapi lebih lambat & kurang first-class TypeScript/validation dibanding Fastify.
- **NestJS** — terstruktur, tapi lebih berat dari yang dibutuhkan fase ini.

## Konsekuensi
- (+) Satu bahasa end-to-end → tipe & util dibagi antara web, API, worker; onboarding & velocity maksimal untuk tim kecil.
- (+) Fastify cepat, schema-first, integrasi Zod & JWT mulus (sudah dibangun di `src/server.ts`).
- (−) Ekosistem ML Python tidak tersedia in-process — diterima; ML/eval akan jadi service Python terpisah saat dibutuhkan.
- (−) Bila kelak butuh banyak kerja ML berat, kita tetap mengelola dua bahasa (tapi terisolasi di tier-nya).

## Reversibilitas
Menambahkan service Python (FastAPI) untuk ML/eval di masa depan = **aditif**, murah, dan tidak mengganggu API tier. Mengganti API tier dari Fastify ke FastAPI = mahal (menulis ulang seluruh backend) → itulah kenapa keputusan ini diambil tegas sekarang.

## Catatan
Jika founder ingin backend berbahasa Python sejak awal (mis. karena tim lebih kuat di Python), ini **one-way door** yang harus diputuskan SEKARANG sebelum kode bertambah — beri tahu dan ADR ini akan di-*supersede*. Per kondisi saat ini (kode TypeScript sudah jalan & terverifikasi), rekomendasi tegas: **tetap Fastify/TypeScript**.
