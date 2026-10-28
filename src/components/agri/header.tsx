"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sprout, Menu, MessageCircleQuestion, LogIn, UserPlus, LayoutDashboard, UserRound, LogOut } from "lucide-react";
import type { AuthUser } from "@/lib/agri-types";
import { ROLE_LABEL } from "@/lib/agri-types";

export type ViewKey =
  | "beranda" | "lahan" | "siapkan" | "tanaman" | "pasar"
  | "masuk" | "daftar" | "akun" | "panel";

const NAV: { key: ViewKey; label: string }[] = [
  { key: "beranda", label: "Beranda" },
  { key: "lahan", label: "Kelola Lahan" },
  { key: "siapkan", label: "Siapkan Lahan" },
  { key: "tanaman", label: "Kenali Tanaman" },
  { key: "pasar", label: "Pasar Tani" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function AgriHeader({
  view,
  user,
  onNavigate,
  onOpenAi,
  onLogout,
}: {
  view: ViewKey;
  user: AuthUser | null;
  onNavigate: (v: ViewKey) => void;
  onOpenAi: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  const go = (v: ViewKey) => {
    onNavigate(v);
    setOpen(false);
  };

  const panelLabel = user?.role === "operator" ? "Panel Operator" : user?.role === "superadmin" ? "Panel Admin" : "Panel Petani";

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
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
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

        {/* Kanan atas: Tanya Ahli + Masuk/Daftar atau Avatar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAi}
            className="hidden gap-1.5 border-primary/40 text-primary hover:bg-accent hover:text-accent-foreground xl:inline-flex"
          >
            <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
            Tanya Ahli
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-border/70 bg-background py-1 pl-1 pr-2.5 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  aria-label={`Menu akun ${user.name}`}
                >
                  <Avatar className="h-8 w-8 border border-border/60">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={`Foto profil ${user.name}`} />
                    ) : null}
                    <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                      {initials(user.name) || "PL"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                      {ROLE_LABEL[user.role] ?? user.role}
                    </Badge>
                    <span className="truncate">@{user.username}</span>
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("panel")} className="gap-2">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  {panelLabel}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("akun")} className="gap-2">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Akun Saya
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => go("masuk")}
                className="gap-1.5 border-primary/40 text-primary hover:bg-accent hover:text-accent-foreground"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Masuk</span>
              </Button>
              <Button
                size="sm"
                onClick={() => go("daftar")}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Daftar</span>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sprout className="h-4 w-4" aria-hidden="true" />
                </span>
                Tani Loa Lepu
              </SheetTitle>

              {user ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/70 bg-accent/40 p-3">
                  <Avatar className="h-10 w-10 border border-border/60">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={`Foto profil ${user.name}`} />
                    ) : null}
                    <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                      {initials(user.name) || "PL"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ROLE_LABEL[user.role] ?? user.role} · @{user.username}
                    </p>
                  </div>
                </div>
              ) : null}

              <nav className="mt-4 flex flex-col gap-1" aria-label="Navigasi seluler">
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

                {user ? (
                  <>
                    <button
                      onClick={() => go("panel")}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-base font-medium text-foreground/80 hover:bg-accent"
                    >
                      <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                      {panelLabel}
                    </button>
                    <button
                      onClick={() => go("akun")}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-base font-medium text-foreground/80 hover:bg-accent"
                    >
                      <UserRound className="h-5 w-5" aria-hidden="true" />
                      Akun Saya
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        onLogout();
                      }}
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-base font-medium text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-5 w-5" aria-hidden="true" />
                      Keluar
                    </button>
                  </>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2 px-1">
                    <Button variant="outline" onClick={() => go("masuk")} className="gap-1.5 border-primary/40 text-primary">
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Masuk
                    </Button>
                    <Button onClick={() => go("daftar")} className="gap-1.5">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      Daftar
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
