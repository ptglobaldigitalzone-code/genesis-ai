# ADR-0005: Docker untuk Kontainerisasi

**Status:** Accepted
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Butuh lingkungan dev yang reproducible dan artefak deploy yang konsisten lintas dev/staging/prod. Tim kecil — setup harus "satu perintah".

## Keputusan
Memakai **Docker** (+ docker-compose untuk dev) untuk Postgres+Redis lokal dan untuk mengemas service/worker. Dijalankan di **managed container host**, **bukan Kubernetes** pada fase ini (lihat Konsekuensi).

## Alternatif yang dipertimbangkan
- **Tanpa kontainer (install lokal)** — rapuh, "works on my machine", onboarding lambat. Ditolak.
- **Kubernetes sekarang** — overkill untuk pre-revenue; overhead operasional besar. **Ditunda** sampai jumlah service & skala menuntut orkestrasi.
- **Serverless functions murni** — kurang cocok untuk worker long-running & koneksi DB persisten.

## Konsekuensi
- (+) Dev reproducible: `npm run infra:up` mengangkat Postgres(pgvector)+Redis (lihat `docker-compose.yml`).
- (+) Artefak deploy konsisten; mudah pindah host.
- (+) Tidak terkunci ke satu cloud.
- (−) Docker menambah sedikit kurva belajar & resource lokal — diterima.
- (−) Tanpa orkestrator, scaling/rollout awal lebih manual — diterima sampai skala menuntut K8s.

## Reversibilitas
Tinggi. Kontainer adalah standar; pindah ke K8s atau host lain kelak = aditif, bukan menulis ulang.
