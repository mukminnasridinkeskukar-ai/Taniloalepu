"use client";

import { useCallback, useEffect, useState } from "react";
import { AgriHeader, type ViewKey } from "@/components/agri/header";
import { AgriFooter } from "@/components/agri/footer";
import { HomeView } from "@/components/agri/home-view";
import { LandView } from "@/components/agri/land-view";
import { PrepareView } from "@/components/agri/prepare-view";
import { CropsView } from "@/components/agri/crops-view";
import { MarketView } from "@/components/agri/market-view";
import { AiChatDialog } from "@/components/agri/ai-chat";
import { AuthView } from "@/components/agri/auth-view";
import { ProfileView } from "@/components/agri/profile-view";
import { PanelView } from "@/components/agri/panel-view";
import { useToast } from "@/hooks/use-toast";
import type { AuthUser } from "@/lib/agri-types";

const VALID_VIEWS: ViewKey[] = [
  "beranda", "lahan", "siapkan", "tanaman", "pasar", "masuk", "daftar", "akun", "panel",
];

const PROTECTED: ViewKey[] = ["akun", "panel"];

export default function Home() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewKey>("beranda");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // muat sesi pengguna saat halaman dibuka
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (alive) setUser(data.user ?? null);
      } catch {
        /* pengguna belum masuk */
      } finally {
        if (alive) setAuthLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // sinkronisasi tab dengan hash agar bisa dibagikan / kembali via tombol browser
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace("#", "") as ViewKey;
      if (VALID_VIEWS.includes(h)) setView(h);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const navigate = useCallback((v: ViewKey) => {
    setView(v);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${v}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // halaman terlindungi: jika sesi belum dimuat / belum masuk, arahkan ke halaman masuk
  useEffect(() => {
    if (!authLoading && PROTECTED.includes(view) && !user) navigate("masuk");
  }, [authLoading, view, user, navigate]);

  const handleLoginSuccess = useCallback(
    (u: AuthUser) => {
      setUser(u);
      toast({ title: `Selamat datang, ${u.name.split(" ")[0]}!` });
      navigate("panel");
    },
    [toast, navigate]
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* abaikan */
    }
    setUser(null);
    toast({ title: "Anda telah keluar dari akun" });
    navigate("beranda");
  }, [toast, navigate]);

  const openAi = useCallback(() => {
    setAiQuestion(undefined);
    setAiOpen(true);
  }, []);

  const askAi = useCallback((question: string) => {
    setAiQuestion(question);
    setAiOpen(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <AgriHeader
        view={view}
        user={user}
        onNavigate={navigate}
        onOpenAi={openAi}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {view === "beranda" && <HomeView onNavigate={navigate} user={user} />}
        {view === "lahan" && <LandView onGoPrepare={() => navigate("siapkan")} user={user} onNavigate={navigate} />}
        {view === "siapkan" && <PrepareView />}
        {view === "tanaman" && <CropsView onAskAi={askAi} />}
        {view === "pasar" && <MarketView user={user} onNavigate={navigate} />}
        {(view === "masuk" || view === "daftar") && (
          <AuthView mode={view} onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />
        )}
        {view === "akun" && user && <ProfileView user={user} onUserUpdated={setUser} />}
        {view === "panel" && user && <PanelView user={user} onNavigate={navigate} onUserUpdated={setUser} />}
      </main>

      <AgriFooter onNavigate={navigate} />

      <AiChatDialog open={aiOpen} onOpenChange={setAiOpen} initialQuestion={aiQuestion} />
    </div>
  );
}
