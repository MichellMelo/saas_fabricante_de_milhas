ALTER TABLE "MileSale"
  ADD COLUMN "loyaltyProgramId" TEXT,
  ADD COLUMN "costOfGoodsSold" DECIMAL(14,2),
  ADD COLUMN "inventoryManaged" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX "MileSale_userId_loyaltyProgramId_soldAt_idx"
  ON "MileSale"("userId", "loyaltyProgramId", "soldAt");

ALTER TABLE "MileSale"
  ADD CONSTRAINT "MileSale_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "MileInventoryMovementType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT');

CREATE TABLE "MilePurchase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "loyaltyProgramId" TEXT NOT NULL,
  "miles" INTEGER NOT NULL,
  "acquisitionCpm" DECIMAL(12,4) NOT NULL,
  "grossAmount" DECIMAL(14,2) NOT NULL,
  "fees" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "purchasedAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MilePurchase_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MilePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MilePurchase_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "MilePurchase_userId_purchasedAt_idx" ON "MilePurchase"("userId", "purchasedAt");
CREATE INDEX "MilePurchase_userId_loyaltyProgramId_purchasedAt_idx" ON "MilePurchase"("userId", "loyaltyProgramId", "purchasedAt");

CREATE TABLE "MileInventory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "loyaltyProgramId" TEXT NOT NULL,
  "miles" INTEGER NOT NULL DEFAULT 0,
  "totalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "averageCpm" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MileInventory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MileInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MileInventory_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MileInventory_userId_loyaltyProgramId_key" ON "MileInventory"("userId", "loyaltyProgramId");
CREATE INDEX "MileInventory_userId_idx" ON "MileInventory"("userId");

CREATE TABLE "MileInventoryMovement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "loyaltyProgramId" TEXT NOT NULL,
  "type" "MileInventoryMovementType" NOT NULL,
  "miles" INTEGER NOT NULL,
  "unitCostCpm" DECIMAL(12,4) NOT NULL,
  "totalCost" DECIMAL(14,2) NOT NULL,
  "purchaseId" TEXT,
  "saleId" TEXT,
  "reason" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MileInventoryMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MileInventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MileInventoryMovement_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MileInventoryMovement_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "MilePurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MileInventoryMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "MileSale"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "MileInventoryMovement_userId_occurredAt_idx" ON "MileInventoryMovement"("userId", "occurredAt");
CREATE INDEX "MileInventoryMovement_userId_loyaltyProgramId_occurredAt_idx" ON "MileInventoryMovement"("userId", "loyaltyProgramId", "occurredAt");
CREATE INDEX "MileInventoryMovement_purchaseId_idx" ON "MileInventoryMovement"("purchaseId");
CREATE INDEX "MileInventoryMovement_saleId_idx" ON "MileInventoryMovement"("saleId");
