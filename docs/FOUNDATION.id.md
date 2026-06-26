# Genesis AI — Dokumen Pendirian

> **Bahasa:** Indonesia (terjemahan dari FOUNDATION.md)
> **Status:** DRAFT v0.1 — menunggu persetujuan founder
> **Owner:** CTO
> **Terakhir diperbarui:** 2026-06-26

---

## ⚠️ Core Assumption (timpa ini dengan satu kata dan saya tulis ulang semua yang ada di bawah)

Anda belum memberi tahu saya apa sebenarnya yang dilakukan Genesis AI. Daripada mengarang sesuatu yang generik, saya memilih untuk berkomitmen pada sebuah **tesis yang spesifik dan berpotensi besar**. Semua isi dokumen ini mengalir dari tesis tersebut. Kalau tesisnya salah, katakan saja, dan saya akan membangun ulang seluruh dokumen ini di sekitar tesis Anda — dengan biaya murah, karena untuk saat ini semuanya masih sekadar teks.

**TESIS-NYA:**
> **Genesis AI adalah AI workforce platform (platform tenaga kerja AI).** Platform ini memungkinkan sebuah bisnis untuk menghadirkan **AI employees** (karyawan AI) yang otonom — agent yang mengerjakan pekerjaan nyata secara end-to-end (menangani support, mengkualifikasi leads, memproses dokumen, menjalankan operasional back-office) — tanpa perlu merekrut engineer. Anda cukup mendeskripsikan pekerjaannya; Genesis yang membangun, men-deploy, mengawasi, dan menyempurnakan agent tersebut.

**Mengapa tesis ini berpotensi bernilai miliaran dolar:**
- Pembeli tidak membayar untuk software, mereka membayar untuk **labor (tenaga kerja)** — sebuah pos anggaran yang jauh lebih besar daripada SaaS.
- Harga bisa di-scale mengikuti *nilai yang diberikan* (pekerjaan yang selesai), bukan jumlah seat.
- Foundation models (Claude, dll.) membuat ini baru sekarang menjadi mungkin; moat-nya ada di orkestrasi, reliability, dan data workflow proprietary — bukan di model-nya.

**Keputusan tunggal terpenting yang saya butuhkan dari Anda** ada di bagian paling bawah: *vertical mana yang akan kita jadikan pintu masuk (wedge) pertama.* Bacalah sampai akhir.

---

## 1. Visi

**Sebuah dunia di mana setiap bisnis — mulai dari toko 2 orang hingga enterprise — bisa merekrut AI employees semudah memasang lowongan kerja, dan mempercayai mereka untuk menyelesaikan pekerjaannya.**

Kita tidak sedang membangun "satu lagi chatbot AI." Kita sedang membangun platform tempat 100 juta pekerja digital berikutnya diciptakan. Sepuluh tahun ke depan, "Genesis" menjadi kata kerja untuk menghadirkan seorang pekerja AI.

## 2. Misi

**Membuat pekerjaan AI otonom cukup andal untuk bisa dimintai pertanggungjawaban atas hasil bisnis nyata — dan membuat proses menciptakannya tidak memerlukan engineering sama sekali.**

Dua masalah sulit yang sengaja kita pilih: (1) **reliability** (agent yang tidak gagal diam-diam), dan (2) **accessibility** (operator non-teknis bisa membangunnya sendiri). Siapa pun yang berhasil memecahkan keduanya akan menguasai kategori ini.

## 3. Core Values (Nilai Inti)

