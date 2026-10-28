import { createHmac, timingSafeEqual } from "crypto";
import { store } from "@/lib/store";

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
  addressFull: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

/** Bentuk data pengguna yang aman dikirim ke klien (tanpa kata sandi). */
export function publicUser(u: import("@/lib/store").UserRecord | null) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    status: u.status,
    phone: u.phone,
    address: u.address,
    avatarUrl: u.avatarUrl,
    addressFull: u.addressFull ?? "",
    village: u.village ?? "",
    district: u.district ?? "",
    regency: u.regency ?? "",
    province: u.province ?? "",
    latitude: u.latitude ?? null,
    longitude: u.longitude ?? null,
    bankName: u.bankName ?? "",
    bankAccountNumber: u.bankAccountNumber ?? "",
    bankAccountName: u.bankAccountName ?? "",
  };
}

/** Ambil token sesi dari cookie ATAU header Authorization (cadangan bila cookie diblokir iframe). */
function extractSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (match) {
    return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
  }
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const token = extractSessionToken(req);
  const userId = verifySessionToken(token);
  if (!userId) return null;
  const user = await store.users.byId(userId);
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
    addressFull: user.addressFull ?? "",
    village: user.village ?? "",
    district: user.district ?? "",
    regency: user.regency ?? "",
    province: user.province ?? "",
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    bankName: user.bankName ?? "",
    bankAccountNumber: user.bankAccountNumber ?? "",
    bankAccountName: user.bankAccountName ?? "",
  };
}

/**
 * Opsi cookie sesi yang kompatibel dengan pratinjau dalam iframe.
 * - HTTPS (termasuk di balik proxy, deteksi via x-forwarded-proto): SameSite=None + Secure
 *   agar cookie tetap terkirim saat platform dibuka di iframe lintas-situs.
 * - HTTP lokal: SameSite=Lax (SameSite=None tanpa Secure akan ditolak browser).
 */
export function sessionCookieOptions(req?: Request) {
  const proto = req?.headers.get("x-forwarded-proto") ?? "";
  const isHttps = proto.split(",")[0].trim() === "https";
  return {
    httpOnly: true,
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    secure: isHttps,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export { SESSION_COOKIE };
