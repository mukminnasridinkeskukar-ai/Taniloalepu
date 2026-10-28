-- ================================================================
-- Tani Loa Lepu — Skema Basis Data Produksi (PostgreSQL)
-- Jalankan file ini di panel layanan basis data Anda → SQL Editor.
-- Lalu jalankan seed.sql untuk mengisi data awal.
-- ================================================================

-- ===== PENGGUNA (petani | operator | superadmin) =====
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null, -- dikelola platform; operator dapat melihat utk bantu pemulihan akun
  name text not null,
  role text not null default 'petani'
    check (role in ('petani','operator','superadmin')),
  status text not null default 'menunggu'
    check (status in ('menunggu','aktif','ditolak')),
  phone text default '',
  address text default '',
  avatar_url text default '',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists idx_accounts_status on public.accounts(status, created_at desc);

-- ===== LAHAN (Kelola Lahan) =====
create table if not exists public.lands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.accounts(id) on delete set null,
  name text not null,
  location text not null,
  area double precision not null check (area > 0),
  area_unit text not null default 'm2',
  soil_type text not null default 'tanah-merah',
  status text not null default 'persiapan'
    check (status in ('persiapan','tanam','perawatan','panen','pasca')),
  planned_crop text default '',
  image_url text default '',
  notes text default '',
  completed_steps text not null default '[]',
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
  gallery text not null default '[]',
  planting_steps text not null default '[]',
  care_tips text not null default '[]',
  diseases text not null default '[]',
  price_range text default ''
);

-- ===== PRODUK (Pasar Tani) =====
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.accounts(id) on delete set null,
  name text not null,
  category text not null default 'sayuran',
  price double precision not null check (price > 0),
  unit text not null default 'kg',
  stock integer not null default 0 check (stock >= 0),
  description text default '',
  image_url text default '',
  gallery text not null default '[]',
  farmer_name text not null,
  location text not null,
  rating double precision not null default 4.8,
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
  total double precision not null,
  status text not null default 'baru'
    check (status in ('baru','diproses','dikirim','selesai')),
  created_at timestamptz not null default now()
);

-- ================================================================
-- Row Level Security (RLS)
-- Aplikasi berkomunikasi lewat koneksi server (service role), sehingga
-- aturan peran (petani/operator/superadmin) ditegakkan di kode aplikasi.
-- Kebijakan di bawah menjaga akses langsung dari klien tetap aman:
-- katalog & produk terbaca publik; data akun & lahan hanya lewat server.
-- ================================================================
alter table public.accounts   enable row level security;
alter table public.lands      enable row level security;
alter table public.activities enable row level security;
alter table public.crops      enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;

-- Katalog tanaman & produk: baca terbuka untuk semua
create policy "crops_read"    on public.crops      for select using (true);
create policy "products_read" on public.products   for select using (true);

-- Pesanan: publik boleh membuat (checkout), baca hanya lewat server
create policy "orders_insert" on public.orders     for insert with check (true);

-- Akun, lahan, aktivitas: seluruh akses dikelola koneksi server
-- (tanpa kebijakan klien = tidak dapat diakses langsung dari browser)

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
