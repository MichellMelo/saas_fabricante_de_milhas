CREATE TABLE "Airport" (
  "iataCode" VARCHAR(3) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "municipality" VARCHAR(255),
  "countryCode" VARCHAR(2),
  "countryName" VARCHAR(100),
  "sourceType" VARCHAR(30) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Airport_pkey" PRIMARY KEY ("iataCode")
);
CREATE INDEX "Airport_municipality_idx" ON "Airport"("municipality");
CREATE INDEX "Airport_name_idx" ON "Airport"("name");
CREATE TABLE "AirportCatalogSync" (
  "id" TEXT NOT NULL DEFAULT 'ourairports',
  "lastAttemptAt" TIMESTAMP(3),
  "lastSuccessAt" TIMESTAMP(3),
  "recordCount" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AirportCatalogSync_pkey" PRIMARY KEY ("id")
);
