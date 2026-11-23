# Etapa 2 — Análise de Concorrentes

> Entregável 2 de 3 da Etapa 2. As informações vêm de páginas oficiais dos fabricantes, acessadas em **23 nov. 2026** (lista de fontes ao final). Recursos e planos mudam com frequência; confira as fontes antes da apresentação.

Concorrentes analisados: **Motion**, **Todoist**, **Notion** e **Google Gemini**. Eles representam as quatro abordagens que o NEXO pretende integrar: agendamento automático, lista de tarefas, espaço de trabalho e assistente conversacional.

---

## 1. Motion

**Categoria:** calendário e gerenciador de tarefas com agendamento automático por IA.

| Aspecto | Análise |
|---|---|
| **Principais funcionalidades** | Calendário com IA que reúne tarefas, reuniões e prazos em uma única visão; **auto-scheduling**, que distribui tarefas no calendário conforme prioridade, prazo, duração e dependências e reorganiza o plano quando as prioridades mudam; assistente de reuniões com link de agendamento; integrações nativas com Google Calendar, Outlook, iCloud, Zoom, Google Meet, Teams e Slack. |
| **Pontos fortes** | O agendamento automático é o recurso central, maduro e integrado aos calendários mais usados; replaneja sem que o usuário arraste tarefas manualmente. |
| **Limitações e aspectos relevantes** | Produto pago, com período de teste; voltado principalmente a equipes e profissionais; interface e documentação em inglês; o plano é aplicado automaticamente ao calendário, então o controle do usuário vem depois do fato e não antes. |
| **Oportunidades para o NEXO** | Oferecer planejamento automático **com prévia e aprovação**; atender ao público individual e acadêmico em português; somar ao agendamento uma conversa sobre a rotina e o histórico de hábitos. |

## 2. Todoist

**Categoria:** gerenciador de tarefas pessoal e de equipe.

| Aspecto | Análise |
|---|---|
| **Principais funcionalidades** | Criação rápida de tarefas com linguagem natural, inclusive recorrências ("toda segunda", "mensalmente") e editor visual de recorrência; projetos, filtros, etiquetas e prioridades; **Todoist Assist**, conjunto de recursos de IA como o *Filter Assist* (descrever em texto o filtro desejado) e o *Ramble* (ditar tarefas em linguagem natural); apps para web, desktop e celular. |
| **Pontos fortes** | Captura de tarefas muito rápida; o melhor *parser* de datas e recorrências entre os analisados; alguns recursos de IA disponíveis no plano gratuito. |
| **Limitações e aspectos relevantes** | É, essencialmente, uma lista de tarefas: não encaixa automaticamente as tarefas nos horários livres nem considera a disponibilidade do usuário; a IA atua em pontos específicos (filtros, captura) e não como assistente que analisa a rotina inteira. |
| **Oportunidades para o NEXO** | Ir além da lista: cruzar tarefas, compromissos e disponibilidade para sugerir **quando** fazer cada atividade; usar o histórico de adiamentos para recomendações. |

## 3. Notion

**Categoria:** espaço de trabalho integrado (documentos, bases de dados, projetos) com IA e calendário.

| Aspecto | Análise |
|---|---|
| **Principais funcionalidades** | Páginas e bases de dados flexíveis; **Notion AI** para escrever, resumir e consultar o conteúdo do espaço de trabalho; **Notion Calendar** (antigo Cron, adquirido em 2022), com compartilhamento de disponibilidade e integração com Zoom e Google Meet; **conector Notion Calendar ↔ Notion AI** (beta), que permite à IA pesquisar eventos, resumir a agenda da semana e as ações de reuniões. |
| **Pontos fortes** | Altíssima flexibilidade: o usuário monta o próprio sistema de organização; IA conectada aos documentos e ao calendário. |
| **Limitações e aspectos relevantes** | Exige que o usuário **construa** a própria estrutura, o que é uma curva de aprendizado alta para quem busca algo pronto; o conector de calendário está em beta e exige o mesmo e-mail na agenda e no espaço de trabalho; não há planejamento automático das tarefas pessoais nos horários livres. |
| **Oportunidades para o NEXO** | Entregar uma estrutura **pronta** (objetivos → tarefas → plano → histórico) sem configuração; um assistente que já conhece o modelo de dados e age sobre ele. |

