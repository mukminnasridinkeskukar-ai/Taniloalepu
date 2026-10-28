"use client";

import { Sprout, MapPin, Clock, Heart } from "lucide-react";
import type { ViewKey } from "./header";

export function AgriFooter({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const links: { key: ViewKey; label: string }[] = [
    { key: "lahan", label: "Kelola Lahan" },
    { key: "siapkan", label: "Siapkan Lahan" },
    { key: "tanaman", label: "Kenali Tanaman" },
    { key: "pasar", label: "Pasar Tani" },
  ];

  return (
    <footer className="mt-auto border-t border-border/70 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sprout className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold">
                Tani <span className="text-primary">Loa Lepu</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Platform tani Desa Loa Lepu — mengurus lahan, menyiapkan tanam,
              merawat tanaman, hingga menjual hasil panen langsung ke masyarakat
              secara online. Dikembangkan langsung oleh petani setempat.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Fitur Utama</h3>
            <ul className="mt-3 space-y-2">
              {links.map((l) => (
                <li key={l.key}>
                  <button
                    onClick={() => onNavigate(l.key)}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Lokasi &amp; Layanan</h3>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Desa Loa Lepu, Kecamatan Tenggarong Seberang<br />
                  Kabupaten Kutai Kartanegara, Kalimantan Timur
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Pesanan online dapat dilakukan 24 jam — konfirmasi &amp; pengiriman
                  diproses setiap hari pukul 08.00–17.00 WITA
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Tani Loa Lepu — dikembangkan petani Desa Loa Lepu, Kutai Kartanegara.</p>
          <p className="flex items-center gap-1">
            Dibuat dengan <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" /> untuk petani kita
          </p>
        </div>
      </div>
    </footer>
  );
}
