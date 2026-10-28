import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";

// PATCH /api/users/[id]
// - operator: setujui / tolak pengajuan akun petani (status menunggu)
// - superadmin: ubah peran, status, reset kata sandi akun mana pun
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const target = await store.users.byId(id);
  if (!target) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await req.json();

    if (session.role === "operator") {
      // operator hanya boleh menyetujui/menolak pengajuan akun petani
      if (target.role !== "petani") {
        return NextResponse.json({ error: "Operator hanya mengelola akun petani" }, { status: 403 });
      }
      const status = String(body.status ?? "");
      if (!["aktif", "ditolak"].includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }
      if (target.status !== "menunggu" && status === "ditolak") {
        return NextResponse.json({ error: "Akun yang sudah aktif tidak dapat ditolak" }, { status: 400 });
      }
      const updated = await store.users.update(id, {
        status,
        approvedAt: status === "aktif" ? new Date() : target.approvedAt,
      });
      return NextResponse.json({ ok: true, status: updated?.status ?? status });
    }

    if (session.role === "superadmin") {
      const data: Record<string, string | null> = {};
      if (typeof body.role === "string" && ["petani", "operator", "superadmin"].includes(body.role)) {
        data.role = body.role;
      }
      if (typeof body.status === "string" && ["aktif", "menunggu", "ditolak"].includes(body.status)) {
        data.status = body.status;
        if (body.status === "aktif") data.approvedAt = new Date().toISOString();
      }
      if (typeof body.password === "string" && body.password.length > 0) {
        if (body.password.length < 6) {
          return NextResponse.json({ error: "Kata sandi baru minimal 6 karakter" }, { status: 400 });
        }
        data.password = body.password;
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
      }
      // cegah superadmin menonaktifkan dirinya sendiri
      if (id === session.id && (data.status === "ditolak" || data.status === "menunggu" || (data.role && data.role !== "superadmin"))) {
        return NextResponse.json({ error: "Anda tidak dapat menurunkan atau menonaktifkan akun sendiri" }, { status: 400 });
      }
      await store.users.update(id, data);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui akun" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — superadmin menghapus akun
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }
  if (session.role !== "superadmin") {
    return NextResponse.json({ error: "Hanya admin desa yang dapat menghapus akun" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (id === session.id) {
    return NextResponse.json({ error: "Anda tidak dapat menghapus akun sendiri" }, { status: 400 });
  }
  try {
    await store.users.remove(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
