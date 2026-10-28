CREATE TABLE "FlightAvailability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "dateRegistered" TIMESTAMP(3) NOT NULL,
    "program" VARCHAR(100) NOT NULL,
    "cabinClass" VARCHAR(50) NOT NULL,
    "origin" VARCHAR(3) NOT NULL,
    "destination" VARCHAR(3) NOT NULL,
    "milesFloor" INTEGER NOT NULL,
    "monthsAvailable" TEXT NOT NULL,
    "outboundDates" TEXT NOT NULL,
    "returnDates" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FlightAvailability_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FlightAvailability_userId_fingerprint_key" ON "FlightAvailability"("userId", "fingerprint");
CREATE INDEX "FlightAvailability_userId_dateRegistered_idx" ON "FlightAvailability"("userId", "dateRegistered");
CREATE INDEX "FlightAvailability_userId_origin_destination_idx" ON "FlightAvailability"("userId", "origin", "destination");
CREATE INDEX "FlightAvailability_userId_program_idx" ON "FlightAvailability"("userId", "program");
ALTER TABLE "FlightAvailability" ADD CONSTRAINT "FlightAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
