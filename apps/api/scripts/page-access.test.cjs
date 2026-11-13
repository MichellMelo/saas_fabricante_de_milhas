const assert = require("node:assert/strict");
const { test } = require("node:test");
const { BadRequestException, ForbiddenException, UnauthorizedException } = require("@nestjs/common");
const { Reflector } = require("@nestjs/core");
const { JwtAuthGuard } = require("../dist/auth/jwt-auth.guard");
const { RequirePage } = require("../dist/auth/page-permissions");
const { PageAccessController } = require("../dist/admin-management/page-access.controller");
const { ProductContentController } = require("../dist/product-content/product-content.controller");

test("JWT válido exige permissão atual e retorna 403 após revogação", async () => {
  class ModuleController {}
  RequirePage("historico")(ModuleController);
  const user = { id: "member", email: "member@example.test", active: true, isAdmin: false, authVersion: 1, pagePermissions: [] };
  const jwt = { verifyAsync: async () => ({ sub: user.id, email: user.email, authVersion: 1 }) };
  const prisma = { user: { findUnique: async () => user } };
  const guard = new JwtAuthGuard(jwt, prisma, new Reflector());
  const request = { headers: { authorization: "Bearer test" } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => ModuleController,
  };
  await assert.rejects(guard.canActivate(context), ForbiddenException);
  user.pagePermissions = [{ page: "historico" }];
  assert.equal(await guard.canActivate(context), true);
  user.pagePermissions = [];
  await assert.rejects(guard.canActivate(context), ForbiddenException);
  user.isAdmin = true;
  assert.equal(await guard.canActivate(context), true);
  user.active = false;
  await assert.rejects(guard.canActivate(context), UnauthorizedException);
});

test("produto exige acesso à página e assinatura ativa", async () => {
  const controller = new ProductContentController({
    assertProductAccess: async () => { throw new ForbiddenException("Produto inativo"); },
    listContent: async () => ["post"],
  });
  const request = { user: { id: "member", isAdmin: false, allowedPages: ["mentorias"] } };
  await assert.rejects(controller.list(request, "AULAO"), /não tem acesso a esta página/);
  await assert.rejects(controller.list(request, "MENTORSHIP"), /Produto inativo/);
  request.user.isAdmin = true;
  assert.deepEqual(await controller.list(request, "MENTORSHIP"), ["post"]);
});

test("alteração impede autoedição, promoção, edição de administradores e sessões revogadas", async (testContext) => {
  const previousAdmins = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "protected@example.test";
  testContext.after(() => {
    if (previousAdmins === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previousAdmins;
  });
  const actor = { id: "actor", email: "actor@example.test", active: true, isAdmin: true, authVersion: 1 };
  const target = { id: "target", email: "protected@example.test", isAdmin: false };
  const audit = [];
  const transaction = {
    $queryRaw: async () => [actor, target],
    userPagePermission: { upsert: async ({ create }) => ({ page: create.page, allowed: create.allowed }) },
    adminAuditLog: { create: async ({ data }) => audit.push(data) },
  };
  const controller = new PageAccessController({ $transaction: (run) => run(transaction) });
  const request = { user: { ...actor, allowedPages: [] } };
  await assert.rejects(controller.set(request, actor.id, "historico", { allowed: true }), ForbiddenException);
  await assert.rejects(controller.set(request, target.id, "administradores-admin", { allowed: true }), BadRequestException);
  await assert.rejects(controller.set(request, target.id, "historico", { allowed: true }), ForbiddenException);
  target.email = "member@example.test";
  await assert.rejects(controller.set({ user: { ...request.user, isAdmin: false } }, target.id, "historico", { allowed: true }), ForbiddenException);
  actor.authVersion = 2;
  await assert.rejects(controller.set(request, target.id, "historico", { allowed: true }), ForbiddenException);
  assert.equal(audit.length, 0);
  actor.authVersion = 1;
  assert.deepEqual(await controller.set(request, target.id, "historico", { allowed: false }), { page: "historico", allowed: false });
  assert.equal(audit[0].action, "PAGE_ACCESS_CHANGED");
});
