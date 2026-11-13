# Controle de Acessos

Em **Administrativo → Controle de Acessos**, procure um usuário por nome ou e-mail e ajuste os switches. Cada alteração é salva individualmente e registrada na auditoria. O switch **Administrativo** libera a consulta dos lançamentos financeiros da própria conta. Gerenciamento de clientes, lançamentos, administradores, catálogo geral e permissões exige uma conta administradora.

No cadastro público, a conta recebe Visão geral, Programas e saldos, Cadastro de programas pessoais, Calculadoras e Passagens e resgates. Financeiro de Milhas, Histórico de Oportunidades, Administrativo e páginas de produtos começam bloqueados. O convite continua criando os acessos aos produtos selecionados. Libere também a página de cada produto neste painel. Revogações valem na próxima requisição à API. Na navegação, permissões atualizadas são carregadas ao recarregar a página ou renovar a sessão.

O cadastro normaliza o e-mail, reserva endereços administrativos configurados e encaminha quem tem convite pendente para o fluxo de convite. Contas públicas começam ativas e o endereço informado ainda precisa ser confirmado por um administrador antes de qualquer promoção. Ao usar `ADMIN_EMAILS`, adicione somente endereços de contas cuja titularidade foi verificada.

A API aceita até 20 tentativas de cadastro por endereço de conexão e 120 no total por janela de 15 minutos por processo. Requisições pelo mesmo proxy podem compartilhar a cota. Para múltiplas instâncias ou grande volume, configure também limite por cliente na borda. O cadastro usa as variáveis já existentes e não adiciona migração além da já prevista para controle de acessos.

A migração Prisma `20261113150000_user_page_permissions` concede às contas existentes as páginas de trabalho que já estavam disponíveis e concede páginas de produtos onde já existe uma relação de acesso. Validade, ativação e expiração dos produtos continuam verificadas em cada leitura. A tabela tem RLS e bloqueia acesso direto por papéis da Data API.

Para validar em desenvolvimento, aponte a API para um banco local e aplique as migrações pendentes com `npm run prisma:deploy`. Abra `/register`, crie uma conta e entre pelo login. Teste `/#mile-finance`, `/#historico` e `/#financeiro` antes e depois de ligar os switches correspondentes com a conta administrativa. Atualize a página e confirme que a sessão e as permissões persistem. Verifique também uma conta criada por convite.
