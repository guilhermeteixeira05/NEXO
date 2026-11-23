# Relatório de Testes

> Todos os resultados marcados como **aprovado** foram obtidos executando os testes neste repositório em **23/11/2026** (Windows 11, Node.js 26.13, Google Chrome estável). Itens que dependem de credenciais ou de pessoas aparecem como **pendente**. Nada aqui é simulado.

## 1. Resumo

| Tipo | Ferramenta | Comando | Resultado |
|---|---|---|---|
| Verificação de tipos | TypeScript 5.9 (strict) | `npm run typecheck` | ✅ 0 erros |
| Qualidade de código | ESLint 9 + regras do Next/React | `npm run lint` | ✅ 0 erros, 0 avisos (3 erros iniciais corrigidos) |
| Build de produção | Next.js 16.4.6 | `npm run build` | ✅ 21 rotas + proxy |
| Unitários (regras de negócio e integração com a IA) | Vitest 4.1 | `npm test` | ✅ 63 testes |
| Integração com API pública (real) | Vitest + BrasilAPI | `npm test` | ✅ 1 teste (feriados de 2026) |
| Banco de dados (migração, RLS, transação) | Vitest + PGlite (PostgreSQL) | `npm test` | ✅ 11 testes |
| Interface, navegação e responsividade | Playwright 1.65 + Chrome | `npm run test:e2e` | ✅ 35 testes nas páginas públicas |
| Acessibilidade automática | axe-core 4.14 | `npm run test:e2e` | ✅ 0 violações (6 varreduras: 3 páginas × 2 temas) |
| Desempenho, acessibilidade, boas práticas e SEO | Lighthouse 13.6 | ver seção 6 | ✅ A11y 100 · BP 100 · SEO 100 · Desempenho 87–100 |
| Fluxos autenticados de ponta a ponta | Playwright (`tests/e2e/app.spec.ts`) + Supabase real | `E2E_SUPABASE=1 npx playwright test tests/e2e/app.spec.ts` | ✅ 7 testes (ver seção 5.1) |
| Acessibilidade das telas autenticadas | axe-core 4.14 | (mesmo comando acima) | ✅ 0 violações nas 10 telas |
| Chat com resposta real da IA | Playwright + API Gemini (`gemini-3.5-flash-lite`, nível gratuito) | (mesmo comando acima) | ✅ A IA respondeu citando a atividade pendente "Estudar inglês", lida do banco |
| WAVE | Extensão WebAIM | manual | ⏳ **Pendente** |
| Testes com usuários | Roteiro em [relatório de usabilidade](relatorio-usabilidade.md#3-roteiro-de-teste-de-usabilidade-com-usuários) | presencial | ⏳ **Pendente**: requer participantes reais |

**Total automatizado executado:** 117 testes aprovados (75 Vitest + 35 Playwright nas páginas públicas + 7 Playwright com login).

## 2. Testes unitários — regras de negócio (`tests/unit`)

| Arquivo | O que cobre | Requisitos |
|---|---|---|
| `dates.test.ts` | Conversão de fuso (Brasília e Amazonas), soma de dias e meses, segunda-feira da semana, validação de datas e horas, formatação em português | RNF12 |
| `task-rules.test.ts` | Recorrência (diária, dias úteis, semanal, mensal, data final), atraso, adiadas com frequência, agrupamento, agenda do dia, duração estimada | RF12, RF13, RF15, RF18, RN01, RN03, RN05 |
| `scheduler.test.ts` | Encaixe por prioridade, intervalo de 10 min, compromissos fixos, atrasadas primeiro, não agendar no passado, respeito ao prazo, sem disponibilidade, feriados, sobreposição, fora da disponibilidade, validação de blocos da IA | RF26–RF32, RN06, RN07 |
| `ai-proposals.test.ts` | Validação das propostas da IA: reagendamento válido com estado anterior, id inexistente, compromisso fixo, atividade concluída, data passada, conflito, criar e priorizar, formato inválido; contexto sem e-mail nem IDs | RF23, RN08, RN09, RNF05, RNF07 |
| `insights.test.ts` | Indicadores do período, taxa de conclusão, dia mais produtivo, período de pico, mais adiadas, sugestões; sinais proativos e bloqueio de links externos | RF25, RF39–RF44 |
| `validation-and-holidays.test.ts` | Esquemas de formulário (compromisso, campos vazios, campo ausente, recorrência, cadastro); parsing da BrasilAPI e tratamento de 404, falha de rede e ano inválido | RF01, RF09, RF45, RNF09 |
| `ai-gemini.test.ts` | Integração com o Gemini, com o SDK `@google/genai` trocado por um dublê de teste (sem rede): escolha do provedor, conversão do histórico, laço de ferramentas (id e nome na resposta da função, turno do modelo preservado com `thoughtSignature`), erro devolvido à IA, bloqueio de segurança e limite de tokens, saída JSON validada pelo esquema, mensagens para 429 e 403 | RF19–RF23, RNF09 |
| `ai-gemini-retry.test.ts` | Novas tentativas com o SDK `@google/genai` real e uma função `fetch` de teste (sem rede): 503, 503 e sucesso → resposta na 3ª tentativa; desiste após 3 tentativas mantendo o status do erro; 429 e 400 não são repetidos | RNF09 |

**Defeito encontrado pelos testes e corrigido:** o sinal proativo "Ver programação" apontava para `/painel#programacao`, que era recusado pela lista de links permitidos (só aceitava `?` e `/`). Com isso, a ação sugerida pela IA perderia o destino. Corrigido em `src/lib/insights/signals.ts`.

## 3. Integração com a API pública (`tests/integration/brasilapi.live.test.ts`)

Chamada **real** a `https://brasilapi.com.br/api/feriados/v1/2026`: aprovada, com 14 feriados, incluindo 20/11 (Consciência Negra) e 25/12 (Natal). Antes disso, a resposta e o 404 para o ano 1800 foram conferidos manualmente com `Invoke-WebRequest`.

## 4. Banco de dados (`tests/db/schema-rls.test.ts`)

A migração `supabase/migrations/20261123000000_nexo_schema.sql` é aplicada em um PostgreSQL real (PGlite), com um esqueleto mínimo do Supabase (schema `auth`, função `auth.uid()` e papéis `anon`/`authenticated`). Testes aprovados:

1. A migração roda sem erros e o gatilho cria o perfil com o nome do cadastro.
2. Restrições: compromisso sem horário, término antes do início, concluída sem data de conclusão e link externo em notificação são recusados.
3. RLS: o dono vê as próprias linhas e `user_id` recebe `auth.uid()` por padrão.
4. RLS: outro usuário não lê, não altera e não exclui dados alheios (0 linhas afetadas).
5. RLS: não é possível inserir em nome de outro usuário nem vincular objetivo ou tarefa alheia.
6. O histórico aceita apenas inserção (UPDATE e DELETE recebem "permission denied").
7. Perfil: atualiza o próprio, não altera o de outro, não exclui.
8. O papel `anon` (sem login) não acessa nenhuma tabela.
9. `approve_plan`: outro usuário não consegue aprovar.
10. `approve_plan`: aplica reagendamento, criação e prioridade numa transação, **não move compromisso fixo** (o item é listado como ignorado) e registra o histórico.
11. `approve_plan`: impede aprovar duas vezes.

> Observação: o PGlite reproduz o PostgreSQL, mas não o serviço Supabase Auth/PostgREST. O comportamento no Supabase real deve ser confirmado pela suíte E2E autenticada.

## 5. Interface, responsividade e acessibilidade (`tests/e2e/public.spec.ts`)

Servidor de produção (`next start`) + Google Chrome via Playwright, fuso America/Sao_Paulo, idioma pt-BR.

| Grupo | Testes | Resultado |
|---|---|---|
| Estrutura: `lang="pt-BR"`, título, meta viewport, link "Pular para o conteúdo" como 1º foco, um único `h1` | 1 | ✅ |
| Rotas protegidas redirecionam sem sessão (`/painel`, `/tarefas`, `/assistente`) | 1 | ✅ |
| APIs exigem autenticação (`/api/assistente`, `/api/notificacoes` → 401) | 1 | ✅ |
| Cabeçalhos de segurança (`nosniff`, `DENY`, sem `X-Powered-By`) | 1 | ✅ |
| Sem rolagem horizontal em 320, 375, 480, 768, 1024, 1200, 1440 e 1920 px × 3 páginas | 24 | ✅ |
| Alvos de toque ≥ 44 px em 320–768 px (dentro dos 24 acima) | — | ✅ |
| axe WCAG 2.1 AA, temas claro e escuro × 3 páginas | 6 | ✅ 0 violações |
| Texto a 200% sem rolagem horizontal | 1 | ✅ |

**Defeitos encontrados pelos testes E2E e corrigidos:**

| Defeito | Correção |
|---|---|
| URL inexistente redirecionava para `/configurar` ou `/entrar` em vez da página 404 | O proxy passou a proteger apenas as rotas da área autenticada (`src/lib/supabase/proxy.ts`) |
| `/api/assistente` e `/api/notificacoes` respondiam 500 sem Supabase configurado | `getUserOrNull()` retorna usuário nulo → resposta 401 |
| Link do logotipo com 36 px de altura (abaixo de 44 px) | `.logo` com `min-height: 44px` |
| Contraste insuficiente no fim do gradiente do título e no rodapé sobre o fundo com brilhos (revisão manual do item "incompleto" do axe) | Gradiente de texto por tema e brilhos reduzidos (ver [relatório de acessibilidade](relatorio-acessibilidade.md)) |

Capturas de tela: `docs/relatorios/capturas/`. Relatórios do axe: `docs/relatorios/axe/`.

## 5.1 Fluxos com login no Supabase real (`tests/e2e/app.spec.ts`)

Executado em 23/11/2026 contra o projeto Supabase do grupo (migração aplicada, confirmação de e-mail desligada), servidor de produção e Google Chrome. **7 de 7 aprovados** em três execuções: duas sem chave de IA e uma com a `GEMINI_API_KEY` (IA real).

| Teste | O que faz | Resultado |
|---|---|---|
| Cadastro e configuração inicial (RF01, RF03, RF07) | Cria uma conta, percorre as 4 etapas, cadastra um objetivo e chega ao Painel com o nome do usuário | ✅ |
| Tarefas (RF09, RF12, RF13) | Cria 2 atividades, recarrega a página (persistência), conclui uma, adia a outra para amanhã e confere os dois eventos no Histórico | ✅ |
| Planejamento (RF26, RF24) | Gera o plano semanal e o aprova quando há itens a aprovar | ✅ |
| Lembretes (RF33, RF38) | Cria um lembrete diário | ✅ |
| Calendário (RF45) | Dezembro de 2026 mostra "Feriado nacional: Natal" vindo da BrasilAPI | ✅ |
| Assistente (RF19) | Pergunta "Quais tarefas ainda preciso concluir?" e espera a resposta real do Gemini citar "Estudar inglês". Sem chave, o mesmo teste confirma o aviso "IA não configurada" (nenhuma resposta simulada) | ✅ com a IA real |
| Responsividade e acessibilidade | 10 telas em 320, 768 e 1440 px: sem rolagem horizontal, alvos ≥ 44 px no celular e no tablet, axe sem violações | ✅ |

Cada execução cria uma conta `nexo.e2e.<timestamp>@teste.dev` no projeto. Essas contas podem ser excluídas em **Authentication → Users**.

**Observação da execução com IA real:** na revisão do plano, o Gemini respondeu uma vez `503 UNAVAILABLE` (alta demanda). O NEXO registrou o erro e entregou o plano das regras locais, identificado como tal, sem travar a tela. Falhas temporárias assim são comuns no nível gratuito. **Melhoria feita a partir disso:** o cliente do Gemini agora repete automaticamente as falhas temporárias (408 e 5xx) até 3 vezes, com espera de cerca de 1 s e 2 s (`GEMINI_HTTP_OPTIONS` em `src/lib/ai/gemini.ts`). O 429 (limite da cota) não é repetido. Coberto por `ai-gemini-retry.test.ts` e conferido com uma chamada real ao Gemini usando a mesma configuração.

**Defeitos encontrados por esta suíte e corrigidos:**

| Defeito | Correção |
|---|---|
| Criar uma atividade simples falhava com "Revise os campos destacados", sem campo destacado: "Repetir até" não aparece quando a atividade não se repete, e o valor ausente (`null`) era recusado | `emptyToUndefined` trata `null` como vazio (`src/lib/validation/schemas.ts`), com teste de regressão |
| Depois de um envio recusado, o React 19 limpava o formulário e o usuário perdia o que tinha digitado | Hook `useActionForm` (`src/components/ui/useActionForm.ts`), aplicado a todos os formulários |
| Campo de data de "Adiar" com 40 px de altura | Altura mínima de 44 px |
| axe crítico `aria-allowed-attr`: `aria-pressed` em `<label>` nos seletores segmentados (Planejamento e Nova atividade) | Estado visual por `data-selected` (o rádio nativo já informa a seleção) e contorno de foco no item |

Ajustes no próprio teste (não eram defeitos do app): seletores ambíguos, espera do salvamento antes de recarregar, contexto explícito do navegador para o axe, ignorar conteúdo de `<details>` fechado e medir o interruptor pela área do rótulo (o `<label>` inteiro, com 44 px de altura, aciona o campo).

## 5.2 Revisão visual no navegador (conta de demonstração, Supabase e IA reais)

Em 23/11/2026, o NEXO foi aberto no navegador em modo de produção (`next start`), com uma conta de demonstração e atividades de exemplo. A revisão encontrou defeitos que os testes automáticos não pegavam. Todos foram corrigidos e ganharam verificação automática:

| Defeito | Causa | Correção | Verificação nova |
|---|---|---|---|
| A configuração inicial mostrava as 4 etapas de uma vez | `.form { display: flex }` vencia o atributo `hidden` das etapas | `[hidden] { display: none !important }` em `base.css` | O teste de cadastro confere que só a etapa atual aparece |
| Depois de "Concluir" a configuração, a tela ficava em "Salvando…" enquanto a IA gerava o briefing do Painel | O Painel esperava a IA antes de aparecer | O briefing é carregado dentro de um `<Suspense>`: o Painel aparece na hora e as sugestões entram depois. O limite de cada tentativa do Gemini caiu para 20 s | O teste de cadastro exige o Painel em até 20 s |
| No celular, o logotipo do cabeçalho aparecia sem o fundo azul | Os logotipos repetiam o mesmo `id` de gradiente; o primeiro estava no menu lateral, escondido no celular | Um `id` único por logotipo (`useId`) | As 10 telas são conferidas sem `id` repetido |
| No celular, apareciam dois botões "Nova atividade" e o título "Painel" ficava cortado | `.btn { display: inline-flex }` vencia `.topbar__new { display: none }` | Seletor `.topbar .topbar__new` | Até 768 px, o botão do cabeçalho precisa estar escondido |

O teste de responsividade com login passou a ter 3 minutos de limite: ele carrega 30 telas e faz 10 varreduras do axe, e com a IA real a soma passava de 60 s.

## 6. Lighthouse (`docs/relatorios/lighthouse/`)

Executado com `npx lighthouse@13.6.0 <url> --preset=desktop` (ou sem preset, para celular) sobre `next start`:

| Página | Perfil | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | CLS |
|---|---|---|---|---|---|---|---|
| `/` | Celular | 87 | 100 | 100 | 100 | 0,9 s | 0 |
| `/` | Desktop | 100 | 100 | 100 | 100 | 0,3 s | 0 |
| `/configurar` | Celular | 95 | 100 | 100 | 100 | 0,8 s | 0 |
| `/configurar` | Desktop | 100 | 100 | 100 | 100 | 0,2 s | 0 |

A meta do RNF08 (Desempenho ≥ 80) foi atingida. Execução local, sem CDN.

## 6.1 Lighthouse no site publicado (Vercel)

Executado em 23/11/2026 em <https://nexo-a3.vercel.app> (`docs/relatorios/lighthouse/vercel-*.json`):

| Página | Perfil | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | CLS |
|---|---|---|---|---|---|---|---|
| `/` | Celular | 94 | 100 | 100 | 100 | 1,0 s | 0 |
| `/` | Desktop | 82 | 100 | 100 | 100 | 0,4 s | 0 |

No mesmo dia, os 35 testes de `tests/e2e/public.spec.ts` (responsividade em 8 larguras, axe, cabeçalhos de segurança e rotas protegidas) foram aprovados contra o site publicado: `E2E_BASE_URL=https://nexo-a3.vercel.app npx playwright test tests/e2e/public.spec.ts`.

## 7. Matriz de cobertura dos módulos

| Módulo / item pedido | Automatizado e aprovado | Pendente (motivo) |
|---|---|---|
| Cadastro e login | Validação dos formulários; rotas protegidas; APIs 401; cadastro real e configuração inicial no Supabase | Entrar e sair pela tela de login |
| Perfil e preferências | Gatilho e RLS do perfil; telas de Perfil e Configurações (responsividade e axe) | Editar preferências pela tela |
| Tarefas e objetivos | Regras, recorrência, restrições SQL, RLS; criar, concluir e adiar no Supabase, com persistência | Editar e excluir pela tela; objetivos pela tela |
| Disponibilidade | Uso no planejador; cadastro na configuração inicial | — |
| Chat com IA | Validação de propostas; contexto; rota 401; integração com o Gemini (unitário); resposta real do Gemini com os dados do usuário; aviso "IA não configurada" | Proposta de reorganização feita pelo chat |
| Planejamento diário | Planejador, conflitos, validação de blocos; plano semanal gerado no Supabase | — |
| Reorganização / aprovação | `approve_plan` transacional no PostgreSQL; aprovação pela tela | Proposta criada pela IA |
| Lembretes | Criação de lembrete diário pela tela | Notificação disparada no horário |
| Histórico e insights | Métricas, padrões, sinais; histórico registra conclusão e adiamento | Resumo semanal pela IA |
| API pública | Chamada real + tratamento de erros; feriado no calendário autenticado | — |
| Persistência | Migração em PostgreSQL real; dados no Supabase após recarregar | — |
| Segurança e permissões | RLS, anon, cabeçalhos, chave só no servidor | — |
| Responsividade | 8 larguras nas páginas públicas; 10 telas autenticadas em 320, 768 e 1440 px | — |
| Acessibilidade | axe + Lighthouse nas páginas públicas; axe nas 10 telas autenticadas | WAVE; leitor de tela |
| Usabilidade com usuários | Roteiro pronto | Participantes reais |

## 8. Como executar

```bash
npm install
npm run check                 # tipos + lint + testes Vitest (unitários, banco e BrasilAPI)
npm run build
npm run test:e2e              # páginas públicas (sobe o servidor sozinho na porta 3100)
# Fluxos autenticados (Supabase no .env.local, migração aplicada, confirmação de e-mail desativada):
E2E_SUPABASE=1 npx playwright test tests/e2e/app.spec.ts
```

No PowerShell: `$env:E2E_SUPABASE=1; npx playwright test tests/e2e/app.spec.ts`. Sem internet, use `SKIP_LIVE=1` para pular o teste real da BrasilAPI.