1. **Outcomes over output (hasil di atas keluaran).** Kita dibayar atas pekerjaan yang selesai, bukan fitur yang dirilis. Kita mengukur diri kita dengan cara yang sama seperti pelanggan kita mengukur diri mereka.
2. **Bangun kepercayaan secara bertahap.** AI yang mengerjakan pekerjaan nyata itu menakutkan. Kita memperluas otonomi sebuah agent hanya sebesar yang berhasil ia raih — human-in-the-loop sebagai default, otonomi sebagai bentuk "kelulusan".
3. **Reliability adalah produknya.** Demo yang memukau tapi gagal 5% dari waktunya tidak ada nilainya untuk urusan labor. Keandalan yang membosankan adalah barang mewah kita.
4. **Jujur soal keterbatasan.** Kita memberi tahu pelanggan apa yang *belum* bisa dilakukan AI. Overpromising adalah cara startup AI mati.
5. **Cepat namun reversibel.** Bergerak cepat pada keputusan yang bisa kita batalkan; berhati-hati pada one-way doors (keputusan yang tak bisa diputar balik).
6. **Memiliki seluruh hasilnya.** Bukan "kami sudah memberi Anda sebuah alat." Kita bertanggung jawab atas agent yang benar-benar bekerja di production.

## 4. Product Principles (Prinsip Produk)

1. **Job-to-be-done, bukan fitur.** Unit nilainya adalah *sebuah pekerjaan yang selesai*, bukan sebuah dashboard. Setiap layar harus menjawab "apakah pekerjaannya sedang terselesaikan?"
2. **Trust ladder (tangga kepercayaan), selalu terlihat.** Suggest → Draft-for-approval → Act-with-review → Autonomous. Setiap agent menunjukkan posisinya di tangga itu dan naik tingkat secara eksplisit.
3. **Observable secara default.** Setiap tindakan yang diambil agent dicatat, dapat diputar ulang (replayable), dan dapat dijelaskan. Tidak ada black box yang tidak bisa diaudit oleh operator.
4. **Graceful failure mengalahkan silent failure.** Saat ragu, agent meng-eskalasi ke manusia — bukan menebak lalu menyembunyikannya.
5. **Time-to-first-value < 1 hari.** Pelanggan baru harus melihat satu pekerjaan nyata diselesaikan oleh agent mereka di hari pertama, atau kita sudah kehilangan mereka.
6. **Operatornya non-teknis.** Kalau butuh developer, berarti kita gagal. Konfigurasi dilakukan lewat percakapan + contoh, bukan lewat kode.
7. **Compounding data moat.** Setiap koreksi yang disupervisi membuat agent pelanggan itu (dan platform kita) menjadi lebih baik. Kita merancang demi feedback loop ini.

## 5. Engineering Principles (Prinsip Engineering)

1. **Reliability adalah SLA, bukan aspirasi.** Kita mendefinisikan dan memantau success rate, escalation rate, dan time-to-completion per agent. Regresi memicu paging ke seseorang.
2. **Core yang model-agnostic.** Kita mengorkestrasi model; kita tidak terikat pada satu pun. Default ke model Claude yang paling kapabel, tetapi arsitekturnya bisa mengganti provider tanpa rewrite. Tidak ada vendor yang memiliki roadmap kita.
3. **Semua yang dilakukan agent adalah sebuah event.** Action log yang event-sourced → audit, replay, debugging, dan training data kita dapatkan secara gratis.
4. **Determinisme di sekitar non-determinisme.** Panggilan LLM bersifat non-deterministik; scaffolding di sekitarnya (validasi, retry, guardrails, idempotency) bersifat deterministik secara ketat dan teruji.
5. **Evals adalah tests.** Tidak ada kapabilitas agent yang dirilis tanpa eval suite. Kita memperlakukan cakupan eval seperti cakupan kode. Perubahan prompt harus melewati CI evals.
6. **Secure multi-tenant sejak baris pertama.** Isolasi data pelanggan bukan fitur v2. Asumsikan enterprise akan mengaudit kita.
7. **Cost adalah metrik kelas satu.** Pengeluaran token per pekerjaan yang selesai dilacak seperti latensi. Agent yang bekerja tetapi biayanya lebih mahal daripada labor yang ia gantikan adalah sebuah kegagalan.
8. **Boring tech untuk bagian yang membosankan.** Berinovasilah di layer agent; gunakan infrastruktur yang sudah terbukti dan dipahami untuk storage, queue, dan auth.
9. **Bias build vs. buy = buy, sampai ia menjadi moat.** Kita tidak membangun apa yang sudah dikerjakan vendor dengan baik. Kita hanya membangun layer orkestrasi/reliability yang menjadi diferensiasi kita.

