import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser, publicUser } from "@/lib/auth";

// PATCH /api/auth/profile — ubah data akun (nama, kontak, alamat lengkap + GPS, rekening bank, foto, kata sandi)
export async function PATCH(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data: Record<string, string | number | null> = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
      data.name = name.slice(0, 100);
    }
    if (typeof body.phone === "string") data.phone = body.phone.trim().slice(0, 30);
    if (typeof body.address === "string") data.address = body.address.trim().slice(0, 200);
    if (typeof body.addressFull === "string") data.addressFull = body.addressFull.trim().slice(0, 300);
    if (typeof body.village === "string") data.village = body.village.trim().slice(0, 100);
    if (typeof body.district === "string") data.district = body.district.trim().slice(0, 100);
    if (typeof body.regency === "string") data.regency = body.regency.trim().slice(0, 100);
    if (typeof body.province === "string") data.province = body.province.trim().slice(0, 100);
    if (body.latitude !== undefined) {
      if (body.latitude === null || body.latitude === "") {
        data.latitude = null;
      } else {
        const lat = Number(body.latitude);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          return NextResponse.json({ error: "Koordinat garis lintang tidak valid (-90 s.d. 90)" }, { status: 400 });
        }
        data.latitude = lat;
      }
    }
    if (body.longitude !== undefined) {
      if (body.longitude === null || body.longitude === "") {
        data.longitude = null;
      } else {
        const lng = Number(body.longitude);
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          return NextResponse.json({ error: "Koordinat garis bujur tidak valid (-180 s.d. 180)" }, { status: 400 });
        }
        data.longitude = lng;
      }
    }
    if (typeof body.bankName === "string") data.bankName = body.bankName.trim().slice(0, 60);
    if (typeof body.bankAccountNumber === "string") data.bankAccountNumber = body.bankAccountNumber.trim().slice(0, 40);
    if (typeof body.bankAccountName === "string") data.bankAccountName = body.bankAccountName.trim().slice(0, 100);
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
    return NextResponse.json({ ok: true, user: publicUser(updated) });
  } catch (err) {
    console.error(err);
    if ((err as { name?: string }).name === "DbError") {
      const e = err as Error & { hint?: string; status?: number };
      return NextResponse.json({ error: `${e.message} ${e.hint ?? ""}`.trim() }, { status: e.status && e.status >= 400 ? e.status : 500 });
    }
    return NextResponse.json({ error: "Gagal menyimpan perubahan akun" }, { status: 500 });
  }
}
