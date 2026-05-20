/**
 * Prisma generate from application root (works when npm lifecycle CWD is wrong,
 * e.g. cPanel Node Selector using ~/nodevenv/.../lib).
 */
const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

function resolveRoot() {
  const fromNpm = process.env.npm_package_json;
  if (fromNpm) {
    return path.dirname(path.resolve(fromNpm));
  }
  return path.join(__dirname, "..");
}

const root = resolveRoot();
const schema = path.join(root, "prisma", "schema.prisma");
const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");

if (!existsSync(schema)) {
  console.warn("[postinstall] prisma/schema.prisma not found; skipping prisma generate.");
  process.exit(0);
}

if (!existsSync(prismaCli)) {
  console.warn("[postinstall] prisma package not installed yet; skipping prisma generate.");
  process.exit(0);
}

const result = spawnSync(process.execPath, [prismaCli, "generate", "--schema", schema], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