## 6. Business Model (Model Bisnis)

**Kita menjual digital labor, ditagih berdasarkan pekerjaan yang dilakukan — model "AI workforce" berbasis pemakaian (usage-based), bukan SaaS berbasis seat.**

- **Apa yang dibeli pelanggan:** AI employees yang menyelesaikan sebuah pekerjaan terdefinisi (tiket yang resolved, leads yang terkualifikasi, invoice yang terproses).
- **Unit nilai:** *sebuah pekerjaan yang selesai* (atau resolution / qualified lead / dokumen terproses — didefinisikan per use case).
- **Mengapa bukan seat:** seat membatasi upside kita dan menyalahkan-alurkan insentif. Kita menang ketika volume pekerjaan pelanggan bertumbuh; penagihan berbasis usage menangkap hal itu secara otomatis.
- **Struktur gross margin:** Revenue per pekerjaan − (biaya model/token + infra + biaya review human-in-loop). Target **gross margin 70%+** pada skala besar; jalannya adalah menekan token-cost-per-job lewat caching, model yang lebih kecil untuk sub-task, dan otomasi langkah review seiring kepercayaan bertumbuh.
- **Land-and-expand:** mulai dengan satu agent mengerjakan satu pekerjaan → berkembang ke lebih banyak pekerjaan, lebih banyak otonomi, lebih banyak volume. Net revenue retention adalah metrik yang menjadikan kita perusahaan bernilai miliaran dolar.

## 7. Revenue Strategy (Strategi Pendapatan)

**Tiga lapisan, ditumpuk seiring waktu:**

1. **Platform fee (base subscription)** — MRR yang dapat diprediksi; mencakup akses, dashboard supervisi, dan integrasi. Menjadi jangkar hubungan dengan pelanggan.
2. **Usage / outcome fee (mesinnya)** — per pekerjaan yang selesai. Di sinilah revenue ber-scale secara super-linear seiring keberhasilan pelanggan. Inti dari matematika miliaran dolar.
3. **Expansion (pengganda)** — lebih banyak agent, lebih banyak departemen, tier otonomi yang lebih tinggi, premium SLA, enterprise (SSO, audit, infra dedicated).

**Bintang utara finansial: Net Revenue Retention (NRR, retensi pendapatan bersih) > 130%.** Perusahaan yang mempertahankan 100 pelanggan dan menumbuhkan masing-masing 1,3x/tahun akan berkumulasi menuju miliaran lebih cepat daripada yang mengejar logo dengan akun yang stagnan. Land small, expand relentlessly (masuk kecil, kembangkan tanpa henti).

**Tuas sekunder (nanti):** data supervised-correction menjadi sebuah moat dan, berpotensi, sebuah marketplace berisi agent vertical yang sudah dilatih (pre-trained) yang bisa di-deploy oleh pihak lain.

## 8. Go-To-Market (GTM)

**Strategi: Vertical wedge → horizontal platform.** Ruang agent platform sudah penuh dengan tool generik "bangun agent apa saja" yang tidak menang secara mendalam di mana pun. Kita menang dengan menjadi *tak terkalahkan pada satu pekerjaan di satu industri terlebih dahulu*, lalu berekspansi.

**Fase:**
- **Fase 0 — Design partners (sekarang → 3 bln):** 3–5 pelanggan yang kita dampingi langsung di SATU vertical. Kita melakukan hal-hal yang tidak scalable: membangun agent mereka sendiri, memahami workflow-nya sampai ke tulang. Tujuan: membuktikan satu agent secara andal mengerjakan pekerjaan nyata dan mereka mau membayar.
- **Fase 1 — Produktisasi sang wedge (3–9 bln):** ubah apa yang kita pelajari menjadi self-serve untuk satu pekerjaan/vertical itu. Pricing aktif. Tujuan: penjualan yang repeatable, time-to-value <1 hari.
- **Fase 2 — Ekspansi di dalam akun (9–18 bln):** tipe agent kedua dan ketiga; dorong NRR. Pelanggan yang sama, lebih banyak pekerjaan.
- **Fase 3 — Horizontal platform (18 bln+):** generalisasi agent builder sehingga pelanggan (dan partner) bisa membuat agent mereka sendiri untuk pekerjaan baru.

