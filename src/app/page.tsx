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

const VALID_VIEWS: ViewKey[] = ["beranda", "lahan", "siapkan", "tanaman", "pasar"];

export default function Home() {
  const [view, setView] = useState<ViewKey>("beranda");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<string | undefined>(undefined);

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
      <AgriHeader view={view} onNavigate={navigate} onOpenAi={openAi} />

      <main className="flex-1">
        {view === "beranda" && <HomeView onNavigate={navigate} />}
        {view === "lahan" && <LandView onGoPrepare={() => navigate("siapkan")} />}
        {view === "siapkan" && <PrepareView />}
        {view === "tanaman" && <CropsView onAskAi={askAi} />}
        {view === "pasar" && <MarketView />}
      </main>

      <AgriFooter onNavigate={navigate} />

      <AiChatDialog open={aiOpen} onOpenChange={setAiOpen} initialQuestion={aiQuestion} />
    </div>
  );
}
