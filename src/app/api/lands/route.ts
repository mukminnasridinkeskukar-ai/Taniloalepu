import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/lands — petani: lahan milik sendiri; operator & admin desa: semua lahan.
// Tanpa sesi: tidak mengembalikan data (data lahan hanya untuk pengguna terdaftar).
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk untuk melihat kelola lahan" }, { status: 401 });
  }

  try {
    const where = session.role === "petani" ? { ownerId: session.id } : {};
    const lands = await db.land.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { activities: { orderBy: { date: "desc" }, take: 20 } },
    });
    return NextResponse.json(lands);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat data lahan" }, { status: 500 });
  }
}

// POST /api/lands — tambah lahan baru (wajib masuk; petani atau admin desa)
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu untuk mendaftarkan lahan" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator tidak dapat menginput data lahan" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const location = String(body.location ?? "").trim();
    const area = Number(body.area);
    if (!name || !location || !area || area <= 0) {
      return NextResponse.json(
        { error: "Nama, lokasi, dan luas lahan wajib diisi dengan benar" },
        { status: 400 }
      );
    }
    const land = await db.land.create({
      data: {
        ownerId: session.id,
        name,
        location,
        area,
        areaUnit: body.areaUnit === "ha" ? "ha" : "m2",
        soilType: String(body.soilType ?? "tanah-merah"),
        status: String(body.status ?? "persiapan"),
        plannedCrop: String(body.plannedCrop ?? ""),
        imageUrl: String(body.imageUrl ?? ""),
        notes: String(body.notes ?? ""),
        completedSteps: "[]",
      },
    });
    await db.activity.create({
      data: {
        landId: land.id,
        title: "Lahan didaftarkan ke platform",
        note: `${land.name} (${land.area} ${land.areaUnit}) siap dikelola.`,
      },
    });
    return NextResponse.json(land, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menambahkan lahan" }, { status: 500 });
  }
}
