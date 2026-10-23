-- Supabase-specific hardening for tables created by the Prisma schema migration.
-- Apply after the Prisma initial schema migration.
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LoyaltyProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LoyaltyAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PointTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FlightRecord" ENABLE ROW LEVEL SECURITY;

-- Browser/Data API roles must not access application tables directly.
-- NestJS uses server-side Prisma access; do not expose direct table access until
-- Supabase Auth and per-user policies are intentionally implemented.
REVOKE ALL ON TABLE public."User" FROM anon, authenticated;
REVOKE ALL ON TABLE public."LoyaltyProgram" FROM anon, authenticated;
REVOKE ALL ON TABLE public."LoyaltyAccount" FROM anon, authenticated;
REVOKE ALL ON TABLE public."PointTransaction" FROM anon, authenticated;
REVOKE ALL ON TABLE public."FlightRecord" FROM anon, authenticated;

-- The event trigger can still invoke its helper, but PostgREST clients cannot.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
