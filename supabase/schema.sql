-- ================================================================
-- TaniNusa — Skema Supabase (PostgreSQL)
-- Jalankan file ini di Supabase Dashboard → SQL Editor → New query.
-- Lalu jalankan supabase/seed.sql untuk mengisi data awal.
-- ================================================================

-- ===== LAHAN (Kelola Lahan) =====
create table if not exists public.lands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  area numeric not null check (area > 0),
  area_unit text not null default 'm2',
  soil_type text not null default 'tanah-merah',
  status text not null default 'persiapan'
    check (status in ('persiapan','tanam','perawatan','panen','pasca')),
  planned_crop text default '',
  image_url text default '',
  notes text default '',
  completed_steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references public.lands(id) on delete cascade,
  title text not null,
  note text default '',
  date timestamptz not null default now()
);

create index if not exists idx_activities_land on public.activities(land_id, date desc);

-- ===== TANAMAN (Kenali & Rawat) =====
create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  latin_name text default '',
  category text not null,
  difficulty text not null default 'sedang'
    check (difficulty in ('mudah','sedang','sulit')),
  harvest_days integer not null default 90,
  water_need text default 'sedang',
  sun_need text default 'terang',
  season text default 'Sepanjang tahun',
  description text default '',
  image_url text default '',
  gallery jsonb not null default '[]'::jsonb,
  planting_steps jsonb not null default '[]'::jsonb,
  care_tips jsonb not null default '[]'::jsonb,
  diseases jsonb not null default '[]'::jsonb,
  price_range text default ''
);

-- ===== PRODUK (Pasar Tani) =====
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'sayuran',
  price numeric not null check (price > 0),
  unit text not null default 'kg',
  stock integer not null default 0 check (stock >= 0),
  description text default '',
  image_url text default '',
  gallery jsonb not null default '[]'::jsonb,
  farmer_name text not null,
  location text not null,
  rating numeric not null default 4.8,
  sold integer not null default 0,
  is_organic boolean not null default false,
  created_at timestamptz not null default now()
);

-- ===== PESANAN (checkout Pasar Tani) =====
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  product_name text not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  quantity integer not null check (quantity > 0),
  total numeric not null,
  status text not null default 'baru'
    check (status in ('baru','diproses','dikirim','selesai')),
  created_at timestamptz not null default now()
);

-- ================================================================
-- Row Level Security (RLS)
-- Mode publik terbuka (tanpa login): siapa pun boleh membaca katalog
-- dan membuat lahan/pesanan; cocok untuk demo & komunitas kecil.
-- Untuk produksi ketat, aktifkan Supabase Auth lalu kunci kebijakan
-- tulis dengan auth.role() = 'authenticated'.
-- ================================================================
alter table public.lands      enable row level security;
alter table public.activities enable row level security;
alter table public.crops      enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;

-- Baca terbuka untuk semua
create policy "lands_read"    on public.lands      for select using (true);
create policy "activities_read" on public.activities for select using (true);
create policy "crops_read"    on public.crops      for select using (true);
create policy "products_read" on public.products   for select using (true);
create policy "orders_read"   on public.orders     for select using (true);

-- Tulis terbuka (demo publik)
create policy "lands_insert"    on public.lands      for insert with check (true);
create policy "lands_update"    on public.lands      for update using (true);
create policy "lands_delete"    on public.lands      for delete using (true);
create policy "activities_insert" on public.activities for insert with check (true);
create policy "products_insert" on public.products   for insert with check (true);
create policy "orders_insert"   on public.orders     for insert with check (true);

-- Update otomatis kolom updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_lands_touch on public.lands;
create trigger trg_lands_touch
  before update on public.lands
  for each row execute function public.touch_updated_at();
