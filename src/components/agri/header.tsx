"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sprout, Menu, MessageCircleQuestion } from "lucide-react";

export type ViewKey = "beranda" | "lahan" | "siapkan" | "tanaman" | "pasar";

const NAV: { key: ViewKey; label: string }[] = [
  { key: "beranda", label: "Beranda" },
  { key: "lahan", label: "Kelola Lahan" },
  { key: "siapkan", label: "Siapkan Lahan" },
  { key: "tanaman", label: "Kenali Tanaman" },
  { key: "pasar", label: "Pasar Tani" },
];

export function AgriHeader({
  view,
  onNavigate,
  onOpenAi,
}: {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
  onOpenAi: () => void;
}) {
  const [open, setOpen] = useState(false);

  const go = (v: ViewKey) => {
    onNavigate(v);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <button
          onClick={() => go("beranda")}
          className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Tani Loa Lepu - ke beranda"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate text-lg font-bold tracking-tight text-foreground">
            Tani <span className="text-primary">Loa Lepu</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors lg:px-4 ${
                view === item.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/75 hover:bg-accent hover:text-accent-foreground"
              }`}
              aria-current={view === item.key ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAi}
            className="hidden gap-1.5 border-primary/40 text-primary hover:bg-accent hover:text-accent-foreground sm:inline-flex"
          >
            <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
            Tanya Ahli
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sprout className="h-4 w-4" aria-hidden="true" />
                </span>
                Tani Loa Lepu
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Navigasi seluler">
                {NAV.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => go(item.key)}
                    className={`rounded-lg px-4 py-3 text-left text-base font-medium transition-colors ${
                      view === item.key
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:bg-accent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setOpen(false);
                    onOpenAi();
                  }}
                  className="mt-2 flex items-center gap-2 rounded-lg border border-primary/40 px-4 py-3 text-left text-base font-medium text-primary hover:bg-accent"
                >
                  <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
                  Tanya Ahli Tanaman
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
