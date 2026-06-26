# Genesis AI — Product Requirements Document (PRD)

> **Versi:** 1.0 (DRAFT — menunggu persetujuan founder)
> **Bahasa:** Bahasa Indonesia (terjemahan dari PRD.md)
> **Produk:** Genesis AI — AI Workforce Platform
> **Cakupan v1.0:** AI Customer Support Agent (the wedge)
> **Pemilik:** CTO · **Tanggal:** 2026-06-26
> **Dokumen pendamping:** [FOUNDATION.md](FOUNDATION.md)

---

## 0. Document Control

| Field | Value |
|---|---|
| Status | DRAFT v1.0 — perlu persetujuan |
| Approvers | Founder (Anda) |
| Wedge yang diasumsikan | AI Customer Support Agent *(override hanya mengubah spesifik use-case, bukan strukturnya)* |
| Penjaga out-of-scope | Apa pun yang tidak tercantum di §7 secara eksplisit **tidak** masuk v1.0 |

---

## 1. Ringkasan

Genesis AI v1.0 menghadirkan **AI Customer Support Agent berbasis no-code** yang dapat dijalankan oleh operator non-teknis dalam waktu kurang dari satu hari. Agent ini menyerap pengetahuan perusahaan (dokumen, FAQ, tiket lampau), terhubung ke satu kanal support, dan **secara otonom menyusun draf atau mengirimkan resolusi** atas pertanyaan pelanggan yang masuk — di bawah **trust ladder** yang terlihat jelas dengan human-in-the-loop sebagai default. Setiap tindakan dicatat, dapat di-replay, dan dapat diukur.

v1.0 bukanlah platform lengkap. Ini adalah **hal terkecil yang membuktikan tesis inti**: *dapatkah sebuah AI agent secara andal mengerjakan pekerjaan support yang nyata, secara observable, sedemikian rupa sehingga sebuah bisnis bersedia membayar untuk tiket yang terselesaikan?*

## 2. Pernyataan Masalah

Perusahaan SMB dan mid-market kewalahan oleh volume support pelanggan yang berulang. Merekrut tidak scalable, outsourcing berkualitas rendah, dan tool support "AI" yang ada saat ini umumnya bersifat (a) bot deflection bodoh yang membuat pelanggan frustrasi, atau (b) copilot yang hanya *membantu* seorang agent manusia yang tetap harus mengerjakan pekerjaannya. Tidak ada produk yang mudah diakses yang memungkinkan operator non-teknis men-deploy agent yang **benar-benar menyelesaikan tiket end-to-end, secara andal, dengan pengawasan yang mereka percayai.**

## 3. Goals & Non-Goals

### Goals (v1.0)
- G1 — Operator non-teknis dapat membuat, melatih, dan men-deploy agent support dalam **< 1 hari** (time-to-first-value).
- G2 — Agent **menyelesaikan tiket nyata** pada kualitas yang terukur, dengan pengawasan human-in-the-loop.
- G3 — Setiap tindakan agent bersifat **observable, auditable, dan dapat di-replay**.
- G4 — Membuktikan **ekonominya**: cost-per-resolved-ticket < harga yang dapat kami tetapkan < alternatif manusia.
- G5 — Menetapkan UX **trust-ladder** sebagai tulang punggung produk.

### Non-Goals (secara eksplisit BUKAN v1.0)
- N1 — Beragam tipe agent / vertikal (hanya support).
- N2 — Multi-channel saat peluncuran (hanya satu kanal — lihat §7).
- N3 — Otomasi billing self-serve penuh (billing manual/tahap awal dapat diterima di MVP).
- N4 — Custom agent yang dibangun pelanggan / general agent builder (visi Phase 3).
- N5 — Fitur enterprise: SSO, infrastruktur dedicated, RBAC tingkat lanjut (Phase 3).
- N6 — Support suara/telepon (hanya teks).

## 4. Success Metrics (KPI)

| Metric | Definisi | Target v1.0 |
|---|---|---|
| **Resolution rate** | Tiket yang sepenuhnya diselesaikan agent tanpa editan manusia | ≥ 50% (fase design-partner) |
| **Assisted rate** | Tiket yang drafnya dikirim dengan editan minor | ≥ 30% |
| **Escalation accuracy** | Agent meng-eskalasi dengan benar saat ragu (false-confidence rendah) | ≥ 95% |
| **CSAT pada tiket yang ditangani agent** | Kepuasan pelanggan atas tiket yang diselesaikan agent | ≥ setara dengan manusia |
| **Time-to-first-value** | Signup → tiket nyata pertama yang ditangani | < 1 hari |
| **Cost per resolved ticket** | (token + infra + review) / tiket terselesaikan | < harga yang ditagih, jalur margin ≥70% |
| **Reliability** | Uptime agent + keberhasilan penyelesaian tindakan | ≥ 99% keberhasilan tindakan |

