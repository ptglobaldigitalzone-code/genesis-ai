# ADR-0007: Redis untuk Cache + Queue

**Status:** Accepted
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Pemrosesan tiket bersifat async (intake tak boleh memblokir). Butuh: antrian job yang durable dengan retry/backoff/idempotency, cache, rate-limit counter, dan (untuk event bus) streaming ringan.

## Keputusan
Memakai **Redis** sebagai backing untuk: **BullMQ** (queue pemrosesan tiket), cache, rate-limit, dan **Redis Streams** untuk fan-out event (lihat [ADR-0008](0008-event-bus.md)).

## Alternatif yang dipertimbangkan
- **RabbitMQ** — broker matang, tapi satu sistem lagi; BullMQ/Redis cukup pada skala kita dan DX-nya lebih baik untuk tim TypeScript.
- **SQS / Cloud Tasks** — terkelola & andal, tapi lock-in cloud; dipertimbangkan untuk fase skala.
- **Kafka** — untuk throughput/durability ekstrem; overkill sekarang (lihat ADR-0008).

## Konsekuensi
- (+) Satu sistem (Redis) melayani queue + cache + streams → ops sederhana.
- (+) BullMQ memberi retry, backoff, DLQ, idempotency (jobId), rate-limit per-tenant (sudah dibangun di `src/queue/`).
- (+) Ekosistem & familiaritas tinggi.
- (−) Redis sebagai queue tak sekuat broker khusus untuk jaminan tertentu — diterima pada skala ini; ada jalur ke SQS/Kafka.
- (−) Durability bergantung konfigurasi persistensi Redis — dikelola via infra.

## Reversibilitas
Sedang-tinggi. Queue diakses lewat lapisan tipis (`src/queue/index.ts`); pindah ke SQS/Kafka = mengganti adapter, bukan logika bisnis.
