const { spawnSync } = require("node:child_process");

function fail(message) {
  console.error(`Integration tests blocked: ${message}`);
  process.exit(1);
}

const rawUrl = process.env.TEST_DATABASE_URL;
if (!rawUrl) {
  fail("set TEST_DATABASE_URL explicitly; DATABASE_URL and .env are never used as a fallback.");
}

let databaseUrl;
try {
  databaseUrl = new URL(rawUrl);
} catch {
  fail("TEST_DATABASE_URL is not a valid URL.");
}

if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
  fail("only PostgreSQL URLs are accepted.");
}

const hostname = databaseUrl.hostname.toLowerCase();
if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
  fail("the database host must be localhost, 127.0.0.1, or ::1.");
}

if (hostname.includes("supabase") || rawUrl.includes("nqdwfliopzjwbfucugpx") || rawUrl.includes("bbxobvtagiuboylwvtnc")) {
  fail("Supabase development and production databases are forbidden.");
}

if (databaseUrl.pathname !== "/fabricante_milhas_test") {
  fail("the database name must be exactly fabricante_milhas_test.");
}

if (databaseUrl.port !== "55432") {
  fail("the database port must be exactly 55432 (the dedicated Docker test port).");
}

// Override DATABASE_URL only in child processes, after strict validation.
// No .env file is loaded by this runner.
const env = { ...process.env, DATABASE_URL: rawUrl };
const prismaCli = require.resolve("prisma/build/index.js", {
  paths: [process.cwd(), process.cwd() + "/../../"],
});
const vitestCli = require.resolve("vitest/vitest.mjs", {
  paths: [process.cwd(), process.cwd() + "/../../"],
});

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Applying Prisma migrations to the isolated local test database...");
run(process.execPath, [prismaCli, "migrate", "deploy"]);

console.log("Running PostgreSQL integration tests...");
run(process.execPath, [vitestCli, "run", "--config", "vitest.integration.config.ts"]);
