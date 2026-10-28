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
prisma/schema.prisma      # Skema demo lokal (SQLite) — dipakai otomatis jika DATABASE_URL bukan postgres
prisma/schema.postgres.prisma  # Skema produksi (PostgreSQL) — dipetakan ke tabel supabase/
scripts/prisma-setup.mjs  # Pemilih skema otomatis (postinstall & build)
supabase/                 # SQL siap pakai untuk basis data produksi (PostgreSQL)
db/custom.db              # Basis data demo (SQLite)
```

## Deployment Produksi (Vercel + Basis Data PostgreSQL)

Platform ini dirancang untuk di-deploy sebagai situs tanpa-servur (mis. Vercel)
dengan basis data PostgreSQL terkelola (mis. Supabase). Ikuti urutan berikut
agar proses masuk (login) berfungsi di deployment:

### Langkah 1 — Siapkan basis data

1. Buat proyek pada layanan basis data PostgreSQL (mis. Supabase).
2. Buka **SQL Editor**, lalu jalankan berurutan:
   1. `supabase/reset.sql` — hanya jika pernah memasang skema versi lama;
   2. `supabase/schema.sql` — membuat 6 tabel + keamanan baris (RLS);
   3. `supabase/seed.sql` — mengisi akun demo, 8 tanaman, dan produk contoh.

### Langkah 2 — Atur variabel lingkungan di panel deployment

| Variabel | Nilai | Catatan |
|----------|-------|---------|
| `DATABASE_URL` | alamat koneksi **Transaction pooler** | Diawali `postgresql://` (bukan `file:`), tambahkan `?pgbouncer=true&connection_limit=1` di akhir. |
| `SESSION_SECRET` | teks acak panjang | Bebas, contoh: kalimat acak 40+ karakter. |

> ⚠️ Penyebab paling umum **gagal masuk (error 500) di deployment**:
> 1. `DATABASE_URL` belum diisi / masih memakai `file:...` (berkas lokal tidak tersedia di deployment).
> 2. Tabel belum dibuat (langkah 1 dilewati).
> 3. Skema lama masih memakai tipe kolom `jsonb`/`numeric` — jalankan `reset.sql` lalu `schema.sql` terbaru.

Skrip `postinstall`/`build` otomatis memilih skema Prisma yang tepat:
`DATABASE_URL` berawalan `postgres` → `prisma/schema.postgres.prisma` (PostgreSQL);
selain itu → `prisma/schema.prisma` (SQLite untuk demo lokal).

### Langkah 3 — Deploy, lalu periksa kesehatan lingkungan

Setelah deployment selesai, buka:

```
https://alamat-situs-anda/api/health
```

Endpoint ini menampilkan status basis data **tanpa mengekspos rahasia**:

- `"status": "tersambung"` → semuanya siap; silakan masuk dengan akun demo.
- `"status": "gagal"` → ikuti kolom `saran` (pesan dalam bahasa Indonesia,
  mis. tabel belum dibuat / alamat koneksi salah / pooler belum dipakai).

### Pemecahan Masalah Cepat

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Login → error 500 | `DATABASE_URL` belum diatur | Isi variabel lingkungan, deploy ulang |
| Login → error 500, health: "tabel belum dibuat" | `schema.sql` belum dijalankan | Jalankan `schema.sql` + `seed.sql` di SQL Editor |
| Health: "struktur tabel belum sesuai" | Tabel lama (tipe `jsonb`/`numeric`) | Jalankan `reset.sql` → `schema.sql` → `seed.sql` |
| Health: "tidak dapat menghubungi server" | Proyek DB terjeda / salah alamat / bukan pooler | Aktifkan proyek, pakai Transaction pooler + parameter `pgbouncer` |
| Masuk berhasil lalu lepas saat berpindah halaman | `SESSION_SECRET` berubah antar deployment | Pastikan `SESSION_SECRET` sama & permanen di panel deployment |
| Unggah foto profil gagal di deployment | Ukuran foto > 700 KB setelah dimampatkan | Gunakan foto yang lebih kecil (otomatis dimampatkan ke 256×256) |

## Basis Data Produksi

Folder `supabase/` berisi berkas siap pakai untuk basis data PostgreSQL produksi:

- `schema.sql` — 6 tabel (accounts, lands, activities, crops, products, orders)
  dengan tipe kolom yang **sudah diselaraskan** dengan `prisma/schema.postgres.prisma`
  (teks untuk larik JSON, `double precision` untuk angka desimal), keamanan baris
  (RLS), dan pemicu `updated_at`.
- `seed.sql` — data awal: akun demo multi-user, 8 tanaman lengkap, produk contoh.
- `reset.sql` — membersihkan struktur versi lama sebelum pemasangan ulang.

Skema Prisma produksi (`prisma/schema.postgres.prisma`) memetakan model aplikasi
ke tabel tersebut (`@@map`/`@map`), sehingga aplikasi, SQL, dan data awal selalu konsisten.

---

© 2026 Tani Loa Lepu — dikembangkan petani Desa Loa Lepu, Kutai Kartanegara.
