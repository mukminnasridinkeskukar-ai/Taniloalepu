"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck, Users, Clock3, Map, Package, ShoppingBasket, UserPlus, Eye, EyeOff, Search,
  CheckCircle2, XCircle, Trash2, KeyRound, Copy, Loader2, Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser, AccountRecord, Land, OrderRecord, Product } from "@/lib/agri-types";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/agri-types";
import { fmtDate } from "@/components/agri/panel-view";

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

const STATUS_VARIANT: Record<string, string> = {
  menunggu: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  aktif: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  ditolak: "bg-destructive/15 text-destructive border-destructive/30",
};

const ROLE_BADGE: Record<string, string> = {
  petani: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  operator: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  superadmin: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
};

const EMPTY_NEW = { username: "", password: "", name: "", role: "petani", phone: "", address: "" };

export function SuperadminPanel({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountRecord[] | null>(null);
  const [lands, setLands] = useState<Land[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);

  const [query, setQuery] = useState("");
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ ...EMPTY_NEW });
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AccountRecord | null>(null);
  const [pwTarget, setPwTarget] = useState<AccountRecord | null>(null);
  const [newPw, setNewPw] = useState("");

  const load = useCallback(async () => {
    try {
      const [rU, rL, rP, rO] = await Promise.all([
        fetch("/api/users"), fetch("/api/lands"), fetch("/api/products"), fetch("/api/orders"),
      ]);
      const [dU, dL, dP, dO] = await Promise.all([rU.json(), rL.json(), rP.json(), rO.json()]);
      setAccounts(Array.isArray(dU) ? dU : []);
      setLands(Array.isArray(dL) ? dL : []);
      setProducts(Array.isArray(dP) ? dP : []);
      setOrders(Array.isArray(dO) ? dO : []);
    } catch {
      toast({ title: "Gagal memuat data admin", variant: "destructive" });
      setAccounts((a) => a ?? []);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchUser(acc: AccountRecord, payload: Record<string, unknown>, msg: string) {
    setBusyId(acc.id);
    try {
      const res = await fetch(`/api/users/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memperbarui");
      toast({ title: msg });
      await load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal memperbarui", variant: "destructive" });
    } finally {
      setBusyId("");
    }
  }

  async function removeUser() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus");
      toast({ title: `Akun ${deleteTarget.username} dihapus` });
      await load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal menghapus", variant: "destructive" });
    } finally {
      setBusyId("");
      setDeleteTarget(null);
    }
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) {
      toast({ title: "Lengkapi nama, nama pengguna, dan kata sandi", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, username: newUser.username.toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat akun");
      toast({ title: `Akun ${newUser.username} berhasil dibuat & aktif` });
      setCreateOpen(false);
      setNewUser({ ...EMPTY_NEW });
      await load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal membuat akun", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function resetPassword() {
    if (!pwTarget) return;
    if (newPw.length < 6) {
      toast({ title: "Kata sandi baru minimal 6 karakter", variant: "destructive" });
      return;
    }
    await patchUser(pwTarget, { password: newPw }, `Kata sandi ${pwTarget.username} direset`);
    setPwTarget(null);
    setNewPw("");
  }

  const all = accounts ?? [];
  const pending = all.filter((a) => a.status === "menunggu");
  const filtered = query.trim()
    ? all.filter((a) =>
        [a.username, a.name, a.role, a.phone].some((v) => v.toLowerCase().includes(query.trim().toLowerCase()))
      )
    : all;

  const copyCredentials = async (a: AccountRecord) => {
    try {
      await navigator.clipboard.writeText(`Pengguna: ${a.username}\nSandi: ${a.password}`);
      toast({ title: "Kredensial disalin ke papan klip" });
    } catch {
      toast({ title: "Tidak dapat menyalin", variant: "destructive" });
    }
  };

  const stats = [
    { icon: <Users className="h-5 w-5" aria-hidden="true" />, label: "Total Pengguna", value: all.length },
    { icon: <Clock3 className="h-5 w-5" aria-hidden="true" />, label: "Menunggu Persetujuan", value: pending.length },
    { icon: <Map className="h-5 w-5" aria-hidden="true" />, label: "Lahan Terdaftar", value: lands?.length ?? "…" },
    { icon: <Package className="h-5 w-5" aria-hidden="true" />, label: "Produk Pasar Tani", value: products?.length ?? "…" },
    { icon: <ShoppingBasket className="h-5 w-5" aria-hidden="true" />, label: "Pesanan", value: orders?.length ?? "…" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Crown className="h-6 w-6 text-violet-500" aria-hidden="true" />
            Panel Admin Desa
          </h1>
          <p className="mt-1 text-muted-foreground">
            Akses penuh: kelola seluruh akun, lahan, produk, dan pesanan platform Tani Loa Lepu.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Buat Akun
        </Button>
      </div>

      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {s.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pengajuan menunggu */}
      {pending.length > 0 ? (
        <>
          <h2 className="mb-3 mt-8 text-lg font-bold">Pengajuan Akun Menunggu ({pending.length})</h2>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <ul className="space-y-3">
                {pending.map((a) => (
                  <li key={a.id} className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center">
                    <Avatar className="mx-auto h-10 w-10 sm:mx-0">
                      {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={`Foto ${a.name}`} /> : null}
                      <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials(a.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="font-semibold">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">@{a.username} · diajukan {fmtDate(a.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 justify-center gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === a.id}
                        onClick={() => patchUser(a, { status: "aktif" }, `Akun ${a.username} disetujui`)}
                        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === a.id}
                        onClick={() => patchUser(a, { status: "ditolak" }, `Pengajuan ${a.username} ditolak`)}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Tolak
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Semua pengguna */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Kelola Semua Pengguna</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pengguna…" className="pl-8" aria-label="Cari pengguna" />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {accounts === null ? (
            <div className="p-4"><Skeleton className="h-40 rounded-lg" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">Pengguna</TableHead>
                    <TableHead className="min-w-36">Nama Pengguna</TableHead>
                    <TableHead className="min-w-32">Kata Sandi</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={`Foto ${a.name}`} /> : null}
                            <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">{initials(a.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{a.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {a.phone || "—"} · {a._count ? `${a._count.lands} lahan · ${a._count.products} produk` : "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.username}</code></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{reveal[a.id] ? a.password : "••••••••"}</code>
                          <button
                            onClick={() => setReveal((r) => ({ ...r, [a.id]: !r[a.id] }))}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={reveal[a.id] ? `Sembunyikan sandi ${a.username}` : `Tampilkan sandi ${a.username}`}
                          >
                            {reveal[a.id] ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                          </button>
                          <button
                            onClick={() => copyCredentials(a)}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={`Salin kredensial ${a.username}`}
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.id === user.id ? (
                          <Badge variant="outline" className={ROLE_BADGE[a.role] ?? ""}>{ROLE_LABEL[a.role] ?? a.role}</Badge>
                        ) : (
                          <Select value={a.role} onValueChange={(role) => patchUser(a, { role }, `Peran ${a.username} → ${ROLE_LABEL[role]}`)}>
                            <SelectTrigger size="sm" className="w-32" aria-label={`Ubah peran ${a.username}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="petani">Petani</SelectItem>
                              <SelectItem value="operator">Operator</SelectItem>
                              <SelectItem value="superadmin">Admin Desa</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_VARIANT[a.status] ?? ""}>{STATUS_LABEL[a.status] ?? a.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === a.id}
                            onClick={() =>
                              patchUser(a, { status: a.status === "aktif" ? "menunggu" : "aktif" }, `Status ${a.username} diperbarui`)
                            }
                            aria-label={a.status === "aktif" ? `Nonaktifkan ${a.username}` : `Aktifkan ${a.username}`}
                          >
                            {a.status === "aktif" ? <UserXIcon /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setPwTarget(a); setNewPw(""); }} aria-label={`Reset sandi ${a.username}`}>
                            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                          {a.id !== user.id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busyId === a.id}
                              onClick={() => setDeleteTarget(a)}
                              className="text-destructive hover:text-destructive"
                              aria-label={`Hapus akun ${a.username}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pesanan terbaru (semua) */}
      <h2 className="mb-3 mt-8 text-lg font-bold">Semua Pesanan Pasar Tani</h2>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {orders === null ? (
            <div className="p-4"><Skeleton className="h-24 rounded-lg" /></div>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pesanan.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {orders.slice(0, 8).map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.productName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.customerName} · {o.quantity} unit · {fmtDate(o.createdAt)} · {o.phone}
                    </p>
                  </div>
                  <Badge variant="secondary">{o.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Dialog buat akun */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Akun Baru</DialogTitle>
            <DialogDescription>
              Akun langsung aktif setelah dibuat. Berikan kredensial kepada pengguna terkait.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createAccount} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nu-name">Nama Lengkap *</Label>
                <Input id="nu-name" value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nu-role">Peran</Label>
                <Select value={newUser.role} onValueChange={(role) => setNewUser((u) => ({ ...u, role }))}>
                  <SelectTrigger id="nu-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petani">Petani</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="superadmin">Admin Desa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nu-username">Nama Pengguna *</Label>
                <Input id="nu-username" value={newUser.username} onChange={(e) => setNewUser((u) => ({ ...u, username: e.target.value.toLowerCase() }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nu-password">Kata Sandi *</Label>
                <Input id="nu-password" type="text" value={newUser.password} onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))} required />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nu-phone">No. Telepon</Label>
                <Input id="nu-phone" type="tel" value={newUser.phone} onChange={(e) => setNewUser((u) => ({ ...u, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nu-address">Alamat / Dusun</Label>
                <Input id="nu-address" value={newUser.address} onChange={(e) => setNewUser((u) => ({ ...u, address: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
              <Button type="submit" disabled={creating} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                Buat Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog reset sandi */}
      <Dialog open={pwTarget !== null} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi</DialogTitle>
            <DialogDescription>
              Ganti kata sandi akun <code className="rounded bg-muted px-1 text-xs">{pwTarget?.username}</code>. Kata sandi baru
              minimal 6 karakter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rp-new">Kata Sandi Baru</Label>
            <Input id="rp-new" type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>Batal</Button>
            <Button onClick={resetPassword} className="bg-primary text-primary-foreground hover:bg-primary/90">Simpan Sandi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun {deleteTarget?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun akan dihapus permanen. Lahan dan produk milik akun ini tetap tersimpan tetapi kehilangan
              pemiliknya. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={removeUser}>
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function UserXIcon() {
  return <XCircle className="h-3.5 w-3.5" aria-hidden="true" />;
}
