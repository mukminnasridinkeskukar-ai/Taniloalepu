import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health — pemeriksaan lingkungan deployment (tanpa rahasia).
 *
 * Buka halaman ini di browser setelah deployment untuk memastikan
 * basis data tersambung dan tabel sudah dibuat. Pesan dijamin mudah
 * dipahami dan tidak menampilkan kredensial.
 */

type Cek = { ok: boolean; lingkungan: Record<string, string>; database: Record<string, unknown> };

function saranDariError(err: unknown): { pesan: string; saran: string } {
  const e = err as { code?: string; message?: string };
  const code = e?.code ?? "";
  const msg = e?.message ?? String(err);

  if (msg.includes("Environment variable not found") || msg.includes("DATABASE_URL")) {
    return {
      pesan: "Alamat basis data belum diatur di lingkungan deployment.",
      saran:
        "Tambahkan variabel DATABASE_URL pada pengaturan environment di panel deployment Anda, lalu jalankan ulang deployment. Format untuk basis data produksi: postgresql://... (lihat README bagian Deployment).",
    };
  }
  if (code === "P1001") {
    return {
      pesan: "Tidak dapat menghubungi server basis data.",
      saran:
        "Pastikan proyek basis data Anda aktif (tidak jeda/terhenti) dan alamat yang dipakai benar. Untuk deployment tanpa-servur, gunakan alamat koneksi pooler (port 6543) dengan tambahan ?pgbouncer=true&connection_limit=1.",
    };
  }
  if (code === "P1003") {
    return {
      pesan: "Berkas basis data demo tidak ditemukan.",
      saran:
        "Untuk deployment produksi, DATABASE_URL harus berupa alamat basis data PostgreSQL (diawali postgresql://), bukan berkas lokal (file:...). Lihat README bagian Deployment.",
    };
  }
  if (code === "P2021" || /does not exist in the current database|relation .* does not exist/i.test(msg)) {
    return {
      pesan: "Tabel basis data belum dibuat.",
      saran:
        "Jalankan supabase/schema.sql (lalu seed.sql) pada SQL Editor layanan basis data Anda, atau jalankan: npx prisma db push --schema prisma/schema.postgres.prisma",
    };
  }
  if (code === "P2022" || /column .* does not exist/i.test(msg)) {
    return {
      pesan: "Struktur tabel belum sesuai (ada kolom yang hilang).",
      saran:
        "Struktur lama perlu disegarkan: jalankan supabase/reset.sql, lalu supabase/schema.sql dan supabase/seed.sql pada SQL Editor.",
    };
  }
  if (/prepared statement|pgbouncer|Connection terminated/i.test(msg)) {
    return {
      pesan: "Koneksi ke basis data terputus di tengah permintaan.",
      saran:
        "Gunakan alamat koneksi pooler dengan parameter ?pgbouncer=true&connection_limit=1 (Transaction pooler).",
    };
  }
  return { pesan: msg.slice(0, 300), saran: "Periksa log deployment untuk detail lengkapnya." };
}

export async function GET() {
  const url = (process.env.DATABASE_URL || "").trim();
  const jenisUrl = url
    ? /^(postgres|postgresql):\/\//i.test(url)
      ? "postgresql"
      : url.startsWith("file:")
        ? "berkas-lokal"
        : "tidak-dikenal"
    : "belum-diatur";

  const lingkungan: Record<string, string> = {
    basisData: jenisUrl,
    kunciSesi: process.env.SESSION_SECRET ? "terisi" : "belum-diisi (memakai bawaan)",
    mode: process.env.NODE_ENV ?? "-",
  };

  try {
    const jumlahPengguna = await db.user.count();
    const jumlahTanaman = await db.crop.count();
    const jumlahProduk = await db.product.count();
    const body: Cek = {
      ok: true,
      lingkungan,
      database: {
        status: "tersambung",
        tabel: "sesuai",
        pengguna: jumlahPengguna,
        tanaman: jumlahTanaman,
        produk: jumlahProduk,
        catatan:
          jumlahTanaman === 0
            ? "Tabel kosong — jalankan supabase/seed.sql untuk mengisi data awal (akun demo, tanaman, produk)."
            : "Data awal tersedia.",
      },
    };
    return NextResponse.json(body);
  } catch (err) {
    const { pesan, saran } = saranDariError(err);
    return NextResponse.json(
      { ok: false, lingkungan, database: { status: "gagal", pesan, saran } },
      { status: 503 }
    );
  }
}
