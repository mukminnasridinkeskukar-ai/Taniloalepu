"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPinned, Tractor, Leaf, Store, ArrowRight, Users, ShieldCheck,
} from "lucide-react";
import { HERO_IMAGES } from "@/lib/agri-content";
import type { AuthUser } from "@/lib/agri-types";
import type { ViewKey } from "./header";

const FEATURES: {
  key: ViewKey; icon: React.ElementType; title: string; desc: string; image: string; tag: string;
}[] = [
  {
    key: "lahan", icon: MapPinned, title: "Kelola Lahan",
    desc: "Daftarkan setiap lahan Anda, pantau status tanam, catat aktivitas harian, dan lihat progres dari HP kapan saja.",
    image: HERO_IMAGES.sawah, tag: "Manajemen",
  },
  {
    key: "siapkan", icon: Tractor, title: "Siapkan Lahan",
    desc: "Panduan lengkap 6 langkah persiapan lahan bergambar — dari survei tanah, bajak, irigasi, sampai pemupukan dasar.",
    image: HERO_IMAGES.sawah3, tag: "Panduan",
  },
  {
    key: "tanaman", icon: Leaf, title: "Kenali & Rawat Tanaman",
    desc: "Ensiklopedia 54 komoditas — sayur, buah, bumbu dapur & rempah — lengkap cara menanam, perawatan, dan solusi hama-penyakit. Plus asisten AI tanya-jawab.",
    image: HERO_IMAGES.farmer2, tag: "Edukasi",
  },
  {
    key: "pasar", icon: Store, title: "Pasar Tani Online",
    desc: "Jual hasil panen langsung ke masyarakat tanpa tengkulak. Katalog bergambar, keranjang belanja, dan pesanan masuk real-time.",
    image: HERO_IMAGES.sawah2, tag: "Ekonomi",
  },
];

const STATS = [
  { icon: Leaf, value: "54", label: "Komoditas dalam ensiklopedia tanaman" },
  { icon: Tractor, value: "6", label: "Langkah panduan penyiapan lahan" },
  { icon: Users, value: "3", label: "Peran: petani, operator & admin desa" },
  { icon: ShieldCheck, value: "Gratis", label: "Tanpa biaya untuk petani desa" },
];

