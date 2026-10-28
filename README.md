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

## Cara Kerja Basis Data (Penting!)

Platform ini **tidak lagi memakai berkas database lokal**. Seluruh data (akun, lahan,
tanaman, produk, pesanan) tersimpan di layanan basis data PostgreSQL awan (Supabase)
dan diakses lewat **REST API over HTTPS** oleh server aplikasi.

Keuntungan pendekatan ini:

- **Satu sumber data** untuk komputer lokal maupun deployment Vercel — tidak ada
  perbedaan perilaku "jalan di lokal, gagal di deployment".
- **Kompatibel penuh dengan lingkungan tanpa-servur** (Vercel): tidak ada berkas
  database, tidak ada mesin Prisma, tidak ada koneksi TCP khusus.
- **Tanpa konfigurasi**: alamat & kunci layanan sudah tertanam di
  `src/lib/supabase.ts` (boleh ditimpa lewat variabel `SUPABASE_URL` /
  `SUPABASE_ANON_KEY` bila suatu saat ganti proyek basis data).

## Menjalankan Secara Lokal

Prasyarat: Node.js 18+ (atau Bun) sudah terpasang.

```bash
# 1. Pasang dependensi
npm install          # atau: bun install

# 2. Jalankan mode pengembangan
npm run dev          # atau: bun run dev
```

Buka `http://localhost:3000` di peramban. Seluruh data diambil dari basis data
awan yang sama dengan deployment produksi — akun demo & data contoh sudah tersedia.

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
│                         #   lands, crops, products, orders, assistant, health
├── components/
│   ├── agri/             # Komponen fitur (header, footer, home, lahan, tanaman,
│   │                     #   pasar, asisten, auth, profil, panel operator/admin)
│   └── ui/               # Komponen antarmuka dasar
├── lib/
│   ├── supabase.ts       # Klien REST basis data awan (PostgREST) + pesan galat Indonesia
│   ├── store.ts          # Lapisan data domain (akun, lahan, tanaman, produk, pesanan)
│   ├── auth.ts           # Sesi login (cookie bertanda tangan HMAC + Bearer token)
│   └── auth-client.ts    # Penyimpan token cadangan + intersep fetch sisi klien
supabase/
└── setup.sql             # SQL sekali-jalankan: tabel + keamanan baris + data awal
```

## Deployment Produksi (GitHub + Vercel + Supabase)

### Langkah 1 — Siapkan basis data (SEKALI SAJA, wajib)

1. Buka panel proyek basis data Anda (Supabase) → menu **SQL Editor** → **New query**.
2. Salin **seluruh isi** berkas `supabase/setup.sql`, tempel, lalu klik **Run**.
3. Selesai. Hasilnya: 6 tabel + kebijakan akses + data awal (4 akun demo,
   8 tanaman, 12 produk, 3 lahan contoh). Skrip ini aman dijalankan ulang —
   data yang sudah ada tidak akan ditimpa.

> ⚠️ **Penyebab paling umum gagal masuk (login) di deployment:** langkah 1 dilewati,
> atau tabel dibuat dengan skema versi lama yang mengunci tabel `accounts`.
> Jalankan `setup.sql` terbaru — kebijakan aksesnya akan diperbarui otomatis.

### Langkah 2 — Deploy ke Vercel

1. Dorong (push) seluruh kode proyek ini ke repositori GitHub Anda.
2. Di Vercel: **Add New → Project → Import** repositorinya → **Deploy**.
3. **Tidak perlu mengisi environment variable apa pun** — kredensial basis data
   sudah tertanam. (Opsional: isi `SESSION_SECRET` dengan teks acak panjang milik
   Anda agar sesi login lebih aman & stabil antar deployment.)

### Langkah 3 — Periksa kesehatan deployment

Setelah deployment selesai, buka:

```
https://alamat-situs-anda/api/health
```

Endpoint ini menampilkan status basis data **tanpa mengekspos rahasia**:

- `"status": "tersambung"` + `pengguna` lebih dari 0 → semuanya siap; silakan masuk
  dengan akun demo.
- `pengguna: 0` meski `tanaman`/`produk` terisi → kebijakan akses lama masih aktif;
  jalankan ulang `supabase/setup.sql` (Langkah 1).
- `"status": "gagal"` → ikuti kolom `saran` (pesan berbahasa Indonesia).

### Pemecahan Masalah Cepat

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Katalog tampil, tapi login selalu "salah" | Tabel `accounts` terkunci kebijakan lama | Jalankan `supabase/setup.sql` di SQL Editor |
| Error 500 di semua halaman | Tabel belum dibuat di basis data | Jalankan `supabase/setup.sql` di SQL Editor |
| Health: "tidak dapat menghubungi layanan" | Proyek basis data terjeda/terhenti | Aktifkan proyek di panel basis data |
| Masuk berhasil lalu lepas antar kunjungan | `SESSION_SECRET` berubah antar deployment | Set `SESSION_SECRET` permanen di Vercel |
| Unggah foto profil gagal | Foto > 700 KB setelah dimampatkan | Gunakan foto lebih kecil (otomatis dimampatkan 256×256) |
| Cek status data | — | Buka `/api/health` kapan saja |

---

© 2026 Tani Loa Lepu — dikembangkan petani Desa Loa Lepu, Kutai Kartanegara.
