# Tani Loa Lepu 🌱

Platform tani digital **Desa Loa Lepu, Kecamatan Tenggarong Seberang, Kabupaten Kutai
Kartanegara, Kalimantan Timur** — dikembangkan langsung oleh petani setempat untuk
membantu sesama petani:

1. **Kelola Lahan** — daftarkan petakan lahan, pantau status tanam, catat aktivitas harian.
2. **Siapkan Lahan** — panduan 6 langkah persiapan lahan bergambar + kalender tanam + checklist.
3. **Kenali & Rawat Tanaman** — ensiklopedia 8 komoditas beserta cara menanam, perawatan, dan solusi hama-penyakit, plus asisten tanya-jawab 24 jam.
4. **Pasar Tani** — jual hasil panen langsung ke masyarakat secara online (katalog bergambar, keranjang, checkout).

Antarmuka kaya gambar dan sepenuhnya responsif untuk HP, tablet, maupun desktop.

---

## Sistem Multi-Pengguna

Platform memiliki tiga peran pengguna dengan hak akses berbeda:

| Peran | Hak Akses |
|-------|-----------|
| **Petani** | Menginput & mengelola lahan, mencatat aktivitas, memasang produk di Pasar Tani, mengubah foto profil & data akun. Data lahan/produk bersifat pribadi (hanya miliknya). |
| **Operator** | Menyetujui/menolak pengajuan akun petani, melihat nama pengguna & kata sandi petani untuk membantu pemulihan akun, melihat seluruh lahan (hanya baca). |
| **Superadmin (Admin Desa)** | Akses penuh: mengelola seluruh akun (buat, ubah peran, reset sandi, hapus), menyetujui pengajuan, melihat semua lahan, produk, dan pesanan. |

**Alur pendaftaran:** petani mendaftar dari beranda → status *menunggu persetujuan* →
operator menyetujui dari Panel Operator → petani dapat masuk dan mulai menginput data.
Input data lahan/produk hanya bisa dilakukan setelah masuk dengan akun aktif.

### Akun Demo

| Peran | Nama Pengguna | Kata Sandi |
|-------|---------------|------------|
| Superadmin | `superadmin` | `super123` |
| Operator | `operator` | `operator123` |
| Petani (aktif) | `petani01` | `petani123` |
| Petani (menunggu persetujuan) | `petani02` | `petani456` |

> Catatan keamanan: kata sandi disimpan dalam bentuk yang dapat dilihat operator
> sesuai kebutuhan pemulihan akun tingkat desa. Untuk penerapan skala besar,
> disarankan mengganti dengan penyimpanan kata sandi teracak (hash) satu arah.

## Menjalankan Secara Lokal

Prasyarat: Node.js 18+ (atau Bun) sudah terpasang.

```bash
# 1. Pasang dependensi
npm install          # atau: bun install

# 2. Sinkronkan skema basis data demo (file SQLite di folder db/)
npx prisma db push   # atau: bun run db:push

# 3. Jalankan mode pengembangan
npm run dev          # atau: bun run dev
```

Buka `http://localhost:3000` di peramban. Data contoh (8 tanaman, 12 produk,
3 lahan) dan akun demo sudah tersedia sehingga aplikasi langsung bisa dicoba.

## Build Produksi

```bash
npm run build
npm run start
```

## Struktur Proyek

```
src/
├── app/                  # Halaman & API (App Router)
│   ├── page.tsx          # Aplikasi utama (9 tampilan: beranda, lahan, siapkan,
│   │                     #   tanaman, pasar, masuk, daftar, akun, panel)
│   └── api/              # auth (register/login/logout/me/profile), users,
│                         #   lands, crops, products, orders, assistant
├── components/
│   ├── agri/             # Komponen fitur (header, footer, home, lahan, tanaman,
│   │                     #   pasar, asisten, auth, profil, panel operator/admin)
│   └── ui/               # Komponen antarmuka dasar
├── lib/                  # Tipe data, konten statis, sesi login, manifest gambar
prisma/schema.prisma      # Skema basis data (User, Land, Activity, Crop, Product, Order)
supabase/                 # SQL siap pakai untuk basis data produksi (PostgreSQL)
db/custom.db              # Basis data demo (SQLite)
```

## Basis Data Produksi

Folder `supabase/` berisi skema SQL (`schema.sql`) dan data awal (`seed.sql`)
untuk dipasang pada basis data PostgreSQL produksi, lengkap dengan keamanan
tingkat baris (RLS) dan tabel akun multi-user. Salin `.env.example` menjadi
`.env` lalu sesuaikan `DATABASE_URL` dengan basis data milik Anda.

---

© 2026 Tani Loa Lepu — dikembangkan petani Desa Loa Lepu, Kutai Kartanegara.
