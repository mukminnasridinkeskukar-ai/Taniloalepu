import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien Supabase untuk produksi (GitHub + Vercel + Supabase).
 *
 * Cara pakai:
 *  1. Buat proyek di https://supabase.com, lalu salin URL & anon key
 *     (Project Settings → API).
 *  2. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
 *     di Environment Variables Vercel (atau file .env.local untuk lokal).
 *  3. Jalankan SQL pada supabase/schema.sql di SQL Editor Supabase.
 *
 * Fungsi ini mengembalikan `null` bila env belum diset — sehingga aplikasi
 * tetap bisa berjalan dengan API lokal (Prisma + SQLite) untuk mode demo.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    cached = null;
    return cached;
  }

  cached = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return cached;
}

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
