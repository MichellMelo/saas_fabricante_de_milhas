CREATE TYPE "MileSaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

CREATE TABLE "MileSale" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "buyerName" TEXT,
  "miles" INTEGER NOT NULL,
  "acquisitionCpm" DECIMAL(12,4) NOT NULL,
  "grossAmount" DECIMAL(12,2) NOT NULL,
  "fees" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "soldAt" TIMESTAMP(3) NOT NULL,
  "status" "MileSaleStatus" NOT NULL DEFAULT 'COMPLETED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MileSale_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MileSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MileSale_userId_soldAt_idx" ON "MileSale"("userId", "soldAt");
CREATE INDEX "MileSale_userId_status_idx" ON "MileSale"("userId", "status");
