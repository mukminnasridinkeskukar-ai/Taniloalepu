"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Map, Package, ShoppingBasket, PlusCircle, BookOpen, ArrowRight, Wallet, Loader2,
  Landmark, Banknote, Eye, BadgeCheck, Hourglass,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser, Land, OrderRecord, Product } from "@/lib/agri-types";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/agri-types";
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [proofOrder, setProofOrder] = useState<OrderRecord | null>(null);

  const fetchOrders = useCallback(async () => {
    const rO = await fetch("/api/orders");
    const dO = await rO.json();
    setOrders(Array.isArray(dO) ? dO : []);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rL, rP] = await Promise.all([fetch("/api/lands"), fetch("/api/products")]);
        const dL = await rL.json();
        const dP = await rP.json();
        if (!alive) return;
        setLands(Array.isArray(dL) ? dL : []);
        setProducts(Array.isArray(dP) ? dP.filter((p: Product) => p.ownerId === user.id) : []);
        await fetchOrders();
      } catch {
        if (alive) toast({ title: "Gagal memuat data panel", variant: "destructive" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [user.id, toast, fetchOrders]);

  async function verifyPayment(o: OrderRecord) {
    setBusyId(o.id);
    try {
      const res = await fetch(`/api/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "terverifikasi" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: "Pembayaran diverifikasi",
        description: `Pesanan ${o.productName} (${o.customerName}) ditandai lunas.`,
      });
      await fetchOrders();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal memverifikasi", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  const loading = lands === null || orders === null || products === null;
  const income = (orders ?? []).reduce((a, o) => a + o.total, 0);
  const planting = (lands ?? []).filter((l) => l.status === "tanam" || l.status === "perawatan").length;
  const pendingPayments = (orders ?? []).filter((o) => o.paymentStatus !== "terverifikasi").length;

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
          <StatCard icon={<ShoppingBasket className="h-5 w-5" aria-hidden="true" />} label="Pesanan Masuk" value={String(orders!.length)} hint={pendingPayments > 0 ? `${pendingPayments} belum terverifikasi` : "semua terverifikasi"} />
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
      <h2 className="mb-3 mt-8 text-lg font-bold">Pesanan untuk Produk Anda</h2>
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
              {orders!.slice(0, 10).map((o) => {
                const verified = o.paymentStatus === "terverifikasi";
                const isTransfer = o.paymentMethod === "transfer";
                return (
                  <li key={o.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{o.productName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {o.customerName} · {o.quantity} unit · {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · {o.phone}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">{rupiah(o.total)}</span>
                      <Badge variant="secondary">{o.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={verified ? "border-emerald-300 bg-emerald-50 text-emerald-800" : isTransfer ? "border-amber-300 bg-amber-50 text-amber-800" : "border-border bg-muted/50 text-muted-foreground"}
                      >
                        {isTransfer ? <Landmark className="mr-1 h-3 w-3" aria-hidden="true" /> : <Banknote className="mr-1 h-3 w-3" aria-hidden="true" />}
                        {PAYMENT_METHOD_LABEL[o.paymentMethod ?? "cod"] ?? o.paymentMethod}
                        {" · "}
                        {verified ? PAYMENT_STATUS_LABEL.terverifikasi : isTransfer ? PAYMENT_STATUS_LABEL.menunggu : "Bayar di tempat"}
                      </Badge>
                      {isTransfer && o.paymentProof && (
                        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setProofOrder(o)}>
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Lihat Bukti Transfer
                        </Button>
                      )}
                      {!verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 border-emerald-300 px-2 text-xs text-emerald-800 hover:bg-emerald-50"
                          disabled={busyId === o.id}
                          onClick={() => void verifyPayment(o)}
                        >
                          {busyId === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                          {isTransfer ? "Verifikasi Pembayaran" : "Tandai Lunas"}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Dialog bukti transfer */}
      <Dialog open={!!proofOrder} onOpenChange={(v) => !v && setProofOrder(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" aria-hidden="true" />
              Bukti Transfer — {proofOrder?.productName}
            </DialogTitle>
            <DialogDescription>
              Dari {proofOrder?.customerName} · {rupiah(proofOrder?.total ?? 0)} · {proofOrder?.bankName} {proofOrder?.bankAccountNumber}
            </DialogDescription>
          </DialogHeader>
          {proofOrder?.paymentProof ? (
            <img src={proofOrder.paymentProof} alt={`Bukti transfer dari ${proofOrder.customerName}`} className="w-full rounded-xl border" />
          ) : (
            <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Hourglass className="h-4 w-4" aria-hidden="true" /> Pembeli belum mengunggah bukti transfer.
            </p>
          )}
          <div className="flex justify-end gap-2">
            {proofOrder && proofOrder.paymentStatus !== "terverifikasi" && (
              <Button
                className="gap-2"
                disabled={busyId === proofOrder.id}
                onClick={() => {
                  const target = proofOrder;
                  setProofOrder(null);
                  void verifyPayment(target);
                }}
              >
                {busyId === proofOrder.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <BadgeCheck className="h-4 w-4" aria-hidden="true" />}
                Verifikasi Pembayaran
              </Button>
            )}
            {proofOrder && proofOrder.paymentStatus === "terverifikasi" && (
              <Badge className="gap-1 bg-emerald-600 text-white">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Terverifikasi
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
