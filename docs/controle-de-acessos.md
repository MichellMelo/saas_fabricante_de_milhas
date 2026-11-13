# Controle de Acessos

Em **Administrativo → Controle de Acessos**, procure um usuário por nome ou e-mail e ajuste os switches. Cada alteração é salva individualmente e registrada na auditoria. Páginas administrativas continuam reservadas às contas administradoras, inclusive as identificadas por `ADMIN_EMAILS`. O cadastro de programas pessoais pode ser liberado separadamente, enquanto o catálogo geral só pode ser alterado por administradores.

Contas novas começam com todas as páginas bloqueadas. O convite continua criando os acessos aos produtos selecionados. Libere também a página de cada produto neste painel. O acesso ao produto precisa estar ativo e dentro do prazo para a página aparecer. Revogações valem na próxima requisição à API. Na navegação, permissões atualizadas são carregadas ao recarregar a página ou renovar a sessão.

A migração Prisma `20261113150000_user_page_permissions` concede às contas existentes as páginas de trabalho que já estavam disponíveis e concede páginas de produtos onde já existe uma relação de acesso. Validade, ativação e expiração dos produtos continuam verificadas em cada leitura. A tabela tem RLS e bloqueia acesso direto por papéis da Data API.

Para validar em homologação, execute a migração com `npm run prisma:deploy` apontando para um banco separado, antes de iniciar a API nova. Execute `npm run typecheck`, `npm run build` e `npm run test:page-access --workspace @fabricante/api`. Confira uma conta existente, uma conta recém-convidada e uma administradora. Alterne um switch e tente abrir o módulo pelo link direto `/#historico` e pela API com a conta afetada.
