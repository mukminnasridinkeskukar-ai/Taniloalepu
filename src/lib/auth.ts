import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

/**
 * Sesi login berbasis cookie bertanda tangan (HMAC-SHA256).
 * Cookie hanya-baca dari sisi klien (httpOnly) dan berlaku 7 hari.
 */

const SESSION_COOKIE = "tll_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function secret(): string {
  return process.env.SESSION_SECRET || "tani-loa-lepu-kunci-sesi-default-2024";
}

function sign(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("hex");
}

export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(userId);
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return userId;
}

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: string; // petani | operator | superadmin
  status: string; // menunggu | aktif | ditolak
  phone: string;
  address: string;
  avatarUrl: string;
};

/** Ambil user dari cookie sesi pada Request (route handler). */
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  const token = match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "aktif") return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    status: user.status,
    phone: user.phone,
    address: user.address,
    avatarUrl: user.avatarUrl,
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export { SESSION_COOKIE };