**Motion (gerak penjualan):** founder-led sales di Fase 0 (tanpa belanja marketing — outreach langsung + jaringan). Product-led + inside sales begitu self-serve berfungsi. Enterprise/field sales hanya ketika ACV sudah cukup membenarkannya.

**Distribution wedge untuk dipertimbangkan:** integration marketplace (mis. help-desk / CRM app store dari vertical apa pun yang kita pilih) untuk distribusi yang murah dan terkualifikasi.

## 9. Competitive Analysis (Analisis Kompetitif)

| Tipe kompetitor | Contoh (kategori) | Kekuatan mereka | Di mana kita menang |
|---|---|---|---|
| **Horizontal agent builders** | Platform "bangun AI agent apa saja" | Fleksibel, disukai developer | Mereka generik → dangkal di pekerjaan apa pun. Kita bertanggung jawab atas outcomes di satu vertical, no-code. |
| **SaaS incumbent yang menambahkan "AI"** | CRM, help-desk yang menempelkan AI copilot | Distribusi, data yang sudah ada | AI mereka adalah fitur yang membantu manusia. AI kita *mengerjakan pekerjaannya*. Bolt-on copilot ≠ autonomous labor. |
| **AI point solutions** | Tool single-purpose "AI SDR", "AI support" | Terpoles untuk satu tugas | Terkunci ke satu tugas, satu model. Kita adalah platform: banyak pekerjaan, ekspansi, model-agnostic. |
| **DIY di atas raw foundation models** | Tim in-house di atas API Claude/OpenAI | Kontrol penuh, tanpa vendor | Reliability, evals, supervisi, dan multi-tenancy itu *sulit*. Kita menjual 18 bulan yang akan mereka habiskan untuk membangun scaffolding. |
| **Consulting / agency** | AI dev shop | Bespoke, high-touch | Tidak scalable, tidak ada produk yang ber-compound. Kita memproduktisasi apa yang mereka kerjakan secara manual. |

**Moat yang dapat kita pertahankan (sesuai urutan terbentuknya):** (1) reliability engineering + evals yang under-invest oleh pihak lain, (2) data supervised-workflow proprietary per vertical, (3) integrasi vertical yang dalam, (4) switching cost begitu agent menjalankan pekerjaan production, (5) brand sebagai platform pekerja AI *yang akuntabel*.

**Risiko yang jujur:** vendor foundation-model bergerak naik ke atas stack dan kategori "agent platform" menjadi komoditas. **Pertahanan:** kuasai workflow vertical, data, dan trust relationship — bagian-bagian yang tidak akan ditekuni secara dalam oleh vendor model.

## 10. Pricing (Penetapan Harga)

**Model: hybrid — platform base + usage, dengan tier yang outcome-aligned.** Ilustratif (akan dikalibrasi terhadap biaya labor nyata dari vertical yang dipilih — pricing harus lebih murah daripada alternatif manusia sambil melindungi margin):

| Tier | Untuk siapa | Base / bln | Usage | Termasuk | Tujuan |
|---|---|---|---|---|---|
| **Starter** | Solopreneur / tim kecil | $99 | $X per pekerjaan selesai setelah kuota termasuk | 1 agent, 100 pekerjaan/bln | Pintu masuk murah, buktikan nilai |
| **Growth** | SMB (usaha kecil-menengah) | $499 | $X/pekerjaan lebih rendah | 3 agent, 1.000 pekerjaan/bln, integrasi | Tier volume — kita ingin mendarat di sini |
| **Scale** | Mid-market | $2.000+ | diskon berdasarkan volume | Banyak agent, otonomi lebih tinggi, priority SLA | Mesin ekspansi |
| **Enterprise** | Organisasi besar | Custom | Kontrak committed-use | SSO, audit logs, infra dedicated, SLA custom | ACV tinggi, dapat dipertahankan |

