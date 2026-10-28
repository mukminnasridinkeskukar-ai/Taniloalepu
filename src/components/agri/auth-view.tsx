"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogIn, UserPlus, Leaf, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { HERO_IMAGES } from "@/lib/agri-content";
import type { AuthUser } from "@/lib/agri-types";

type Mode = "masuk" | "daftar";

export function AuthView({
  mode,
  onNavigate,
  onLoginSuccess,
}: {
  mode: Mode;
  onNavigate: (v: "beranda" | "masuk" | "daftar") => void;
  onLoginSuccess: (user: AuthUser) => void;
}) {
  const [form, setForm] = useState({ username: "", password: "", name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "masuk" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "masuk"
          ? { username: form.username, password: form.password }
          : {
              username: form.username,
              password: form.password,
              name: form.name,
              phone: form.phone,
              address: form.address,
            };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan, coba lagi");
        return;
      }
      if (mode === "masuk") {
        onLoginSuccess(data.user as AuthUser);
      } else {
        setRegistered(true);
      }
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  // ===== Layar sukses pendaftaran =====
  if (registered) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <Card className="overflow-hidden border-primary/30 shadow-lg">
          <div className="bg-primary/10 px-6 py-8 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-bold">Pengajuan Akun Terkirim</h1>
            <p className="mt-2 text-muted-foreground">
              Terima kasih, <span className="font-semibold text-foreground">{form.name}</span>! Akun{" "}
              <span className="font-semibold text-foreground">@{form.username}</span> sedang menunggu persetujuan
              operator desa.
            </p>
          </div>
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-accent/40 p-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold">Langkah selanjutnya</p>
                <p className="mt-1 text-muted-foreground">
                  Operator desa akan memeriksa dan menyetujui pengajuan Anda. Setelah disetujui, Anda dapat masuk
                  menggunakan nama pengguna dan kata sandi yang telah didaftarkan untuk mulai menginput data lahan,
                  tanaman, dan menjual hasil panen.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => onNavigate("beranda")}>
                Kembali ke Beranda
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setRegistered(false);
                  setForm({ username: "", password: "", name: "", phone: "", address: "" });
                  onNavigate("masuk");
                }}
              >
                Coba Masuk
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const isLogin = mode === "masuk";

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-16">
      {/* Panel gambar */}
      <div className="relative hidden overflow-hidden rounded-3xl shadow-xl lg:block">
        <img
          src={HERO_IMAGES.farmer}
          alt="Petani menanam di sawah Desa Loa Lepu"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative flex h-full flex-col justify-end p-8 text-white">
          <Badge className="mb-3 w-fit bg-white/20 text-white backdrop-blur">
            <Leaf className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Desa Loa Lepu · Kutai Kartanegara
          </Badge>
          <h2 className="text-2xl font-bold leading-snug">
            Satu akun untuk seluruh kebutuhan pertanian Anda
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Data lahan & tanaman tersimpan aman milik Anda sendiri
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Jual hasil panen langsung ke masyarakat
            </li>
          </ul>
        </div>
      </div>

      {/* Panel form */}
      <Card className="self-start shadow-lg">
        <CardContent className="px-6 py-8 sm:px-8">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              {isLogin ? <LogIn className="h-6 w-6" aria-hidden="true" /> : <UserPlus className="h-6 w-6" aria-hidden="true" />}
            </span>
            <h1 className="text-2xl font-bold">{isLogin ? "Masuk ke Akun" : "Daftar Akun Petani"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin
                ? "Masuk untuk mengelola lahan, mencatat aktivitas, dan menjual hasil panen."
                : "Isi formulir untuk mengajukan akun petani. Operator desa akan menyetujui pengajuan Anda."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name">Nama Lengkap *</Label>
                  <Input
                    id="auth-name"
                    placeholder="cth. Budi Santoso"
                    value={form.name}
                    onChange={set("name")}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-phone">No. Telepon</Label>
                    <Input
                      id="auth-phone"
                      type="tel"
                      placeholder="cth. 0812-3456-7890"
                      value={form.phone}
                      onChange={set("phone")}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-address">Alamat / Dusun</Label>
                    <Input
                      id="auth-address"
                      placeholder="cth. Dusun Loa Lepu Ulu"
                      value={form.address}
                      onChange={set("address")}
                      autoComplete="street-address"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-username">Nama Pengguna</Label>
              <Input
                id="auth-username"
                placeholder="cth. budi.santoso"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
                required
                autoComplete="username"
              />
              <p className="text-xs text-muted-foreground">
                3-30 karakter, huruf kecil/angka/titik/garis bawah
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Kata Sandi</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder={isLogin ? "Kata sandi Anda" : "Minimal 6 karakter"}
                value={form.password}
                onChange={set("password")}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isLogin ? "Masuk" : "Kirim Pengajuan Akun"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-4 text-center text-sm">
            {isLogin ? (
              <>
                Belum punya akun?{" "}
                <button onClick={() => onNavigate("daftar")} className="font-semibold text-primary hover:underline">
                  Daftar sekarang
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button onClick={() => onNavigate("masuk")} className="font-semibold text-primary hover:underline">
                  Masuk di sini
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
