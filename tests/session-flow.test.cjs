const assert = require("node:assert/strict");
const { test } = require("node:test");

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
