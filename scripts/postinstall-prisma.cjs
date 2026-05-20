/**
 * Prisma generate from real application root on cPanel Node Selector.
 *
 * npm lifecycle often sets npm_package_json to a path under ~/nodevenv/.../lib
 * (where prisma/ does not exist). INIT_CWD is usually the directory where the
 * user ran `npm install` (the real app root). We also walk up ancestors to find
 * prisma/schema.prisma.
 */
const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const SCHEMA_REL = path.join("prisma", "schema.prisma");

function ancestors(startDir, maxDepth = 14) {
  const out = [];
  let cur = path.resolve(startDir);
  for (let i = 0; i < maxDepth; i++) {
    out.push(cur);
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return out;
}

function findAppRoot() {
  const seen = new Set();
  const rootsToWalk = [];

  if (process.env.INIT_CWD) rootsToWalk.push(process.env.INIT_CWD);
  /** npm 9+ often sets this to the project root during install */
  if (process.env.npm_config_local_prefix) rootsToWalk.push(process.env.npm_config_local_prefix);
  if (process.env.npm_package_json) {
    rootsToWalk.push(path.dirname(path.resolve(process.env.npm_package_json)));
  }
  rootsToWalk.push(path.join(__dirname, ".."));

  for (const start of rootsToWalk) {
    if (!start) continue;
    for (const dir of ancestors(start)) {
      if (seen.has(dir)) continue;
      seen.add(dir);
      if (existsSync(path.join(dir, SCHEMA_REL))) return dir;
    }
  }
  return null;
}

const root = findAppRoot();
const schema = root ? path.join(root, SCHEMA_REL) : null;
const prismaCli = root ? path.join(root, "node_modules", "prisma", "build", "index.js") : null;

if (!root || !schema || !existsSync(schema)) {
  console.warn(
    "[postinstall] prisma/schema.prisma not found (INIT_CWD=%s npm_config_local_prefix=%s npm_package_json=%s); skipping prisma generate.",
    process.env.INIT_CWD || "(unset)",
    process.env.npm_config_local_prefix || "(unset)",
    process.env.npm_package_json || "(unset)"
  );
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
