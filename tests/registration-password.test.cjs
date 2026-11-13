const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { ValidationPipe } = require("@nestjs/common");
const ts = require("typescript");

function loadSource(file) {
  const source = readFileSync(join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
  });
  const exports = {};
  new Function("require", "exports", outputText)(require, exports);
  return exports;
}

const { getPasswordChecks, getRegistrationPasswordStatus, RegistrationPasswordChecklist } = loadSource(
  "apps/web/src/components/registration-password-checklist.tsx",
);
const { RegisterDto } = loadSource("apps/api/src/auth/dto/register.dto.ts");

test("cada requisito muda de cor e ícone ao digitar e reverte ao apagar", () => {
  const states = [
    ["", [false, false, false, false]],
    ["Abcd", [false, true, false, false]],
    ["Abcd1", [false, true, true, false]],
    ["Abcd1!", [true, true, true, true]],
    ["Abcd1", [false, true, true, false]],
    ["abcd1!", [true, false, true, true]],
    ["Abcde!", [true, true, false, true]],
    ["Abcde1", [true, true, true, false]],
  ];
  for (const [password, expected] of states) {
    const checks = getPasswordChecks(password);
    assert.deepEqual(checks.map(({ met }) => met), expected);
    const html = renderToStaticMarkup(createElement(RegistrationPasswordChecklist, { checks }));
    const rows = [...html.matchAll(/<li .*?<\/li>/g)].map(([row]) => row);
    assert.equal(rows.length, 4);
    rows.forEach((row, index) => {
      assert.match(row, expected[index] ? /text-emerald-700.*lucide-check/ : /text-red-700.*lucide-x/);
    });
    assert.equal(html.includes("Senha atende a todos os requisitos"), expected.every(Boolean));
  }
});

test("cadastro fica bloqueado até a confirmação coincidir e respeita o limite do bcrypt", () => {
  assert.equal(getRegistrationPasswordStatus("Abcd1!", "").canRegister, false);
  assert.equal(getRegistrationPasswordStatus("Abcd1!", "Abcd2!").canRegister, false);
  assert.equal(getRegistrationPasswordStatus("Abcd1!", "Abcd1!").canRegister, true);
  assert.equal(getRegistrationPasswordStatus("Abcd1", "Abcd1").canRegister, false);
  const longPassword = "Ab1!" + "🙂".repeat(18);
  const status = getRegistrationPasswordStatus(longPassword, longPassword);
  assert.equal(status.exceedsLimit, true);
  assert.equal(status.canRegister, false);
});

test("o DTO da API aplica os mesmos critérios de composição", async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  const validate = (password) => pipe.transform({
    name: "Conta de teste", email: "register@example.test", password, passwordConfirmation: password,
  }, { type: "body", metatype: RegisterDto });

  for (const valid of ["Abcd1!", "Ábcde٢€", "Abc1🙂x"]) {
    assert.equal((await validate(valid)).password, valid);
    assert.ok(getPasswordChecks(valid).every(({ met }) => met));
  }
  for (const invalid of ["Ab1!", "abcde1!", "Abcde!", "Abcde1", "Abcd1 "]) {
    await assert.rejects(validate(invalid), (error) => error.getStatus() === 400);
    assert.ok(getPasswordChecks(invalid).some(({ met }) => !met));
  }
});
