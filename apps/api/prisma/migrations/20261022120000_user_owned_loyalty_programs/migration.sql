ALTER TABLE "LoyaltyProgram"
ADD COLUMN "ownerUserId" TEXT;

CREATE INDEX "LoyaltyProgram_ownerUserId_idx"
ON "LoyaltyProgram"("ownerUserId");

ALTER TABLE "LoyaltyProgram"
ADD CONSTRAINT "LoyaltyProgram_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
