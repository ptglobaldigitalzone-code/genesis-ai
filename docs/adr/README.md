# Architecture Decision Records (ADR)

> Catatan keputusan arsitektur Genesis AI. Setiap keputusan teknis signifikan direkam di sini — termasuk **alternatif yang ditolak dan kenapa**. ADR adalah memori institusional; tanpanya tim mengulang debat yang sama.

Template & aturan: [ENGINEERING-BIBLE.md §14](../ENGINEERING-BIBLE.md).

## Status legend
- **Accepted** — diputuskan & berlaku.
- **Accepted (deferred)** — diputuskan, tapi adopsi penuh ditunda ke fase tertentu.
- **Rejected (for now)** — tidak dipakai sekarang; bisa ditinjau ulang dengan pemicu jelas.
- **Superseded by ADR-XXXX** — digantikan keputusan lain.

## Index

| ADR | Keputusan | Status |
|---|---|---|
| [ADR-0001](0001-postgresql.md) | PostgreSQL sebagai primary database | ✅ Accepted |
| [ADR-0002](0002-vector-store.md) | pgvector untuk vektor (Qdrant ditunda/bersyarat) | ✅ Accepted · Qdrant ⏸ Rejected (for now) |
| [ADR-0003](0003-api-framework.md) | Fastify/TypeScript untuk API (FastAPI/Python ditolak untuk API tier) | ✅ Accepted · FastAPI ❌ Rejected |
| [ADR-0004](0004-nextjs.md) | Next.js untuk web console | ✅ Accepted |
| [ADR-0005](0005-docker.md) | Docker untuk kontainerisasi | ✅ Accepted |
| [ADR-0006](0006-temporal.md) | State machine dulu; Temporal diadopsi nanti | ✅ Accepted (deferred) |
| [ADR-0007](0007-redis.md) | Redis untuk cache + queue (BullMQ) | ✅ Accepted |
| [ADR-0008](0008-event-bus.md) | Postgres outbox → Redis Streams (NATS ditolak untuk v1) | ✅ Accepted · NATS ⏸ Rejected (for now) |

> **Catatan penting:** daftar permintaan awal mencantumkan Qdrant, FastAPI, Temporal, dan NATS. Keempatnya **bertabrakan dengan stack yang sudah dikunci & dibangun**. ADR di bawah merekam keputusan nyata kita secara jujur, bukan membenarkan teknologi yang tidak dipakai. Bila Anda ingin benar-benar berpindah ke salah satunya, itu keputusan founder — dan ADR-nya akan diperbarui dengan status baru + rencana migrasi.
