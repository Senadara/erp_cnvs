/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Entry point untuk cPanel / CloudLinux Node.js Selector.
 * Startup file di panel: server.js
 *
 * Menggunakan mode "standalone" untuk mencegah Next.js memunculkan
 * worker threads dan membatasi Prisma agar tidak menghabiskan NPROC.
 */

// ── STEP 1: Set env vars DULUAN ──
process.env.UV_THREADPOOL_SIZE = "2";       // Node.js libuv: default 4, kita paksa 2
process.env.RAYON_NUM_THREADS = "1";        // Prisma Rust engine: paksa 1 thread
process.env.NEXT_TELEMETRY_DISABLED = "1";  // Matikan Next.js telemetry
process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const standalonePath = path.join(__dirname, ".next", "standalone", "server.js");

if (!fs.existsSync(standalonePath)) {
  console.error(
    "[erp_cnvs] CRITICAL ERROR: .next/standalone/server.js tidak ditemukan!"
  );
  console.error(
    "Pastikan 'output: \"standalone\"' aktif di next.config.ts dan Anda telah menjalankan 'npm run build'."
  );
  process.exit(1);
}

// ── STEP 2: Pindah working directory ke folder standalone (opsional tapi disarankan) ──
// process.chdir(path.join(__dirname, ".next", "standalone"));

// ── STEP 3: Meneruskan ke Standalone Server bawaan Next.js ──
console.log(`[erp_cnvs] Memulai server STANDALONE dengan NPROC Optimized...`);
console.log(`[erp_cnvs] UV_THREADPOOL=${process.env.UV_THREADPOOL_SIZE}, RAYON=${process.env.RAYON_NUM_THREADS}`);

require(standalonePath);
