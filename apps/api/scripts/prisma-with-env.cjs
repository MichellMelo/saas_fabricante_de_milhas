const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");

// The API workspace runs from apps/api, so load the repository-level .env
// explicitly instead of relying on Prisma's implicit dotenv discovery.
const repoEnv = path.resolve(__dirname, "../../../.env");
const apiEnv = path.resolve(__dirname, "../.env");
const envPath = fs.existsSync(repoEnv) ? repoEnv : apiEnv;

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

if (!process.env.DATABASE_URL) {
  console.error(
    `DATABASE_URL is not set. Checked .env files at: ${repoEnv} and ${apiEnv}`,
  );
  process.exit(1);
}

// Resolve Prisma's JavaScript CLI directly. This avoids the Windows .cmd shim
// and works consistently across Windows, macOS, and Linux.
let prismaCli;
try {
  prismaCli = require.resolve("prisma/build/index.js", {
    paths: [process.cwd(), path.resolve(__dirname, "../../../")],
  });
} catch (error) {
  console.error("Could not resolve the local Prisma CLI:", error);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [prismaCli, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
