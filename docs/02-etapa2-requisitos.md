# Etapa 2 — Requisitos Funcionais e Não Funcionais

> Entregável 1 de 3 da Etapa 2 (apostila, seção 1.4). Os demais são a [análise de concorrentes](02-etapa2-analise-concorrentes.md) e a [fundamentação de usabilidade](02-etapa2-fundamentacao-usabilidade.md).

**Legenda de prioridade (MoSCoW):** **M** = obrigatório · **S** = importante · **C** = desejável.
A coluna **Módulo** indica a frente de trabalho responsável (ver [divisão da equipe](divisao-equipe.md)).

---

## 1. Requisitos funcionais

### Módulo 1 — Usuários e perfil

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF01 | Cadastro | O usuário cria uma conta com nome, e-mail e senha (mínimo de 8 caracteres). | M |
| RF02 | Login e logout | O usuário entra com e-mail e senha e encerra a sessão em qualquer tela. | M |
| RF03 | Configuração inicial | Após o primeiro login, um assistente em etapas coleta perfil, preferências, disponibilidade e ao menos um objetivo (as etapas podem ser puladas). | M |
| RF04 | Gerenciar perfil | O usuário consulta e edita nome, ocupação e fuso horário. | M |
| RF05 | Preferências pessoais | O usuário define período de maior foco, duração padrão de tarefas, antecedência padrão dos lembretes, assistente proativo (ligado/desligado) e tema (sistema, claro ou escuro). | M |
| RF06 | Objetivos | O usuário cria, edita, conclui, pausa e exclui objetivos com título, descrição, categoria, prazo e progresso (0–100%). | M |
| RF07 | Disponibilidade | O usuário define janelas de horário livre para cada dia da semana, com uma ou mais janelas por dia. | M |
| RF08 | Configurações da conta | O usuário altera a senha, o tema, as notificações do navegador e encerra a sessão. | S |

### Módulo 2 — Tarefas e organização

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF09 | Criar atividade | O usuário cria uma **tarefa**, um **compromisso** (com horário fixo) ou um **hábito**, com título, descrição, categoria, prioridade, prazo, horário, duração estimada, recorrência e objetivo vinculado. | M |
| RF10 | Editar atividade | Todos os campos podem ser alterados após a criação. | M |
| RF11 | Excluir atividade | A exclusão pede confirmação e é registrada no histórico. | M |
| RF12 | Concluir atividade | Marca a atividade como concluída, registra data e hora e, se ela for recorrente, cria a próxima ocorrência. | M |
| RF13 | Adiar atividade | O usuário escolhe uma nova data (amanhã, próxima semana ou data livre); o contador de adiamentos é incrementado e o histórico é registrado. | M |
| RF14 | Prioridades e categorias | Prioridades: baixa, média, alta e urgente. Categorias: trabalho, estudos, pessoal, saúde, casa, finanças e outros. | M |
| RF15 | Recorrência | Repetição diária, em dias úteis, semanal ou mensal, com data final opcional. | M |
| RF16 | Filtros e busca | Filtrar por status, categoria e prioridade, e buscar pelo título. | S |
| RF17 | Calendário | Visão mensal com indicadores de atividades e feriados; ao escolher um dia, exibe a agenda daquele dia. | M |
| RF18 | Programação diária | Agenda do dia em ordem cronológica, com compromissos, tarefas planejadas e tarefas sem horário. | M |

### Módulo 3 — Assistente com inteligência artificial

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF19 | Conversa | O usuário envia mensagens em linguagem natural e recebe respostas da IA; as conversas ficam salvas e podem ser retomadas. | M |
| RF20 | Consultas sobre a rotina | A IA responde perguntas como "Como está minha programação de amanhã?" usando os dados reais do usuário. | M |
| RF21 | Análise personalizada | A IA analisa perfil, objetivos, tarefas, disponibilidade e histórico para identificar acúmulo, conflitos e adiamentos. | M |
| RF22 | Recomendações | A IA sugere melhorias de organização, sempre justificadas. | M |
| RF23 | Propostas de alteração | Quando a sugestão altera dados (reagendar, criar ou repriorizar), a IA gera uma **proposta** com prévia das mudanças, sem aplicá-las. | M |
| RF24 | Aprovação | O usuário aprova, rejeita ou pede ajustes na proposta; somente a aprovação altera o banco de dados. | M |
| RF25 | Assistente proativo | O painel exibe um *briefing* com lembretes, alertas e recomendações contextualizadas, que o usuário pode atualizar ou desativar nas preferências. | M |