## 4. Google Gemini

**Categoria:** assistente conversacional de IA de uso geral.

| Aspecto | Análise |
|---|---|
| **Principais funcionalidades** | Conversa em linguagem natural (texto e voz, no Gemini Live); integração com os aplicativos do Google Workspace (Agenda, Tasks, Keep, Gmail, Docs, Drive) para criar eventos, lembretes e notas e consultar tarefas; **ações programadas** (*scheduled actions*), que executam um pedido em horário definido, com até 10 ações ativas. |
| **Pontos fortes** | Modelo de linguagem muito capaz; ecossistema Google amplamente adotado; conversa por voz. |
| **Limitações e aspectos relevantes** | Assistente **genérico**: não mantém um modelo próprio de objetivos, disponibilidade e histórico de adiamentos; as ações programadas e alguns recursos de Workspace dependem de assinaturas ou planos qualificados (segundo o anúncio oficial, Google AI Pro/Ultra e planos Workspace elegíveis); ações executadas diretamente nos apps, sem uma visão de plano que o usuário aprove como um todo. |
| **Oportunidades para o NEXO** | Ser um assistente **especializado** em rotina, com dados estruturados (objetivos, disponibilidade, histórico) e propostas revisáveis; proatividade baseada em padrões do próprio usuário. |

---

## 5. Quadro comparativo

Legenda: ● atende · ◐ atende parcialmente · ○ não atende (no recorte desta análise)

| Critério | Motion | Todoist | Notion | Gemini | **NEXO** |
|---|:-:|:-:|:-:|:-:|:-:|
| Gerenciamento de tarefas com prioridade e recorrência | ● | ● | ◐ ¹ | ◐ ² | ● |
| Calendário integrado | ● | ◐ | ● | ◐ ² | ● |
| Objetivos vinculados às tarefas | ◐ | ◐ | ◐ ¹ | ○ | ● |
| Disponibilidade semanal do usuário | ● | ○ | ◐ | ○ | ● |
| Planejamento automático no tempo livre | ● | ○ | ○ | ○ | ● |
| Identificação de conflitos de horário | ● | ○ | ◐ | ○ | ● |
| Assistente conversacional sobre a própria rotina | ◐ | ◐ | ● | ● | ● |
| Recomendações proativas baseadas no histórico | ◐ | ○ | ○ | ◐ ³ | ● |
| **Prévia e aprovação antes de alterar a agenda** | ○ | — | ◐ | ◐ | ● |
| Histórico de adiamentos e padrões | ○ | ◐ | ○ | ○ | ● |
| Interface e IA em português | ◐ | ● | ● | ● | ● |
| Contexto de feriados nacionais brasileiros | ○ | ○ | ○ | ◐ | ● |
| Uso individual sem custo para o protótipo | ○ | ● | ● | ● | ● ⁴ |

¹ Depende de o usuário montar a estrutura com bases de dados. ² Por integração com Google Tasks e Agenda. ³ Por ações programadas definidas pelo usuário, não por análise de padrões. ⁴ Protótipo acadêmico; o uso da IA tem custo por requisição, pago pela equipe na API.

> As avaliações ◐/○ consideram apenas os recursos descritos nas fontes oficiais consultadas. Elas não afirmam que um recurso não existe em planos ou versões não analisados.

## 6. Conclusão — diferencial competitivo do NEXO

Cada concorrente resolve bem **uma parte** do problema:

- **Motion** planeja automaticamente, mas aplica as mudanças direto no calendário e foca em equipes pagantes;
- **Todoist** captura e organiza tarefas com excelência, mas não decide *quando* fazê-las;
- **Notion** oferece flexibilidade total, mas exige que o usuário construa o próprio sistema;
- **Gemini** conversa muito bem, mas é genérico e não mantém um modelo estruturado da rotina.

