CREATE TYPE "ProductType" AS ENUM ('GROUP_VIP', 'AULAO', 'MENTORSHIP');

CREATE TABLE "UserProductAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "product" "ProductType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserProductAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "tokenHash" TEXT NOT NULL,
    "productTypes" "ProductType"[] NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProductAccess_userId_product_key" ON "UserProductAccess"("userId", "product");
CREATE INDEX "UserProductAccess_product_active_idx" ON "UserProductAccess"("product", "active");
CREATE INDEX "UserProductAccess_userId_active_idx" ON "UserProductAccess"("userId", "active");
CREATE UNIQUE INDEX "ClientInvitation_tokenHash_key" ON "ClientInvitation"("tokenHash");
CREATE INDEX "ClientInvitation_email_acceptedAt_idx" ON "ClientInvitation"("email", "acceptedAt");
CREATE INDEX "ClientInvitation_expiresAt_idx" ON "ClientInvitation"("expiresAt");

ALTER TABLE "UserProductAccess" ADD CONSTRAINT "UserProductAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientInvitation" ADD CONSTRAINT "ClientInvitation_invitedByUserId_fkey"
FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
