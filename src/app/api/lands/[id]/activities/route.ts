import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/lands/[id]/activities — tambah catatan aktivitas ke lahan
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Judul aktivitas wajib diisi" }, { status: 400 });
    }
    const land = await db.land.findUnique({ where: { id } });
    if (!land) {
      return NextResponse.json({ error: "Lahan tidak ditemukan" }, { status: 404 });
    }
    const activity = await db.activity.create({
      data: {
        landId: id,
        title: title.slice(0, 120),
        note: String(body.note ?? "").slice(0, 400),
      },
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
    const activities = await db.activity.findMany({
      where: { landId: id },
      orderBy: { date: "desc" },
      take: 50,
    });
    return NextResponse.json(activities);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat aktivitas" }, { status: 500 });
  }
}
