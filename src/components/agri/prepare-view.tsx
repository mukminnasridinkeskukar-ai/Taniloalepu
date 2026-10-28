"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { CalendarDays, Clock3, Lightbulb, CheckCircle2, HelpCircle } from "lucide-react";
import { PREP_STEPS, SEASON_CALENDAR, MONTH_LABELS, FAQ_ITEMS, HERO_IMAGES } from "@/lib/agri-content";

const LS_KEY = "taninusa-prep-checklist";

export function PrepareView() {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    // muat dari localStorage (sistem eksternal) secara asinkron agar tidak memicu render berantai
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) setDone(JSON.parse(raw));
      } catch {
        /* abaikan */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
  };

  const progress = (done.length / PREP_STEPS.length) * 100;
  const allDone = done.length === PREP_STEPS.length;

  const monthCols = useMemo(() => MONTH_LABELS.map((_, i) => i), []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl">
        <img
          src={HERO_IMAGES.sawah3}
          alt="Traktor mengolah lahan"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[oklch(0.2_0.05_150/0.85)]" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <Badge className="mb-3 border-emerald-300/40 bg-emerald-400/20 text-emerald-50 backdrop-blur">
            Panduan Bergambar
          </Badge>
          <h1 className="max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            Menyiapkan Lahan dengan Benar = Separuh Panen Sukses
          </h1>
          <p className="mt-3 max-w-2xl text-emerald-50/90">
            Ikuti enam langkah persiapan yang telah teruji oleh ribuan petani. Setiap langkah
            dilengkapi foto ilustrasi, estimasi waktu, dan tips praktis hemat biaya.
          </p>
        </div>
      </div>

      {/* Progress checklist */}
      <Card className="mt-8">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
              Checklist Persiapan Lahan Saya
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tandai setiap langkah yang sudah selesai di lahan Anda — progres tersimpan otomatis di perangkat ini.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{done.length} dari {PREP_STEPS.length} selesai</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} aria-label="Progres persiapan" />
            {allDone && (
              <p className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-center text-xs font-medium text-accent-foreground">
                Luar biasa! Lahan Anda siap menanam.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline langkah */}
      <div className="mt-10 space-y-8">
        {PREP_STEPS.map((step, i) => {
          const isDone = done.includes(step.id);
          const flip = i % 2 === 1;
          return (
            <Card
              key={step.id}
              className={`overflow-hidden pt-0 transition-all ${isDone ? "border-primary/50" : ""}`}
            >
              <CardContent className="grid gap-0 p-0 md:grid-cols-2">
                <div className={`relative h-56 sm:h-64 ${flip ? "md:order-2" : ""}`}>
                  <img
                    src={step.image}
                    alt={step.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    Langkah {i + 1} dari 6
                  </span>
                  {isDone && (
                    <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Selesai
                    </span>
                  )}
                </div>
                <div className={`flex flex-col gap-3 p-6 sm:p-8 ${flip ? "md:order-1" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <Badge variant="secondary" className="gap-1">
                      <Clock3 className="h-3 w-3" aria-hidden="true" /> {step.duration}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {step.description}
                  </p>
                  <div className="rounded-xl bg-accent/60 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
                      <Lightbulb className="h-4 w-4" aria-hidden="true" /> Tips Hemat
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {step.tips.map((t) => (
                        <li key={t} className="flex gap-2 text-sm text-accent-foreground/90">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-1">
                    <button
                      onClick={() => toggle(step.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isDone
                          ? "bg-primary text-primary-foreground"
                          : "border border-primary/40 text-primary hover:bg-accent"
                      }`}
                      aria-pressed={isDone}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {isDone ? "Tandai belum selesai" : "Tandai sudah selesai"}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kalender musim tanam */}
      <div className="mt-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Kalender Tanam</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Kapan sebaiknya menanam?</h2>
          <p className="mt-3 text-muted-foreground">
            Pola umum musim tanam di Kalimantan Timur (ilustrasi — sesuaikan dengan pola
            cuaca daerah Anda dan info penyuluh desa).
          </p>
        </div>

        <Card className="mt-8 overflow-x-auto">
          <CardContent className="p-4 sm:p-6">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <caption className="sr-only">Kalender musim tanam per komoditas</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-40 pb-3 text-left font-semibold">Komoditas</th>
                  {monthCols.map((m) => (
                    <th key={m} scope="col" className="pb-3 text-center text-xs font-medium text-muted-foreground">
                      {MONTH_LABELS[m]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEASON_CALENDAR.map((row) => (
                  <tr key={row.crop} className="border-t border-border/60">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={row.image} alt={`Tanaman ${row.crop}`} className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                        <span className="font-medium">{row.crop}</span>
                      </div>
                    </td>
                    {monthCols.map((m) => (
                      <td key={m} className="px-0.5 text-center">
                        <span
                          className={`mx-auto block h-6 w-full max-w-8 rounded ${
                            row.months.includes(m + 1) ? "bg-primary/80" : "bg-muted"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          {row.months.includes(m + 1) ? "musim tanam" : "bukan musim tanam"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-3 w-6 rounded bg-primary/80" aria-hidden="true" /> = waktu tanam ideal
              <CalendarDays className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
              Klik komoditas di menu “Kenali Tanaman” untuk panduan budidaya lengkapnya.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">
            <HelpCircle className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Tanya Jawab
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">Pertanyaan yang sering diajukan</h2>
        </div>
        <Accordion type="single" collapsible className="mt-8 mx-auto max-w-3xl">
          {FAQ_ITEMS.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-[15px] font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
