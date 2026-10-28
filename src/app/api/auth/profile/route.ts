import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";

// PATCH /api/auth/profile — ubah data akun (nama, telepon, alamat, foto profil, kata sandi)
export async function PATCH(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data: Record<string, string> = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
      data.name = name.slice(0, 100);
    }
    if (typeof body.phone === "string") data.phone = body.phone.trim().slice(0, 30);
    if (typeof body.address === "string") data.address = body.address.trim().slice(0, 200);
    if (typeof body.avatarUrl === "string") {
      // batasi ukuran data URL foto profil ~ 700 KB agar hemat penyimpanan
      if (body.avatarUrl.length > 700_000) {
        return NextResponse.json({ error: "Ukuran foto terlalu besar. Gunakan foto yang lebih kecil." }, { status: 400 });
      }
      data.avatarUrl = body.avatarUrl;
    }

    // ganti kata sandi: wajib verifikasi sandi lama
    if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: "Kata sandi baru minimal 6 karakter" }, { status: 400 });
      }
      const user = await store.users.byId(session.id);
      if (!user || user.password !== String(body.currentPassword ?? "")) {
        return NextResponse.json({ error: "Kata sandi lama tidak sesuai" }, { status: 400 });
      }
      data.password = body.newPassword;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan data" }, { status: 400 });
    }

    const updated = await store.users.update(session.id, data);
    return NextResponse.json({
      ok: true,
      user: {
        id: updated?.id,
        username: updated?.username,
        name: updated?.name,
        role: updated?.role,
        status: updated?.status,
        phone: updated?.phone,
        address: updated?.address,
        avatarUrl: updated?.avatarUrl,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menyimpan perubahan akun" }, { status: 500 });
  }
}
