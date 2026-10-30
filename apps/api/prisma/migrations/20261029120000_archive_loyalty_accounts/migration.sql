ALTER TABLE "LoyaltyAccount"
ADD COLUMN "archivedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "LoyaltyAccount_userId_loyaltyProgramId_key";

CREATE UNIQUE INDEX "LoyaltyAccount_userId_loyaltyProgramId_active_key"
ON "LoyaltyAccount" ("userId", "loyaltyProgramId")
WHERE "archivedAt" IS NULL;

CREATE INDEX "LoyaltyAccount_userId_loyaltyProgramId_idx"
ON "LoyaltyAccount" ("userId", "loyaltyProgramId");
