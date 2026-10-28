import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/orders — petani: pesanan utk produk miliknya; admin desa: semua pesanan.
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator tidak dapat melihat pesanan" }, { status: 403 });
  }

  try {
    const where =
      session.role === "superadmin"
        ? {}
        : { product: { ownerId: session.id } };
    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat pesanan" }, { status: 500 });
  }
}

// POST /api/orders — buat pesanan dari Pasar Tani
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.productId ?? "");
    const customerName = String(body.customerName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const quantity = Math.floor(Number(body.quantity));

    if (!customerName || !phone || !address || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Nama, telepon, alamat, dan jumlah wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Stok tidak cukup. Tersedia ${product.stock} ${product.unit}` },
        { status: 400 }
      );
    }

    const total = product.price * quantity;
    const [order] = await Promise.all([
      db.order.create({
        data: {
          productId,
          productName: product.name,
          customerName,
          phone,
          address,
          quantity,
          total,
        },
      }),
      db.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity }, sold: { increment: quantity } },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        message: `Pesanan "${product.name}" (${quantity} ${product.unit}) berhasil dibuat. Petani akan menghubungi Anda di ${phone}.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
