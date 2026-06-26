-- Genesis AI — Row-Level Security (Pasal 2 Constitution: lapis kedua isolasi tenant)
--
-- Lapisan ini membuat DB sendiri menolak akses lintas-tenant, bahkan bila query
-- aplikasi lupa memfilter tenant_id. Kebijakan memakai GUC `app.current_tenant`
-- yang DI-SET aplikasi per-transaksi via withTenant() (lihat src/db/withTenant.ts).
--
-- PENTING (belum di-enable otomatis): jalankan script ini HANYA setelah aplikasi
-- merutekan operasi tenant-scoped melalui withTenant(); jika tidak, FORCE RLS akan
-- menyembunyikan semua baris (deny-by-default). Terapkan: `npm run db:rls`.
--
-- current_setting(..., true) → NULL bila tidak diset (bukan error). NULL = tidak ada
-- baris yang cocok → default aman (tertutup).

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'users','agents','knowledge_sources','kb_chunks',
    'conversations','messages','events','feedback','ticket_costs'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    -- FORCE: pemilik tabel pun tunduk RLS (tanpa ini, owner mem-bypass).
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);

    -- Bersihkan kebijakan lama (idempotent).
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);

    -- Satu kebijakan untuk semua operasi: baris hanya terlihat/boleh-tulis bila
    -- tenant_id cocok dengan tenant aktif pada sesi.
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);
    $f$, t);
  END LOOP;
END $$;
