/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const dir = __dirname;
const buildIdPath = path.join(dir, ".next", "BUILD_ID");

if (!dev && !fs.existsSync(buildIdPath)) {
  console.error(
    "[erp_cnvs] Folder .next tidak ditemukan. Jalankan `npm run build` (disarankan di komputer lokal), upload folder .next ke server, lalu restart aplikasi."
  );
  process.exit(1);
}

const app = next({ dev, dir });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(
        `> erp_cnvs ready (${dev ? "development" : "production"}) on http://${hostname}:${port}`
      );
    });
  })
  .catch((err) => {
    console.error("[erp_cnvs] Failed to start:", err);
    process.exit(1);
  });
