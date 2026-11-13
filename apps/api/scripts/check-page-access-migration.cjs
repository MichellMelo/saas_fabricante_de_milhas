const assert = require("node:assert/strict");
const { readdirSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

async function main() {
  const { PGlite } = require(process.argv[2] || "@electric-sql/pglite");
  const db = new PGlite();
  const migrations = join(__dirname, "../prisma/migrations");
  const accessMigration = "20261113150000_user_page_permissions";
  try {
    await db.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
    for (const folder of readdirSync(migrations).sort()) {
      if (folder >= accessMigration) break;
      await db.exec(readFileSync(join(migrations, folder, "migration.sql"), "utf8"));
    }
    await db.exec(`
      INSERT INTO "User" ("id", "email", "updatedAt") VALUES ('legacy', 'legacy@example.test', now());
      INSERT INTO "UserProductAccess" ("id", "userId", "product", "updatedAt") VALUES ('vip', 'legacy', 'GROUP_VIP', now());
    `);
    await db.exec(readFileSync(join(migrations, accessMigration, "migration.sql"), "utf8"));
    await db.exec(`INSERT INTO "User" ("id", "email", "updatedAt") VALUES ('new', 'new@example.test', now())`);
    const grants = await db.query(`SELECT "userId", array_agg("page" ORDER BY "page") AS pages
      FROM "UserPagePermission" WHERE "allowed" GROUP BY "userId"`);
    assert.deepEqual(grants.rows, [{
      userId: "legacy",
      pages: ["calculadoras", "dashboard", "group-vip", "historico", "mile-finance", "passagens", "programas", "programas-admin"],
    }]);
    const security = await db.query(`SELECT relrowsecurity AS rls,
      has_table_privilege('anon', '"UserPagePermission"', 'SELECT') AS anon_read,
      has_table_privilege('authenticated', '"UserPagePermission"', 'INSERT') AS user_write
      FROM pg_class WHERE oid = '"UserPagePermission"'::regclass`);
    assert.deepEqual(security.rows, [{ rls: true, anon_read: false, user_write: false }]);
    console.log("Migração validada: acessos legados, bloqueio inicial e proteção da Data API.");
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
