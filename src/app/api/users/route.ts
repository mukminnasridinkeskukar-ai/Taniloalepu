import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/users — operator: daftar akun petani (+ kredensial utk bantu pemulihan);
// superadmin: daftar seluruh pengguna.
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role !== "operator" && session.role !== "superadmin") {
    return NextResponse.json({ error: "Hanya operator atau admin desa yang dapat melihat daftar akun" }, { status: 403 });
  }

  const where = session.role === "operator" ? { role: "petani" } : {};
  const users = await db.user.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      password: true,
      name: true,
      role: true,
      status: true,
      phone: true,
      address: true,
      avatarUrl: true,
      createdAt: true,
      approvedAt: true,
      _count: { select: { lands: true, products: true } },
    },
  });

  return NextResponse.json(users);
}

// POST /api/users — superadmin membuat akun baru (petani/operator/superadmin)
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role !== "superadmin") {
    return NextResponse.json({ error: "Hanya admin desa yang dapat membuat akun" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const role = ["petani", "operator", "superadmin"].includes(body.role) ? body.role : "petani";
    const status = ["aktif", "menunggu"].includes(body.status) ? body.status : "aktif";

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return NextResponse.json({ error: "Nama pengguna harus 3-30 karakter (huruf kecil, angka, . _ -)" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Nama pengguna sudah digunakan" }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        username,
        password,
        name,
        role,
        status,
        phone: String(body.phone ?? "").trim().slice(0, 30),
        address: String(body.address ?? "").trim().slice(0, 200),
        approvedAt: status === "aktif" ? new Date() : null,
      },
    });
    return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
  }
}
