"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Map, Package, ShoppingBasket, PlusCircle, BookOpen, ArrowRight, Wallet, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser, Land, OrderRecord, Product } from "@/lib/agri-types";
import { OperatorPanel } from "@/components/agri/operator-panel";
import { SuperadminPanel } from "@/components/agri/admin-panel";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold leading-tight">{value}</p>
          {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard, rupiah };

// ===================== PANEL PETANI =====================
function PetaniPanel({ user, onNavigate }: { user: AuthUser; onNavigate: (v: "lahan" | "pasar" | "tanaman" | "akun") => void }) {
  const { toast } = useToast();
  const [lands, setLands] = useState<Land[] | null>(null);
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rL, rO, rP] = await Promise.all([fetch("/api/lands"), fetch("/api/orders"), fetch("/api/products")]);
        const dL = await rL.json();
        const dO = await rO.json();
        const dP = await rP.json();
        if (!alive) return;
        setLands(Array.isArray(dL) ? dL : []);
        setOrders(Array.isArray(dO) ? dO : []);
        setProducts(Array.isArray(dP) ? dP.filter((p: Product) => p.ownerId === user.id) : []);
      } catch {
        if (alive) toast({ title: "Gagal memuat data panel", variant: "destructive" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [user.id, toast]);

  const loading = lands === null || orders === null || products === null;
  const income = (orders ?? []).reduce((a, o) => a + o.total, 0);
  const planting = (lands ?? []).filter((l) => l.status === "tanam" || l.status === "perawatan").length;

  const actions: { key: "lahan" | "pasar" | "tanaman"; icon: React.ReactNode; title: string; desc: string }[] = [
    { key: "lahan", icon: <Map className="h-5 w-5" aria-hidden="true" />, title: "Kelola Lahan", desc: "Daftarkan & pantau lahan Anda" },
    { key: "pasar", icon: <Package className="h-5 w-5" aria-hidden="true" />, title: "Jual Hasil Panen", desc: "Pasang produk di Pasar Tani" },
    { key: "tanaman", icon: <BookOpen className="h-5 w-5" aria-hidden="true" />, title: "Kenali Tanaman", desc: "Panduan menanam & perawatan" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Panel Petani</h1>
          <p className="mt-1 text-muted-foreground">
            Selamat datang kembali, <span className="font-semibold text-foreground">{user.name}</span>! Ringkasan aktivitas pertanian Anda.
          </p>
        </div>
        <Button onClick={() => onNavigate("lahan")} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Daftarkan Lahan
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Map className="h-5 w-5" aria-hidden="true" />} label="Lahan Saya" value={String(lands!.length)} hint={`${planting} sedang ditanami`} />
          <StatCard icon={<Package className="h-5 w-5" aria-hidden="true" />} label="Produk Saya" value={String(products!.length)} hint="dipasang di Pasar Tani" />
          <StatCard icon={<ShoppingBasket className="h-5 w-5" aria-hidden="true" />} label="Pesanan Masuk" value={String(orders!.length)} hint="utk produk Anda" />
          <StatCard icon={<Wallet className="h-5 w-5" aria-hidden="true" />} label="Total Nilai Pesanan" value={rupiah(income)} hint="seluruh pesanan" />
        </div>
      )}

      {/* Aksi cepat */}
      <h2 className="mb-3 mt-8 text-lg font-bold">Aksi Cepat</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => onNavigate(a.key)}
            className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {a.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{a.title}</span>
              <span className="block text-xs text-muted-foreground">{a.desc}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Pesanan terbaru */}
      <h2 className="mb-3 mt-8 text-lg font-bold">Pesanan Terbaru untuk Produk Anda</h2>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Memuat pesanan…
            </div>
          ) : orders!.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Belum ada pesanan. Pasang produk Anda di Pasar Tani agar dibeli masyarakat.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {orders!.slice(0, 5).map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.productName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.customerName} · {o.quantity} unit · {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="font-semibold text-primary">{rupiah(o.total)}</span>
                  <Badge variant="secondary">{o.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ===================== DISPATCHER =====================
export function PanelView({ user, onNavigate, onUserUpdated }: {
  user: AuthUser;
  onNavigate: (v: "lahan" | "pasar" | "tanaman" | "akun" | "beranda") => void;
  onUserUpdated: (u: AuthUser) => void;
}) {
  if (user.role === "operator") return <OperatorPanel user={user} />;
  if (user.role === "superadmin") return <SuperadminPanel user={user} />;
  return <PetaniPanel user={user} onNavigate={onNavigate} />;
}

// util pemformatan tanggal bersama
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
