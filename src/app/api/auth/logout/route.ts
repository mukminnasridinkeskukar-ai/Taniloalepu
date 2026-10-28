import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

// POST /api/auth/logout — keluar dari akun
export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  // Atribut harus cocok dengan saat cookie dibuat agar pembersihan berlaku di semua konteks (termasuk iframe)
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(req), maxAge: 0 });
  return res;
}
