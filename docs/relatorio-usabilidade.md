# Relatório Técnico de Usabilidade

> Critério da apostila (seção 1.3): "atendimento comprovado a pelo menos 5 heurísticas de Nielsen (com documentação explícita de como foram aplicadas no sistema)".
> Este relatório liga cada heurística à **tela** e ao **arquivo** onde ela foi implementada. A seção 3 traz o roteiro de teste com usuários, que **ainda não foi executado** (depende de participantes reais).

## 1. Evidências por heurística

### H1 — Visibilidade do status do sistema ✅

| Onde | Evidência | Arquivo |
|---|---|---|
| Todos os formulários | Botão muda para "Salvando…" com indicador giratório e fica desabilitado durante o envio | `src/components/ui/SubmitButton.tsx` |
| Após ações (concluir, adiar, excluir, aprovar) | Aviso com o resultado ("“Treino” concluída. Próxima ocorrência: 30/11/2026.") anunciado por `aria-live` | `src/components/ui/Toast.tsx`, `src/components/tasks/TaskItem.tsx` |
| Assistente | Indicador "NEXO está pensando…" enquanto a IA responde | `src/components/assistant/ChatView.tsx` |
| Navegação | Item ativo destacado e marcado com `aria-current="page"` | `src/components/layout/Navigation.tsx` |
| Notificações | Contador de não lidas no sino, atualizado a cada 60 s | `src/components/layout/NotificationBell.tsx` |
| Configuração inicial | Barra de progresso e texto "Etapa 3 de 4" | `src/components/profile/OnboardingWizard.tsx` |
| Planos | Selo "Aguardando sua aprovação" / "Aprovado" / "Rejeitado" e origem ("revisado pela IA" / "planejador local") | `src/components/planning/PlanCard.tsx` |
| Tarefas | "N atividades encontradas" ao filtrar | `src/components/tasks/TaskBoard.tsx` |
| Painel | O restante da tela aparece na hora; enquanto a IA prepara as sugestões, o espaço mostra "O NEXO está analisando sua rotina…" (`role="status"`) | `src/components/dashboard/BriefingPanel.tsx` |

### H2 — Correspondência entre o sistema e o mundo real ✅

- Vocabulário do dia a dia: "Adiar para amanhã", "Programação de hoje", "Horários livres", "Agora e a seguir".
- Datas em português e no formato brasileiro (`segunda-feira, 23 de novembro`, `25/12`), relógio de 24 h e fuso `America/Sao_Paulo` (`src/lib/dates.ts`).
- Feriados nacionais reais da BrasilAPI no calendário e no planejamento.
- Calendário começando no domingo, como os calendários brasileiros (`src/app/(app)/calendario/page.tsx`).
- Ícones com metáforas conhecidas (sino, alvo, calendário, prancheta).

### H3 — Controle e liberdade do usuário ✅

- **A IA nunca altera dados sozinha**: cada proposta tem "Aprovar", "Pedir ajustes" e "Rejeitar" (`PlanCard.tsx`); a aprovação é a única forma de aplicar mudanças (`approve_plan` no banco).
- Concluir pode ser desfeito ("Reabrir") pelo mesmo botão (`toggleCompleteAction`).
- Diálogos fecham com Esc, clique fora ou "Fechar", e o foco volta ao botão que os abriu (`Dialog.tsx`).
- A configuração inicial permite "Pular configuração" e "Voltar" entre as etapas.
- O assistente proativo pode ser desligado (Configurações).

### H4 — Consistência e padrões ✅

- Design system único (tokens, botões, campos, cartões) compartilhado entre o Figma e o código (`src/styles/tokens.css` ↔ variáveis do Figma).
- O mesmo componente de atividade (`TaskItem`) no Painel, em Tarefas e no Calendário; o mesmo formulário (`TaskForm`) para criar e editar em qualquer tela.
- Navegação com a mesma ordem de destinos em todas as faixas de tela.
- Prioridade sempre com a mesma cor **e** o mesmo rótulo (`PriorityBadge`).