## 5. Target Users / Persona

- **Primer — "Operator" (pembeli & admin):** support lead / ops manager / founder di sebuah SMB. Non-teknis. Memiliki agent: melatihnya, menetapkan autonomy level-nya, mereview pekerjaannya, memantau metriknya. *Produk ini dibangun untuk orang ini.*
- **Sekunder — "Reviewer" (human-in-the-loop):** staf support yang menyetujui/mengedit draf agent dan menangani eskalasi.
- **Penerima manfaat akhir — "Customer":** pelanggan dari perusahaan itu sendiri yang menerima respons dari agent. Tidak pernah melihat branding Genesis; mengalami jawaban yang cepat dan benar.

## 6. Key Use Cases / User Stories

- **US1 (Operator):** Sebagai operator, saya menghubungkan sumber pengetahuan dan kanal support saya agar agent dapat mempelajari bisnis saya dan mulai menangani tiket.
- **US2 (Operator):** Sebagai operator, saya menetapkan autonomy level agent (Suggest / Draft / Act-with-review / Autonomous) agar saya mengendalikan seberapa banyak yang dikerjakannya tanpa pengawasan.
- **US3 (Reviewer):** Sebagai reviewer, saya melihat balasan yang didraf agent di dalam queue, mengedit/menyetujui/menolaknya, dan editan saya melatih agent.
- **US4 (Perilaku agent):** Ketika sebuah tiket masuk, agent mengambil pengetahuan yang relevan, menyusun jawaban yang grounded, lalu mengirimkannya atau merutekannya untuk review sesuai autonomy level.
- **US5 (Perilaku agent):** Ketika agent tidak yakin atau permintaan memerlukan manusia/kebijakan/tindakan yang tidak bisa diambilnya, agent **meng-eskalasi** dengan konteks alih-alih menebak.
- **US6 (Operator):** Sebagai operator, saya melihat dashboard berisi resolution rate, eskalasi, biaya, dan CSAT agar saya dapat memercayai dan menyetel agent.
- **US7 (Operator/Auditor):** Sebagai operator, saya dapat membuka tiket mana pun dan me-replay persis apa yang dilihat, diambil, dan diputuskan agent.

## 7. Functional Requirements (cakupan v1.0)

> Setiap requirement dapat ditelusuri. **MUST** = masuk v1.0. **SHOULD** = jika waktu memungkinkan. **WON'T** = ditunda secara eksplisit.

### A. Onboarding & Knowledge
- **FR-1 (MUST):** Operator dapat membuat akun dan sebuah workspace "Agent".
- **FR-2 (MUST):** Operator dapat menyerap pengetahuan dari: (a) dokumen yang diunggah (PDF/teks/markdown), (b) crawl URL/sitemap help-center, (c) CSV berisi Q&A lampau. → membangun knowledge base agent (RAG).
- **FR-3 (MUST):** Operator dapat mengedit/mengkurasi knowledge base (menambah, menghapus, menandai sebagai otoritatif).
- **FR-4 (SHOULD):** Operator dapat mendefinisikan brand voice/tone melalui contoh dan instruksi singkat.

### B. Channel Integration
- **FR-5 (MUST):** Menghubungkan **satu** kanal support untuk v1.0. **Direkomendasikan: email/shared inbox** (paling sederhana, universal) — alternatif: satu integrasi help-desk (mis. salah satu dari Zendesk/Intercom/Freshdesk) jika seorang design partner membutuhkannya.
- **FR-6 (MUST):** Tiket/pesan inbound diterima, dimasukkan ke queue, dan diatribusikan ke sebuah thread percakapan.
- **FR-7 (MUST):** Respons outbound agent dikirimkan kembali melalui kanal yang sama.

