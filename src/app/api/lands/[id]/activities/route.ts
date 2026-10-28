import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";

// POST /api/lands/[id]/activities — tambah catatan aktivitas ke lahan (pemilik / admin desa)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator hanya dapat melihat aktivitas" }, { status: 403 });
  }
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Judul aktivitas wajib diisi" }, { status: 400 });
    }
    const land = await store.lands.byId(id);
    if (!land) {
      return NextResponse.json({ error: "Lahan tidak ditemukan" }, { status: 404 });
    }
    if (session.role !== "superadmin" && land.ownerId !== session.id) {
      return NextResponse.json({ error: "Anda hanya dapat mencatat aktivitas pada lahan milik sendiri" }, { status: 403 });
    }
    const activity = await store.activities.create({
      landId: id,
      title: title.slice(0, 120),
      note: String(body.note ?? "").slice(0, 400),
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menambahkan aktivitas" }, { status: 500 });
  }
}

// GET /api/lands/[id]/activities — daftar aktivitas lahan
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const activities = await store.activities.listByLand(id, 50);
    return NextResponse.json(activities);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat aktivitas" }, { status: 500 });
  }
}