### H5 — Prevenção de erros ✅

- Confirmação antes de excluir atividades e objetivos, informando que a ação não pode ser desfeita.
- Validação no servidor com Zod: término posterior ao início, compromisso com data e horário, recorrência com data inicial (`src/lib/validation/schemas.ts`).
- Campo de data para adiar não aceita datas passadas (`min`).
- Campos opcionais que não aparecem na tela (ex.: "Repetir até" quando a atividade não se repete) são ignorados na validação, em vez de bloquear o cadastro (defeito encontrado nos testes autenticados e corrigido).
- Propostas da IA validadas antes de gravar: atividade inexistente, data passada, compromisso fixo ou conflito de horário são recusados (`src/lib/ai/proposals.ts`).
- Planos mostram **conflitos** e **atividades que não couberam** antes da aprovação.

### H6 — Reconhecimento em vez de memorização ✅

- O Painel reúne programação do dia, próximas 2 horas, pendências, objetivos e próximo feriado.
- Perguntas sugeridas no chat ("Como está minha programação de amanhã?").
- Prévia "antes → depois" em cada item de proposta.
- Filtros e categorias visíveis; o formulário explica cada tipo de atividade.

### H7 — Flexibilidade e eficiência de uso ✅

- Criação rápida: botão "+" flutuante (celular) e "Nova atividade" no cabeçalho (tablet e desktop).
- Adiar com um toque ("Para amanhã", "Para a próxima semana").
- Pedidos em linguagem natural ao assistente; Enter envia, Shift+Enter quebra linha.
- Links diretos de ação no briefing ("Reorganizar", "Planejar amanhã").

### H8 — Estética e design minimalista ✅

- Uma ação principal por tela; cartões só com o essencial e ações extras no menu "⋯".
- Barra inferior com 5 destinos no celular; demais itens na gaveta "Mais".
- Cores de estado usadas somente para estado (atraso, conflito, sucesso).

### H9 — Reconhecer, diagnosticar e recuperar-se de erros ✅

- Mensagens junto ao campo, com ícone, `aria-invalid` e `aria-describedby`, dizendo como corrigir ("Informe um horário de término depois do início.").
- Falhas da BrasilAPI: "Feriados indisponíveis no momento", e a página continua funcionando.
- Falhas da IA com causa e orientação (chave inválida, limite gratuito atingido, sem conexão) — `aiErrorMessage`.
- Falhas temporárias do Gemini (ex.: "alta demanda") são repetidas automaticamente antes de mostrar erro, e o planejamento continua funcionando com as regras locais se a IA não responder.
- Depois de um envio recusado, o formulário **mantém o que foi digitado** e o usuário só corrige o campo indicado (`src/components/ui/useActionForm.ts`). Esse defeito (o React 19 limpava os campos) foi encontrado pelos testes autenticados e corrigido.
- Página de erro com "Tentar novamente" e 404 com caminhos de volta.

### H10 — Ajuda e documentação ✅

- Estados vazios que ensinam o próximo passo ("Você ainda não tem objetivos. Crie o primeiro…").
- Textos de apoio em disponibilidade, preferências e tipos de atividade.
- Seção "Como o NEXO usa seus dados" nas Configurações.
- Página `/configurar` com instruções quando o ambiente não está configurado.

**Resultado:** as 10 heurísticas foram aplicadas (o mínimo exigido é 5). As cinco centrais para a avaliação são **H1, H3, H5, H6 e H9**.

## 2. Verificações automatizadas relacionadas à usabilidade

