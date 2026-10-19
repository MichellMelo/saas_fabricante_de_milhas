from pathlib import Path
import json
import sys

root = Path(__file__).resolve().parents[1]
def read(path):
    return (root / path).read_text(encoding="utf-8")
def json_file(path):
    return json.loads(read(path))

root_pkg = json_file("package.json")
web_pkg = json_file("apps/web/package.json")
api_pkg = json_file("apps/api/package.json")
schema = read("apps/api/prisma/schema.prisma")
dashboard = read("apps/web/src/components/dashboard.tsx")
workflow = read(".github/workflows/validate.yml")
auth_controller = read("apps/api/src/auth/auth.controller.ts")
auth_service = read("apps/api/src/auth/auth.service.ts")
auth_guard = read("apps/api/src/auth/jwt-auth.guard.ts")
migration = read("apps/api/prisma/migrations/20261018000000_initial_auth_schema/migration.sql")

checks = {
 "Root npm workspaces include frontend and API": root_pkg.get("workspaces") == ["apps/web", "apps/api"],
 "Frontend dependencies include Next, React and Lucide": all(name in web_pkg["dependencies"] for name in ("next", "react", "lucide-react")),
 "Frontend has TypeScript and Tailwind": "typescript" in web_pkg["devDependencies"] and "tailwindcss" in web_pkg["devDependencies"],
 "shadcn configuration and primitives exist": (root / "apps/web/components.json").exists() and all((root / path).exists() for path in ("apps/web/src/components/ui/button.tsx", "apps/web/src/components/ui/card.tsx", "apps/web/src/components/ui/badge.tsx")),
 "Backend dependencies include NestJS, Prisma and JWT": all(name in api_pkg["dependencies"] for name in ("@nestjs/core", "@prisma/client", "@nestjs/jwt", "bcryptjs", "class-validator")),
 "Prisma datasource uses PostgreSQL and environment URL": 'provider = "postgresql"' in schema and 'env("DATABASE_URL")' in schema,
 "Schema includes core models and password hash": all("model " + name + " {" in schema for name in ("User", "LoyaltyProgram", "LoyaltyAccount", "PointTransaction", "FlightRecord")) and "passwordHash String" in schema,
 "Initial versioned migration includes core tables and foreign keys": all(token in migration for token in ('CREATE TABLE "User"', 'CREATE TABLE "LoyaltyAccount"', 'CREATE TABLE "PointTransaction"', 'CREATE TABLE "FlightRecord"', 'FOREIGN KEY')),
 "Auth endpoints and JWT guard are wired": all(token in auth_controller for token in ('Post("register")', 'Post("login")', 'Get("me")', "JwtAuthGuard")) and "verifyAsync" in auth_guard,
 "Passwords are hashed and checked with bcrypt": "hash(dto.password, 12)" in auth_service and "compare(dto.password, user.passwordHash)" in auth_service,
 "JWT secret is required and documented": "JWT_SECRET" in read("apps/api/src/main.ts") and "JWT_SECRET" in read(".env.example"),
 "NestJS health endpoint and API prefix exist": '@Controller("health")' in read("apps/api/src/health.controller.ts") and 'setGlobalPrefix("api")' in read("apps/api/src/main.ts"),
 "Dashboard uses Lucide and shadcn primitives": 'from "lucide-react"' in dashboard and 'from "@/components/ui/button"' in dashboard and 'from "@/components/ui/card"' in dashboard,
 "Demo values are disclosed as fictitious": "fictícios" in dashboard and "DEMONSTRAÇÃO" in dashboard,
 "CI installs, generates Prisma, typechecks and builds": all(token in workflow for token in ("npm install", "npm run prisma:generate", "npm run typecheck", "npm run build")),
 "Environment template exists and ignores real secrets": (root / ".env.example").exists() and ".env" in read(".gitignore") and "DATABASE_URL" in read(".env.example")
}
failed = [name for name, passed in checks.items() if not passed]
for name, passed in checks.items():
    print(("PASS" if passed else "FAIL") + " - " + name)
if failed:
    print("\\n" + str(len(failed)) + " check(s) failed.", file=sys.stderr)
    sys.exit(1)
print("\\nAll " + str(len(checks)) + " architecture checks passed.")
