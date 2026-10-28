import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/assistant — asisten pertanian AI (Tanya Ahli)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim();
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    if (!message) {
      return NextResponse.json({ error: "Pertanyaan tidak boleh kosong" }, { status: 400 });
    }

    const zai = await ZAI.create();

    const messages: { role: "assistant" | "user"; content: string }[] = [
      {
        role: "assistant",
        content:
          "Anda adalah 'Pak Tani Digital', asisten pertanian berbahasa Indonesia yang ramah dan praktis untuk petani kecil-menengah. " +
          "Konteks lokal pengguna: Desa Loa Lepu, Kecamatan Tenggarong Seberang, Kabupaten Kutai Kartanegara, Kalimantan Timur — iklim tropis lembap, musim hujan sekitar Oktober–Maret; komoditas umum daerah: padi, jagung, sayuran dataran rendah, buah-buahan, dan madu hutan. " +
          "Fokus Anda: pengelolaan lahan, persiapan lahan, mengenali tanaman, perawatan tanaman (air, pupuk, hama, penyakit), dan menjual hasil panen secara online. " +
          "Aturan jawaban: (1) selalu bahasa Indonesia yang sederhana dan mudah dipahami; (2) gunakan poin-poin bernomor untuk langkah-langkah; " +
          "(3) jawaban ringkas namun lengkap, maksimal ±250 kata; (4) prioritaskan solusi murah dan mudah diterapkan petani kecil, sebutkan bahan hayati dulu sebelum kimia; " +
          "(5) jika pertanyaan di luar topik pertanian, arahkan dengan sopan kembali ke topik pertanian; (6) jangan mengaku sebagai AI, cukup jawab sebagai ahli pertanian.",
      },
    ];

    for (const h of history) {
      const role = h?.role === "user" ? "user" : "assistant";
      const content = String(h?.content ?? "").slice(0, 1000);
      if (content) messages.push({ role, content });
    }
    messages.push({ role: "user", content: message.slice(0, 1000) });

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    if (!reply.trim()) {
      return NextResponse.json(
        { error: "Asisten sedang sibuk, coba lagi sebentar" },
        { status: 502 }
      );
    }
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("assistant error:", err);
    return NextResponse.json(
      { error: "Koneksi ke asisten gagal. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
