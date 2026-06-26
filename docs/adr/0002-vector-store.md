# ADR-0002: Vector Store — pgvector (Qdrant ditunda/bersyarat)

**Status:** Accepted (pgvector) · Qdrant ⏸ Rejected (for now)
**Tanggal:** 2026-06-26
**Pengambil keputusan:** CTO

## Konteks
Knowledge Base memakai RAG: knowledge tenant di-chunk, di-embed, dan dicari via similarity. Permintaan awal menyebut **Qdrant** (vector DB khusus). Kita harus memutuskan: vector DB terpisah, atau vektor di dalam Postgres.

## Keputusan
Memakai **pgvector di dalam PostgreSQL** untuk v1, dengan index **HNSW** + cosine distance. Vektor disimpan co-located dengan data tenant (`kb_chunks`), ter-scope `tenant_id` + `agent_id`. **Qdrant tidak diadopsi sekarang.**

## Alternatif yang dipertimbangkan
- **Qdrant** (juga Pinecone, Weaviate, Milvus) — vector DB khusus; performa retrieval superior pada skala sangat besar, fitur filtering kaya. **Ditolak untuk sekarang** karena: menambah sistem kedua untuk dipasang, diamankan, di-backup, dan disinkronkan dengan Postgres — overhead ops yang tak sepadan pada skala pre-revenue. Juga memecah isolasi tenant ke dua tempat.
- **In-memory / FAISS lokal** — cepat, tapi tak persisten/terkelola untuk multi-tenant produksi.

## Konsekuensi
- (+) Satu sistem data; isolasi tenant ter-enforce di satu tempat (RLS).
- (+) Transaksi konsisten antara chunk & metadata.
- (+) pgvector menangani jutaan chunk dengan baik — cukup untuk fase awal.
- (−) Pada skala vektor sangat besar / QPS tinggi, vector DB khusus akan lebih unggul.
- (−) Fitur filtering/hybrid search kurang kaya dibanding Qdrant.

## Pemicu untuk meninjau ulang (adopsi Qdrant)
- Latensi retrieval p95 melewati ambang SLA pada volume produksi, **atau**
- Jumlah chunk/QPS melampaui kemampuan praktis pgvector, **atau**
- Butuh fitur filtering/hybrid lanjutan yang sulit di pgvector.
Saat salah satu terpenuhi → ADR baru "Adopt Qdrant" + rencana migrasi (lapisan retrieval sudah diabstraksi di `src/modules/knowledge/service.ts`, sehingga penukaran terlokalisasi).

## Reversibilitas
Tinggi. Retrieval ada di balik satu service function; pindah ke Qdrant = mengganti implementasi `retrieve()` + pipeline ingest, bukan menulis ulang aplikasi.