### C. The Agent (inti)
- **FR-8 (MUST):** Pada setiap tiket inbound, agent: mengklasifikasi intent → mengambil pengetahuan yang relevan → menyusun respons yang grounded → memutuskan tindakan sesuai autonomy level.
- **FR-9 (MUST):** Respons bersifat **grounded** — jawaban mengutip/diturunkan dari knowledge base; agent tidak mengarang kebijakan.
- **FR-10 (MUST):** **Confidence + eskalasi:** agent menghasilkan sinyal confidence dan meng-eskalasi ke manusia saat di bawah ambang batas, saat permintaan memerlukan tindakan yang tidak bisa diambilnya, atau saat pengetahuan tidak tersedia.
- **FR-11 (MUST):** **Guardrails:** agent menolak/meng-eskalasi permintaan yang out-of-scope, sensitif, atau berisiko (refund di luar kebijakan, hukum, penyalahgunaan) alih-alih bertindak.

### D. Trust Ladder & Human-in-the-Loop
- **FR-12 (MUST):** **Autonomy level** per agent, dikendalikan operator:
  1. *Suggest* — draf hanya internal, tidak pernah dikirim.
  2. *Draft-for-approval* — draf masuk ke review queue; manusia yang mengirim.
  3. *Act-with-review* — agent mengirim, manusia mereview setelahnya (sampled/async).
  4. *Autonomous* — agent mengirim, review hanya pada kasus low-confidence/flagged.
- **FR-13 (MUST):** UI **review queue**: reviewer melihat draf, dapat menyetujui/mengedit/menolak; editan dan penolakan ditangkap sebagai feedback.
- **FR-14 (SHOULD):** Koreksi yang ditangkap memperbaiki respons di masa depan (feedback loop ke retrieval/prompting).

### E. Observability & Trust
- **FR-15 (MUST):** **Action log** — setiap keputusan agent (input yang dilihat, pengetahuan yang diambil, draf, tindakan yang diambil) dicatat sebagai sebuah event.
- **FR-16 (MUST):** **Replay** — operator dapat membuka percakapan mana pun dan melihat seluruh jejak reasoning.
- **FR-17 (MUST):** **Dashboard** — resolution rate, assisted rate, escalation rate, volume, biaya, CSAT (jika tersedia).
- **FR-18 (MUST):** **Cost visibility** — token/biaya per tiket dilacak dan ditampilkan.

