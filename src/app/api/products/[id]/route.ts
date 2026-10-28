import { NextRequest, NextResponse } from "next/server";
import { store, composeFullAddress } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/products/[id] — detail produk + info penjual (alamat, GPS, kontak, rekening bank)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await store.products.byId(id);
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    const owner = product.ownerId ? await store.users.byId(product.ownerId) : null;
    return NextResponse.json({
      ...product,
      sellerAddress: composeFullAddress(owner),
      sellerPhone: owner?.phone ?? "",
      sellerLat: owner?.latitude ?? null,
      sellerLng: owner?.longitude ?? null,
      sellerBankName: owner?.bankName ?? "",
      sellerBankAccountNumber: owner?.bankAccountNumber ?? "",
      sellerBankAccountName: owner?.bankAccountName ?? "",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat detail produk" }, { status: 500 });
  }
}

// PATCH /api/products/[id] — petani mengubah produk miliknya sendiri (superadmin juga boleh)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator tidak dapat mengubah produk" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const product = await store.products.byId(id);
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    if (product.ownerId !== session.id && session.role !== "superadmin") {
      return NextResponse.json(
        { error: "Anda hanya dapat mengubah produk hasil panen milik Anda sendiri" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "Nama produk tidak boleh kosong" }, { status: 400 });
      patch.name = name.slice(0, 120);
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: "Harga harus berupa angka lebih dari 0" }, { status: 400 });
      }
      patch.price = price;
    }
    if (body.stock !== undefined) {
      const stock = Math.floor(Number(body.stock));
      if (!Number.isFinite(stock) || stock < 0) {
        return NextResponse.json({ error: "Stok tidak boleh negatif" }, { status: 400 });
      }
      patch.stock = stock;
    }
    if (body.category !== undefined) patch.category = String(body.category).slice(0, 40);
    if (body.unit !== undefined) patch.unit = String(body.unit).trim().slice(0, 30) || "kg";
    if (body.description !== undefined) patch.description = String(body.description).slice(0, 600);
    if (body.imageUrl !== undefined) patch.imageUrl = String(body.imageUrl);
    if (body.location !== undefined) {
      const location = String(body.location).trim();
      if (!location) return NextResponse.json({ error: "Lokasi tidak boleh kosong" }, { status: 400 });
      patch.location = location.slice(0, 100);
    }
    if (body.isOrganic !== undefined) patch.isOrganic = Boolean(body.isOrganic);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan data" }, { status: 400 });
    }

    const updated = await store.products.update(id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    if ((err as { name?: string }).name === "DbError") {
      const e = err as Error & { hint?: string; status?: number };
      return NextResponse.json({ error: `${e.message} ${e.hint ?? ""}`.trim() }, { status: e.status && e.status >= 400 ? e.status : 500 });
    }
    return NextResponse.json({ error: "Gagal mengubah produk" }, { status: 500 });
  }
}

// DELETE /api/products/[id] — petani menghapus produk miliknya sendiri (superadmin juga boleh)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator tidak dapat menghapus produk" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const product = await store.products.byId(id);
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    if (product.ownerId !== session.id && session.role !== "superadmin") {
      return NextResponse.json(
        { error: "Anda hanya dapat menghapus produk hasil panen milik Anda sendiri" },
        { status: 403 }
      );
    }

    await store.products.remove(id);
    return NextResponse.json({ ok: true, message: `Produk "${product.name}" telah dihapus dari Pasar Tani` });
  } catch (err) {
    console.error(err);
    // 409 dari klien REST: produk masih dirujuk pesanan lama (skema basis data lama)
    const status = (err as { status?: number }).status ?? 0;
    const msg = (err as Error).message ?? "";
    if (status === 409 || /foreign key|violates|23503/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Gagal menghapus: produk masih terkait riwayat pesanan lama. Jalankan ulang skrip penyiapan basis data terbaru (langkah 1 pada panduan) agar pesanan lama dapat terlepas otomatis, lalu coba lagi.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
