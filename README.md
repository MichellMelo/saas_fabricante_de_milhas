# SaaS Fabricante de Milhas

Aplicação full-stack em evolução para organizar programas de fidelidade, saldos de pontos, histórico de transações, passagens e decisões de resgate.

## Stack definida

- **Frontend:** Next.js App Router + React + TypeScript
- **UI:** shadcn/ui (componentes locais no padrão shadcn) + Lucide React
- **Backend:** NestJS + TypeScript
- **Banco:** PostgreSQL
- **ORM:** Prisma

O repositório usa npm workspaces: apps/web contém o frontend e apps/api contém a API.

## Requisitos

- Node.js 20.11 ou superior
- npm
- PostgreSQL local ou instância gerenciada
- Variáveis de ambiente configuradas a partir de .env.example

## Desenvolvimento local

1. Instale as dependências na raiz:

   ~~~bash
   npm install
   ~~~

2. Copie .env.example para .env e configure DATABASE_URL para seu PostgreSQL local. Nunca versione credenciais reais.

3. Gere o Prisma Client:

   ~~~bash
   npm run prisma:generate
   ~~~

4. Quando o banco estiver criado e acessível, aplique as migrações de desenvolvimento:

   ~~~bash
   npm run prisma:migrate
   ~~~

5. Inicie frontend e API em terminais separados:

   ~~~bash
   npm run dev:web
   npm run dev:api
   ~~~

   Frontend: http://localhost:3000  
   Health check da API: http://localhost:4000/api/health

   Também é possível iniciar os dois com npm run dev.

## Estrutura

~~~text
apps/
  web/
    src/app/                 # Next.js App Router
    src/components/          # Dashboard e componentes shadcn
    src/lib/                 # utilitários
  api/
    src/                     # NestJS controllers e módulos
    src/prisma/              # integração Prisma
    prisma/schema.prisma     # modelo PostgreSQL
tests/
  stack-smoke-check.py
~~~

## Modelo de dados inicial

O schema Prisma descreve User, LoyaltyProgram, LoyaltyAccount, PointTransaction e FlightRecord, com índices para consultas por usuário e data. É uma base inicial: as regras de domínio, autenticação, isolamento de acesso, auditoria e migrações precisam ser revisadas antes de uso real.

## Estado atual e limites

- O dashboard usa **dados fictícios** para apresentar a direção visual; ainda não consome a API nem o banco.
- A API NestJS fornece apenas GET /api/health e registra o serviço Prisma.
- O schema é uma primeira proposta e não substitui uma revisão do domínio.
- Autenticação, autorização, isolamento multiusuário, validação de DTOs, testes de integração, migrações versionadas e deploy ainda não estão implementados.
- Não cadastrar CPF, credenciais ou dados financeiros reais até concluir a arquitetura de segurança e privacidade.
- As oportunidades de milhas não são ofertas vigentes e não devem embasar decisões financeiras.

## Scripts principais

| Comando | Finalidade |
|---|---|
| npm run dev:web | Next.js em desenvolvimento |
| npm run dev:api | NestJS em modo watch |
| npm run typecheck | Verificação TypeScript dos dois workspaces |
| npm run build | Build do frontend e da API |
| npm run prisma:generate | Geração do Prisma Client |
| npm run prisma:migrate | Migrações de desenvolvimento |
| npm run prisma:studio | Interface local para explorar o banco |

## Direção visual

Interface premium executiva, azul-marinho, dourado discreto, superfícies claras, responsividade, foco visível e suporte a prefers-reduced-motion.
