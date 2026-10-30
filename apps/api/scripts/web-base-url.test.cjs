const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getWebBaseUrl } = require("../dist/clients/web-base-url.js");

test("accepts the public HTTPS origin in production", () => {
  assert.equal(
    getWebBaseUrl({ NODE_ENV: "production", WEB_BASE_URL: "https://fabricantedemilhas.vercel.app/" }),
    "https://fabricantedemilhas.vercel.app",
  );
});

test("rejects a missing URL in production", () => {
  assert.throws(() => getWebBaseUrl({ NODE_ENV: "production" }), { status: 500 });
});

test("rejects localhost HTTP in production", () => {
  assert.throws(
    () => getWebBaseUrl({ NODE_ENV: "production", WEB_BASE_URL: "http://localhost:3000" }),
    { status: 500 },
  );
});

test("rejects malformed URLs and non-origin paths", () => {
  for (const WEB_BASE_URL of ["not-a-url", "https://example.com/path", "https://example.com?x=1", "https://user:pass@example.com"]) {
    assert.throws(() => getWebBaseUrl({ NODE_ENV: "production", WEB_BASE_URL }), { status: 500 });
  }
});

test("allows local HTTP only for loopback hosts outside production", () => {
  assert.equal(
    getWebBaseUrl({ NODE_ENV: "development", WEB_BASE_URL: "http://localhost:3000/" }),
    "http://localhost:3000",
  );
  assert.throws(
    () => getWebBaseUrl({ NODE_ENV: "development", WEB_BASE_URL: "http://example.com" }),
    { status: 500 },
  );
});
