import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

// GET /api/crops?q=&category= — ensiklopedia tanaman
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const category = searchParams.get("category") ?? "";

    const crops = await store.crops.list({ q, category });
    return NextResponse.json(crops);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat data tanaman" }, { status: 500 });
  }
}
