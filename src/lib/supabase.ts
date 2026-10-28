/**
 * Klien REST untuk layanan basis data PostgreSQL (Supabase / PostgREST).
 *
 * Menggantikan Prisma + SQLite agar platform dapat berjalan penuh di
 * lingkungan deployment tanpa-servur (Vercel) maupun secara lokal —
 * komunikasi hanya lewat HTTPS, tanpa berkas database dan tanpa mesin tambahan.
 *
 * Konfigurasi (opsional — nilai bawaan sudah tertanam di bawah):
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const DEFAULT_URL = "https://ssfpabbpfsedmngrrywr.supabase.co";
const DEFAULT_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZnBhYmJwZnNlZG1uZ3JyeXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTQ0NTEsImV4cCI6MjEwODc3MDQ1MX0.H7Sc0TPiABgZ483E5c4tl4MbxWHeJxoJyHop4EjQiQk";

export function dbConfig() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_URL
  ).replace(/\/+$/, "");
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_KEY;
  return { url, key };
}

/** Galat basis data dengan pesan & saran berbahasa Indonesia siap tampilkan. */
export class DbError extends Error {
  status: number;
  hint: string;
  constructor(message: string, hint: string, status = 500) {
    super(message);
    this.name = "DbError";
    this.hint = hint;
    this.status = status;
  }
}

function saranDariRespons(status: number, code: string, message: string): { pesan: string; saran: string } {
  if (code === "42P01" || code === "PGRST205" || /does not exist in the schema cache|relation .* does not exist/i.test(message)) {
    return {
      pesan: "Tabel basis data belum dibuat di proyek Anda.",
      saran:
        "Buka panel layanan basis data → SQL Editor → jalankan seluruh isi berkas supabase/setup.sql (sekali saja), lalu muat ulang halaman ini.",
    };
  }
  if (code === "PGRST204" || /could not find the .* column/i.test(message)) {
    return {
      pesan: "Struktur basis data Anda belum memuat kolom terbaru platform.",
      saran:
        "Buka panel layanan basis data → SQL Editor → jalankan ulang seluruh isi berkas supabase/setup.sql terbaru (aman, data lama tidak berubah), lalu coba lagi.",
    };
  }
  if (status === 401 || status === 403 || /invalid api key|JWT/i.test(message)) {
    return {
      pesan: "Kunci akses basis data tidak valid atau kedaluwarsa.",
      saran:
        "Periksa SUPABASE_URL dan SUPABASE_ANON_KEY pada pengaturan environment deployment (atau gunakan nilai bawaan di src/lib/supabase.ts).",
    };
  }
  if (status === 42501) {
    return {
      pesan: "Akses ke tabel ditolak kebijakan keamanan baris (RLS).",
      saran: "Jalankan ulang supabase/setup.sql agar kebijakan akses platform dibuat.",
    };
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(message)) {
    return {
      pesan: "Tidak dapat menghubungi layanan basis data.",
      saran: "Pastikan proyek basis data Anda aktif (tidak jeda/terhenti) lalu coba lagi.",
    };
  }
  return { pesan: message.slice(0, 300) || "Galat basis data tak dikenal.", saran: "Periksa log deployment untuk detail lengkapnya." };
}

export type RestQuery = {
  select?: string;
  /** Filter kolom, contoh: { status: "eq.aktif", id: "eq.xxx" } */
  filters?: Record<string, string>;
  /** Ekspresi disjungsi mentah PostgREST, contoh: `(name.ilike.*padi*,slug.ilike.*padi*)` */
  or?: string;
  /** contoh: "created_at.desc" atau "price.asc" */
  order?: string;
  limit?: number;
};

function buildUrl(table: string, q: RestQuery): string {
  const { url } = dbConfig();
  const u = new URL(`${url}/rest/v1/${table}`);
  u.searchParams.set("select", q.select ?? "*");
  for (const [col, cond] of Object.entries(q.filters ?? {})) {
    u.searchParams.set(col, cond);
  }
  if (q.or) u.searchParams.set("or", q.or);
  if (q.order) u.searchParams.set("order", q.order);
  if (q.limit) u.searchParams.set("limit", String(q.limit));
  return u.toString();
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE" | "HEAD",
  table: string,
  opts: RestQuery & { body?: unknown; returning?: boolean; wantCount?: boolean } = {}
): Promise<T> {
  const { key } = dbConfig();
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (method === "POST" || method === "PATCH") {
    headers.Prefer = opts.returning === false ? "return=minimal" : "return=representation";
  }
  if (opts.wantCount) {
    headers.Prefer = `${headers.Prefer ? headers.Prefer + "," : ""}count=exact`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(table, opts), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch (err) {
    const { pesan, saran } = saranDariRespons(0, "", String(err));
    throw new DbError(pesan, saran, 503);
  }

  if (!res.ok) {
    let code = "";
    let message = "";
    try {
      const payload = (await res.json()) as { code?: string; message?: string; error_description?: string; msg?: string };
      code = payload.code ?? "";
      message = payload.message ?? payload.error_description ?? payload.msg ?? "";
    } catch {
      /* respons bukan JSON */
    }
    const { pesan, saran } = saranDariRespons(res.status, code, message);
    throw new DbError(pesan, saran, res.status);
  }

  if (res.status === 204) return [] as T;
  return (await res.json()) as T;
}

export const rest = {
  /** Ambil baris-baris tabel. */
  async select<T = Record<string, unknown>>(table: string, q: RestQuery = {}): Promise<T[]> {
    return request<T[]>("GET", table, q);
  },

  /** Tambah baris baru; mengembalikan baris hasil simpanan. */
  async insert<T = Record<string, unknown>>(
    table: string,
    rows: Record<string, unknown> | Record<string, unknown>[]
  ): Promise<T[]> {
    const body = Array.isArray(rows) ? rows : [rows];
    return request<T[]>("POST", table, { body });
  },

  /** Ubah baris sesuai filter; mengembalikan baris setelah diubah. */
  async update<T = Record<string, unknown>>(
    table: string,
    filters: Record<string, string>,
    patch: Record<string, unknown>
  ): Promise<T[]> {
    return request<T[]>("PATCH", table, { filters, body: patch });
  },

  /** Hapus baris sesuai filter. */
  async remove(table: string, filters: Record<string, string>): Promise<void> {
    await request("DELETE", table, { filters, returning: false });
  },

  /** Hitung jumlah baris tabel (untuk halaman kesehatan/deployment). */
  async count(table: string, filters?: Record<string, string>): Promise<number> {
    const { key } = dbConfig();
    const headers: Record<string, string> = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
    };
    let res: Response;
    try {
      res = await fetch(buildUrl(table, { select: "", filters, limit: 1 }), {
        method: "HEAD",
        headers,
        cache: "no-store",
      });
    } catch (err) {
      const { pesan, saran } = saranDariRespons(0, "", String(err));
      throw new DbError(pesan, saran, 503);
    }
    if (!res.ok) {
      let code = "";
      let message = "";
      try {
        const payload = (await res.json()) as { code?: string; message?: string };
        code = payload.code ?? "";
        message = payload.message ?? "";
      } catch {
        /* HEAD tanpa badan */
      }
      const { pesan, saran } = saranDariRespons(res.status, code, message);
      throw new DbError(pesan, saran, res.status);
    }
    const range = res.headers.get("content-range") ?? ""; // contoh: "0-4/12" atau "*/12"
    const total = range.split("/")[1];
    return total ? Number(total) || 0 : 0;
  },
};
