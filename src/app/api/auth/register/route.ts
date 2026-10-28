import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

// POST /api/auth/register — pengajuan akun petani baru (menunggu persetujuan operator)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Nama pengguna harus 3-30 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
    }

    const existing = await store.users.byUsername(username);
    if (existing) {
      return NextResponse.json({ error: "Nama pengguna sudah digunakan, pilih yang lain" }, { status: 409 });
    }

    const user = await store.users.create({
      username,
      password,
      name,
      phone,
      address,
      role: "petani",
      status: "menunggu",
    });

    return NextResponse.json(
      {
        ok: true,
        message: `Pengajuan akun "${user.username}" terkirim. Operator akan menyetujui akun Anda, lalu Anda dapat masuk.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error && err.name === "DbError" ? `${(err as Error).message} ${(err as { hint?: string }).hint ?? ""}`.trim() : "Gagal mengirim pengajuan akun" },
      { status: 500 }
    );
  }
}
