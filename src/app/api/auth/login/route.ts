import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

// POST /api/auth/login — masuk dengan nama pengguna & kata sandi
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json({ error: "Nama pengguna dan kata sandi wajib diisi" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Nama pengguna atau kata sandi salah" }, { status: 401 });
    }

    if (user.status === "menunggu") {
      return NextResponse.json(
        { error: "Akun Anda masih menunggu persetujuan operator. Silakan cek kembali nanti." },
        { status: 403 }
      );
    }
    if (user.status === "ditolak") {
      return NextResponse.json(
        { error: "Pengajuan akun Anda ditolak. Hubungi operator desa untuk informasi lebih lanjut." },
        { status: 403 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl,
      },
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions());
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal masuk ke akun" }, { status: 500 });
  }
}
