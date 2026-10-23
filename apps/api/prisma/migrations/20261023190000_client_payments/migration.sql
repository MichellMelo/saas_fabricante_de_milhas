CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'OTHER');

CREATE TABLE "ClientPayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "product" "ProductType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "method" "PaymentMethod",
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ClientPayment_userId_dueAt_idx" ON "ClientPayment"("userId", "dueAt");
CREATE INDEX "ClientPayment_status_dueAt_idx" ON "ClientPayment"("status", "dueAt");
