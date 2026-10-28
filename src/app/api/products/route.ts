import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/products — petani memasang hasil panen untuk dijual (wajib masuk)
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu untuk memasang produk" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator tidak dapat memasang produk" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const price = Number(body.price);
    const stock = Math.floor(Number(body.stock));
    const location = String(body.location ?? "").trim() || "Desa Loa Lepu";

    if (!name || !price || price <= 0 || !location) {
      return NextResponse.json(
        { error: "Nama produk, harga, dan lokasi wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        ownerId: session.id,
        name: name.slice(0, 120),
        category: String(body.category ?? "sayuran"),
        price,
        unit: String(body.unit ?? "kg").slice(0, 30),
        stock: Number.isFinite(stock) && stock > 0 ? stock : 1,
        description: String(body.description ?? "").slice(0, 600),
        imageUrl: String(body.imageUrl ?? ""),
        gallery: JSON.stringify(Array.isArray(body.gallery) ? body.gallery : []),
        farmerName: session.name.slice(0, 100),
        location: location.slice(0, 100),
        rating: 5.0,
        sold: 0,
        isOrganic: Boolean(body.isOrganic),
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memasang produk" }, { status: 500 });
  }
}

// GET /api/products?q=&category=&sort= — katalog Pasar Tani
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const category = searchParams.get("category") ?? "";
    const sort = searchParams.get("sort") ?? "populer";

    const where: Record<string, unknown> = {};
    if (category && category !== "semua") where.category = category;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { farmerName: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const orderByMap: Record<string, Record<string, string>> = {
      populer: { sold: "desc" },
      termurah: { price: "asc" },
      termahal: { price: "desc" },
      terbaru: { createdAt: "desc" },
      rating: { rating: "desc" },
    };

    const products = await db.product.findMany({
      where,
      orderBy: orderByMap[sort] ?? orderByMap.populer,
    });
    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}