**Prinsip pricing:**
- **Berlabuh pada biaya labor, bukan biaya software.** Kalau sebuah agent mengerjakan pekerjaan yang manusia dibayar $5 untuk itu, kita bisa mengenakan $1–2 dan tetap menjadi pilihan tanpa berpikir panjang — jauh lebih besar daripada yang bisa diizinkan oleh SaaS per-seat.
- **Lantai harga (price floor) = COGS kita + margin.** Jangan pernah menjual sebuah pekerjaan di bawah biaya (token + infra + review). Cost-per-job dipantau terus-menerus.
- **Free trial = jumlah pekerjaan terbatas, bukan waktu terbatas.** Biarkan mereka merasakan pekerjaan nyata terselesaikan; itulah momen konversinya.
- **Ekspansi tanpa friksi.** Menambah agent/volume harus self-serve dan instan. Jangan pernah biarkan pricing menjadi alasan mereka tidak berekspansi.

## 11. Target Customer (Target Pelanggan)

**Primer (Fase 0–2): bisnis kecil dan mid-market (SMB/mid-market) di satu vertical pilihan**, yang kewalahan dengan pekerjaan operasional repetitif, yang sulit merekrut atau tak mampu membiayai staf tambahan, dan tidak punya tim engineering.

- **Pembelinya:** seorang ops leader / founder / kepala departemen yang *merasakan langsung sakitnya soal headcount* dan memegang anggaran untuk menuntaskan pekerjaan.
- **Mengapa SMB/mid-market dulu, bukan enterprise:** siklus penjualan lebih pendek, friksi procurement lebih sedikit, learning loop lebih cepat, dan mereka merasakan kelangkaan labor paling tajam. Enterprise masuk di Fase 3 setelah reliability dan compliance terbukti.
- **Mengapa bukan consumer:** konsumen tidak akan membayar untuk reliability dan tidak ada mesin expansion/NRR. Uangnya ada di anggaran labor bisnis.

**Anti-persona (siapa yang kita tolak sejak awal):** enterprise besar dengan tuntutan compliance berat (terlalu lambat untuk fase belajar kita), dan "tire-kicker" — pengguna teknis yang hanya ingin raw agent SDK (itu bisnis berbeda dengan margin lebih rendah).

---

## 🔑 The One Decision I Need From You (Satu Keputusan yang Saya Butuhkan Dari Anda)

Semua hal di atas sudah solid **kecuali** satu placeholder: **vertical mana yang akan kita jadikan wedge pertama?** Ini adalah keputusan dengan leverage tertinggi di seluruh perusahaan — ia menentukan pelanggan pertama, integrasi, pricing, dan demo kita. Platform yang "untuk semua orang" di hari pertama justru untuk siapa pun.

**Rekomendasi saya — pilih vertical yang (a) padat pekerjaan repetitif, (b) punya nilai $ yang jelas per pekerjaan, (c) kurang terlayani oleh incumbent, (d) Anda atau saya bisa menjangkau pelanggan pertamanya.** Kandidat kuat:

1. **Customer support** (AI support agent yang menyelesaikan tiket) — besar, ROI jelas, mudah diukur, ramai tapi bisa dimenangkan lewat reliability.
2. **Sales development** (AI SDR yang mengkualifikasi/membooking leads) — nilai $ per pekerjaan tinggi, pembeli membayar dengan antusias.
3. **Back-office document ops** (invoice, klaim, dokumen onboarding) — sangat menyakitkan, kurang ramai, sangat sticky.
4. **Sebuah vertical di mana Anda punya keunggulan tak adil (unfair advantage)** — industri yang Anda kenal, punya jaringan di dalamnya, atau punya datanya. *Ini biasanya mengalahkan memilih pasar "terbesar".*

**Beri tahu saya: (1) Apakah tesis AI-workforce ini benar, atau Anda punya produk lain dalam pikiran? (2) Vertical mana yang kita jadikan wedge pertama?**

Jawab dua pertanyaan itu dan saya akan: mengunci dokumen ini ke v1.0, menyusun **north-star technical architecture**, dan mengusulkan **scope Sprint 1** untuk persetujuan Anda.
