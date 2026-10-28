import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_STATUS = ["persiapan", "tanam", "perawatan", "panen", "pasca"];

// PATCH /api/lands/[id] — update status / langkah selesai / catatan
// Pemilik lahan (petani) atau admin desa boleh mengubah; operator hanya melihat.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu untuk mengelola lahan" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator hanya dapat melihat data lahan" }, { status: 403 });
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const existing = await db.land.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lahan tidak ditemukan" }, { status: 404 });
    }
    if (session.role !== "superadmin" && existing.ownerId !== session.id) {
      return NextResponse.json({ error: "Anda hanya dapat mengelola lahan milik sendiri" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!ALLOWED_STATUS.includes(body.status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.completedSteps !== undefined) {
      data.completedSteps = JSON.stringify(Array.isArray(body.completedSteps) ? body.completedSteps : []);
    }
    if (body.notes !== undefined) data.notes = String(body.notes).slice(0, 500);
    if (body.plannedCrop !== undefined) data.plannedCrop = String(body.plannedCrop).slice(0, 100);

    const land = await db.land.update({ where: { id }, data });

    // catat aktivitas otomatis
    let actTitle = "";
    if (body.status !== undefined && body.status !== existing.status) {
      const map: Record<string, string> = {
        persiapan: "Lahan masuk tahap persiapan",
        tanam: "Penanaman dimulai",
        perawatan: "Fase perawatan tanaman",
        panen: "Fase panen",
        pasca: "Pasca panen & penjualan",
      };
      actTitle = map[body.status] ?? "Status diperbarui";
    } else if (body.completedSteps !== undefined) {
      actTitle = "Checklist persiapan diperbarui";
    } else if (body.notes !== undefined && body.notes !== existing.notes) {
      actTitle = "Catatan lahan diperbarui";
    }
    if (actTitle) {
      await db.activity.create({
        data: { landId: id, title: actTitle, note: String(body.activityNote ?? "") },
      });
    }

    return NextResponse.json(land);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui lahan" }, { status: 500 });
  }
}

// DELETE /api/lands/[id] — hapus lahan (pemilik atau admin desa)
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role === "operator") {
    return NextResponse.json({ error: "Operator tidak dapat menghapus lahan" }, { status: 403 });
  }

  try {
    const { id } = await ctx.params;
    const existing = await db.land.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lahan tidak ditemukan" }, { status: 404 });
    }
    if (session.role !== "superadmin" && existing.ownerId !== session.id) {
      return NextResponse.json({ error: "Anda hanya dapat menghapus lahan milik sendiri" }, { status: 403 });
    }
    await db.land.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus lahan" }, { status: 500 });
  }
}
