# Divisão do Projeto entre os Integrantes

> Divisão definida pelo grupo. Cada integrante trabalha na sua branch `feature/*`, abre Pull Request para `develop` e revisa o PR de pelo menos um colega (ver [CONTRIBUTING.md](../CONTRIBUTING.md)). A documentação de RF, RNF e acessibilidade já está pronta e deve apenas ser **mantida atualizada** quando o código mudar.

## Responsabilidades e arquivos

| Integrante | Escopo | Branch | Arquivos principais |
|---|---|---|---|
| **1 — Interface e integração** | Dashboard, navegação, identidade visual, responsividade, componentes compartilhados, integração dos módulos | `feature/interface` | `src/styles/*`, `src/components/ui/*`, `src/components/layout/*`, `src/components/dashboard/*`, `src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/painel/`, `src/app/page.tsx`, `src/lib/snapshot.ts`, Figma |
| **2 — Usuários e perfil** | Cadastro, autenticação, perfil, preferências, objetivos | `feature/usuarios` | `src/lib/auth/*`, `src/lib/profile/*`, `src/lib/supabase/*`, `src/proxy.ts`, `src/components/auth/*`, `src/components/profile/*`, `src/components/goals/*`, `src/app/entrar/`, `src/app/cadastro/`, `src/app/(onboarding)/`, `src/app/(app)/perfil/`, `src/app/(app)/objetivos/`, `src/app/(app)/configuracoes/` |
| **3 — Tarefas e organização** | Tarefas, prioridades, categorias, calendário, disponibilidade | `feature/tarefas` | `src/lib/tasks/*`, `src/components/tasks/*`, `src/components/profile/AvailabilityEditor.tsx`, `src/app/(app)/tarefas/`, `src/app/(app)/calendario/`, `src/lib/dates.ts` |
| **4 — Inteligência artificial** | Chat, integração com IA, análise personalizada, planejamento, reorganização | `feature/ia` | `src/lib/ai/*`, `src/lib/planning/*`, `src/app/api/assistente/`, `src/components/assistant/*`, `src/components/planning/*`, `src/app/(app)/assistente/`, `src/app/(app)/planejamento/` |
| **5 — Acompanhamento** | Lembretes, notificações, histórico, insights, API pública | `feature/lembretes` | `src/lib/reminders/*`, `src/lib/history/*`, `src/lib/insights/*`, `src/lib/holidays/*`, `src/app/api/notificacoes/`, `src/components/reminders/*`, `src/app/(app)/lembretes/`, `src/app/(app)/insights/` |

Compartilhados (alterar só com combinação no grupo): `src/lib/types.ts`, `src/lib/validation/schemas.ts`, `supabase/migrations/*`.

## Contratos entre módulos

Os contratos são **tipos e funções exportadas**. Quem consome um contrato não acessa diretamente as tabelas do outro módulo.

| Contrato | Fornecedor | Consumidores | Assinatura |
|---|---|---|---|
| Tipos de domínio | Todos (arquivo comum) | Todos | `src/lib/types.ts` (`Task`, `Goal`, `Plan`, `PlanItem`, `Reminder`, `ActivityLogEntry`...) |
| Sessão | Integrante 2 | Todos | `requireUser()`, `getProfile()`, `getUserOrNull()` — `src/lib/auth/session.ts` |
| Atividades | Integrante 3 | 1, 4, 5 | `listActiveTasks(supabase, userId)`, `listTasks(...)`, `getTask(...)` — `src/lib/tasks/queries.ts` |
| Regras de atividade | Integrante 3 | 1, 4, 5 | `isOverdue`, `nextOccurrence`, `groupTasks`, `tasksOnDate`, `estimatedMinutes` — `src/lib/tasks/rules.ts` |
| Objetivos e disponibilidade | Integrante 2 | 1, 4, 5 | `listGoals`, `listAvailability` — `src/lib/profile/queries.ts` |
| Histórico | Integrante 5 | 2, 3, 4 | `logActivity(supabase, { userId, event, taskId?, planId?, title?, category?, details? })` — `src/lib/history/log.ts` |
| Feriados | Integrante 5 | 1, 3, 4 | `fetchHolidays(ano)`, `fetchHolidaysBetween(inicio, fim)` → `{ ok, holidays } \| { ok: false, error }` |
| Planejador | Integrante 4 | 1, 5 | `buildSchedule(input)` → `{ blocks, fixed, conflicts, unscheduled, notes, freeMinutesByDate }` |
| Propostas | Integrante 4 | 1 | `PlanCard` (componente), `approvePlanAction(planId)`, `rejectPlanAction(planId)` |
| Indicadores e sinais | Integrante 5 | 1, 4 | `computeMetrics(...)`, `computeSignals(...)`, `getBriefing(...)` |
| Dados compartilhados | Integrante 1 | 1, 4, 5 | `loadUserSnapshot()` → `UserSnapshot` (`src/lib/snapshot.ts`) |
| Componentes de UI | Integrante 1 | Todos | `Icon`, `Dialog`, `TextField`, `SelectField`, `SubmitButton`, `useToast`, `PageHeader`, `Notice`... |

## Regras de integração

1. Toda Server Action começa com `requireUser()` e valida a entrada com Zod.
2. Toda mudança relevante em atividades chama `logActivity` (senão os Insights ficam incompletos).
3. Mudanças no banco = **nova migração** em `supabase/migrations/` (nunca editar a migração já aplicada) + atualização de `src/lib/types.ts` + teste em `tests/db/`.
4. Componentes novos usam os tokens de `src/styles/tokens.css` (nada de cores fixas) e mantêm alvos de toque de 44 px ou mais.
5. Antes do PR: `npm run check` e `npm run build` precisam passar.
