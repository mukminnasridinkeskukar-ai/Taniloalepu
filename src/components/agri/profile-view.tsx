"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Camera, Loader2, Save, KeyRound, UserRound, Phone, MapPin, AtSign, ShieldCheck,
  Navigation, Landmark, LocateFixed, Map as MapIcon, BadgeCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from "@/lib/agri-types";
import { ROLE_LABEL, BANK_OPTIONS, mapsLink } from "@/lib/agri-types";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Ubah berkas gambar menjadi data URL persegi 256px (JPEG kualitas 0.85). */
function fileToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca berkas"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Berkas bukan gambar yang valid"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Peramban tidak mendukung pengolah gambar"));
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileView({ user, onUserUpdated }: { user: AuthUser; onUserUpdated: (u: AuthUser) => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({ name: user.name, phone: user.phone, address: user.address });
  const [info, setInfo] = useState({
    addressFull: user.addressFull ?? "",
    village: user.village ?? "",
    district: user.district ?? "",
    regency: user.regency ?? "",
    province: user.province ?? "",
  });
  const [coords, setCoords] = useState({
    latitude: user.latitude != null ? String(user.latitude) : "",
    longitude: user.longitude != null ? String(user.longitude) : "",
  });
  const [locating, setLocating] = useState(false);
  const [bank, setBank] = useState({
    bankName: user.bankName ?? "",
    bankAccountNumber: user.bankAccountNumber ?? "",
    bankAccountName: user.bankAccountName ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  const latNum = Number(coords.latitude);
  const lngNum = Number(coords.longitude);
  const hasCoord =
    coords.latitude.trim() !== "" &&
    coords.longitude.trim() !== "" &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum);
  const osmSrc = hasCoord
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lngNum - 0.004).toFixed(6)}%2C${(latNum - 0.003).toFixed(6)}%2C${(lngNum + 0.004).toFixed(6)}%2C${(latNum + 0.003).toFixed(6)}&layer=mapnik&marker=${latNum}%2C${lngNum}`
    : "";

  function ambilGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast({ title: "Perangkat tidak mendukung GPS", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        });
        setLocating(false);
        toast({
          title: "Lokasi GPS berhasil diambil",
          description: `Akurasi ±${Math.round(pos.coords.accuracy)} meter. Klik "Simpan Perubahan" untuk menyimpan.`,
        });
      },
      () => {
        setLocating(false);
        toast({
          title: "Gagal mengambil lokasi GPS",
          description: "Aktifkan izin lokasi pada peramban lalu coba lagi, atau isi koordinat secara manual.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  async function patchProfile(payload: Record<string, unknown>, successMsg: string) {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
    onUserUpdated(data.user as AuthUser);
    toast({ title: successMsg });
  }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Pilih berkas gambar (JPG/PNG)", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Ukuran foto maksimal 8 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToSquareDataUrl(file);
      await patchProfile({ avatarUrl: dataUrl }, "Foto profil diperbarui");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal mengunggah foto", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast({ title: "Nama tidak boleh kosong", variant: "destructive" });
      return;
    }
    const lat = coords.latitude.trim();
    const lng = coords.longitude.trim();
    if ((lat && Number.isNaN(Number(lat))) || (lng && Number.isNaN(Number(lng)))) {
      toast({ title: "Koordinat GPS harus berupa angka", description: "Contoh: -0.402834 dan 117.088412", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      await patchProfile(
        {
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          addressFull: info.addressFull,
          village: info.village,
          district: info.district,
          regency: info.regency,
          province: info.province,
          latitude: lat === "" ? null : Number(lat),
          longitude: lng === "" ? null : Number(lng),
          bankName: bank.bankName,
          bankAccountNumber: bank.bankAccountNumber,
          bankAccountName: bank.bankAccountName,
        },
        "Data akun berhasil disimpan"
      );
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 6) {
      toast({ title: "Kata sandi baru minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (pw.next !== pw.confirm) {
      toast({ title: "Konfirmasi kata sandi tidak sama", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      await patchProfile({ currentPassword: pw.current, newPassword: pw.next }, "Kata sandi berhasil diganti");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal mengganti kata sandi", variant: "destructive" });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Akun Saya</h1>
        <p className="mt-1 text-muted-foreground">
          Perbarui foto profil dan kelola data akun Anda di platform Tani Loa Lepu.
        </p>
      </div>

      {/* Kartu profil */}
      <Card className="mb-6 shadow-md">
        <CardContent className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-primary/30 shadow-md">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={`Foto profil ${user.name}`} /> : null}
              <AvatarFallback className="bg-primary/15 text-xl font-bold text-primary">
                {initials(user.name) || "PL"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
              aria-label="Ubah foto profil"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickAvatar}
              aria-label="Pilih foto profil"
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="truncate text-xl font-bold">{user.name}</h2>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{ROLE_LABEL[user.role] ?? user.role}</Badge>
            </div>
            <div className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2 sm:justify-start">
                <AtSign className="h-3.5 w-3.5" aria-hidden="true" /> @{user.username}
              </p>
              {user.phone ? (
                <p className="flex items-center justify-center gap-2 sm:justify-start">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {user.phone}
                </p>
              ) : null}
              <p className="flex items-center justify-center gap-2 sm:justify-start">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {user.address || "Desa Loa Lepu, Tenggarong Seberang"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data akun */}
      <Card className="mb-6 shadow-md">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold">Data Akun</h3>
              <p className="text-xs text-muted-foreground">Nama pengguna tidak dapat diubah</p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-name">Nama Lengkap</Label>
                <Input
                  id="pf-name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-username">Nama Pengguna</Label>
                <Input id="pf-username" value={`@${user.username}`} disabled />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-phone">No. Telepon</Label>
                <Input
                  id="pf-phone"
                  type="tel"
                  placeholder="cth. 0812-3456-7890"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-address">Alamat / Dusun</Label>
                <Input
                  id="pf-address"
                  placeholder="cth. Dusun Loa Lepu Ulu"
                  value={profile.address}
                  onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>
            <Button type="submit" disabled={savingProfile} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alamat lengkap & lokasi GPS */}
      <Card className="mb-6 shadow-md">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold">Alamat Lengkap &amp; Lokasi GPS</h3>
              <p className="text-xs text-muted-foreground">
                Tampil pada produk Anda di Pasar Tani agar pembeli tahu asal hasil panen
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-address-full">Alamat Lengkap (Jalan / Dusun / RT-RW)</Label>
              <Textarea
                id="pf-address-full"
                rows={2}
                placeholder="cth. Jl. Melati No. 8, Dusun Loa Lepu Ulu, RT 03 / RW 02"
                value={info.addressFull}
                onChange={(e) => setInfo((p) => ({ ...p, addressFull: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-village">Desa / Kelurahan</Label>
                <Input
                  id="pf-village"
                  placeholder="cth. Desa Loa Lepu"
                  value={info.village}
                  onChange={(e) => setInfo((p) => ({ ...p, village: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-district">Kecamatan</Label>
                <Input
                  id="pf-district"
                  placeholder="cth. Kecamatan Tenggarong Seberang"
                  value={info.district}
                  onChange={(e) => setInfo((p) => ({ ...p, district: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-regency">Kabupaten</Label>
                <Input
                  id="pf-regency"
                  placeholder="cth. Kabupaten Kutai Kartanegara"
                  value={info.regency}
                  onChange={(e) => setInfo((p) => ({ ...p, regency: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-province">Provinsi</Label>
                <Input
                  id="pf-province"
                  placeholder="cth. Kalimantan Timur"
                  value={info.province}
                  onChange={(e) => setInfo((p) => ({ ...p, province: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>
                  Koordinat GPS (garis lintang &amp; bujur)
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={ambilGps} disabled={locating} className="gap-1.5">
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />}
                  {locating ? "Mencari lokasi…" : "Ambil Lokasi GPS Saat Ini"}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pf-lat" className="text-xs text-muted-foreground">Garis lintang (latitude)</Label>
                  <Input
                    id="pf-lat"
                    inputMode="decimal"
                    placeholder="cth. -0.402834"
                    value={coords.latitude}
                    onChange={(e) => setCoords((p) => ({ ...p, latitude: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-lng" className="text-xs text-muted-foreground">Garis bujur (longitude)</Label>
                  <Input
                    id="pf-lng"
                    inputMode="decimal"
                    placeholder="cth. 117.088412"
                    value={coords.longitude}
                    onChange={(e) => setCoords((p) => ({ ...p, longitude: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {hasCoord && (
              <div className="overflow-hidden rounded-xl border border-border/70">
                <iframe
                  title="Peta pratinjau lokasi"
                  src={osmSrc}
                  className="h-48 w-full border-0"
                  loading="lazy"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Titik GPS: {latNum.toFixed(5)}, {lngNum.toFixed(5)}
                  </span>
                  {mapsLink(latNum, lngNum) && (
                    <a
                      href={mapsLink(latNum, lngNum)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary underline underline-offset-2"
                    >
                      Buka di peta
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rekening bank untuk pembayaran transfer */}
      {user.role !== "operator" && (
        <Card className="mb-6 shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Landmark className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold">Rekening Bank Penerima Pembayaran</h3>
                <p className="text-xs text-muted-foreground">
                  Dipakai pembeli saat memilih metode Transfer Bank di Pasar Tani
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pf-bank">Nama Bank</Label>
                <Input
                  id="pf-bank"
                  list="bank-options"
                  placeholder="cth. BRI"
                  value={bank.bankName}
                  onChange={(e) => setBank((p) => ({ ...p, bankName: e.target.value }))}
                />
                <datalist id="bank-options">
                  {BANK_OPTIONS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-bank-no">Nomor Rekening</Label>
                <Input
                  id="pf-bank-no"
                  inputMode="numeric"
                  placeholder="cth. 1234-01-234567-53-6"
                  value={bank.bankAccountNumber}
                  onChange={(e) => setBank((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-bank-name">Atas Nama</Label>
                <Input
                  id="pf-bank-name"
                  placeholder="cth. Sutrisno"
                  value={bank.bankAccountName}
                  onChange={(e) => setBank((p) => ({ ...p, bankAccountName: e.target.value }))}
                />
              </div>
            </div>
            {bank.bankName && bank.bankAccountNumber ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Pembeli transfer ke {bank.bankName} {bank.bankAccountNumber} a.n. {bank.bankAccountName || user.name}
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Lengkapi rekening agar pembeli dapat membayar via transfer bank.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kata sandi */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold">Ganti Kata Sandi</h3>
              <p className="text-xs text-muted-foreground">Verifikasi kata sandi lama untuk keamanan akun</p>
            </div>
          </div>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pw-current">Kata Sandi Lama</Label>
                <Input
                  id="pw-current"
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-next">Kata Sandi Baru</Label>
                <Input
                  id="pw-next"
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw-confirm">Ulangi Kata Sandi Baru</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={savingPw} variant="outline" className="gap-2">
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              Ganti Kata Sandi
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
