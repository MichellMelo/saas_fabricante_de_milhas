-- Keep product content available only through the authenticated NestJS API.
ALTER TABLE public."ProductContent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."ProductContent" FROM anon, authenticated;
