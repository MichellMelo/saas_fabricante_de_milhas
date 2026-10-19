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
