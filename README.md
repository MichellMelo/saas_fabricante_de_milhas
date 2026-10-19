# SaaS Fabricante de Milhas

Aplicação full-stack em evolução para organizar programas de fidelidade, saldos de pontos, histórico de transações, passagens e decisões de resgate.

## Stack

- Frontend: Next.js App Router + React + TypeScript
- UI: shadcn/ui (componentes locais no padrão shadcn) + Lucide React
- Backend: NestJS + TypeScript
- Banco: PostgreSQL
- ORM: Prisma

O repositório usa npm workspaces: apps/web contém o frontend e apps/api contém a API.

## Requisitos e configuração

- Node.js 20.11 ou superior, npm e PostgreSQL
- Copie .env.example para .env e configure DATABASE_URL e JWT_SECRET. Gere o JWT_SECRET com pelo menos 32 caracteres aleatórios; não use o valor de exemplo em produção e nunca versione segredos reais.
- Instale dependências: `npm install`
- Gere o Prisma Client: `npm run prisma:generate`
- Aplique migrações em desenvolvimento: `npm run prisma:migrate`
- Em ambiente de deploy, use `npm run prisma:deploy` para aplicar migrações versionadas.

Inicie frontend e API em terminais separados com `npm run dev:web` e `npm run dev:api`, ou use `npm run dev`.

Frontend: http://localhost:3000  
Health check: http://localhost:4000/api/health

## Supabase (PostgreSQL remoto)

O projeto Supabase `saas_fabricante_de_milhas` é o banco remoto de desenvolvimento. Nunca versione a senha do banco, `DATABASE_URL`, `JWT_SECRET` ou chaves secretas.

1. No painel do Supabase, abra **Project Settings → Database** (ou **Connect**) e copie a URI PostgreSQL apropriada para o backend. Prefira a conexão direta se o ambiente suportar IPv6; caso contrário, use o Session pooler indicado pelo Supabase. Não use a chave publishable/anon como senha do PostgreSQL.
2. Coloque a URI em `DATABASE_URL` no arquivo local `.env`, sem enviar o arquivo ao Git.
3. Como o schema inicial deste projeto foi criado diretamente no Supabase, registre-o como já aplicado no histórico do Prisma antes de executar futuras migrações:
   `npx prisma migrate resolve --applied 20261018000000_initial_auth_schema --schema apps/api/prisma/schema.prisma`
4. Confira o estado com `npx prisma migrate status --schema apps/api/prisma/schema.prisma` e gere o client com `npm run prisma:generate`.
5. A proteção específica do Supabase está documentada em `supabase/migrations/20261019021132_rls_and_rpc_security.sql`. As tabelas têm RLS ativado e não concedem acesso direto às roles `anon` e `authenticated`; o acesso da aplicação ocorre pela API NestJS via Prisma. Não conecte o frontend diretamente a essas tabelas sem desenhar autenticação Supabase e políticas RLS por usuário.

A conexão e o comando `migrate resolve` devem apontar para o projeto remoto correto. Não execute `prisma migrate dev` nesse banco remoto.

## Autenticação implementada

- `POST /api/auth/register`: cria conta com e-mail normalizado e senha armazenada com hash bcrypt.
- `POST /api/auth/login`: valida credenciais e devolve token JWT com validade de uma hora.
- `GET /api/auth/me`: endpoint protegido, requer `Authorization: Bearer <token>`.
- DTOs são validados globalmente; propriedades não declaradas são rejeitadas.
- O identificador do usuário autenticado vem do token validado, não de um campo enviado no corpo da requisição.

Exemplo de registro:

~~~json
{ "email": "voce@example.com", "password": "uma-senha-longa-com-12", "name": "Seu nome" }
~~~

A API ainda não implementa endpoints CRUD para contas de fidelidade, transações ou voos. Quando forem criados, cada consulta e mutação deve filtrar por `userId` derivado da sessão; nunca confiar em `userId` fornecido pelo cliente.

## Banco de dados

A migração inicial versionada fica em `apps/api/prisma/migrations`. O schema contém User, LoyaltyProgram, LoyaltyAccount, PointTransaction e FlightRecord. A migração cria a estrutura completa inicial e inclui `passwordHash` para autenticação. Não aplique essa migração sobre um banco já existente com tabelas criadas manualmente sem antes revisar o estado do banco e planejar o baseline.

## Limites e segurança

- O dashboard ainda usa dados fictícios e não consome a API.
- Não há verificação de e-mail, recuperação de senha, rate limiting, MFA, revogação de sessão nem fluxo de exclusão de conta.
- A autenticação é uma fundação inicial, não uma auditoria de segurança. Antes de uso público, adicionar rate limiting, política de senha e testes de integração/segurança.
- Não cadastrar CPF, credenciais de programas de fidelidade ou dados financeiros reais antes de concluir a revisão de privacidade e segurança.
- O sistema ainda não integra programas de fidelidade nem consulta promoções reais.

## Scripts principais

| Comando | Finalidade |
|---|---|
| `npm run dev:web` | Next.js em desenvolvimento |
| `npm run dev:api` | NestJS em modo watch |
| `npm run typecheck` | Verificação TypeScript |
| `npm run build` | Build frontend e API |
| `npm run prisma:generate` | Geração Prisma Client |
| `npm run prisma:migrate` | Migração de desenvolvimento |
| `npm run prisma:deploy` | Aplicar migrações versionadas |
| `npm run prisma:studio` | Explorar o banco localmente |

## Direção visual

Interface premium executiva, azul-marinho, dourado discreto, superfícies claras, responsividade, foco visível e suporte a prefers-reduced-motion.
