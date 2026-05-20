/**
 * cPanel "Setup Node.js App" often runs npm lifecycle scripts with CWD under
 * ~/nodevenv/.../lib instead of the application root. Prisma then cannot find
 * prisma/schema.prisma. This script always resolves the repo root from this
 * file's location and runs `prisma generate` there.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = join(root, "prisma", "schema.prisma");
const prismaCli = join(root, "node_modules", "prisma", "build", "index.js");

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
