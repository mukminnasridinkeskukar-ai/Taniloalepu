"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Loader2, ShoppingCart, Star, MapPin, Plus, Minus, Trash2, Store,
  PackageCheck, Truck, Leaf, X, Sprout, LogIn, Pencil, Landmark, Banknote,
  Navigation, MessageCircle, Upload, BadgeCheck,
} from "lucide-react";
import type { Product, AuthUser } from "@/lib/agri-types";
import {
  PRODUCT_CATEGORIES, rupiah, parseJsonArr, waLink, mapsLink, fmtCoord,
} from "@/lib/agri-types";
import { fileToDataUrl } from "@/lib/image-utils";
import { HERO_IMAGES, PRODUCT_PRESET_IMAGES } from "@/lib/agri-content";
import type { ViewKey } from "./header";

type CartItem = { productId: string; name: string; price: number; unit: string; qty: number; imageUrl: string; stock: number };

const EMPTY_SELL = {
  name: "", category: "sayuran", price: "", unit: "kg", stock: "", description: "",
  location: "Desa Loa Lepu", imageUrl: PRODUCT_PRESET_IMAGES[0], isOrganic: false,
};

export function MarketView({ user, onNavigate }: { user: AuthUser | null; onNavigate: (v: ViewKey) => void }) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("semua");
  const [sort, setSort] = useState("populer");

  const [detail, setDetail] = useState<Product | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ customerName: "", phone: "", address: "" });
  const [placing, setPlacing] = useState(false);

  // Pembayaran: COD / transfer bank + bukti transfer dari pembeli
  const [payMethod, setPayMethod] = useState<"cod" | "transfer">("cod");
  const [proofUrl, setProofUrl] = useState("");
  const [proofPicking, setProofPicking] = useState(false);
  const [details, setDetails] = useState<Record<string, Product>>({});

  // Kelola produk sendiri: ubah & hapus
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [delTarget, setDelTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [sellOpen, setSellOpen] = useState(false);
  const [sellForm, setSellForm] = useState({ ...EMPTY_SELL });
  const [selling, setSelling] = useState(false);

  const proofRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async (query: string, cat: string, sortKey: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (cat && cat !== "semua") params.set("category", cat);
      params.set("sort", sortKey);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void fetchProducts(q, category, sort), 250);
    return () => clearTimeout(t);
  }, [q, category, sort, fetchProducts]);

  // Saat dialog checkout dibuka: ambil detail tiap produk (info rekening & alamat penjual)
  useEffect(() => {
    if (!checkoutOpen || cart.length === 0) return;
    let alive = true;
    (async () => {
      const results = await Promise.all(
        cart.map((c) =>
          fetch(`/api/products/${c.productId}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      if (!alive) return;
      const map: Record<string, Product> = {};
      for (const d of results) {
        if (d && typeof d === "object" && "id" in d) map[(d as Product).id] = d as Product;
      }
      setDetails(map);
    })();
    return () => {
      alive = false;
    };
  }, [checkoutOpen, cart]);

  function addToCart(p: Product, quantity: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === p.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === p.id
            ? { ...c, qty: Math.min(c.qty + quantity, p.stock) }
            : c
        );
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, unit: p.unit, qty: quantity, imageUrl: p.imageUrl, stock: p.stock }];
    });
    toast({ title: "Ditambahkan ke keranjang", description: `${p.name} (${quantity} ${p.unit})` });
    setDetail(null);
  }

  const cartTotal = useMemo(() => cart.reduce((a, c) => a + c.price * c.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((a, c) => a + c.qty, 0), [cart]);

  // Kelompokkan item keranjang per penjual (untuk instruksi rekening transfer)
  const sellerGroups = useMemo(() => {
    const groups: { key: string; seller: string; bank: string; account: string; holder: string; total: number; phone: string }[] = [];
    for (const c of cart) {
      const d = details[c.productId];
      const seller = d?.farmerName ?? "Petani";
      const key = d?.sellerBankAccountNumber || `nonbank-${d?.farmerName ?? c.productId}`;
      const g = groups.find((x) => x.key === key);
      if (g) g.total += c.price * c.qty;
      else
        groups.push({
          key,
          seller,
          bank: d?.sellerBankName ?? "",
          account: d?.sellerBankAccountNumber ?? "",
          holder: d?.sellerBankAccountName ?? "",
          total: c.price * c.qty,
          phone: d?.sellerPhone ?? "",
        });
    }
    return groups;
  }, [cart, details]);

  async function pickProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Pilih berkas gambar (JPG/PNG)", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Ukuran foto maksimal 10 MB", variant: "destructive" });
      return;
    }
    setProofPicking(true);
    try {
      const dataUrl = await fileToDataUrl(file, { maxSide: 1000, quality: 0.72 });
      setProofUrl(dataUrl);
      toast({ title: "Bukti transfer siap dilampirkan" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal memproses foto", variant: "destructive" });
    } finally {
      setProofPicking(false);
    }
  }

  async function placeOrder() {
    if (!checkoutForm.customerName.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim()) {
      toast({ title: "Lengkapi nama, telepon, dan alamat", variant: "destructive" });
      return;
    }
    if (payMethod === "transfer" && !proofUrl) {
      toast({
        title: "Unggah bukti transfer terlebih dahulu",
        description: "Transfer sesuai total ke rekening petani, lalu unggah foto bukti transfernya.",
        variant: "destructive",
      });
      return;
    }
    setPlacing(true);
    try {
      // kirim satu pesanan per item (sederhana & andal) — rekening tiap penjual tersalin otomatis
      for (const item of cart) {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...checkoutForm,
            productId: item.productId,
            quantity: item.qty,
            paymentMethod: payMethod,
            paymentProof: payMethod === "transfer" ? proofUrl : "",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }
      toast({
        title: "Pesanan berhasil dibuat!",
        description:
          payMethod === "transfer"
            ? "Bukti transfer Anda terlampir — petani akan memverifikasi pembayaran lalu menghubungi Anda."
            : "Bayar tunai saat pesanan diterima. Petani akan menghubungi Anda untuk konfirmasi pengiriman.",
      });
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setCheckoutForm({ customerName: "", phone: "", address: "" });
      setPayMethod("cod");
      setProofUrl("");
      setDetails({});
      void fetchProducts(q, category, sort);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal memesan", variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  }

  function openSell() {
    setEditTarget(null);
    setSellForm({ ...EMPTY_SELL });
    setSellOpen(true);
  }

  function openEdit(p: Product) {
    setEditTarget(p);
    setSellForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      unit: p.unit,
      stock: String(p.stock),
      description: p.description,
      location: p.location,
      imageUrl: p.imageUrl,
      isOrganic: p.isOrganic,
    });
    setSellOpen(true);
  }

  async function sellProduct() {
    if (!user) {
      toast({ title: "Silakan masuk terlebih dahulu", description: "Hanya petani terdaftar yang dapat memasang produk." });
      onNavigate("masuk");
      return;
    }
    if (!sellForm.name.trim() || !sellForm.price || !sellForm.location.trim()) {
      toast({ title: "Lengkapi nama produk, harga, dan lokasi", variant: "destructive" });
      return;
    }
    setSelling(true);
    try {
      const base = {
        ...sellForm,
        price: Number(sellForm.price),
        stock: Math.max(0, Math.floor(Number(sellForm.stock || (editTarget ? 0 : 1)))),
        gallery: [],
      };
      const res = editTarget
        ? await fetch(`/api/products/${editTarget.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(base),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...base, stock: base.stock || 1 }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: editTarget ? "Produk berhasil diperbarui!" : "Produk berhasil dipasang!",
        description: editTarget ? `${sellForm.name} telah diperbarui di Pasar Tani.` : `${sellForm.name} kini tampil di Pasar Tani.`,
      });
      setSellOpen(false);
      setEditTarget(null);
      setSellForm({ ...EMPTY_SELL });
      void fetchProducts(q, category, sort);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal menyimpan produk", variant: "destructive" });
    } finally {
      setSelling(false);
    }
  }

  async function deleteProduct() {
    if (!delTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${delTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Produk dihapus", description: data.message ?? `${delTarget.name} ditarik dari Pasar Tani.` });
      if (detail?.id === delTarget.id) setDetail(null);
      setDelTarget(null);
      void fetchProducts(q, category, sort);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal menghapus produk", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const isOwn = (p: Product) => !!user && (p.ownerId === user.id || user.role === "superadmin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl">
        <img src={HERO_IMAGES.sawah2} alt="Hasil panen petani" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[oklch(0.2_0.05_150/0.82)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-6 px-6 py-10 sm:px-10 sm:py-14">
          <div className="max-w-xl">
            <Badge className="mb-3 border-emerald-300/40 bg-emerald-400/20 text-emerald-50 backdrop-blur">
              Belanja Langsung dari Petani
            </Badge>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Pasar Tani</h1>
            <p className="mt-2 text-emerald-50/90">
              Sayur, buah, beras, dan hasil tani lainnya dipetik pagi, dikirim siang.
              Setiap pembelian langsung menghidupkan ekonomi desa.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user && user.role !== "operator" ? (
              <Button variant="outline" onClick={openSell} className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Store className="mr-2 h-4 w-4" aria-hidden="true" /> Jual Hasil Panen
              </Button>
            ) : !user ? (
              <Button variant="outline" onClick={() => onNavigate("masuk")} className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <LogIn className="mr-2 h-4 w-4" aria-hidden="true" /> Masuk untuk Jual
              </Button>
            ) : null}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button className="relative bg-emerald-500 text-white hover:bg-emerald-400">
                  <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                  Keranjang
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-amber-950">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <CartSheetContent
                cart={cart}
                cartTotal={cartTotal}
                setCart={setCart}
                onCheckout={() => setCheckoutOpen(true)}
              />
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search & filter */}
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk, petani, atau lokasi…"
            className="h-11 pl-10"
            aria-label="Cari produk"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRODUCT_CATEGORIES).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setCategory(k)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === k
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-foreground/75 hover:bg-accent"
              }`}
              aria-pressed={category === k}
            >
              {label}
            </button>
          ))}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full lg:w-44" aria-label="Urutkan produk">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="populer">Paling populer</SelectItem>
            <SelectItem value="terbaru">Terbaru</SelectItem>
            <SelectItem value="termurah">Harga terendah</SelectItem>
            <SelectItem value="termahal">Harga tertinggi</SelectItem>
            <SelectItem value="rating">Rating tertinggi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid produk */}
      {loading ? (
        <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat produk…
        </div>
      ) : products.length === 0 ? (
        <Card className="mx-auto mt-12 max-w-md p-10 text-center">
          <PackageCheck className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 font-medium">Produk tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">Coba kata kunci lain atau pilih kategori “Semua”.</p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Card
              key={p.id}
              className="group flex cursor-pointer flex-col overflow-hidden pt-0 transition-all hover:-translate-y-1 hover:shadow-lg"
              onClick={() => {
                setDetail(p);
                setGalleryIdx(0);
                setQty(1);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setDetail(p);
                  setGalleryIdx(0);
                  setQty(1);
                }
              }}
              aria-label={`Lihat produk ${p.name}`}
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={p.imageUrl || PRODUCT_PRESET_IMAGES[0]}
                  alt={`Produk ${p.name}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {isOwn(p) && (
                  <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(p);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-md transition-all hover:scale-110 hover:bg-white"
                      aria-label={`Ubah produk ${p.name}`}
                      title="Ubah produk"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDelTarget(p);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md transition-all hover:scale-110 hover:bg-white"
                      aria-label={`Hapus produk ${p.name}`}
                      title="Hapus produk"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {p.isOrganic && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Leaf className="h-3 w-3" aria-hidden="true" /> Organik
                  </span>
                )}
                {p.stock === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black">Stok Habis</span>
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</h3>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> {p.rating.toFixed(1)}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {p.location} · {p.farmerName}
                </p>
                <div className="mt-auto pt-2">
                  <p className="text-lg font-bold text-primary">
                    {rupiah(p.price)}
                    <span className="text-xs font-normal text-muted-foreground"> / {p.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Terjual {p.sold} · Stok {p.stock}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ===== Dialog detail produk ===== */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-2xl" aria-describedby={undefined}>
          {detail && (() => {
            const gallery = [...new Set([detail.imageUrl, ...parseJsonArr<string>(detail.gallery)].filter(Boolean))];
            const shown = gallery[Math.min(galleryIdx, gallery.length - 1)];
            const canBuy = detail.stock > 0 && qty <= detail.stock;
            return (
              <div>
                <DialogTitle className="sr-only">Produk {detail.name}</DialogTitle>
                <div className="relative">
                  <img src={shown} alt={`Galeri ${detail.name}`} className="h-60 w-full object-cover sm:h-72" />
                  <Button
                    variant="ghost" size="icon"
                    className="absolute right-3 top-3 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                    onClick={() => setDetail(null)} aria-label="Tutup detail produk"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {gallery.length > 1 && (
                  <div className="flex gap-2 px-5 pt-4">
                    {gallery.map((g, i) => (
                      <button
                        key={`${g}-${i}`}
                        onClick={() => setGalleryIdx(i)}
                        className={`h-14 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                          i === galleryIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        aria-label={`Lihat foto ${i + 1}`}
                      >
                        <img src={g} alt={`Thumbnail ${detail.name} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-4 p-5 sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-2xl font-bold">{detail.name}</h2>
                      <span className="flex items-center gap-1 font-medium text-amber-600">
                        <Star className="h-4 w-4 fill-current" aria-hidden="true" /> {detail.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {detail.farmerName} · {detail.location}
                    </p>
                  </div>

                  {/* Alamat lengkap & koordinat GPS petani penjual */}
                  {(detail.sellerAddress || detail.sellerLat != null) && (
                    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/40 p-3 text-sm">
                      <p className="flex items-start gap-2">
                        <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>
                          <span className="font-medium">Alamat petani:</span>{" "}
                          {detail.sellerAddress || detail.location}
                        </span>
                      </p>
                      {detail.sellerLat != null && detail.sellerLng != null && (
                        <p className="flex items-start gap-2">
                          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <span>
                            <span className="font-medium">Titik GPS:</span> {fmtCoord(detail.sellerLat)}, {fmtCoord(detail.sellerLng)}
                            {mapsLink(detail.sellerLat, detail.sellerLng) && (
                              <>
                                {" "}·{" "}
                                <a
                                  href={mapsLink(detail.sellerLat, detail.sellerLng)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-primary underline underline-offset-2"
                                >
                                  Buka peta
                                </a>
                              </>
                            )}
                          </span>
                        </p>
                      )}
                      {detail.sellerPhone && waLink(detail.sellerPhone, `Halo, saya tertarik dengan produk "${detail.name}" di Pasar Tani.`) && (
                        <p className="flex items-start gap-2">
                          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <a
                            href={waLink(detail.sellerPhone, `Halo, saya tertarik dengan produk "${detail.name}" di Pasar Tani.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary underline underline-offset-2"
                          >
                            Hubungi petani via WhatsApp
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {detail.isOrganic && (
                      <Badge className="bg-emerald-600 text-white"><Leaf className="mr-1 h-3 w-3" aria-hidden="true" />Organik</Badge>
                    )}
                    <Badge variant="secondary">Terjual {detail.sold}</Badge>
                    <Badge variant={detail.stock > 0 ? "secondary" : "destructive"}>
                      Stok {detail.stock} {detail.unit}
                    </Badge>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>

                  <Separator />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-2xl font-bold text-primary">
                      {rupiah(detail.price)}
                      <span className="text-sm font-normal text-muted-foreground"> / {detail.unit}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="icon"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        aria-label="Kurangi jumlah"
                        disabled={qty <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold" aria-live="polite">{qty}</span>
                      <Button
                        variant="outline" size="icon"
                        onClick={() => setQty(Math.min(detail.stock, qty + 1))}
                        aria-label="Tambah jumlah"
                        disabled={qty >= detail.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1"
                      disabled={!canBuy}
                      onClick={() => addToCart(detail, qty)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                      {detail.stock === 0 ? "Stok Habis" : "Tambah ke Keranjang"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      disabled={!canBuy}
                      onClick={() => {
                        addToCart(detail, qty);
                        setDetail(null);
                        setCartOpen(true);
                      }}
                    >
                      Beli Sekarang
                    </Button>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                    Pengiriman diatur langsung bersama petani setelah pesanan dikonfirmasi.
                  </p>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== Dialog checkout ===== */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Data Pengiriman</DialogTitle>
            <DialogDescription>
              Petani akan menghubungi nomor Anda untuk konfirmasi pesanan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="co-name">Nama lengkap *</Label>
              <Input id="co-name" placeholder="cth: Budi Santoso" value={checkoutForm.customerName}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="co-phone">Nomor WhatsApp / telepon *</Label>
              <Input id="co-phone" type="tel" placeholder="cth: 0812xxxxxxx" value={checkoutForm.phone}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="co-addr">Alamat lengkap *</Label>
              <Textarea id="co-addr" rows={3} placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota"
                value={checkoutForm.address}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })} />
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Metode pembayaran</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPayMethod("cod")}
                  className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                    payMethod === "cod" ? "border-primary bg-primary/5 ring-1 ring-ring/30" : "border-border bg-card hover:border-primary/40"
                  }`}
                  aria-pressed={payMethod === "cod"}
                >
                  <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold">Tunai (COD)</span>
                    <span className="block text-xs text-muted-foreground">Bayar tunai saat pesanan tiba</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("transfer")}
                  className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                    payMethod === "transfer" ? "border-primary bg-primary/5 ring-1 ring-ring/30" : "border-border bg-card hover:border-primary/40"
                  }`}
                  aria-pressed={payMethod === "transfer"}
                >
                  <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold">Transfer Bank</span>
                    <span className="block text-xs text-muted-foreground">Transfer ke rekening petani + unggah bukti</span>
                  </span>
                </button>
              </div>
            </div>

            {payMethod === "transfer" && (
              <div className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-3.5">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Landmark className="h-4 w-4 text-primary" aria-hidden="true" /> Rekening tujuan transfer
                </p>
                <div className="space-y-2">
                  {sellerGroups.length === 0 && (
                    <p className="text-xs text-muted-foreground">Memuat rekening petani…</p>
                  )}
                  {sellerGroups.map((g) => (
                    <div key={g.key} className="rounded-lg border border-border/60 bg-card p-2.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <p className="font-medium">{g.seller}</p>
                        <p className="font-semibold text-primary">{rupiah(g.total)}</p>
                      </div>
                      {g.bank && g.account ? (
                        <p className="mt-0.5 text-muted-foreground">
                          {g.bank} · <span className="font-mono font-medium text-foreground">{g.account}</span> · a.n. {g.holder || g.seller}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-amber-600">
                          Rekening belum diatur petani ini — silakan hubungi petani untuk koordinasi pembayaran.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="co-proof">Bukti transfer *</Label>
                  <input ref={proofRef} id="co-proof" type="file" accept="image/*" className="hidden" onChange={pickProof} aria-label="Unggah bukti transfer" />
                  {proofUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={proofUrl} alt="Pratinjau bukti transfer" className="h-20 w-20 rounded-lg border object-cover" />
                      <div className="flex flex-col gap-1.5">
                        <Badge className="w-fit gap-1 bg-emerald-600 text-white">
                          <BadgeCheck className="h-3 w-3" aria-hidden="true" /> Bukti siap dilampirkan
                        </Badge>
                        <Button type="button" variant="outline" size="sm" onClick={() => proofRef.current?.click()} disabled={proofPicking}>
                          {proofPicking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />} Ganti foto
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => proofRef.current?.click()} disabled={proofPicking}>
                      {proofPicking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Unggah foto bukti transfer
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Transfer sesuai total ke rekening petani di atas, lalu unggah foto struk / tangkapan layar m-banking Anda. Bukti akan diverifikasi petani.
                  </p>
                </div>
              </div>
            )}

            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Ringkasan pesanan</p>
              {cart.map((c) => (
                <div key={c.productId} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{c.name} × {c.qty} {c.unit}</span>
                  <span className="font-medium">{rupiah(c.price * c.qty)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{rupiah(cartTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Batal</Button>
            <Button onClick={placeOrder} disabled={placing || cart.length === 0} className="gap-2">
              {placing && <Loader2 className="h-4 w-4 animate-spin" />}
              Buat Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog jual / ubah produk ===== */}
      <Dialog open={sellOpen} onOpenChange={(v) => { setSellOpen(v); if (!v) setEditTarget(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" aria-hidden="true" />
              {editTarget ? "Ubah Produk Hasil Panen" : "Jual Hasil Panen Anda"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Perbarui informasi produk Anda — perubahan langsung tampil di Pasar Tani."
                : "Pasang produk Anda di Pasar Tani — masyarakat langsung bisa melihat dan memesan."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="sp-name">Nama produk *</Label>
              <Input id="sp-name" placeholder="cth: Tomat Segar Panen Harian" value={sellForm.name}
                onChange={(e) => setSellForm({ ...sellForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="sp-price">Harga (Rp) *</Label>
                <Input id="sp-price" type="number" min="100" placeholder="cth: 12000" value={sellForm.price}
                  onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Satuan</Label>
                <Select value={sellForm.unit} onValueChange={(v) => setSellForm({ ...sellForm, unit: v })}>
                  <SelectTrigger aria-label="Satuan jual"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["kg", "ikat", "pack", "paket", "karung", "sisir", "botol"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sp-stock">Stok *</Label>
                <Input id="sp-stock" type="number" min="1" placeholder="cth: 50" value={sellForm.stock}
                  onChange={(e) => setSellForm({ ...sellForm, stock: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Kategori</Label>
              <Select value={sellForm.category} onValueChange={(v) => setSellForm({ ...sellForm, category: v })}>
                <SelectTrigger aria-label="Kategori produk"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_CATEGORIES).filter(([k]) => k !== "semua").map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sp-loc">Lokasi *</Label>
              <Input id="sp-loc" placeholder="cth: Desa Loa Lepu, Tenggarong Seberang" value={sellForm.location}
                onChange={(e) => setSellForm({ ...sellForm, location: e.target.value })} />
              <p className="text-xs text-muted-foreground">
                Produk tercatat atas nama akun Anda: <span className="font-medium text-foreground">{user?.name}</span>
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sp-desc">Deskripsi produk</Label>
              <Textarea id="sp-desc" rows={3} placeholder="Ceritakan keunggulan produk Anda: cara panen, kualitas, kelebihan…"
                value={sellForm.description}
                onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Pilih foto produk</Label>
              <div className="grid grid-cols-5 gap-2">
                {PRODUCT_PRESET_IMAGES.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSellForm({ ...sellForm, imageUrl: url })}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      sellForm.imageUrl === url ? "border-primary ring-2 ring-ring/40" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-label="Pilih foto produk"
                  >
                    <img src={url} alt="Opsi foto produk" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sp-organic"
                checked={sellForm.isOrganic}
                onCheckedChange={(v) => setSellForm({ ...sellForm, isOrganic: v === true })}
              />
              <Label htmlFor="sp-organic" className="text-sm font-normal">
                Produk ini ditanam secara organik
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSellOpen(false); setEditTarget(null); }}>Batal</Button>
            <Button onClick={sellProduct} disabled={selling} className="gap-2">
              {selling && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? "Simpan Perubahan" : "Pasang di Pasar Tani"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Konfirmasi hapus produk ===== */}
      <AlertDialog open={!!delTarget} onOpenChange={(v) => !v && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk <span className="font-semibold text-foreground">{delTarget?.name}</span> akan ditarik dari Pasar Tani.
              Riwayat pesanan yang sudah masuk tetap tersimpan. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteProduct();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CartSheetContent({
  cart,
  cartTotal,
  setCart,
  onCheckout,
}: {
  cart: CartItem[];
  cartTotal: number;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckout: () => void;
}) {
  return (
    <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
      <SheetHeader className="border-b border-border/70 px-4 py-4">
        <SheetTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" aria-hidden="true" />
          Keranjang ({cart.length} produk)
        </SheetTitle>
      </SheetHeader>

      {cart.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="font-medium">Keranjang masih kosong</p>
          <p className="text-sm text-muted-foreground">Yuk lihat-lihat hasil panen segar petani!</p>
        </div>
      ) : (
        <>
          <div className="nice-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {cart.map((c) => (
              <div key={c.productId} className="flex gap-3 rounded-xl border border-border/70 p-3">
                <img src={c.imageUrl || PRODUCT_PRESET_IMAGES[0]} alt={c.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-sm font-bold text-primary">{rupiah(c.price)} <span className="text-xs font-normal text-muted-foreground">/ {c.unit}</span></p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => setCart((prev) => prev.map((x) => x.productId === c.productId ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                        aria-label={`Kurangi ${c.name}`}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{c.qty}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => setCart((prev) => prev.map((x) => x.productId === c.productId ? { ...x, qty: Math.min(x.stock, x.qty + 1) } : x))}
                        aria-label={`Tambah ${c.name}`}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setCart((prev) => prev.filter((x) => x.productId !== c.productId))}
                      aria-label={`Hapus ${c.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{rupiah(cartTotal)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={onCheckout}>
              Lanjut ke Pengiriman
            </Button>
          </div>
        </>
      )}
    </SheetContent>
  );
}
