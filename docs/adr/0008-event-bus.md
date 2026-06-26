# ADR-0008: Event Bus — Postgres Outbox → Redis Streams (NATS ditolak untuk v1)

**Status:** Accepted · NATS ⏸ Rejected (for now)
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Event log adalah **system of record** (Everything Is Traceable): replay, audit, metrik, eval, training data semua lahir darinya. Butuh: event tak boleh hilang (komit bersama perubahan state), dan bisa di-fan-out ke beberapa consumer (metrics, audit, eval, feedback). Permintaan awal menyebut **NATS**.

## Keputusan
Untuk v1: **transactional outbox** — event ditulis ke tabel `events` (APPEND-ONLY) dalam transaksi yang sama dengan perubahan state, lalu **di-fan-out via Redis Streams** ke consumer. **NATS tidak diadopsi sekarang.** Jalur skala: Kafka/managed streaming bila volume menuntut.

## Alternatif yang dipertimbangkan
- **NATS (JetStream)** — ringan, cepat, pub/sub + streaming yang bagus. **Ditolak untuk sekarang** karena: menambah sistem messaging terpisah, sementara kebutuhan v1 (durabilitas + fan-out beberapa consumer) sudah dipenuhi outbox+Redis tanpa komponen baru. Outbox juga memberi jaminan "event tak hilang" yang lebih sulit dicapai bila menulis langsung ke message bus terpisah dari transaksi DB.
- **Kafka** — standar industri untuk event streaming skala besar; overkill & berat secara ops untuk fase ini.
- **Tulis langsung ke bus (tanpa outbox)** — berisiko event hilang bila DB commit sukses tapi publish gagal (dual-write problem). Ditolak.

## Konsekuensi
- (+) Event tak hilang: di-commit transaksional bersama state (`src/modules/events/service.ts`).
- (+) Tanpa sistem messaging baru untuk dipasang/diamankan di v1.
- (+) Migrasi bus kelak transparan bagi producer (pola outbox menyembunyikan tujuan).
- (−) Redis Streams kurang kaya fitur dibanding NATS JetStream/Kafka untuk pola konsumsi kompleks.
- (−) Pada throughput event sangat tinggi / banyak consumer group, butuh bus khusus.

## Pemicu untuk meninjau ulang (adopsi NATS atau Kafka)
- Volume event / jumlah consumer group melampaui kenyamanan Redis Streams, **atau**
- Butuh pola messaging lanjutan (replay per-partition, retensi panjang, ordering kuat lintas service).
Saat itu: pilih NATS (ringan) vs Kafka (skala besar) lewat ADR baru.

## Reversibilitas
Tinggi. Pola outbox memisahkan "menulis event" dari "mengirim event". Producer hanya memanggil `emitEvent()`; mengganti mekanisme fan-out tidak menyentuh producer.