O diferencial do NEXO está na **integração dessas capacidades sobre um único modelo de dados**, somada a duas decisões de projeto:

1. **Um só modelo de dados para todos os módulos.** A tarefa cadastrada é a mesma que a IA consulta, que o planejador encaixa, que o lembrete considera e que o histórico registra. A IA conhece objetivos, disponibilidade e adiamentos e não precisa que o usuário repita contexto.
2. **Controle humano explícito.** Toda alteração proposta pela IA chega como **prévia revisável** (aprovar, rejeitar ou pedir ajustes), o que atende às heurísticas de *controle e liberdade do usuário* e de *prevenção de erros*.
3. **Proatividade baseada em padrões do próprio usuário.** O NEXO detecta acúmulo, conflitos e adiamentos frequentes e sugere uma reorganização antes que o prazo vença.
4. **Contexto brasileiro e acessibilidade.** Interface em português, feriados nacionais via BrasilAPI e conformidade WCAG 2.1 AA como requisito, não como ajuste posterior.

---

## Fontes

- MOTION. *AI Calendar*. Disponível em: <https://usemotion.com/calendar>. Acesso em: 23 nov. 2026.
- MOTION. *Concept: Auto-scheduling* (Central de ajuda). Disponível em: <https://usemotion.com/help/time-management/auto-scheduling/concept-auto-scheduling>. Acesso em: 23 nov. 2026.
- MOTION. *AI Meeting Assistant / Scheduler*. Disponível em: <https://www.usemotion.com/scheduler>. Acesso em: 23 nov. 2026.
- MOTION. *Motion: Tasks & AI Scheduling* (App Store). Disponível em: <https://apps.apple.com/us/app/motion-tasks-and-scheduling/id1580440623>. Acesso em: 23 nov. 2026.
- TODOIST. *Todoist Assist*. Disponível em: <https://www.todoist.com/todoist-assist>. Acesso em: 23 nov. 2026.
- TODOIST. *Introduction to Todoist Assist* (Central de ajuda). Disponível em: <https://www.todoist.com/help/articles/introduction-to-todoist-assist-KgPP22q5O>. Acesso em: 23 nov. 2026.
- TODOIST. *New visual interface for recurring tasks* (Atualizações do produto). Disponível em: <https://www.todoist.com/help/articles/new-visual-interface-for-recurring-tasks-jun-30-nMZ4CZjHb>. Acesso em: 23 nov. 2026.
- NOTION. *Notion Calendar AI Connector (beta)* (Central de ajuda). Disponível em: <https://www.notion.com/help/notion-calendar-ai-connector>. Acesso em: 23 nov. 2026.
- NOTION. *Releases 2.37 — Notion Calendar*. Disponível em: <https://www.notion.com/en-gb/releases/2024-01-17>. Acesso em: 23 nov. 2026.
- GOOGLE. *Schedule actions in Gemini Apps* (Ajuda do Gemini). Disponível em: <https://support.google.com/gemini/answer/16316416>. Acesso em: 23 nov. 2026.
- GOOGLE. *Scheduled actions in the Gemini app* (blog oficial). Disponível em: <https://blog.google/products/gemini/scheduled-actions-gemini-app/>. Acesso em: 23 nov. 2026.
- GOOGLE WORKSPACE UPDATES. *Google Workspace apps are now generally available for the Gemini app*. Disponível em: <https://workspaceupdates.googleblog.com/2025/05/google-workspace-apps-are-now-generally-available-for-the-gemini-app.html>. Acesso em: 23 nov. 2026.
- GOOGLE WORKSPACE UPDATES. *Gemini Live: Google Calendar, Tasks and Keep*. Disponível em: <https://workspaceupdates.googleblog.com/2025/08/gemini-live-google-calendar-tasks-keep.html>. Acesso em: 23 nov. 2026.
