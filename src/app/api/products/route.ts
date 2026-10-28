import { NextRequest, NextResponse } from "next/server";
import { store, composeFullAddress } from "@/lib/store";
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

    const product = await store.products.create({
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
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error(err);
    if ((err as { name?: string }).name === "DbError") {
      const e = err as Error & { hint?: string; status?: number };
      return NextResponse.json({ error: `${e.message} ${e.hint ?? ""}`.trim() }, { status: e.status && e.status >= 400 ? e.status : 500 });
    }
    return NextResponse.json({ error: "Gagal memasang produk" }, { status: 500 });
  }
}

// GET /api/products?q=&category=&sort= — katalog Pasar Tani (+ info alamat & GPS penjual)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const category = searchParams.get("category") ?? "";
    const sort = searchParams.get("sort") ?? "populer";

    const products = await store.products.list({ q, category, sort });

    // Perkaya dengan alamat lengkap & koordinat GPS petani penjual
    const ownerIds = [...new Set(products.map((p) => p.ownerId).filter(Boolean))] as string[];
    const owners = await store.users.byIds(ownerIds);
    const byId = new Map(owners.map((o) => [o.id, o]));
    const enriched = products.map((p) => {
      const owner = p.ownerId ? byId.get(p.ownerId) : undefined;
      return {
        ...p,
        sellerAddress: composeFullAddress(owner ?? null),
        sellerPhone: owner?.phone ?? "",
        sellerLat: owner?.latitude ?? null,
        sellerLng: owner?.longitude ?? null,
      };
    });
    return NextResponse.json(enriched);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}