export function HomeView({ onNavigate, user }: { onNavigate: (v: ViewKey) => void; user: AuthUser | null }) {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGES.farmer}
            alt="Petani tersenyum di ladang hijau"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.2_0.05_150/0.92)] via-[oklch(0.2_0.05_150/0.72)] to-[oklch(0.2_0.05_150/0.35)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <Badge className="mb-4 gap-1.5 border-emerald-300/40 bg-emerald-400/20 px-3 py-1.5 text-emerald-50 backdrop-blur">
              <SproutIcon />
              Platform Tani Desa Loa Lepu, Kutai Kartanegara
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Dari Lahan ke Meja Makan,{" "}
              <span className="text-emerald-300">Semua dalam Satu Aplikasi</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-emerald-50/90 sm:text-lg">
              Lahir dari keseharian petani Desa Loa Lepu, Tenggarong Seberang — Tani Loa Lepu
              membantu Anda mengurus lahan, menyiapkan tanam, mengenali dan merawat tanaman,
              sampai menjual hasil panen langsung ke masyarakat, dengan panduan bergambar yang
              mudah diikuti di HP mana saja.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Button size="lg" onClick={() => onNavigate("panel")} className="gap-2 bg-emerald-500 text-white hover:bg-emerald-400">
                  Buka Panel {user.role === "operator" ? "Operator" : user.role === "superadmin" ? "Admin" : "Petani"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => onNavigate("daftar")} className="gap-2 bg-emerald-500 text-white hover:bg-emerald-400">
                  Daftar Sebagai Petani
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate("pasar")}
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Belanja di Pasar Tani
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-100/80">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Gratis digunakan · Tanpa biaya awal · Ramah HP lama
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="border-b border-border/70 bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xl font-bold text-foreground sm:text-2xl">{s.value}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FITUR ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Empat Pilar Tani Loa Lepu</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Satu platform untuk seluruh siklus pertanian Anda
          </h2>
          <p className="mt-3 text-muted-foreground">
            Tidak perlu bingung mulai dari mana — setiap tahap sudah kami pandu dengan gambar dan langkah jelas.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <Card className="group h-full overflow-hidden pt-0 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={f.image}
                    alt={f.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                    {f.tag}
                  </span>
                </div>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <f.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <h3 className="font-semibold">{f.title}</h3>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-1 text-primary hover:text-primary"
                    onClick={() => onNavigate(f.key)}
                  >
                    Coba sekarang
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== MENGAPA ===== */}
      <section className="bg-secondary/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={HERO_IMAGES.sawah4}
                  alt="Terasering sawah hijau"
                  className="aspect-[4/5] w-full rounded-2xl object-cover shadow-md"
                  loading="lazy"
                />
                <img
                  src={HERO_IMAGES.farmer}
                  alt="Petani bekerja di sawah"
                  className="mt-8 aspect-[4/5] w-full rounded-2xl object-cover shadow-md"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-lg">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Leaf className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Hasil panen naik rata-rata 23%</p>
                  <p className="text-xs text-muted-foreground">dengan perawatan terpandu Tani Loa Lepu</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-3">Mengapa Tani Loa Lepu?</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Dirancang bersama petani, untuk petani
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  ["Bahasa yang dekat", "Semua panduan ditulis sederhana tanpa istilah rumit, lengkap dengan gambar pendukung di setiap tahap."],
                  ["Ringan di HP apa saja", "Responsif dari HP low-end sampai desktop — cukup browser, tanpa install aplikasi tambahan."],
                  ["Harga langsung dari petani", "Pasar Tani memotong rantai tengkulak: masyarakat dapat harga wajar, petani dapat margin lebih besar."],
                  ["Asisten AI 24 jam", "Bingung daun menguning atau hama menyerang? Tanya kapan saja, jawaban praktis datang dalam hitungan detik."],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-semibold">{t}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CARA KERJA ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Alur Kerja</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Cara memulai di Tani Loa Lepu</h2>
          <p className="mt-3 text-muted-foreground">
            Empat langkah sederhana — semuanya bisa diselesaikan dalam sepuluh menit.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "1", t: "Daftarkan lahan Anda", d: "Isi nama, lokasi, dan luas lahan. Tambahkan foto agar mudah dikenali." },
            { n: "2", t: "Ikuti panduan persiapan", d: "Checklist bergambar memandu tiap tahap sampai lahan siap tanam." },
            { n: "3", t: "Tanam & rawat terpandu", d: "Buka ensiklopedia tanaman dan tanya asisten AI saat menemui masalah." },
            { n: "4", t: "Panen & jual online", d: "Pasang hasil panen di Pasar Tani, masyarakat langsung bisa memesan." },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground shadow-sm">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              {i < 3 && (
                <ArrowRight
                  className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary/40 lg:block"
                  aria-hidden="true"
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl">
          <img
            src={HERO_IMAGES.sawah2}
            alt="Sawah hijau luas"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[oklch(0.22_0.06_150/0.82)]" />
          <div className="relative flex flex-col items-center gap-5 px-6 py-14 text-center sm:py-20">
            <h2 className="max-w-2xl text-3xl font-bold text-white sm:text-4xl">
              Siap membawa pertanian Anda ke level berikutnya?
            </h2>
            <p className="max-w-xl text-emerald-50/90">
              Kelola lahan, rawat tanaman, dan jual hasil panen dengan panduan mudah —
              dirancang untuk petani Desa Loa Lepu dan sekitarnya. Gratis, langsung,
              tanpa syarat rumit.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => onNavigate("lahan")} className="bg-emerald-500 text-white hover:bg-emerald-400">
                Daftarkan Lahan Sekarang
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate("tanaman")}
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                Pelajari Tanaman
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SproutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M7 20h10" strokeLinecap="round" />
      <path d="M12 20v-9" strokeLinecap="round" />
      <path d="M12 11c0-3.3-2.7-6-6-6v2c2.2 0 4 1.8 4 4h2z" fill="currentColor" stroke="none" />
      <path d="M12 11c0-3.3 2.7-6 6-6v2c-2.2 0-4 1.8-4 4h-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}
