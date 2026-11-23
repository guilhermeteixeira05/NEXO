<p align="center">
  <img src="src/app/icon.svg" width="64" height="64" alt="Logotipo do NEXO" />
</p>

# NEXO — Assistente Pessoal Inteligente

> Projeto A3 · Usabilidade, Desenvolvimento Web, Mobile e Jogos · Sistemas de Informação

O **NEXO** é um assistente pessoal com inteligência artificial que organiza tarefas, compromissos, hábitos e objetivos em uma única aplicação web responsiva. Ele conversa sobre a rotina do usuário com base nos dados reais dele, gera planejamentos diários e semanais nos horários livres, avisa antes que algo saia do controle e **só altera a agenda com a aprovação do usuário**.

| | |
|---|---|
| **Figma** | <https://www.figma.com/design/9hzmKgGYbPMaTvYTgbRyRn> ([organização do arquivo](docs/figma.md)) |
| **Aplicação publicada** | _pendente — preencher após o deploy na Vercel_ ([como publicar](docs/deploy-vercel.md)) |
| **Documentação** | [docs/](docs/README.md) |

## Sumário

[Problema e objetivo](#problema-e-objetivo) · [Funcionalidades](#funcionalidades) · [Tecnologias](#tecnologias) · [Arquitetura](#arquitetura) · [Estrutura de pastas](#estrutura-de-pastas) · [Instalação](#instalação) · [Banco de dados](#configuração-do-banco-de-dados-supabase) · [Variáveis de ambiente](#variáveis-de-ambiente) · [IA](#configuração-da-ia) · [API pública](#api-pública-brasilapi) · [Testes](#testes) · [Publicação](#publicação) · [Equipe](#equipe-e-colaboração)

## Problema e objetivo

**Problema:** a dificuldade de organizar tarefas, compromissos e objetivos pessoais, manter consistência e administrar o tempo, sobretudo quando as informações estão espalhadas em várias ferramentas.

**Objetivo:** desenvolver um assistente pessoal inteligente que transforme objetivos, compromissos e responsabilidades em planejamentos personalizados, lembretes e recomendações.

**Diferencial:** o NEXO não é só um chatbot, um calendário ou uma lista de tarefas. Todos os módulos usam o **mesmo modelo de dados**, a IA conhece objetivos, disponibilidade e histórico de adiamentos, e toda alteração sugerida chega como **prévia para aprovação**. Detalhes em [Etapa 1](docs/01-etapa1-problema-e-publico.md) e na [análise de concorrentes](docs/02-etapa2-analise-concorrentes.md).

## Funcionalidades

| Módulo | Funcionalidades |
|---|---|
| **1. Usuários e perfil** | Cadastro, login/logout, configuração inicial em 4 etapas, perfil, preferências (período de foco, duração padrão, antecedência de lembretes, tema), objetivos com progresso, disponibilidade semanal, troca de senha |
| **2. Tarefas e organização** | Tarefas, compromissos e hábitos; criar, editar, excluir (com confirmação), concluir/reabrir, adiar com um toque; prioridades, categorias, prazos e recorrência (diária, dias úteis, semanal, mensal); busca e filtros; calendário mensal; programação diária |
| **3. Assistente com IA** | Chat com Claude usando os dados do usuário; consultas sobre a rotina; análise de tarefas e objetivos; propostas de reorganização com prévia; aprovar, rejeitar ou pedir ajustes; briefing proativo no Painel |
| **4. Planejamento inteligente** | Plano diário, semanal e reorganização de adiadas; ordenação por atraso, prioridade, prazo e objetivo; respeito à disponibilidade e aos compromissos; conflitos e atividades não encaixadas; sugestões de melhoria; revisão pela IA |
| **5. Lembretes** | Lembretes avulsos ou de atividades, recorrentes; avisos das próximas 2 h; notificação diária de atrasadas; central de notificações; notificações do navegador (opcional) |
| **6. Histórico e insights** | Linha do tempo de conclusões, adiamentos e planos; taxa de conclusão, concluídas por dia e por categoria; dia mais produtivo, período de pico, mais adiadas; acompanhamento de objetivos; resumo semanal gerado pela IA |
| **API pública** | Feriados nacionais da **BrasilAPI** no calendário, no painel, no planejamento e no contexto da IA |

Fora do escopo desta versão: consultoria de investimentos, dietas, diagnósticos médicos, prescrição de exercícios, voz contínua e automação de dispositivos.

## Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · CSS (variáveis, Grid, Flexbox, media queries) · Supabase (PostgreSQL + Auth + RLS) · API Anthropic (Claude) · Zod · BrasilAPI · Vitest · PGlite · Playwright · axe-core · Lighthouse · Git/GitHub · Vercel.
Justificativa e versões: [arquitetura da aplicação](docs/arquitetura-aplicacao.md#2-tecnologias).

## Arquitetura

```text
Navegador (React) ──► proxy.ts (sessão) ──► Páginas / Server Actions / Route Handlers (Next.js na Vercel)
                                              │            │                 │
                                   Regras puras (planejador, métricas, validação da IA)
                                              │            │                 │
                                     Supabase (PostgreSQL + RLS)   Anthropic Claude   BrasilAPI
```

Interface, regras de negócio, persistência, serviços externos e integração com IA ficam em módulos separados. Diagramas, modelo de dados e segurança: [docs/arquitetura-aplicacao.md](docs/arquitetura-aplicacao.md).

## Estrutura de pastas

```text
├── docs/                    Documentação acadêmica, técnica e relatórios
├── supabase/migrations/     Esquema do banco, RLS e função approve_plan
├── src/
│   ├── app/                 Rotas (públicas, (onboarding), (app) autenticado, api/)
│   ├── components/          ui/ (design system), layout/, tasks/, planning/, assistant/...
│   ├── lib/                 auth, profile, tasks, ai, planning, reminders, insights, holidays...
│   ├── styles/              tokens.css, base.css, layout.css, components.css, pages.css
│   └── proxy.ts             Sessão e proteção de rotas
└── tests/                   unit/, db/, integration/, e2e/
```

## Instalação

**Requisitos:** Node.js 20.9 ou mais recente (testado no 26.13), npm, Git; conta gratuita no Supabase; chave da API Anthropic (para a IA).

```bash
git clone https://github.com/SEU-USUARIO/nexo.git
cd nexo
npm install
cp .env.example .env.local      # PowerShell: Copy-Item .env.example .env.local
# preencha o .env.local (veja abaixo)
npm run dev                     # http://localhost:3000
```

Produção local: `npm run build` e depois `npm start`.

Sem o `.env.local`, as páginas públicas funcionam e as rotas internas levam a `/configurar`, que explica o que falta.

## Configuração do banco de dados (Supabase)

1. Crie um projeto em <https://supabase.com> (região São Paulo).
2. **SQL Editor** → cole e execute `supabase/migrations/20261123000000_nexo_schema.sql`. Isso cria 12 tabelas, restrições, índices, o gatilho que cria o perfil, as políticas de **Row Level Security** e a função `approve_plan`.
3. **Authentication → URL Configuration**: Site URL = endereço do app; Redirect URLs = `http://localhost:3000/**` e a URL da Vercel.
4. Copie a Project URL e a chave **publishable** para o `.env.local`.

Passo a passo completo: [docs/deploy-vercel.md](docs/deploy-vercel.md).

## Variáveis de ambiente

| Variável | Onde é usada | Obrigatória | Exemplo |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | Sim | `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador e servidor (protegida por RLS) | Sim | `sb_publishable_…` |
| `ANTHROPIC_API_KEY` | **somente servidor** | Para a IA | `sk-ant-…` |
| `ANTHROPIC_MODEL` | servidor | Não | `claude-haiku-5-5` (padrão) |
| `NEXT_PUBLIC_SITE_URL` | link de confirmação de e-mail | Sim em produção | `https://nexo.vercel.app` |

Nunca faça commit do `.env.local`. O `.env.example` não contém valores reais.

## Configuração da IA

- Crie uma chave em <https://console.anthropic.com> e defina `ANTHROPIC_API_KEY`. O modelo padrão é `claude-haiku-5-5` (rápido e barato); para respostas mais elaboradas, use `ANTHROPIC_MODEL=claude-opus-5-5`.
- A chave só é lida no servidor (`src/lib/ai/client.ts`). O navegador conversa com `/api/assistente`.
- Sem a chave, o chat informa que a IA não está configurada (**não há respostas simuladas**). O planejamento, o briefing e o resumo semanal passam a usar as regras locais e indicam isso na tela.
- O que é enviado à IA: [arquitetura § 5](docs/arquitetura-aplicacao.md#5-segurança-e-privacidade).

## API pública (BrasilAPI)

`GET https://brasilapi.com.br/api/feriados/v1/{ano}`: gratuita e sem chave. Implementada em `src/lib/holidays/brasilapi.ts`, com tempo limite de 8 s, validação da resposta, cache de 24 h e mensagens de erro. Nenhuma configuração é necessária.

## Testes

```bash
npm run check        # TypeScript + ESLint + Vitest (unitários, banco PostgreSQL/RLS e BrasilAPI real)
npm run build
npm run test:e2e     # Playwright + axe: páginas públicas em 8 larguras de tela (usa o Google Chrome instalado)
```

Resultados de 23/11/2026: **95 testes automatizados aprovados**; axe com 0 violações WCAG 2.1 AA; Lighthouse com Acessibilidade, Boas práticas e SEO em 100. A suíte autenticada (`tests/e2e/app.spec.ts`) requer um Supabase de teste e está **pendente**. Relatório completo: [docs/relatorio-testes.md](docs/relatorio-testes.md).

## Publicação

Vercel + Supabase. Importe o repositório em <https://vercel.com/new>, cadastre as variáveis de ambiente e faça o deploy. Guia: [docs/deploy-vercel.md](docs/deploy-vercel.md).

<a id="aplicação-publicada"></a>**Aplicação publicada:** _pendente_.

## Equipe e colaboração

O projeto está dividido em 5 frentes (interface, usuários, tarefas, IA e acompanhamento), com branches e contratos entre módulos: [docs/divisao-equipe.md](docs/divisao-equipe.md). Fluxo de trabalho, padrão de commits e como enviar ao GitHub: [CONTRIBUTING.md](CONTRIBUTING.md).

<a id="figma"></a>**Figma:** <https://www.figma.com/design/9hzmKgGYbPMaTvYTgbRyRn>

---

Projeto acadêmico. Referências: apostila da Aula 04 — Projeto A3 e Interfaces Responsivas; Nielsen (1994); W3C WCAG 2.1.
