"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  UserCheck, UserX, Users, Clock3, Eye, EyeOff, Search, CheckCircle2, XCircle, KeyRound, Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser, AccountRecord } from "@/lib/agri-types";
import { STATUS_LABEL } from "@/lib/agri-types";
import { fmtDate } from "@/components/agri/panel-view";

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

const STATUS_VARIANT: Record<string, string> = {
  menunggu: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  aktif: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  ditolak: "bg-destructive/15 text-destructive border-destructive/30",
};

export function OperatorPanel({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [rejectTarget, setRejectTarget] = useState<AccountRecord | null>(null);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Gagal memuat daftar akun", variant: "destructive" });
      setAccounts([]);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(acc: AccountRecord, status: "aktif" | "ditolak") {
    setBusyId(acc.id);
    try {
      const res = await fetch(`/api/users/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memproses");
      toast({
        title: status === "aktif" ? `Akun ${acc.username} disetujui` : `Pengajuan ${acc.username} ditolak`,
      });
      await load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Gagal memproses", variant: "destructive" });
    } finally {
      setBusyId("");
      setRejectTarget(null);
    }
  }

  const all = accounts ?? [];
  const pending = all.filter((a) => a.status === "menunggu");
  const active = all.filter((a) => a.status === "aktif");
  const filtered = query.trim()
    ? all.filter((a) =>
        [a.username, a.name, a.phone].some((v) => v.toLowerCase().includes(query.trim().toLowerCase()))
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Panel Operator</h1>
        <p className="mt-1 text-muted-foreground">
          Setujui pengajuan akun petani dan bantu pemulihan akun warga Desa Loa Lepu.
        </p>
      </div>

      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Menunggu Persetujuan</p>
              <p className="text-lg font-bold">{pending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Petani Aktif</p>
              <p className="text-lg font-bold">{active.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total Akun Petani</p>
              <p className="text-lg font-bold">{all.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pengajuan masuk */}
      <h2 className="mb-3 mt-8 text-lg font-bold">Pengajuan Akun Masuk</h2>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          {accounts === null ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ) : pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada pengajuan baru. Semua permintaan akun sudah diproses.
            </p>
          ) : (
            <ul className="space-y-3">
              {pending.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center">
                  <Avatar className="mx-auto h-10 w-10 sm:mx-0">
                    {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={`Foto ${a.name}`} /> : null}
                    <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                      {initials(a.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="font-semibold">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{a.username} · diajukan {fmtDate(a.createdAt)}
                      {a.phone ? ` · ${a.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 justify-center gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === a.id}
                      onClick={() => decide(a, "aktif")}
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      {busyId === a.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      )}
                      Setujui
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => setRejectTarget(a)} className="gap-1.5 text-destructive hover:text-destructive">
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      Tolak
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Daftar akun petani + kredensial */}
      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Data Akun Petani</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama / pengguna…"
            className="pl-8"
            aria-label="Cari akun petani"
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {accounts === null ? (
            <div className="p-4">
              <Skeleton className="h-40 rounded-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada akun yang cocok dengan pencarian.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">Petani</TableHead>
                    <TableHead className="min-w-36">Nama Pengguna</TableHead>
                    <TableHead className="min-w-32">Kata Sandi</TableHead>
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
                            <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                              {initials(a.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{a.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {a.phone || "—"} · daftar {fmtDate(a.createdAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.username}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {reveal[a.id] ? a.password : "••••••••"}
                          </code>
                          <button
                            onClick={() => setReveal((r) => ({ ...r, [a.id]: !r[a.id] }))}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={reveal[a.id] ? `Sembunyikan sandi ${a.username}` : `Tampilkan sandi ${a.username}`}
                          >
                            {reveal[a.id] ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_VARIANT[a.status] ?? ""}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => copyCredentials(a)} aria-label={`Salin kredensial ${a.username}`}>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
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

      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Kredensial akun hanya untuk membantu pemulihan akun petani. Jangan dibagikan ke pihak lain.
      </p>

      {/* Konfirmasi tolak */}
      <AlertDialog open={rejectTarget !== null} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak pengajuan akun ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengajuan dari {rejectTarget?.name} (@{rejectTarget?.username}) akan ditandai ditolak dan tidak dapat
              masuk ke platform. Tindakan ini dapat dipulihkan oleh admin desa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => rejectTarget && decide(rejectTarget, "ditolak")}
            >
              <UserX className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Tolak Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
