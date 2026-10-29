-- These records are accessed only by the trusted NestJS API through Prisma.
-- Enable RLS so browser-facing Supabase roles cannot read invitation tokens or audit data directly.
ALTER TABLE "AdminInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;
