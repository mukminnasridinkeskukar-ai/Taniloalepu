import { NextRequest, NextResponse } from "next/server";
import { store, composeFullAddress } from "@/lib/store";
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
    if (session.role === "superadmin") {
      const orders = await store.orders.list();
      return NextResponse.json(orders);
    }
    // petani: pesanan atas produk miliknya ATAU pesanan atas namanya (terlepas dari produk terhapus)
    const myProducts = await store.products.list({ ownerId: session.id });
    const orders = await store.orders.list({
      ownerId: session.id,
      productIds: myProducts.map((p) => p.id),
    });
    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memuat pesanan" }, { status: 500 });
  }
}

// POST /api/orders — buat pesanan dari Pasar Tani (COD atau transfer bank dgn bukti)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.productId ?? "");
    const customerName = String(body.customerName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const quantity = Math.floor(Number(body.quantity));
    const paymentMethod = body.paymentMethod === "transfer" ? "transfer" : "cod";
    const paymentProof = typeof body.paymentProof === "string" ? body.paymentProof : "";

    if (!customerName || !phone || !address || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Nama, telepon, alamat, dan jumlah wajib diisi dengan benar" },
        { status: 400 }
      );
    }
    if (paymentMethod === "transfer" && !paymentProof.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Bukti transfer wajib diunggah untuk metode pembayaran transfer bank" },
        { status: 400 }
      );
    }
    if (paymentProof.length > 900_000) {
      return NextResponse.json(
        { error: "Ukuran foto bukti transfer terlalu besar. Coba lagi dengan foto yang lebih kecil." },
        { status: 400 }
      );
    }

    const product = await store.products.byId(productId);
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: `Stok tidak cukup. Tersedia ${product.stock} ${product.unit}` },
        { status: 400 }
      );
    }

    // kurangi stok dengan penjaga konkurensi (stok lama harus cocok)
    const ok = await store.products.adjustStock(productId, product.stock, {
      stock: product.stock - quantity,
      sold: product.sold + quantity,
    });
    if (!ok) {
      return NextResponse.json(
        { error: "Stok baru saja berubah. Muat ulang halaman lalu coba lagi." },
        { status: 409 }
      );
    }

    // Salin rekening bank petani penjual ke pesanan (bukti transfer + instruksi bayar)
    const seller = product.ownerId ? await store.users.byId(product.ownerId) : null;
    const order = await store.orders.create({
      productId,
      ownerId: product.ownerId,
      productName: product.name,
      customerName,
      phone,
      address,
      quantity,
      total: product.price * quantity,
      paymentMethod,
      paymentStatus: "menunggu",
      paymentProof: paymentMethod === "transfer" ? paymentProof : "",
      bankName: seller?.bankName ?? "",
      bankAccountNumber: seller?.bankAccountNumber ?? "",
      bankAccountName: seller?.bankAccountName ?? "",
    });

    const sellerAddress = composeFullAddress(seller);
    const message =
      paymentMethod === "transfer"
        ? `Pesanan "${product.name}" (${quantity} ${product.unit}) dibuat dgn metode Transfer Bank. Bukti transfer Anda terlampir & akan diverifikasi petani.`
        : `Pesanan "${product.name}" (${quantity} ${product.unit}) berhasil dibuat — bayar tunai saat pesanan diterima.`;

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        message,
        payment: {
          method: paymentMethod,
          total: order.total,
          bankName: order.bankName,
          bankAccountNumber: order.bankAccountNumber,
          bankAccountName: order.bankAccountName,
          sellerAddress,
          sellerPhone: seller?.phone ?? "",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    if ((err as { name?: string }).name === "DbError") {
      const e = err as Error & { hint?: string; status?: number };
      return NextResponse.json({ error: `${e.message} ${e.hint ?? ""}`.trim() }, { status: e.status && e.status >= 400 ? e.status : 500 });
    }
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
