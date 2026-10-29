ALTER TABLE "User"
  ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "AdminInvitation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "tokenHash" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "emailStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "emailAttempts" INTEGER NOT NULL DEFAULT 0,
  "nextEmailAttemptAt" TIMESTAMP(3),
  "lastEmailError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "targetUserId" TEXT,
  "targetEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminInvitation_tokenHash_key" ON "AdminInvitation"("tokenHash");
CREATE INDEX "AdminInvitation_email_acceptedAt_idx" ON "AdminInvitation"("email", "acceptedAt");
CREATE INDEX "AdminInvitation_emailStatus_nextEmailAttemptAt_idx" ON "AdminInvitation"("emailStatus", "nextEmailAttemptAt");
CREATE INDEX "AdminInvitation_expiresAt_idx" ON "AdminInvitation"("expiresAt");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_targetEmail_createdAt_idx" ON "AdminAuditLog"("targetEmail", "createdAt");
CREATE INDEX "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");

ALTER TABLE "AdminInvitation"
  ADD CONSTRAINT "AdminInvitation_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
