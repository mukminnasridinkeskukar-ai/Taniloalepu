import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/orders/[id] — penjual (pemilik produk) / superadmin:
//   - verifikasi pembayaran: { paymentStatus: "terverifikasi" }
//   - perbarui progres pesanan: { status: "baru" | "diproses" | "dikirim" | "selesai" }
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator tidak dapat mengubah pesanan" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const order = await store.orders.byId(id);
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    if (order.ownerId !== session.id && session.role !== "superadmin") {
      return NextResponse.json(
        { error: "Anda hanya dapat mengelola pesanan untuk produk milik Anda sendiri" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (body.paymentStatus !== undefined) {
      const ps = String(body.paymentStatus);
      if (!["menunggu", "terverifikasi"].includes(ps)) {
        return NextResponse.json({ error: "Status pembayaran tidak valid" }, { status: 400 });
      }
      patch.paymentStatus = ps;
      patch.confirmedAt = ps === "terverifikasi" ? new Date().toISOString() : null;
    }
    if (body.status !== undefined) {
      const st = String(body.status);
      if (!["baru", "diproses", "dikirim", "selesai"].includes(st)) {
        return NextResponse.json({ error: "Status pesanan tidak valid" }, { status: 400 });
      }
      patch.status = st;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan data" }, { status: 400 });
    }

    const updated = await store.orders.update(id, patch);
    return NextResponse.json({
      ok: true,
      order: updated,
      message:
        patch.paymentStatus === "terverifikasi"
          ? "Pembayaran telah diverifikasi"
          : "Status pesanan diperbarui",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui pesanan" }, { status: 500 });
  }
}
