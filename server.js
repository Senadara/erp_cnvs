/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Entry point untuk cPanel / CloudLinux Node.js Selector.
 * Startup file di panel: server.js
 *
 * ═══════════════════════════════════════════════════════════════
 * CRITICAL: Semua env vars HARUS di-set SEBELUM require apapun!
 * UV_THREADPOOL_SIZE & RAYON_NUM_THREADS hanya berlaku jika
 * di-set sebelum libuv/Rust engine menginisialisasi thread pool.
 * ═══════════════════════════════════════════════════════════════
 */

// ── STEP 1: Set env vars DULUAN sebelum load module apapun ──
process.env.UV_THREADPOOL_SIZE = "2";       // Node.js libuv: default 4, kita paksa 2
process.env.RAYON_NUM_THREADS = "1";        // Prisma Rust engine: paksa 1 thread
process.env.NEXT_TELEMETRY_DISABLED = "1";  // Matikan Next.js telemetry
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || "--max-old-space-size=512";

// ── STEP 2: Sekarang baru aman load modules ──
const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const { parse } = require("url");

// Load .env (hanya untuk DATABASE_URL, AUTH_SECRET, dll)
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ── STEP 3: Lazy-load Next.js (jangan require di top-level) ──
const dir = __dirname;
const buildIdPath = path.join(dir, ".next", "BUILD_ID");
const hasProductionBuild = fs.existsSync(buildIdPath);

const dev =
  process.env.NODE_ENV === "development" ||
  (process.env.NODE_ENV !== "production" && !hasProductionBuild);

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.LISTEN_HOST || "0.0.0.0";

if (!dev && !hasProductionBuild) {
  console.error(
    "[erp_cnvs] Folder .next tidak ditemukan. Build di PC: npm run build, upload .next ke server, lalu restart."
  );
  process.exit(1);
}

// Next.js di-require setelah semua env vars sudah terpasang
const next = require("next");
const app = next({ dev, dir });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("[erp_cnvs] Request error:", req.url, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(
        `[erp_cnvs] Ready (${dev ? "development" : "production"}) http://${hostname}:${port}`
      );
      console.log(
        `[erp_cnvs] NPROC Optimized: UV_THREADPOOL=${process.env.UV_THREADPOOL_SIZE}, RAYON=${process.env.RAYON_NUM_THREADS}`
      );
    });
  })
  .catch((err) => {
    console.error("[erp_cnvs] Failed to start:", err);
    process.exit(1);
  });
