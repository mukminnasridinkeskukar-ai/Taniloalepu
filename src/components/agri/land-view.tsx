"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, MapPin, Ruler, Leaf, NotebookPen, Loader2, Trash2, ChevronDown, ClipboardCheck, History, X,
} from "lucide-react";
import type { Land, Activity } from "@/lib/agri-types";
import { LAND_STATUS, SOIL_TYPES, parseJsonArr } from "@/lib/agri-types";
import { LAND_PRESET_IMAGES } from "@/lib/agri-content";

const PREP_CHECKLIST: { id: string; label: string }[] = [
  { id: "lahan", label: "Survei & analisis lahan selesai" },
  { id: "olahan", label: "Tanah dibajak & digaru" },
  { id: "irigasi", label: "Irigasi & drainase siap" },
  { id: "pupuk", label: "Pupuk dasar diaplikasikan" },
  { id: "benih", label: "Benih/bibit unggul disiapkan" },
  { id: "tanam", label: "Penanaman dilakukan" },
];

const EMPTY_FORM = {
  name: "", location: "", area: "", areaUnit: "m2", soilType: "alluvial",
  status: "persiapan", plannedCrop: "", notes: "", imageUrl: LAND_PRESET_IMAGES[0],
};

export function LandView({ onGoPrepare }: { onGoPrepare: () => void }) {
  const { toast } = useToast();
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Land | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Land | null>(null);
  const [actForm, setActForm] = useState({ title: "", note: "" });
  const [notesDraft, setNotesDraft] = useState("");

  const fetchLands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lands");
      const data = await res.json();
      setLands(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Gagal memuat lahan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchLands();
  }, [fetchLands]);

  async function addLand() {
    if (!form.name.trim() || !form.location.trim() || !form.area) {
      toast({ title: "Lengkapi nama, lokasi, dan luas lahan", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/lands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, area: Number(form.area) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Lahan berhasil didaftarkan!", description: `${form.name} siap dikelola.` });
      setAddOpen(false);
      setForm({ ...EMPTY_FORM });
      void fetchLands();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function updateLand(id: string, payload: Record<string, unknown>, okMsg?: string) {
    try {
      const res = await fetch(`/api/lands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (okMsg) toast({ title: okMsg });
      void fetchLands();
      if (detail?.id === id) openDetail({ ...detail, ...data });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal memperbarui", variant: "destructive" });
    }
  }

  async function openDetail(land: Land) {
    setDetail(land);
    setNotesDraft(land.notes ?? "");
    try {
      const res = await fetch(`/api/lands/${land.id}/activities`);
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      setActivities([]);
    }
  }

  async function addActivity() {
    if (!detail || !actForm.title.trim()) return;
    try {
      await fetch(`/api/lands/${detail.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actForm),
      });
      setActForm({ title: "", note: "" });
      const res = await fetch(`/api/lands/${detail.id}/activities`);
      setActivities(await res.json());
      toast({ title: "Aktivitas dicatat" });
    } catch {
      toast({ title: "Gagal mencatat aktivitas", variant: "destructive" });
    }
  }

  async function removeLand() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/lands/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: `Lahan "${deleteTarget.name}" dihapus` });
      setDeleteTarget(null);
      if (detail?.id === deleteTarget.id) setDetail(null);
      void fetchLands();
    } catch {
      toast({ title: "Gagal menghapus lahan", variant: "destructive" });
    }
  }

  const totalArea = useMemo(
    () => lands.reduce((a, l) => a + l.area, 0),
    [lands]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2">Manajemen Lahan</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Kelola Lahan Anda</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Daftarkan setiap petakan lahan, pantau statusnya, dan catat aktivitas harian.
            Semua riwayat tersimpan rapi agar mudah dievaluasi saat musim panen.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Daftarkan Lahan
        </Button>
      </div>

      {/* Ringkasan */}
      {!loading && lands.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total lahan", value: String(lands.length) },
            { label: "Total luas", value: `${totalArea.toLocaleString("id-ID")} m²` },
            { label: "Sedang ditanam", value: String(lands.filter((l) => l.status === "tanam" || l.status === "perawatan").length) },
          ].map((s) => (
            <Card key={s.label} className="p-4 sm:p-5">
              <p className="text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              <p className="mt-1 text-lg font-bold sm:text-2xl">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Daftar lahan */}
      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat lahan…
        </div>
      ) : lands.length === 0 ? (
        <Card className="mt-10 flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
            <MapPin className="h-7 w-7" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-semibold">Belum ada lahan terdaftar</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Mulai dengan mendaftarkan petakan lahan pertama Anda. Setelah terdaftar, Anda bisa
            mengikuti checklist persiapan dan mencatat aktivitas tanam.
          </p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" /> Daftarkan Lahan Pertama
          </Button>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lands.map((land) => {
            const steps = parseJsonArr<string>(land.completedSteps);
            const progress = (steps.length / PREP_CHECKLIST.length) * 100;
            const st = LAND_STATUS[land.status] ?? LAND_STATUS.persiapan;
            return (
              <Card key={land.id} className="group overflow-hidden pt-0 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={land.imageUrl || LAND_PRESET_IMAGES[0]}
                    alt={`Lahan ${land.name}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div>
                    <h3 className="font-semibold">{land.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {land.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                      {land.area.toLocaleString("id-ID")} {land.areaUnit}
                    </span>
                    {land.plannedCrop && (
                      <span className="flex items-center gap-1">
                        <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                        {land.plannedCrop}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progres persiapan</span>
                      <span>{steps.length}/{PREP_CHECKLIST.length}</span>
                    </div>
                    <Progress value={progress} aria-label={`Progres ${land.name}`} />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => openDetail(land)}>
                      Detail & Kelola
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" aria-label="Ubah status lahan">
                          Status <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(LAND_STATUS).map(([k, v]) => (
                          <DropdownMenuItem
                            key={k}
                            onClick={() => updateLand(land.id, { status: k }, `Status diubah ke "${v.label}"`)}
                          >
                            {v.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(land)}
                      aria-label={`Hapus ${land.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CTA ke panduan */}
      <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-accent/50 p-6 sm:flex-row">
        <div>
          <h3 className="font-semibold">Butuh panduan menyiapkan lahan?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ikuti 6 langkah persiapan bergambar — dari survei tanah sampai pembenihan.
          </p>
        </div>
        <Button variant="outline" onClick={onGoPrepare} className="shrink-0 border-primary/40 text-primary hover:bg-accent">
          Buka Panduan Siapkan Lahan
        </Button>
      </div>

      {/* ===== Dialog: tambah lahan ===== */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Daftarkan Lahan Baru</DialogTitle>
            <DialogDescription>
              Isi data lahan Anda. Foto membantu mengenali lahan dengan cepat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="land-name">Nama lahan *</Label>
              <Input id="land-name" placeholder="cth: Sawah Utama" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="land-loc">Lokasi *</Label>
              <Input id="land-loc" placeholder="cth: Desa Loa Lepu, Tenggarong Seberang" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="land-area">Luas *</Label>
                <Input id="land-area" type="number" min="1" placeholder="cth: 2500" value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Satuan</Label>
                <Select value={form.areaUnit} onValueChange={(v) => setForm({ ...form, areaUnit: v })}>
                  <SelectTrigger aria-label="Satuan luas"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m2">m²</SelectItem>
                    <SelectItem value="ha">hektar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Jenis tanah</Label>
                <Select value={form.soilType} onValueChange={(v) => setForm({ ...form, soilType: v })}>
                  <SelectTrigger aria-label="Jenis tanah"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOIL_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status awal</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger aria-label="Status lahan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LAND_STATUS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="land-crop">Rencana tanaman</Label>
              <Input id="land-crop" placeholder="cth: Padi (Ciherang)" value={form.plannedCrop}
                onChange={(e) => setForm({ ...form, plannedCrop: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="land-notes">Catatan</Label>
              <Textarea id="land-notes" rows={2} placeholder="cth: irigasi dari bendung sebelah timur…"
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Pilih foto lahan</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {LAND_PRESET_IMAGES.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: url })}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      form.imageUrl === url ? "border-primary ring-2 ring-ring/40" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Pilih foto ${form.imageUrl === url ? "(terpilih)" : ""}`}
                  >
                    <img src={url} alt="Opsi foto lahan" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={addLand} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Lahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: detail lahan ===== */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-2xl">
          {detail && (() => {
            const steps = parseJsonArr<string>(detail.completedSteps);
            const st = LAND_STATUS[detail.status] ?? LAND_STATUS.persiapan;
            return (
              <div>
                <div className="relative h-48 sm:h-56">
                  <img src={detail.imageUrl || LAND_PRESET_IMAGES[0]} alt={`Lahan ${detail.name}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <Button
                    variant="ghost" size="icon"
                    className="absolute right-3 top-3 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                    onClick={() => setDetail(null)} aria-label="Tutup detail"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-4 left-5 right-5">
                    <span className={`mb-2 inline-block rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur ${st.color}`}>
                      {st.label}
                    </span>
                    <h2 className="text-2xl font-bold text-white">{detail.name}</h2>
                    <p className="flex items-center gap-1 text-sm text-white/85">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {detail.location}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    {[
                      ["Luas", `${detail.area.toLocaleString("id-ID")} ${detail.areaUnit}`],
                      ["Jenis tanah", SOIL_TYPES[detail.soilType] ?? detail.soilType],
                      ["Rencana tanam", detail.plannedCrop || "—"],
                      ["Status", st.label],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">{k}</p>
                        <p className="mt-0.5 font-medium">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Checklist */}
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                      Checklist Persiapan
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Klik untuk menandai langkah yang sudah selesai.
                    </p>
                    <div className="mt-3 space-y-2">
                      {PREP_CHECKLIST.map((c) => {
                        const done = steps.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() =>
                              updateLand(
                                detail.id,
                                { completedSteps: done ? steps.filter((s) => s !== c.id) : [...steps, c.id] }
                              )
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                              done ? "border-primary/40 bg-accent/60" : "border-border hover:bg-muted/50"
                            }`}
                            aria-pressed={done}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                            }`}>
                              {done && (
                                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            <span className={done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Catatan */}
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <NotebookPen className="h-4 w-4 text-primary" aria-hidden="true" />
                      Catatan Lahan
                    </h3>
                    <Textarea
                      rows={2}
                      className="mt-2"
                      placeholder="Tulis catatan: kondisi cuaca, jadwal pupuk, dll."
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                    />
                    <Button
                      size="sm" variant="secondary" className="mt-2"
                      onClick={() => updateLand(detail.id, { notes: notesDraft }, "Catatan disimpan")}
                    >
                      Simpan Catatan
                    </Button>
                  </div>

                  {/* Aktivitas */}
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <History className="h-4 w-4 text-primary" aria-hidden="true" />
                      Riwayat Aktivitas
                    </h3>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="cth: Siram pagi, aplikasi pupuk urea"
                        value={actForm.title}
                        onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                        aria-label="Judul aktivitas"
                      />
                      <Button onClick={addActivity} disabled={!actForm.title.trim()} className="shrink-0">Catat</Button>
                    </div>
                    <Input
                      className="mt-2"
                      placeholder="Catatan tambahan (opsional)"
                      value={actForm.note}
                      onChange={(e) => setActForm({ ...actForm, note: e.target.value })}
                      aria-label="Catatan aktivitas"
                    />
                    <div className="nice-scroll mt-4 max-h-56 space-y-2.5 overflow-y-auto pr-1">
                      {activities.length === 0 ? (
                        <p className="rounded-xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                          Belum ada aktivitas. Mulai catat kegiatan harian Anda di atas.
                        </p>
                      ) : (
                        activities.map((a) => (
                          <div key={a.id} className="flex gap-3 rounded-xl border border-border/70 p-3">
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                                <p className="text-sm font-medium">{a.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                              {a.note && <p className="mt-0.5 break-words text-xs text-muted-foreground">{a.note}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== AlertDialog: hapus ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus lahan "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh riwayat aktivitas lahan ini akan ikut terhapus dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={removeLand} className="bg-destructive text-white hover:bg-destructive/90">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
