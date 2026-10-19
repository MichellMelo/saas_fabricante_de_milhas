CREATE TYPE "LoyaltyProgramType" AS ENUM ('BANK', 'AIRLINE', 'HOTEL', 'OTHER');
CREATE TYPE "TransactionType" AS ENUM ('EARN', 'TRANSFER_IN', 'TRANSFER_OUT', 'REDEMPTION', 'PURCHASE', 'EXPIRATION', 'ADJUSTMENT');

CREATE TABLE "User" (
 "id" TEXT NOT NULL,
 "email" TEXT NOT NULL,
 "passwordHash" TEXT NOT NULL,
 "name" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LoyaltyProgram" (
 "id" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "code" TEXT NOT NULL,
 "type" "LoyaltyProgramType" NOT NULL DEFAULT 'OTHER',
 "active" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LoyaltyAccount" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "loyaltyProgramId" TEXT NOT NULL,
 "memberReference" TEXT,
 "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
 "currency" TEXT NOT NULL DEFAULT 'POINTS',
 "lastBalanceAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PointTransaction" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "loyaltyAccountId" TEXT,
 "type" "TransactionType" NOT NULL,
 "points" DECIMAL(18,2) NOT NULL,
 "unitCostBrl" DECIMAL(12,4),
 "cashValueBrl" DECIMAL(12,2),
 "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "notes" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FlightRecord" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "airline" TEXT NOT NULL,
 "flightNumber" TEXT,
 "origin" TEXT NOT NULL,
 "destination" TEXT NOT NULL,
 "departureAt" TIMESTAMP(3),
 "arrivalAt" TIMESTAMP(3),
 "bookingReference" TEXT,
 "pointsRedeemed" DECIMAL(18,2),
 "taxesBrl" DECIMAL(12,2),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "FlightRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "LoyaltyProgram_code_key" ON "LoyaltyProgram"("code");
CREATE UNIQUE INDEX "LoyaltyAccount_userId_loyaltyProgramId_key" ON "LoyaltyAccount"("userId", "loyaltyProgramId");
CREATE INDEX "LoyaltyAccount_userId_idx" ON "LoyaltyAccount"("userId");
CREATE INDEX "LoyaltyAccount_loyaltyProgramId_idx" ON "LoyaltyAccount"("loyaltyProgramId");
CREATE INDEX "PointTransaction_userId_occurredAt_idx" ON "PointTransaction"("userId", "occurredAt");
CREATE INDEX "PointTransaction_loyaltyAccountId_occurredAt_idx" ON "PointTransaction"("loyaltyAccountId", "occurredAt");
CREATE INDEX "FlightRecord_userId_departureAt_idx" ON "FlightRecord"("userId", "departureAt");

ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_loyaltyProgramId_fkey" FOREIGN KEY ("loyaltyProgramId") REFERENCES "LoyaltyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FlightRecord" ADD CONSTRAINT "FlightRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
