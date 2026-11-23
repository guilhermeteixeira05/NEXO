# Checklist Final de Entrega — Projeto A3

Legenda: ✅ pronto · ⏳ depende do grupo · ❌ não feito

## Entregáveis da apostila (seção 1.2)

| Item | Situação | Observação |
|---|---|---|
| Aplicação hospedada e funcional (Vercel/Netlify) | ⏳ | Build aprovado; publicar conforme [deploy-vercel.md](deploy-vercel.md) e colar a URL no README |
| Repositório Git versionado, README, instruções e histórico de commits | ✅ local / ⏳ GitHub | Repositório local com branches e commits por funcionalidade; criar o remoto e enviar ([CONTRIBUTING.md](../CONTRIBUTING.md)) |
| Vídeo de até 10 min (problema, solução, arquitetura, heurísticas) | ⏳ | Roteiro pronto: [roteiro-video.md](roteiro-video.md) |

## Critérios mínimos de qualidade (seção 1.3)

| Critério | Situação | Evidência |
|---|---|---|
| ≥ 5 heurísticas de Nielsen documentadas | ✅ | 10 aplicadas — [relatório de usabilidade](relatorio-usabilidade.md) |
| Design responsivo e acessível (WCAG 2.1 AA) | ✅ público / ⏳ telas autenticadas | axe 0 violações, Lighthouse A11y 100 — [relatório de acessibilidade](relatorio-acessibilidade.md) |
| Navegação mobile fluida, alvos de toque adequados | ✅ | Barra inferior, botão "+", alvos ≥ 44 px testados |
| Consumo de ao menos uma API REST pública | ✅ | BrasilAPI (feriados) com teste real |
| Código limpo e modular + relatório técnico de usabilidade/acessibilidade | ✅ | ESLint/TypeScript sem erros; relatórios em `docs/` |

## Etapas

| Etapa | Situação | Documento |
|---|---|---|
| 1 — Problema e público | ✅ | [01-etapa1-problema-e-publico.md](01-etapa1-problema-e-publico.md) |
| 2 — Requisitos, concorrentes e usabilidade | ✅ | [requisitos](02-etapa2-requisitos.md) · [concorrentes](02-etapa2-analise-concorrentes.md) · [usabilidade](02-etapa2-fundamentacao-usabilidade.md) |
| 3 — Arquitetura, fluxogramas, wireframes e protótipo | ✅ | [03-etapa3-arquitetura-e-prototipacao.md](03-etapa3-arquitetura-e-prototipacao.md) · [Figma](figma.md) |
| 4 — Desenvolvimento, testes e deploy | ✅ código e testes / ⏳ deploy e testes com usuários | [04-etapa4-desenvolvimento-testes-deploy.md](04-etapa4-desenvolvimento-testes-deploy.md) |

## Tarefas do grupo antes da entrega

- [ ] Criar o projeto Supabase e aplicar a migração.
- [ ] Gerar a chave da Anthropic (e definir um limite de gastos).
- [ ] Configurar `.env.local` e rodar `npm run dev` localmente.
- [ ] Rodar a suíte autenticada: `E2E_SUPABASE=1 npx playwright test tests/e2e/app.spec.ts` (Supabase de teste) e anotar o resultado no [relatório de testes](relatorio-testes.md).
- [ ] Criar o repositório no GitHub, enviar `main` e `develop` e convidar os 4 colegas.
- [ ] Cada integrante fazer commits reais na sua `feature/*` (a rubrica avalia a colaboração no histórico).
- [ ] Publicar na Vercel e conferir as verificações pós-deploy.
- [ ] Rodar WAVE e Lighthouse na URL pública.
- [ ] Realizar os testes de usabilidade com 5 participantes e preencher a tabela.
- [ ] Compartilhar o Figma (Share → "Anyone with the link can view").
- [ ] Gravar o vídeo (máx. 10 min).
- [ ] Conferir todos os links: deploy, GitHub, Figma e vídeo.
