const assert = require("node:assert/strict");
const { test } = require("node:test");
const { randomUUID } = require("node:crypto");

const base = process.env.SESSION_TEST_URL;
const password = process.env.SESSION_TEST_PASSWORD;

function browser() {
  const cookies = new Map();
  async function request(path, { method = "GET", body, refreshOnly = false } = {}) {
    const cookie = [...cookies.entries()]
      .filter(([name]) => (!refreshOnly || name === "fm_refresh") &&
        (name !== "fm_refresh" || path.startsWith("/api/auth/")))
      .map(([name, value]) => `${name}=${value}`).join("; ");
    const response = await fetch(new URL(path, base), {
      method, redirect: "manual",
      headers: { Cookie: cookie, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const header of response.headers.getSetCookie()) {
      const [nameValue] = header.split(";");
      const separator = nameValue.indexOf("=");
      const name = nameValue.slice(0, separator);
      const value = nameValue.slice(separator + 1);
      if (value) cookies.set(name, value);
      else cookies.delete(name);
    }
    return response;
  }
  return { request };
}

test("login, recarga, renovação e permissões via Next e Nest", { skip: !base || !password }, async () => {
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname), "Use apenas um ambiente local descartável.");
  const admin = browser();
  const member = browser();
  const login = (client, email) => client.request("/api/auth/login", { method: "POST", body: { email, password } });
  assert.equal((await login(admin, "admin@example.test")).status, 200);
  assert.equal((await login(member, "new@example.test")).status, 200);

  async function dashboard(client) {
    const response = await client.request("/");
    assert.equal(response.status, 200);
    assert.match(await response.text(), /dashboard-shell/);
  }
  await dashboard(admin);
  await dashboard(member);
  await dashboard(member);

  const endpoint = "/api/admin/page-access";
  const search = await admin.request(`${endpoint}?q=new%40example.test`);
  assert.equal(search.status, 200);
  const { users } = await search.json();
  assert.equal(users.length, 1);
  const permission = `${endpoint}/${encodeURIComponent(users[0].id)}/historico`;
  const set = (allowed) => admin.request(permission, { method: "PUT", body: { allowed } });
  const history = "/api/flight-availability";
  assert.equal((await member.request(endpoint)).status, 403);
  assert.equal((await set(false)).status, 200);
  assert.equal((await member.request(history)).status, 403);
  const denied = await member.request("/clientes/test");
  assert.equal(denied.status, 200);
  assert.match(await denied.text(), /Acesso negado/);
  await dashboard(member);

  try {
    assert.equal((await set(true)).status, 200);
    assert.equal((await member.request(history)).status, 200);
    assert.equal((await member.request("/api/auth/profile", {
      method: "PATCH", body: { name: "Nova Conta QA" },
    })).status, 200);
    assert.equal((await member.request("/api/auth/refresh", { method: "POST", refreshOnly: true })).status, 200);
    await dashboard(member);
    assert.equal((await member.request(history)).status, 200);
  } finally {
    assert.equal((await set(false)).status, 200);
  }
  assert.equal((await member.request(history)).status, 403);
  assert.equal((await admin.request(history)).status, 200);
});