### Módulo 4 — Planejamento inteligente

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF26 | Plano diário | Gera um plano para uma data, encaixando tarefas pendentes nas janelas de disponibilidade. | M |
| RF27 | Plano semanal | Gera um plano para os 7 dias seguintes. | M |
| RF28 | Ordenação por prioridade | O plano ordena por prioridade, prazo e vínculo com objetivos. | M |
| RF29 | Disponibilidade e compromissos | O plano respeita as janelas de disponibilidade e não sobrepõe compromissos fixos. | M |
| RF30 | Conflitos | O sistema identifica e exibe sobreposições de horário e tarefas que não cabem no tempo disponível. | M |
| RF31 | Reorganizar adiadas | Gera uma proposta que redistribui atividades adiadas ou atrasadas. | M |
| RF32 | Sugestões de melhoria | O plano traz observações, como dia sobrecarregado ou prazo em risco. | S |

### Módulo 5 — Lembretes

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF33 | Configurar lembretes | Criar, editar e excluir lembretes avulsos ou vinculados a uma atividade, com data e hora. | M |
| RF34 | Lembrete automático | Ao criar uma atividade com horário, o usuário pode gerar um lembrete com a antecedência padrão. | S |
| RF35 | Lembretes recorrentes | Repetição diária ou semanal. | M |
| RF36 | Avisos de atividades próximas | O painel destaca as atividades das próximas 2 horas. | M |
| RF37 | Notificações de pendências | Atividades atrasadas geram uma notificação diária. | M |
| RF38 | Central de notificações | Lista de notificações com estado lido/não lido e contador no menu; notificações do navegador opcionais (com permissão). | M |

### Módulo 6 — Histórico e insights

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF39 | Histórico | Linha do tempo de atividades criadas, concluídas, adiadas, reagendadas e excluídas, além de planos aprovados e rejeitados. | M |
| RF40 | Indicadores | Taxa de conclusão, concluídas por dia, adiamentos e distribuição por categoria, nos últimos 7 e 30 dias. | M |
| RF41 | Objetivos | Progresso dos objetivos e atividades vinculadas concluídas. | M |
| RF42 | Resumo semanal | Resumo da semana gerado pela IA a partir dos indicadores, salvo para consulta. | M |
| RF43 | Padrões | Dia mais produtivo, período com mais conclusões, atividades mais adiadas e categoria predominante. | S |
| RF44 | Sugestões de melhoria | Recomendações derivadas dos padrões. | S |

### Integração com API pública

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF45 | Feriados nacionais | Consultar `GET https://brasilapi.com.br/api/feriados/v1/{ano}` e exibir os feriados no calendário, o próximo feriado no painel e as datas no contexto do planejamento e da IA. Falhas são tratadas com mensagem clara, sem quebrar a tela. | M |

---

## 2. Requisitos não funcionais

| ID | Categoria | Requisito | Critério de aceitação |
|---|---|---|---|
| RNF01 | Responsividade | Layout Mobile First com as faixas da apostila: 320–480, 481–768, 769–1024, 1025–1200 e 1201 px ou mais. | Nenhuma rolagem horizontal de 320 a 1920 px; navegação funcional em todas as faixas |
| RNF02 | Acessibilidade | Conformidade WCAG 2.1 nível AA. | Zero violações *serious/critical* no axe-core; contraste de texto ≥ 4,5:1; uso completo por teclado |
| RNF03 | Toque | Alvos de toque adequados. | Controles interativos com no mínimo 44 × 44 px |
| RNF04 | Segurança | Autenticação via Supabase Auth; Row Level Security em todas as tabelas; chave da IA apenas no servidor. | Usuário A não lê nem altera dados do usuário B; nenhuma chave secreta no bundle do cliente |
| RNF05 | Validação | Toda entrada é validada no servidor (Zod), inclusive as respostas da IA, antes de gravar no banco. | Dados inválidos são rejeitados com mensagem de erro |
| RNF06 | Controle humano | A IA não altera dados sem aprovação explícita. | Propostas permanecem com status "proposto" até a ação do usuário |
| RNF07 | Privacidade | A IA recebe apenas o contexto necessário: perfil, objetivos, disponibilidade, tarefas recentes e feriados. Não são enviados e-mail nem senha. | Contexto montado em um único módulo auditável (`src/lib/ai/context.ts`) |
| RNF08 | Desempenho | Carregamento rápido em rede móvel. | Lighthouse Performance ≥ 80 nas páginas públicas (meta) |
| RNF09 | Confiabilidade | Falhas em serviços externos (IA, BrasilAPI) não quebram a aplicação. | Tempo limite de 8 s na BrasilAPI; mensagens de erro e alternativas locais |
| RNF10 | Usabilidade | Aplicação documentada de pelo menos 5 heurísticas de Nielsen. | Ver [relatório de usabilidade](relatorio-usabilidade.md) |
| RNF11 | Feedback | Toda ação tem retorno visual. | Estados de carregamento, sucesso e erro anunciados por região `aria-live` |
| RNF12 | Localização | Interface em português do Brasil. | `lang="pt-BR"`; datas no formato dd/mm/aaaa; fuso padrão America/Sao_Paulo |
| RNF13 | Temas | Tema claro e escuro. | Segue `prefers-color-scheme` por padrão, com escolha manual nas configurações |
| RNF14 | Manutenibilidade | Código modular por domínio, em TypeScript estrito. | ESLint sem erros; separação entre interface, regras, persistência e serviços |
| RNF15 | Testabilidade | Testes automatizados das regras de negócio. | Testes unitários do planejador, da recorrência, dos insights e da validação da IA |
| RNF16 | Compatibilidade | Navegadores modernos. | Duas últimas versões de Chrome, Edge, Firefox e Safari, desktop e mobile |
| RNF17 | Implantação | Publicação no Vercel com banco no Supabase. | Configuração apenas por variáveis de ambiente, documentadas em `.env.example` |

