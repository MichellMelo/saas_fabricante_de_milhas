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
clients_controller = read("apps/api/src/clients/clients.controller.ts")
clients_service = read("apps/api/src/clients/clients.service.ts")
accept_invitation_form = read("apps/web/src/components/accept-invitation-form.tsx")
client_management = read("apps/web/src/components/client-management.tsx")
group_vip_controller = read("apps/api/src/group-vip/group-vip.controller.ts")
group_vip_service = read("apps/api/src/group-vip/group-vip.service.ts")
group_vip_ui = read("apps/web/src/components/group-vip-content.tsx")
group_vip_migration = read("apps/api/prisma/migrations/20261022160000_group_vip_content/migration.sql")
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
 "Public registration is disabled and invitation acceptance is available": "O cadastro é feito somente por convite" in auth_service and 'Post("accept-invitation")' in auth_controller,
 "Product entitlements and hashed invitations are modeled": all(token in schema for token in ("enum ProductType", "model UserProductAccess", "model ClientInvitation", "tokenHash String @unique")),
 "Client management API checks administrator allowlist": "ADMIN_EMAILS" in clients_controller and 'Get("clients")' in clients_controller and 'Post("invitations")' in clients_controller,
 "Invitation acceptance grants selected products": "tx.userProductAccess.createMany" in auth_service and 'createHash("sha256")' in auth_service,
 "Frontend supports invite activation and product controls": "accept-invitation" in accept_invitation_form and all(token in client_management for token in ("GROUP_VIP", "AULAO", "MENTORSHIP", "product-access")),
 "Group VIP content has persistent model and migration": "model GroupVipPost {" in schema and 'CREATE TABLE "GroupVipPost"' in group_vip_migration,
 "Group VIP read endpoint enforces product entitlement and filters drafts": "assertProductAccess(request.user.id)" in group_vip_controller and "isPublished: true" in group_vip_service,
 "Only admins can manage Group VIP posts": "assertAdmin(request)" in group_vip_controller and all(token in group_vip_controller for token in ('Post("posts")', 'Post("posts/:id/update")', 'Post("posts/:id/publish")')),
 "Group VIP UI supports internal content, external links, editing and publication": all(token in group_vip_ui for token in ("externalUrl", "Salvar rascunho", "Editar", "Publicar")) and "GroupVipContent" in dashboard,
 "JWT secret is required and documented": "JWT_SECRET" in read("apps/api/src/main.ts") and "JWT_SECRET" in read(".env.example"),
 "NestJS health endpoint and API prefix exist": '@Controller("health")' in read("apps/api/src/health.controller.ts") and 'setGlobalPrefix("api")' in read("apps/api/src/main.ts"),
 "Dashboard uses Lucide and shadcn primitives": 'from "lucide-react"' in dashboard and 'from "@/components/ui/button"' in dashboard and 'from "@/components/ui/card"' in dashboard,
 "Dashboard avoids fictitious values and explains unavailable metrics": "Sem custo de aquisição suficiente para estimar com segurança" in dashboard and "histórico será exibido quando houver uma série temporal confiável" in dashboard and "DEMONSTRAÇÃO" not in dashboard and "fictícios" not in dashboard,
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
