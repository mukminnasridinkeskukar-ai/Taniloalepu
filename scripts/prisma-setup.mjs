#!/usr/bin/env node
/**
 * Memilih skema Prisma sesuai lingkungan, lalu men-generate Prisma Client.
 *
 * - DATABASE_URL diawali "postgres://" / "postgresql://"  → prisma/schema.postgres.prisma
 *   (deployment produksi, mis. Vercel + Supabase)
 * - DATABASE_URL lain / tidak diatur                       → prisma/schema.prisma
 *   (mode demo lokal berbasis berkas SQLite)
 *
 * Dijalankan otomatis pada "postinstall" dan "build" sehingga deployment
 * selalu memakai client yang cocok dengan basis data tujuan.
 *
 * Mode uji: set PRISMA_SETUP_DRY=1 untuk hanya mencetak keputusan tanpa generate.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const url = (process.env.DATABASE_URL || "").trim();
const isPostgres = /^(postgres|postgresql):\/\//i.test(url);
const schema = isPostgres ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma";
const label = url
  ? isPostgres
    ? "postgresql (produksi)"
    : "berkas SQLite (demo lokal)"
  : "tidak diatur — default SQLite (demo lokal)";

console.log(`[persiapan-database] DATABASE_URL: ${label}`);
console.log(`[persiapan-database] Skema yang dipakai: ${schema}`);

if (process.env.PRISMA_SETUP_DRY === "1") {
  console.log("[persiapan-database] Mode uji (dry) — tidak menjalankan generate.");
  process.exit(0);
}

// Cari CLI Prisma di node_modules lokal agar tidak menyentuh jaringan.
const candidates = [
  "node_modules/.bin/prisma",
  "node_modules/prisma/build/index.js",
];
const bin = candidates.find(existsSync);

try {
  if (bin) {
    execSync(`"${bin}" generate --schema ${schema}`, { stdio: "inherit" });
  } else {
    execSync(`npx --no-install prisma generate --schema ${schema}`, { stdio: "inherit" });
  }
} catch (err) {
  console.error("[persiapan-database] Gagal generate Prisma Client:", err.message);
  process.exit(1);
}