---

## 3. Regras de negócio e comportamentos esperados

| ID | Regra |
|---|---|
| RN01 | Uma atividade está **atrasada** quando não está concluída nem cancelada e seu prazo (ou horário de término) já passou. |
| RN02 | Um **compromisso** exige horário de início e de término, e o término deve ser posterior ao início. Uma **tarefa** pode ter apenas prazo. |
| RN03 | Concluir uma atividade recorrente cria uma nova ocorrência com a próxima data válida (diária: +1 dia; dias úteis: próximo dia de segunda a sexta; semanal: +7 dias; mensal: mesmo dia do mês seguinte, limitado ao último dia), desde que não ultrapasse a data final da recorrência. |
| RN04 | Adiar incrementa `postponed_count`, atualiza o prazo, move o horário planejado para a nova data e registra o evento `adiada` no histórico. |
| RN05 | Uma atividade adiada 2 vezes ou mais é considerada **frequentemente adiada** e aparece nos alertas proativos e nos padrões. |
| RN06 | O planejador encaixa tarefas **apenas** dentro das janelas de disponibilidade, sem sobrepor compromissos, em ordem de: (1) atrasadas, (2) prioridade, (3) prazo mais próximo, (4) vínculo com objetivo, deixando intervalos de 10 minutos entre blocos. |
| RN07 | Há **conflito** quando dois itens com horário se sobrepõem ou quando um item com horário fica fora das janelas de disponibilidade. Tarefas que não cabem no tempo livre são listadas como "não encaixadas". |
| RN08 | Propostas da IA são gravadas como plano com status `proposto`. Somente o dono pode aprová-las ou rejeitá-las. Ao aprovar, o servidor valida de novo cada item (a atividade existe, pertence ao usuário, os horários são coerentes) antes de aplicar. |
| RN09 | A IA pode **propor** criação de atividades, reagendamentos e mudanças de prioridade. Exclusões nunca são propostas pela IA. |
| RN10 | Um lembrete vencido (`remind_at` ≤ agora) gera uma notificação e passa a `enviado`; se for recorrente, é reprogramado para a próxima ocorrência. |
| RN11 | A notificação de pendências é gerada no máximo uma vez por dia por usuário. |
| RN12 | O *briefing* proativo é gerado no máximo uma vez por dia (ou quando o usuário pede para atualizar), e somente se o assistente proativo estiver ativado. |
| RN13 | O resumo semanal considera de segunda a domingo da semana escolhida e fica salvo na tabela `insights`. |
| RN14 | Feriados da BrasilAPI ficam em cache por 24 horas no servidor. Se a API falhar, o calendário exibe o aviso "Feriados indisponíveis no momento" e continua funcionando. |
| RN15 | A IA recusa pedidos fora do escopo (diagnóstico médico, dieta, prescrição de treino, investimentos) e sugere um profissional qualificado. |

---

## 4. Rastreabilidade (requisito → tela → código)

| Requisitos | Tela (rota) | Código principal |
|---|---|---|
| RF01–RF02 | `/entrar`, `/cadastro` | `src/app/(auth)`, `src/lib/auth/actions.ts` |
| RF03 | `/configuracao-inicial` | `src/app/(app)/configuracao-inicial` |
| RF04–RF05, RF07 | `/perfil` | `src/app/(app)/perfil`, `src/lib/profile` |
| RF06, RF41 | `/objetivos` | `src/app/(app)/objetivos`, `src/lib/goals` |
| RF08 | `/configuracoes` | `src/app/(app)/configuracoes` |
| RF09–RF16 | `/tarefas` | `src/app/(app)/tarefas`, `src/lib/tasks` |
| RF17–RF18, RF45 | `/calendario`, `/painel` | `src/app/(app)/calendario`, `src/lib/holidays` |
| RF19–RF24 | `/assistente` | `src/app/(app)/assistente`, `src/app/api/assistente`, `src/lib/ai` |
| RF25 | `/painel` | `src/lib/ai/briefing.ts`, `src/lib/insights/signals.ts` |
| RF26–RF32 | `/planejamento` | `src/app/(app)/planejamento`, `src/lib/planning` |
| RF33–RF38 | `/lembretes` | `src/app/(app)/lembretes`, `src/lib/reminders` |
| RF39–RF44 | `/insights` | `src/app/(app)/insights`, `src/lib/insights` |