| Verificação | Ferramenta | Resultado (23/11/2026) |
|---|---|---|
| Sem rolagem horizontal de 320 a 1920 px (8 larguras) | Playwright (`tests/e2e/public.spec.ts`) | Aprovado nas páginas públicas |
| Sem rolagem horizontal nas 10 telas autenticadas (320, 768 e 1440 px) | Playwright (`tests/e2e/app.spec.ts`) + Supabase real | Aprovado |
| Alvos de toque ≥ 44 × 44 px no celular e no tablet | Playwright | Aprovado nas páginas públicas (falha inicial no logotipo, com 36 px, corrigida) e nas telas autenticadas (campo de data de "Adiar", com 40 px, corrigido) |
| Fluxos principais com login: cadastro, configuração inicial, criar/concluir/adiar, plano, lembrete, feriados e chat com a IA real | Playwright + Supabase real | Aprovado (7 de 7); dois defeitos de formulário encontrados e corrigidos (ver H5 e H9) |
| Zoom de texto a 200% sem rolagem horizontal | Playwright | Aprovado |
| Lighthouse: Acessibilidade / Boas práticas / SEO | Lighthouse 13.6 | 100 / 100 / 100 (celular e desktop) |

Detalhes da suíte com login: [relatório de testes, seção 5.1](relatorio-testes.md#51-fluxos-com-login-no-supabase-real-testse2eappspects). Esses testes automatizados **não substituem** os testes com usuários reais da seção 3, que continuam pendentes.

## 3. Roteiro de teste de usabilidade com usuários

> **Status: PENDENTE.** Os resultados abaixo devem ser preenchidos pela equipe após sessões com participantes reais. Nenhum dado foi inventado.

**Objetivo:** verificar se pessoas do público-alvo conseguem organizar a rotina com o NEXO sem ajuda e se confiam nas propostas da IA.

**Participantes:** 5 pessoas (recomendação clássica de Nielsen para encontrar a maioria dos problemas), de preferência próximas das personas: estudante que trabalha, profissional com muitos compromissos e pessoa com horários irregulares.

**Preparação:** aplicação publicada; conta de teste nova por participante; celular **e** computador; termo de consentimento (uso das observações apenas para o trabalho, sem gravar dados pessoais).

**Protocolo:** pensar em voz alta; o moderador não ajuda (só repete a tarefa); cronometrar; anotar erros e hesitações.

| # | Tarefa | Critério de sucesso | Heurísticas observadas |
|---|---|---|---|
| T1 | Crie sua conta e informe que tem tempo livre de segunda a sexta, das 19h às 22h | Chega ao Painel com a disponibilidade salva | H1, H3, H10 |
| T2 | Cadastre "Treino de peito" amanhã das 18h30 às 19h30, com lembrete | Compromisso aparece em Tarefas, no Calendário e no Painel | H4, H5, H7 |
| T3 | Cadastre 3 tarefas sem horário (uma de prioridade alta) | Tarefas na lista com prioridade correta | H2, H6 |
| T4 | Peça ao NEXO para organizar o dia de amanhã e aprove a proposta | Plano aprovado; horários aparecem na programação | H1, H3, H5 |
| T5 | Pergunte ao assistente "Estou acumulando atividades?" | O participante entende a resposta e a relaciona aos dados | H2, H6 |
| T6 | Adie uma tarefa para a próxima semana | Tarefa movida; histórico registra o adiamento | H7, H9 |
| T7 | Descubra qual foi seu dia mais produtivo | Encontra a informação em Insights | H6, H8 |
| T8 | Mude o aplicativo para o tema escuro | Tema alterado em Configurações | H4, H10 |

**Métricas a registrar:** taxa de sucesso por tarefa; tempo por tarefa; número de erros; **SUS** (System Usability Scale, 10 perguntas, escala 1–5) ao final; pergunta aberta: "Você confiaria no NEXO para reorganizar sua semana? Por quê?".

**Modelo de registro (preencher):**

| Participante | Perfil | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | SUS | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | — | — | — | — | — | — | — | — | — | — | — |
| P2 | — | — | — | — | — | — | — | — | — | — | — |
| P3 | — | — | — | — | — | — | — | — | — | — | — |
| P4 | — | — | — | — | — | — | — | — | — | — | — |
| P5 | — | — | — | — | — | — | — | — | — | — | — |

**Depois das sessões:** classificar cada problema por gravidade (0 a 4, escala de Nielsen), corrigir os de gravidade 3 e 4 antes da entrega e registrar aqui o que mudou.
