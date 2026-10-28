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

// Resolve Prisma through npm's local executable PATH. On Windows, npm exposes
// CLI tools as .cmd shims, which cannot reliably be loaded with require.resolve.
const command = process.platform === "win32" ? "prisma.cmd" : "prisma";
const result = spawnSync(command, process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
