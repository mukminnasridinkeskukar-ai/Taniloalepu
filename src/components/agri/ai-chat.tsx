"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sprout, User, Loader2, RotateCcw } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Daunku menguning, kenapa ya?",
  "Kapan waktu terbaik pupuk NPK?",
  "Cara atasi wereng batang cokelat",
  "Cara jual hasil panen secara online",
];

export function AiChatDialog({
  open,
  onOpenChange,
  initialQuestion,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialQuestion?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Selamat datang, Pak/Bu Tani! Saya Pak Tani Digital, asisten pertanian Anda. Tanyakan apa saja soal lahan, tanaman, hama, sampai cara menjual hasil panen — saya siap membantu.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && initialQuestion) {
      void send(initialQuestion);
    }
  }, [open, initialQuestion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: message }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: next.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membalas");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Maaf, koneksi ke asisten sedang terganggu. Silakan coba lagi beberapa saat, atau tanya dengan kalimat lain ya.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([
      {
        role: "assistant",
        content:
          "Selamat datang kembali! Ada yang bisa saya bantu soal lahan, tanaman, atau jualan hasil panen?",
      },
    ]);
    setInput("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85dvh] max-w-lg flex-col gap-0 p-0 sm:h-[600px]">
        <DialogHeader className="border-b border-border/70 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sprout className="h-4 w-4" aria-hidden="true" />
            </span>
            Pak Tani Digital
            <span className="ml-auto">
              <Button variant="ghost" size="icon" onClick={reset} aria-label="Mulai percakapan baru" className="h-8 w-8">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Asisten tani digital — jawaban praktis untuk petani Loa Lepu & sekitarnya
          </DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="nice-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Sprout className="h-3.5 w-3.5" />}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted text-foreground"
                }`}
              >
                {m.role === "user" ? (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                ) : (
                  <div className="space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold [&_p]:leading-relaxed">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sprout className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Pak Tani sedang berpikir…</span>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => void send(q)}
                className="rounded-full border border-primary/30 bg-accent/60 px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex gap-2 border-t border-border/70 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pertanyaan pertanian Anda…"
            aria-label="Pertanyaan untuk asisten"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Kirim pertanyaan">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
