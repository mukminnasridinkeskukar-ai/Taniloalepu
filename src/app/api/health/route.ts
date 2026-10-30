import { NextResponse } from "next/server";
import { rest, DbError, dbConfig } from "@/lib/supabase";

/**
 * GET /api/health — pemeriksaan lingkungan deployment (tanpa rahasia).
 *
 * Buka halaman ini di browser setelah deployment untuk memastikan
 * layanan basis data tersambung dan tabel sudah dibuat. Pesan dijamin
 * mudah dipahami dan tidak menampilkan kredensial.
 */

type Cek = { ok: boolean; lingkungan: Record<string, string>; database: Record<string, unknown> };

export async function GET() {
  const { url, key } = dbConfig();
  const lingkungan: Record<string, string> = {
    penyimpananData: "PostgreSQL (REST) — cocok untuk deployment Vercel",
    alamatLayanan: url ? "terisi" : "belum-terisi",
    kunciAkses: key ? "terisi" : "belum-terisi",
    kunciSesi: process.env.SESSION_SECRET ? "terisi" : "belum-diisi (memakai bawaan)",
    mode: process.env.NODE_ENV ?? "-",
  };

  try {
    const [pengguna, tanaman, produk] = await Promise.all([
      rest.count("accounts"),
      rest.count("crops"),
      rest.count("products"),
    ]);
    const body: Cek = {
      ok: true,
      lingkungan,
      database: {
        status: "tersambung",
        tabel: "sesuai",
        pengguna,
        tanaman,
        produk,
        catatan:
          tanaman === 0 || pengguna === 0
            ? "Tabel kosong — buka SQL Editor layanan basis data Anda lalu jalankan supabase/setup.sql untuk membuat tabel, akun pengelola, dan katalog tanaman."
            : "Data awal tersedia. Platform siap digunakan.",
      },
    };
    return NextResponse.json(body);
  } catch (err) {
    const dbErr = err instanceof DbError ? err : null;
    const pesan = dbErr?.message ?? String(err);
    const saran = dbErr?.hint ?? "Periksa log deployment untuk detail lengkapnya.";
    return NextResponse.json(
      { ok: false, lingkungan, database: { status: "gagal", pesan, saran } },
      { status: 503 }
    );
  }
}
