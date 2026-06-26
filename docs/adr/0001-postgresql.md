# ADR-0001: PostgreSQL sebagai Primary Database

**Status:** Accepted
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Genesis butuh penyimpanan untuk data relasional (tenant, user, agent, percakapan, event, biaya) sekaligus vektor untuk RAG. Tim kecil, pre-revenue — biaya operasional dan kompleksitas harus minimal. Multi-tenancy adalah syarat sejak baris pertama, dan event log harus jadi system of record yang andal.

## Keputusan
Memakai **PostgreSQL** sebagai satu-satunya primary database, dengan ekstensi **pgvector** untuk embedding (lihat [ADR-0002](0002-vector-store.md)) dan **Row-Level Security** (roadmap) untuk isolasi tenant.

## Alternatif yang dipertimbangkan
- **MySQL/MariaDB** — matang, tapi ekosistem vektor & fitur JSON/RLS kalah dari Postgres.
- **MongoDB / NoSQL** — fleksibel skema, tapi kita butuh transaksi kuat (outbox event), relasi, dan integritas — relational menang.
- **DB terkelola serverless (mis. DynamoDB)** — scale mudah, tapi lock-in tinggi dan model query terbatas untuk kebutuhan relasional + vektor kita.

## Konsekuensi
- (+) Satu DB untuk relasional + vektor → ops sederhana, tak perlu sinkronisasi dua sistem.
- (+) Transaksi kuat memungkinkan transactional outbox (event tak hilang).
- (+) RLS memberi lapis kedua isolasi tenant.
- (+) Teknologi membosankan & terbukti — sesuai prinsip "boring for the boring parts".
- (−) Skala write ekstrem suatu hari butuh partisi/replica/sharding — diterima; ada jalur (read replica → partisi tabel `events`/`messages`).
- (−) pgvector pada skala vektor sangat besar bisa kalah dari vector DB khusus — lihat ADR-0002.

## Reversibilitas
Tinggi untuk pilihan "pakai relational"; sedang untuk Postgres spesifik (migrasi antar-RDBMS mahal tapi mungkin). Bukan one-way door yang menakutkan karena akses lewat Drizzle ORM.