test("cadastro público, três switches e convite coexistem", { skip: !base || !password }, async () => {
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname));
  const admin = browser();
  const member = browser();
  const invited = browser();
  const email = `public-${randomUUID()}@example.test`;
  const inviteEmail = `invite-${randomUUID()}@example.test`;
  const newPassword = "Abcd1!";
  const details = { name: "Cadastro Público QA", email, password: newPassword, passwordConfirmation: newPassword };
  const post = (client, path, body) => client.request(path, { method: "POST", body });
  const register = (body) => post(member, "/api/auth/register", body);

  assert.equal((await register({ ...details, name: " ", email: "invalido" })).status, 400);
  for (const invalidPassword of ["Ab1!", "abcde1!", "Abcde!", "Abcde1"]) {
    assert.equal((await register({ ...details, password: invalidPassword, passwordConfirmation: invalidPassword })).status, 400);
  }
  assert.equal((await register({ ...details, passwordConfirmation: "outraSenha12" })).status, 400);
  assert.equal((await register({ ...details, isAdmin: true })).status, 400);
  assert.equal((await register({ ...details, email: "ADMIN@EXAMPLE.TEST" })).status, 409);
  const registered = await register(details);
  assert.equal(registered.status, 201);
  assert.equal(registered.headers.getSetCookie().length, 0);
  assert.equal((await register({ ...details, email: email.toUpperCase() })).status, 409);
  assert.equal((await post(member, "/api/auth/login", { email, password: newPassword })).status, 200);
  assert.equal((await post(admin, "/api/auth/login", { email: "admin@example.test", password })).status, 200);
  const dashboard = await member.request("/");
  assert.match(await dashboard.text(), /dashboard-shell/);
  assert.equal((await member.request("/api/loyalty-accounts")).status, 200);
  assert.match(await (await member.request("/clientes/test")).text(), /Acesso negado/);
  assert.equal((await member.request("/api/admin/page-access")).status, 403);

  const adminAccess = "/api/admin/page-access";
  const search = await admin.request(`${adminAccess}?q=${encodeURIComponent(email)}`);
  assert.equal(search.status, 200);
  const { users: [user] } = await search.json();
  assert.equal(user.isAdmin, false);
  const payment = { userId: user.id, product: "GROUP_VIP", amount: 20, dueAt: "2030-01-01" };
  const createdPayment = await post(admin, "/api/admin/payments", payment);
  assert.equal(createdPayment.status, 201);
  const ownPayment = await createdPayment.json();
  const other = await admin.request(`${adminAccess}?q=new%40example.test`);
  const { users: [otherUser] } = await other.json();
  assert.ok(otherUser?.id && otherUser.id !== user.id);
  assert.equal((await post(admin, "/api/admin/payments", { ...payment, userId: otherUser.id })).status, 201);
  const areas = {
    "mile-finance": "/api/mile-finance/dashboard",
    historico: "/api/flight-availability",
    administrativo: "/api/admin/payments",
  };
  for (const [page, endpoint] of Object.entries(areas)) {
    const permission = `${adminAccess}/${user.id}/${page}`;
    const set = (client, allowed) => client.request(permission, { method: "PUT", body: { allowed } });
    assert.equal((await member.request(endpoint)).status, 403);
    assert.equal((await set(member, true)).status, 403);
    assert.equal((await set(admin, true)).status, 200);
    const allowedResponse = await member.request(endpoint);
    assert.equal(allowedResponse.status, 200);
    if (page === "administrativo") {
      assert.deepEqual((await allowedResponse.json()).map(({ id, userId }) => ({ id, userId })), [{ id: ownPayment.id, userId: user.id }]);
    }
    const read = await admin.request(`${adminAccess}/${user.id}`);
    assert.ok((await read.json()).allowedPages.includes(page));
    assert.match(await (await member.request("/")).text(), /dashboard-shell/);
    assert.equal((await member.request("/api/admin/clients")).status, 403);
    assert.equal((await post(member, "/api/admin/payments", payment)).status, 403);
    assert.equal((await set(admin, false)).status, 200);
    assert.equal((await member.request(endpoint)).status, 403);
    assert.equal((await admin.request(endpoint)).status, 200);
  }

  const invitation = await post(admin, "/api/admin/invitations", { email: inviteEmail, products: ["GROUP_VIP"] });
  assert.equal(invitation.status, 201);
  const { inviteUrl } = await invitation.json();
  assert.equal((await register({ ...details, email: inviteEmail })).status, 409);
  const token = new URL(inviteUrl).searchParams.get("token");
  assert.equal((await post(invited, "/api/auth/accept-invitation", { token, name: "Convite QA", password: "ConviteLocal2026!" })).status, 200);
  assert.match(await (await invited.request("/")).text(), /dashboard-shell/);
  let limited;
  for (let attempt = 0; attempt <= 20; attempt++) {
    const response = await register({});
    if (response.status === 429) {
      limited = response;
      break;
    }
    assert.equal(response.status, 400);
  }
  assert.ok(limited && Number(limited.headers.get("Retry-After")) > 0);
});
