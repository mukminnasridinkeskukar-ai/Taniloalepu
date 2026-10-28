import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/crops?q=&category= — ensiklopedia tanaman
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const category = searchParams.get("category") ?? "";

    const where: Record<string, unknown> = {};
    if (category && category !== "semua") where.category = category;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { latinName: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const crops = await db.crop.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(crops);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat data tanaman" }, { status: 500 });
  }
}
