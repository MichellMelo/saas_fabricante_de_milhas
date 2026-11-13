const assert = require("node:assert/strict");
const { test } = require("node:test");
const { RegistrationRateGuard } = require("../dist/auth/registration-rate.guard");

test("limita tentativas por conexão e ignora cabeçalhos de origem informados pelo cliente", () => {
  const guard = new RegistrationRateGuard();
  const headers = new Map();
  const context = (claimedAddress) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        socket: { remoteAddress: "127.0.0.1" },
        headers: { "x-forwarded-for": claimedAddress },
      }),
      getResponse: () => ({ setHeader: (name, value) => headers.set(name, value) }),
    }),
  });
  for (let attempt = 0; attempt < 20; attempt++) {
    assert.equal(guard.canActivate(context(`192.0.2.${attempt}`)), true);
  }
  assert.throws(() => guard.canActivate(context("192.0.2.99")), (error) => error.getStatus() === 429);
  assert.ok(headers.get("Retry-After") > 0);
});
