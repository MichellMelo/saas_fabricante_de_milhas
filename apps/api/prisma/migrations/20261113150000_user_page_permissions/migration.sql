BEGIN;

CREATE TABLE "UserPagePermission" (
    "userId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserPagePermission_pkey" PRIMARY KEY ("userId", "page"),
    CONSTRAINT "UserPagePermission_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "UserPagePermission" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "UserPagePermission" FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE "UserPagePermission" FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE "UserPagePermission" FROM authenticated;
    END IF;
END $$;

INSERT INTO "UserPagePermission" ("userId", "page", "allowed")
SELECT "User"."id", pages.page, true
FROM "User"
CROSS JOIN (VALUES ('dashboard'), ('programas'), ('programas-admin'),
    ('calculadoras'), ('passagens'), ('historico'), ('mile-finance')) AS pages(page);

INSERT INTO "UserPagePermission" ("userId", "page", "allowed")
SELECT "userId",
    CASE "product" WHEN 'GROUP_VIP' THEN 'group-vip'
        WHEN 'AULAO' THEN 'auloes' WHEN 'MENTORSHIP' THEN 'mentorias' END,
    true
FROM "UserProductAccess"
WHERE "product" IN ('GROUP_VIP', 'AULAO', 'MENTORSHIP');

COMMIT;
