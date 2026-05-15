/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Entry point untuk cPanel / CloudLinux Node.js Selector.
 * Startup file di panel: server.js (atau app.js yang require file ini)
 */
const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const dir = __dirname;
const buildIdPath = path.join(dir, ".next", "BUILD_ID");
const hasProductionBuild = fs.existsSync(buildIdPath);

// Production jika NODE_ENV=production ATAU folder .next sudah ada (typical cPanel)
const dev =
  process.env.NODE_ENV === "development" ||
  (process.env.NODE_ENV !== "production" && !hasProductionBuild);

const port = Number.parseInt(process.env.PORT || "3000", 10);
// Jangan pakai env HOSTNAME dari cPanel (sering IP publik) — Passenger proxy ke 127.0.0.1:PORT
const hostname = process.env.LISTEN_HOST || "0.0.0.0";

if (!dev && !hasProductionBuild) {
  console.error(
    "[erp_cnvs] Folder .next tidak ditemukan. Build di PC: npm run build, upload .next ke server, lalu restart."
  );
  process.exit(1);
}

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
    });
  })
  .catch((err) => {
    console.error("[erp_cnvs] Failed to start:", err);
    process.exit(1);
  });
