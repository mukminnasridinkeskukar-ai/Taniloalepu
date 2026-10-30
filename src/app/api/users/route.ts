import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
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

  try {
    const users = await store.users.list(session.role === "operator" ? { role: "petani" } : undefined);
    users.sort(
      (a, b) => a.status.localeCompare(b.status) || (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );

    // hitung jumlah lahan & produk per pemilik (menggantikan _count Prisma)
    const [lands, products] = await Promise.all([store.lands.list(), store.products.list()]);
    const counts: Record<string, { lands: number; products: number }> = {};
    for (const l of lands) {
      if (l.ownerId) (counts[l.ownerId] ??= { lands: 0, products: 0 }).lands++;
    }
    for (const p of products) {
      if (p.ownerId) (counts[p.ownerId] ??= { lands: 0, products: 0 }).products++;
    }

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        status: u.status,
        phone: u.phone,
        address: u.address,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        approvedAt: u.approvedAt,
        _count: { lands: counts[u.id]?.lands ?? 0, products: counts[u.id]?.products ?? 0 },
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat daftar akun" }, { status: 500 });
  }
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

    const existing = await store.users.byUsername(username);
    if (existing) {
      return NextResponse.json({ error: "Nama pengguna sudah digunakan" }, { status: 409 });
    }

    const user = await store.users.create({
      username,
      password,
      name,
      role,
      status,
      phone: String(body.phone ?? "").trim().slice(0, 30),
      address: String(body.address ?? "").trim().slice(0, 200),
      approvedAt: status === "aktif" ? new Date().toISOString() : null,
    });
    return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
  }
}
