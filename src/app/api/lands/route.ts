import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/lands — daftar semua lahan + aktivitas
export async function GET() {
  try {
    const lands = await db.land.findMany({
      orderBy: { createdAt: "desc" },
      include: { activities: { orderBy: { date: "desc" }, take: 20 } },
    });
    return NextResponse.json(lands);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat data lahan" }, { status: 500 });
  }
}

// POST /api/lands — tambah lahan baru
export async function POST(req: NextRequest) {
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
