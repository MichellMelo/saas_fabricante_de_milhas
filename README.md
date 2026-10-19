# SaaS Fabricante de Milhas

Fundação visual e dashboard executivo da plataforma Fabricante de Milhas.

## Executar localmente

Não há etapa de build ou dependências de runtime nesta fase. Abra o arquivo index.html em um navegador moderno. Para servir por HTTP local, execute na raiz do projeto:

```bash
python3 -m http.server 4173
```

Depois acesse http://localhost:4173.

## O que está incluído

- Layout executivo responsivo, com navegação lateral e cabeçalho.
- Indicadores, gráfico de evolução, distribuição por programa e oportunidades de exemplo.
- Estados de demonstração e navegação para módulos planejados.
- Interações acessíveis por teclado, foco visível e suporte a prefers-reduced-motion.
- Tokens CSS para cores, tipografia, espaçamento e superfícies.

## Limites intencionais da Fase 1

- Todos os saldos, percentuais, valores e oportunidades são fictícios.
- Não há autenticação, backend, banco de dados, integrações com programas de fidelidade, consulta de ofertas vigentes ou persistência.
- Não inserir dados pessoais, CPF, credenciais ou informações financeiras reais nesta versão.
- Fontes tipográficas são carregadas do Google Fonts; se a rede estiver indisponível, haverá fallback para fontes locais.

## Próximas etapas sugeridas

1. Definir autenticação, modelo de usuários e isolamento dos dados.
2. Modelar programas de fidelidade, contas, saldos e histórico de movimentações.
3. Especificar regras e testes das calculadoras de custo por milheiro, transferência, cashback e resgate.
4. Implementar integrações somente após validar fontes, termos de uso, segurança e atualização dos dados.

## Direção de interface

Estética premium executiva: azul-marinho, dourado discreto, superfícies claras, tipografia legível e animações curtas e funcionais. Movimentos de interface respeitam a preferência de movimento reduzido.
