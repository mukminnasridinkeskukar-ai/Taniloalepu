-- ================================================================
-- Tani Loa Lepu — Bersihkan struktur lama (RESET)
-- Jalankan file ini HANYA jika Anda pernah menjalankan schema.sql
-- versi lama, agar struktur tabel dibuat ulang dengan tipe yang
-- sesuai. Data demo harus diisi ulang setelahnya (seed.sql).
-- ================================================================

drop table if exists public.activities cascade;
drop table if exists public.lands cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.crops cascade;
drop table if exists public.accounts cascade;

drop function if exists public.touch_updated_at() cascade;
