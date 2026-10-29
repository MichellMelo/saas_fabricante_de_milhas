CREATE TYPE "PersonalRedemptionStatus" AS ENUM ('PLANNED', 'ISSUED', 'TRIP_COMPLETED', 'CANCELLED', 'REFUNDED');

CREATE TABLE "PersonalTrip" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" VARCHAR(180),
  "origin" VARCHAR(3) NOT NULL,
  "destination" VARCHAR(3) NOT NULL,
  "outboundDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalTrip_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PersonalTripPassenger" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PersonalTripPassenger_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PersonalRedemption" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tripId" TEXT,
  "origin" VARCHAR(3) NOT NULL,
  "destination" VARCHAR(3) NOT NULL,
  "issuanceDate" TIMESTAMP(3) NOT NULL,
  "outboundDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3),
  "program" VARCHAR(100) NOT NULL,
  "cabin" VARCHAR(40) NOT NULL,
  "milesUsed" INTEGER NOT NULL,
  "feesPaid" DECIMAL(12,2) NOT NULL,
  "cashReferencePrice" DECIMAL(12,2),
  "cashReferenceDate" TIMESTAMP(3),
  "cashReferenceSource" VARCHAR(2048),
  "bookingLocator" VARCHAR(100),
  "status" "PersonalRedemptionStatus" NOT NULL DEFAULT 'ISSUED',
  "notes" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalRedemption_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PersonalRedemptionAudit" (
  "id" TEXT NOT NULL,
  "redemptionId" TEXT,
  "redemptionLabel" VARCHAR(400) NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" VARCHAR(40) NOT NULL,
  "fieldName" VARCHAR(100),
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PersonalRedemptionAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PersonalTrip_userId_outboundDate_idx" ON "PersonalTrip"("userId", "outboundDate");
CREATE INDEX "PersonalTrip_userId_origin_destination_idx" ON "PersonalTrip"("userId", "origin", "destination");
CREATE INDEX "PersonalTripPassenger_tripId_idx" ON "PersonalTripPassenger"("tripId");
CREATE INDEX "PersonalRedemption_userId_deletedAt_issuanceDate_idx" ON "PersonalRedemption"("userId", "deletedAt", "issuanceDate");
CREATE INDEX "PersonalRedemption_userId_status_idx" ON "PersonalRedemption"("userId", "status");
CREATE INDEX "PersonalRedemption_userId_origin_destination_idx" ON "PersonalRedemption"("userId", "origin", "destination");
CREATE INDEX "PersonalRedemption_tripId_idx" ON "PersonalRedemption"("tripId");
CREATE INDEX "PersonalRedemptionAudit_redemptionId_createdAt_idx" ON "PersonalRedemptionAudit"("redemptionId", "createdAt");
CREATE INDEX "PersonalRedemptionAudit_actorUserId_createdAt_idx" ON "PersonalRedemptionAudit"("actorUserId", "createdAt");
ALTER TABLE "PersonalTrip" ADD CONSTRAINT "PersonalTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalTripPassenger" ADD CONSTRAINT "PersonalTripPassenger_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "PersonalTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalRedemption" ADD CONSTRAINT "PersonalRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalRedemption" ADD CONSTRAINT "PersonalRedemption_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "PersonalTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonalRedemptionAudit" ADD CONSTRAINT "PersonalRedemptionAudit_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "PersonalRedemption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PersonalRedemptionAudit" ADD CONSTRAINT "PersonalRedemptionAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
