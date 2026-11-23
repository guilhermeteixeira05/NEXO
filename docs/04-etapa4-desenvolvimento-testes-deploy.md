# Etapa 4 — Desenvolvimento Funcional, Testes e Deploy

> Entregáveis da apostila (seção 1.4): codificação da aplicação, testes de responsividade em múltiplos viewports, validação de acessibilidade, testes de usabilidade com usuários e publicação oficial.

## 1. Codificação da aplicação

| Item | Situação | Onde |
|---|---|---|
| Aplicação web Next.js 16 + React 19 + TypeScript | ✅ Concluída | `src/` |
| Banco de dados Supabase com RLS | ✅ Migração pronta e testada em PostgreSQL | `supabase/migrations/` |
| IA real (Anthropic Claude), chamada pelo servidor | ✅ Implementada; ativa ao definir `ANTHROPIC_API_KEY` | `src/lib/ai/`, `src/app/api/assistente/` |
| API pública BrasilAPI | ✅ Implementada e testada com chamada real | `src/lib/holidays/brasilapi.ts` |
| Os 6 módulos usando os mesmos dados | ✅ | `src/lib/snapshot.ts` |

Arquitetura detalhada: [arquitetura-aplicacao.md](arquitetura-aplicacao.md). Requisitos e rastreabilidade: [02-etapa2-requisitos.md](02-etapa2-requisitos.md#4-rastreabilidade-requisito--tela--código).

### Como os módulos compartilham os dados

Uma atividade cadastrada em **Tarefas** (`tasks`):
1. aparece no **Painel**, no **Calendário** e na programação do dia;
2. entra no contexto enviado à **IA**, que pode consultá-la e propor reagendá-la;
3. é encaixada pelo **Planejamento** nas janelas de **Disponibilidade**;
4. gera **Lembrete** automático quando tem horário;
5. ao ser concluída ou adiada, é registrada no **Histórico** (`activity_log`);
6. alimenta os **Insights** (taxa de conclusão, padrões, mais adiadas) e o **briefing proativo**.

## 2. Testes de responsividade em múltiplos viewports

Executados com Playwright em 8 larguras (320, 375, 480, 768, 1024, 1200, 1440 e 1920 px), cobrindo as 5 faixas da apostila. Resultado: **sem rolagem horizontal** e **alvos de toque ≥ 44 px** nas páginas públicas. Detalhes e capturas: [relatório de testes](relatorio-testes.md#5-interface-responsividade-e-acessibilidade-testse2epublicspects).

| Faixa (apostila) | Layout implementado |
|---|---|
| 320–480 px | 1 coluna, barra inferior, botão "+" flutuante |
| 481–768 px | 1 coluna com mais respiro; formulários em 2 colunas |
| 769–1024 px | Menu lateral recolhido (ícones), conteúdo em 2 colunas |
| 1025–1200 px | Menu lateral completo, indicadores em 4 colunas |
| ≥ 1201 px | Painel em 3 colunas, largura máxima de 1440 px |

## 3. Validação de acessibilidade

axe-core (0 violações nos temas claro e escuro) e Lighthouse (Acessibilidade 100). Itens manuais e pendências: [relatório de acessibilidade](relatorio-acessibilidade.md).

## 4. Testes de usabilidade com usuários

**Pendente.** O roteiro com 8 tarefas, métricas (sucesso, tempo, erros, SUS) e modelo de registro está pronto em [relatório de usabilidade](relatorio-usabilidade.md#3-roteiro-de-teste-de-usabilidade-com-usuários). A equipe deve realizá-lo com participantes reais e registrar os resultados.

## 5. Publicação oficial

O projeto está pronto para a Vercel (build aprovado, variáveis documentadas). A publicação depende das contas do grupo; o passo a passo está em [deploy-vercel.md](deploy-vercel.md). Após publicar, registre o endereço no [README](../README.md#aplicação-publicada) e no [checklist](checklist-entrega.md).
