# Testes de integração da API

Os testes de integração usam um PostgreSQL descartável em Docker. Eles não devem apontar para Supabase, desenvolvimento, homologação ou produção.

## Pré-requisitos

- Docker Desktop (ou Docker Engine) em execução.
- Dependências do monorepo instaladas.
- Node.js conforme a versão exigida pelo projeto.

## Executar no PowerShell

Na raiz do repositório:

```powershell
npm run test:integration:up --workspace=@fabricante/api

$env:TEST_DATABASE_URL = "postgresql://fabricante_test:fabricante_test_local_only@127.0.0.1:55432/fabricante_milhas_test?schema=public"
npm run test:integration --workspace=@fabricante/api
$testExitCode = $LASTEXITCODE
Remove-Item Env:TEST_DATABASE_URL

npm run test:integration:down --workspace=@fabricante/api
if ($testExitCode -ne 0) { exit $testExitCode }
```

O runner exige que `TEST_DATABASE_URL` seja informado explicitamente e valida protocolo, host local, porta e nome exato do banco antes de executar qualquer migração. Ele rejeita hosts remotos e referências conhecidas dos projetos Supabase de desenvolvimento e produção. Não usa `.env` como fallback.

O container executa `docker/init-test-db.sql` na primeira inicialização para criar os papéis locais `anon` e `authenticated`, exigidos pela migration de RLS. São papéis sem login, criados exclusivamente no PostgreSQL descartável; nenhuma migration da aplicação é alterada para acomodar o ambiente de teste.

O runner aplica as migrações com `prisma migrate deploy` e só então executa os arquivos `*.integration.test.ts`.

## Escopo atual

O primeiro teste real verifica, em PostgreSQL, que duas tentativas concorrentes de redefinição com o mesmo token resultem em exatamente uma operação bem-sucedida, uma rejeitada, um incremento de `authVersion` e um único evento de auditoria.

A simulação unitária existente continua separada e não substitui este teste de concorrência no banco real.