### F. Platform basics
- **FR-19 (MUST):** Isolasi data multi-tenant yang aman (pengetahuan/tiket setiap pelanggan terpisah secara ketat).
- **FR-20 (MUST):** Auth dasar (email/password atau magic link) + role: Operator (admin), Reviewer.
- **FR-21 (WON'T - ditunda):** SSO, SCIM, custom RBAC, white-label, multi-agent, otomasi billing.

## 8. Key User Flows (tingkat tinggi)

1. **Setup flow:** Sign up → buat agent → serap pengetahuan → hubungkan kanal → set autonomy = *Draft-for-approval* (default yang aman) → go live.
2. **Ticket flow:** Tiket inbound → agent mengambil + menyusun draf → (sesuai autonomy) kirim atau queue → reviewer bertindak → respons dikirimkan → dicatat → metrik diperbarui.
3. **Trust graduation flow:** Operator memantau resolution + escalation accuracy → menaikkan autonomy level seiring tumbuhnya kepercayaan.
4. **Audit flow:** Operator membuka tiket mana pun → me-replay reasoning agent → mengoreksi pengetahuan jika diperlukan.

## 9. Technical & Architecture Constraints (ringkasan — arsitektur lengkap adalah dokumen terpisah)

- **Lapisan orkestrasi yang model-agnostic.** Default ke model Claude paling kapabel untuk reasoning; model yang lebih kecil/murah untuk klasifikasi/sub-task. Provider dapat ditukar.
- **RAG** atas knowledge base per-tenant (vector store + retrieval).
- **Action log yang event-sourced** sebagai system of record untuk perilaku agent (menggerakkan replay, audit, eval, training masa depan).
- **Scaffolding deterministik** di sekitar pemanggilan model yang non-deterministik: validasi, retry, idempotency, guardrails.
- **Eval harness** untuk kualitas agent, dijalankan di CI pada setiap perubahan prompt/logic (FR-8–FR-11 harus memiliki eval sebelum tier "Autonomous" dirilis).
- Pemrosesan tiket berbasis **async/queue** untuk reliability dan throughput.
- Cost-per-ticket diinstrumentasi sejak hari pertama.

*(Desain sistem terperinci, skema DB, dan kontrak API akan disampaikan sebagai Architecture Document untuk persetujuan terpisah — sesuai proses kami, tidak dibundel ke dalam PRD.)*

## 10. Data Requirements

- **Tenant data:** organisasi, user/role, agent, pengaturan autonomy.
- **Knowledge data:** dokumen, chunk, embedding, metadata sumber/otoritas.
- **Conversation data:** tiket, pesan, thread, metadata kanal.
- **Action/event log:** catatan immutable atas setiap langkah agent (input, retrieval, draf, keputusan, outcome).
- **Feedback data:** editan/persetujuan/penolakan reviewer (sinyal training).
- **Metrics data:** biaya per tiket, status resolusi, CSAT.
- **Retention/PII:** konten support pelanggan mengandung PII — harus dienkripsi saat at rest/in transit, terisolasi per tenant, dapat dihapus atas permintaan (kesiapan GDPR bahkan sebelum sertifikasi).

## 11. Security & Compliance Requirements

- **SEC-1:** Isolasi tenant yang ketat — tidak ada akses data lintas-tenant, ditegakkan di lapisan data.
- **SEC-2:** Enkripsi in transit (TLS) dan at rest.
- **SEC-3:** Secret/credential (API key kanal) disimpan dalam secrets manager, tidak pernah dalam plaintext.
- **SEC-4:** Penanganan PII: minimalkan, enkripsi, dukung penghapusan. Jangan mengirim data pelanggan ke model lebih dari yang diperlukan.
- **SEC-5:** Audit log untuk tindakan administratif.
- **SEC-6:** Guardrails yang mencegah agent mengambil tindakan tidak terotorisasi (mis. menerbitkan refund, membuat janji) — eskalasi sebagai gantinya.
- **SEC-7 (roadmap, bukan v1.0):** Postur kesiapan SOC 2 didokumentasikan sekarang; sertifikasi ketika demand enterprise membenarkannya.

## 12. Assumptions & Dependencies

- **A1:** Akses API foundation model (Claude / provider) — dependency inti; kami memantau biaya & rate limit.
- **A2:** Infrastruktur vector store / embedding.
- **A3:** Akses API kanal yang dipilih (infrastruktur email atau API satu help-desk).
- **A4:** 3–5 pelanggan design-partner yang bersedia co-build di vertikal wedge.
- **A5:** Wedge-nya adalah **customer support** (override mengubah spesifik use-case di §6–§8).

## 13. Risks & Mitigations

| Risk | Dampak | Mitigasi |
|---|---|---|
| Agent memberi jawaban salah/berbahaya | Kepercayaan runtuh | Grounding (FR-9), guardrails (FR-11), default autonomy konservatif, eskalasi (FR-10) |
| Reliability terlalu rendah untuk dijual sebagai "labor" | Tidak ada produk | Evals-as-tests, mulai dari autonomy rendah, ukur tanpa henti (§4) |
| Cost-per-ticket > harga | Tidak ada margin | Instrumentasi biaya FR-18, model tiering, caching |
| Risiko vendor foundation model (harga/limit/kebijakan) | Dependency eksistensial | Inti yang model-agnostic (§9) |
| Scope creep menjadi "full platform" | Tidak pernah rilis | Non-goals yang tegas (§3), deferred list (FR-21) |
| Design partner sulit didapat | Tidak ada learning loop | Outreach yang dipimpin founder sekarang; pilih wedge tempat kita punya akses |

## 14. Release Plan (tingkat tinggi)

- **M0 — Design partner ditandatangani** (wedge dikonfirmasi, 3–5 partner).
- **M1 — Internal alpha:** serap → draf → review queue → log (autonomy: Suggest/Draft saja). Kami mengoperasikannya untuk partner secara manual.
- **M2 — Closed beta:** integrasi kanal aktif, dashboard, tier Act-with-review, eval di CI.
- **M3 — v1.0:** onboarding self-serve < 1 hari, tier Autonomous yang di-gate di balik ambang batas eval, dashboard biaya + metrik.

## 15. Open Questions (perlu input founder)

1. **Apakah tesis AI-workforce sudah dikonfirmasi**, atau produknya berbeda? *(memblokir penguncian v1.0)*
2. **Konfirmasi vertikal wedge** — customer support (diasumsikan) atau yang lain? *(memblokir spesifik §6–§8)*
3. **Kanal mana untuk FR-5** — email/shared inbox generik, atau help-desk spesifik yang sudah digunakan seorang design partner?
4. **Apakah kita punya akses ke 3–5 design partner?** Siapa? *(menentukan timeline M0)*
5. **Adakah constraint yang tegas** — region, compliance, plafon anggaran, preferensi teknologi yang sudah ada?

---

*Artefak berikutnya setelah persetujuan: **Technical Architecture Document** (desain sistem, skema data, kontrak API) untuk gate review terpisah.*
