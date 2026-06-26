# ADR-0004: Next.js untuk Web Console

**Status:** Accepted
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Operator & Reviewer butuh console web: setup agent, review queue, dashboard metrik, replay. Harus cepat dibangun, ramah SEO/marketing nantinya, dan satu bahasa dengan backend (TypeScript).

## Keputusan
Memakai **Next.js (React)** untuk web console. Console adalah **klien dari API** (`/v1/...`), sesuai prinsip **API First** — bukan tempat logika bisnis.

## Alternatif yang dipertimbangkan
- **React SPA (Vite)** — ringan, tapi Next memberi routing, SSR/SSG (untuk marketing/landing), dan struktur lebih lengkap tanpa kerja ekstra.
- **Remix / SvelteKit / Vue/Nuxt** — bagus, tapi Next punya ekosistem & talent pool terbesar; React = standar de-facto.
- **Server-rendered (mis. HTMX + backend)** — kurang cocok untuk UI interaktif (review queue, dashboard real-time).

## Konsekuensi
- (+) TypeScript end-to-end → tipe API dibagi dengan backend.
- (+) Ekosistem & hiring besar; banyak komponen/library siap pakai.
- (+) SSR/SSG siap untuk marketing site di domain yang sama kelak.
- (−) Next bisa terasa "berat"/opinionated untuk app yang sangat sederhana — diterima; manfaat struktur > biaya.

## Reversibilitas
Tinggi. Karena console hanya konsumen API (API First), mengganti framework frontend tidak menyentuh backend sama sekali.
