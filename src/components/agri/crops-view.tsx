"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search, Loader2, Droplets, Sun, CalendarClock, FlaskConical, Bug, ListOrdered,
  Sparkles, X, Leaf, Tag, Wheat,
} from "lucide-react";
import type { Crop, CropDisease } from "@/lib/agri-types";
import { CROP_CATEGORIES, DIFFICULTY, parseJsonArr } from "@/lib/agri-types";

export function CropsView({ onAskAi }: { onAskAi: (question: string) => void }) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("semua");
  const [detail, setDetail] = useState<Crop | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const fetchCrops = useCallback(async (query: string, cat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (cat && cat !== "semua") params.set("category", cat);
      const res = await fetch(`/api/crops?${params.toString()}`);
      const data = await res.json();
      setCrops(Array.isArray(data) ? data : []);
    } catch {
      setCrops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void fetchCrops(q, category), 250);
    return () => clearTimeout(t);
  }, [q, category, fetchCrops]);

  function openDetail(c: Crop) {
    setDetail(c);
    setGalleryIdx(0);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="text-center">
        <Badge variant="secondary" className="mb-2">Ensiklopedia Tanaman</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Kenali & Rawat Tanaman</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Panduan budidaya lengkap 54 tanaman — sayuran, buah tropis, bumbu dapur, rempah, hingga padi-padian:
          cara menanam, jadwal perawatan, hingga solusi hama & penyakit. Bingung? Tanya Pak Tani Digital kapan saja.
        </p>
      </div>

      {/* Search & filter */}
      <div className="mx-auto mt-8 max-w-3xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari tanaman… (cth: manggis, katuk, lada, nanas)"
            className="h-12 pl-10"
            aria-label="Cari tanaman"
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter kategori">
          {Object.entries(CROP_CATEGORIES).map(([k, label]) => (
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
      </div>

      {/* Grid tanaman */}
      {loading ? (
        <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat tanaman…
        </div>
      ) : crops.length === 0 ? (
        <Card className="mx-auto mt-12 max-w-md p-10 text-center">
          <Leaf className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 font-medium">Tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba kata kunci lain atau ganti kategori pencarian.
          </p>
        </Card>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {crops.map((c) => {
            const diff = DIFFICULTY[c.difficulty] ?? DIFFICULTY.sedang;
            return (
              <Card
                key={c.id}
                className="group cursor-pointer overflow-hidden pt-0 transition-all hover:-translate-y-1 hover:shadow-lg"
                onClick={() => openDetail(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openDetail(c)}
                aria-label={`Lihat panduan ${c.name}`}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={c.imageUrl}
                    alt={`Tanaman ${c.name}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur ${diff.color}`}>
                    {diff.label}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs italic text-muted-foreground">{c.latinName}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      Panen ±{c.harvestDays} hari
                    </span>
                    <span className="font-medium text-primary">Lihat panduan →</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== Dialog detail tanaman ===== */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-2xl" aria-describedby={undefined}>
          {detail && (() => {
            const gallery = [...new Set([detail.imageUrl, ...parseJsonArr<string>(detail.gallery)].filter(Boolean))];
            const steps = parseJsonArr<string>(detail.plantingSteps);
            const tips = parseJsonArr<string>(detail.careTips);
            const diseases = parseJsonArr<CropDisease>(detail.diseases);
            const diff = DIFFICULTY[detail.difficulty] ?? DIFFICULTY.sedang;
            const shown = gallery[Math.min(galleryIdx, gallery.length - 1)];
            return (
              <div>
                <DialogTitle className="sr-only">Panduan budidaya {detail.name}</DialogTitle>
                {/* Galeri */}
                <div className="relative">
                  <img
                    src={shown}
                    alt={`Galeri ${detail.name} ${galleryIdx + 1}`}
                    className="h-60 w-full object-cover sm:h-72"
                  />
                  <Button
                    variant="ghost" size="icon"
                    className="absolute right-3 top-3 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                    onClick={() => setDetail(null)} aria-label="Tutup detail tanaman"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-10">
                    <h2 className="text-2xl font-bold text-white">{detail.name}</h2>
                    <p className="text-sm italic text-white/80">{detail.latinName}</p>
                  </div>
                </div>

                {/* Thumbnail galeri */}
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

                <div className="p-5 sm:p-6">
                  {/* Meta */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${diff.color}`}>
                      Tingkat: {diff.label}
                    </span>
                    <Badge variant="secondary" className="gap-1">
                      <CalendarClock className="h-3 w-3" aria-hidden="true" /> Panen ±{detail.harvestDays} hari
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Droplets className="h-3 w-3" aria-hidden="true" /> Air: {detail.waterNeed}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Sun className="h-3 w-3" aria-hidden="true" /> {detail.sunNeed}
                    </Badge>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{detail.description}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-accent/50 p-3 text-sm">
                    <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-muted-foreground">Rentang harga pasar:</span>
                    <span className="font-semibold text-foreground">{detail.priceRange}</span>
                  </div>

                  {/* Tabs panduan */}
                  <Tabs defaultValue="tanam" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="tanam" className="gap-1 text-xs sm:text-sm">
                        <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" /> Menanam
                      </TabsTrigger>
                      <TabsTrigger value="rawat" className="gap-1 text-xs sm:text-sm">
                        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Perawatan
                      </TabsTrigger>
                      <TabsTrigger value="hama" className="gap-1 text-xs sm:text-sm">
                        <Bug className="h-3.5 w-3.5" aria-hidden="true" /> Hama & Penyakit
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tanam" className="mt-4">
                      <p className="mb-3 text-sm text-muted-foreground">
                        Waktu tanam terbaik: {detail.season}
                      </p>
                      <ol className="space-y-3">
                        {steps.map((s, i) => (
                          <li key={i} className="flex gap-3 rounded-xl border border-border/70 p-3.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {i + 1}
                            </span>
                            <p className="text-sm leading-relaxed">{s}</p>
                          </li>
                        ))}
                      </ol>
                    </TabsContent>

                    <TabsContent value="rawat" className="mt-4">
                      <ul className="space-y-2.5">
                        {tips.map((t, i) => (
                          <li key={i} className="flex gap-2.5 rounded-xl bg-accent/40 p-3.5 text-sm leading-relaxed">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="hama" className="mt-4">
                      <Accordion type="single" collapsible>
                        {diseases.map((d, i) => (
                          <AccordionItem key={i} value={`dis-${i}`}>
                            <AccordionTrigger className="text-left text-sm font-medium">
                              {d.name}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-semibold text-destructive">Gejala: </span>
                                  <span className="text-muted-foreground">{d.symptom}</span>
                                </p>
                                <p>
                                  <span className="font-semibold text-primary">Penanganan: </span>
                                  <span className="text-muted-foreground">{d.treatment}</span>
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>
                  </Tabs>

                  {/* CTA AI */}
                  <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-accent/40 p-4 sm:flex-row">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Wheat className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Tanaman Anda bermasalah? <span className="font-medium text-foreground">Tanya Pak Tani Digital</span> — gratis 24 jam.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setDetail(null);
                        onAskAi(`Bagaimana cara merawat ${detail.name}? Saya ingin tips praktis agar panen berhasil.`);
                      }}
                      className="shrink-0"
                    >
                      Tanya Sekarang
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
