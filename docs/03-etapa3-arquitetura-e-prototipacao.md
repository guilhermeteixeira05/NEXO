# Etapa 3 — Wireframes e Prototipação

> Entregáveis da apostila (seção 1.4): arquitetura de informação, fluxogramas, wireframes de baixa fidelidade e protótipo navegável de média/alta fidelidade.
> O projeto visual está no Figma. O link e a organização das páginas estão na [seção 5](#5-projeto-no-figma).

---

## 1. Arquitetura da informação

### 1.1 Estrutura de navegação

O NEXO tem duas áreas: **pública** (apresentação, entrar e cadastro) e **autenticada** (as funcionalidades). A navegação principal tem cinco destinos fixos e um menu "Mais" para os destinos secundários. A ordem é a mesma em todas as faixas de tela (heurística H4).

| Prioridade | Destino | Rota | Celular (≤ 768 px) | Tablet grande (769–1024 px) | Desktop (≥ 1025 px) |
|---|---|---|---|---|---|
| Primária | Painel | `/painel` | Barra inferior | Barra lateral (ícones) | Barra lateral (ícone + texto) |
| Primária | Tarefas | `/tarefas` | Barra inferior | Barra lateral | Barra lateral |
| Primária | Assistente | `/assistente` | Barra inferior (botão central em destaque) | Barra lateral | Barra lateral |
| Primária | Calendário | `/calendario` | Barra inferior | Barra lateral | Barra lateral |
| Primária | Mais | — | Barra inferior (abre a gaveta) | — | — |
| Secundária | Planejamento | `/planejamento` | Gaveta "Mais" | Barra lateral | Barra lateral |
| Secundária | Objetivos | `/objetivos` | Gaveta "Mais" | Barra lateral | Barra lateral |
| Secundária | Lembretes e notificações | `/lembretes` | Gaveta "Mais" + sino no topo | Barra lateral + sino | Barra lateral + sino |
| Secundária | Insights e histórico | `/insights` | Gaveta "Mais" | Barra lateral | Barra lateral |
| Conta | Perfil | `/perfil` | Gaveta "Mais" | Barra lateral (rodapé) | Barra lateral (rodapé) |
| Conta | Configurações | `/configuracoes` | Gaveta "Mais" | Barra lateral (rodapé) | Barra lateral (rodapé) |

### 1.2 Mapa de telas (hierarquia)

```mermaid
flowchart TD
    A["/ Apresentação"] --> B["/entrar"]
    A --> C["/cadastro"]
    C --> D["/configuracao-inicial<br/>1 Perfil · 2 Preferências · 3 Disponibilidade · 4 Objetivo"]
    B --> E
    D --> E["/painel — Dashboard"]
    E --> F["/tarefas"]
    E --> G["/assistente"]
    E --> H["/calendario"]
    E --> I["/planejamento"]
    E --> J["/objetivos"]
    E --> K["/lembretes"]
    E --> L["/insights"]
    E --> M["/perfil"]
    E --> N["/configuracoes"]
    F --> F1["Diálogo: nova/editar atividade"]
    F --> F2["Diálogo: adiar"]
    G --> G1["Cartão de proposta<br/>Aprovar · Rejeitar · Ajustar"]
    I --> I1["Plano proposto<br/>conflitos · não encaixadas"]
    H --> H1["Agenda do dia + feriados"]
    K --> K1["Central de notificações"]
    L --> L1["Indicadores · Padrões · Resumo semanal · Histórico"]
```

### 1.3 Organização dos módulos e relação entre as funcionalidades

Todos os módulos leem e gravam **as mesmas tabelas**. O diagrama mostra o fluxo de dados entre eles.

```mermaid
flowchart LR
    subgraph M1["Módulo 1 · Usuários e perfil"]
        P[Perfil e preferências]
        O[Objetivos]
        D[Disponibilidade]
    end
    subgraph M2["Módulo 2 · Tarefas"]
        T[(Atividades)]
        CAL[Calendário]
    end
    subgraph M3["Módulo 3 · IA"]
        CHAT[Chat]
        BRF[Briefing proativo]
    end
    subgraph M4["Módulo 4 · Planejamento"]
        PL[Planejador]
        PR[(Planos e propostas)]
    end
    subgraph M5["Módulo 5 · Lembretes"]
        R[(Lembretes)]
        N[(Notificações)]
    end
    subgraph M6["Módulo 6 · Histórico e insights"]
        H[(Histórico)]
        INS[Indicadores e resumo]
    end
    API[(BrasilAPI<br/>feriados)]

    O --> T
    P --> PL
    D --> PL
    T --> PL
    API --> CAL
    API --> PL
    API --> CHAT
    T --> CAL
    T --> CHAT
    O --> CHAT
    PL --> PR
    CHAT --> PR
    PR -- aprovação --> T
    T --> R
    R --> N
    T -- concluir/adiar --> H
    PR -- aprovado/rejeitado --> H
    H --> INS
    H --> BRF
    T --> BRF
    INS --> CHAT
```

### 1.4 Estrutura do dashboard (`/painel`)

Ordem de leitura (igual em todas as faixas; no desktop vira grade de 12 colunas):

1. **Saudação e data**: "Boa tarde, Camila · segunda-feira, 23 de novembro" e o próximo feriado.
2. **Briefing do NEXO** (assistente proativo): até 3 recomendações com ação ("Ver programação", "Reorganizar tarde").
3. **Agora e a seguir**: atividades das próximas 2 horas (RF36).
4. **Programação de hoje**: linha do tempo do dia (RF18).
5. **Resumo rápido**: pendentes hoje, atrasadas, concluídas na semana e taxa de conclusão.
6. **Objetivos em foco**: até 3 objetivos com barra de progresso.
7. **Ação flutuante "+"**: nova atividade.

| Faixa | Grade do painel |
|---|---|
| 320–480 px | 1 coluna, cartões empilhados |
| 481–768 px | 1 coluna; o resumo rápido em 2×2 |
| 769–1024 px | 2 colunas (programação à esquerda; briefing, resumo e objetivos à direita) |
| 1025–1200 px | 2 colunas mais largas; resumo em 4 colunas |
| ≥ 1201 px | 3 colunas (briefing · programação · resumo e objetivos), com largura máxima de 1440 px |

### 1.5 Fluxos principais de utilização

| Fluxo | Caminho | Requisitos |
|---|---|---|
| Primeiro acesso | Apresentação → Cadastro → Configuração inicial → Painel | RF01, RF03–RF07 |
| Registrar atividade | Qualquer tela → "+" → formulário → salvar → lista e painel atualizados | RF09, RF15, RF34 |
| Planejar o dia | Planejamento → "Gerar plano de hoje" → revisar conflitos → aprovar | RF26–RF30 |
| Conversar com a IA | Assistente → pergunta → resposta com dados reais | RF19–RF22 |
| Aprovar recomendação | Proposta (chat, briefing ou planejamento) → prévia → aprovar, rejeitar ou ajustar | RF23–RF24 |
| Reorganizar a rotina | Alerta de adiamentos → "Reorganizar" → proposta → aprovação | RF31, RF25 |
| Configurar lembrete | Lembretes → "Novo lembrete" → data, hora e recorrência → central de notificações | RF33–RF38 |
| Consultar insights | Insights → indicadores → padrões → "Gerar resumo semanal" | RF39–RF44 |

---

## 2. Fluxogramas

Diagramas em Mermaid (renderizados no GitHub). As mesmas versões estão na página **02 · Arquitetura** do Figma.

### 2.1 Cadastro e configuração inicial

```mermaid
flowchart TD
    A([Início]) --> B[Acessa /cadastro]
    B --> C[Preenche nome, e-mail e senha]
    C --> D{Dados válidos?}
    D -- Não --> E[Mostra erro junto ao campo] --> C
    D -- Sim --> F[Supabase Auth cria a conta]
    F --> G{Confirmação de e-mail exigida?}
    G -- Sim --> H[Mostra: confirme seu e-mail] --> I[Usuário confirma e entra]
    G -- Não --> J
    I --> J[Trigger cria o perfil]
    J --> K[Configuração inicial · Etapa 1: perfil]
    K --> L[Etapa 2: preferências]
    L --> M[Etapa 3: disponibilidade semanal]
    M --> N[Etapa 4: primeiro objetivo]
    N --> O{Concluir ou pular?}
    O -- Concluir --> P[Salva os dados · onboarding_completed = true]
    O -- Pular --> P
    P --> Q([Painel])
```

### 2.2 Registro de tarefa

```mermaid
flowchart TD
    A([Botão +]) --> B[Abre o diálogo de atividade]
    B --> C[Escolhe o tipo: tarefa, compromisso ou hábito]
    C --> D[Preenche título, categoria, prioridade, data, horário, duração e recorrência]
    D --> E{Compromisso?}
    E -- Sim --> F{Início e término informados e término > início?}
    F -- Não --> G[Erro: informe o horário de término depois do início] --> D
    F -- Sim --> H
    E -- Não --> H{Validação no servidor ok?}
    H -- Não --> G2[Mostra os erros retornados] --> D
    H -- Sim --> I[Grava em tasks e registra 'criada' no histórico]
    I --> J{Criar lembrete?}
    J -- Sim --> K[Grava o lembrete com a antecedência padrão]
    J -- Não --> L
    K --> L[Atualiza a lista, o painel e o calendário]
    L --> M([Mensagem: Atividade salva])
```

### 2.3 Planejamento diário

```mermaid
flowchart TD
    A([Planejamento]) --> B[Escolhe a data e: Gerar plano]
    B --> C[Carrega disponibilidade, compromissos, pendentes, atrasadas e feriado]
    C --> D[Planejador local ordena: atrasadas, prioridade, prazo, objetivo]
    D --> E[Encaixa nas janelas livres sem sobrepor compromissos]
    E --> F{IA configurada?}
    F -- Sim --> G[IA revisa o rascunho e sugere ajustes e observações]
    G --> H{Resposta válida? Zod + checagem de conflitos}
    H -- Não --> I[Usa o rascunho local e avisa o usuário]
    H -- Sim --> J
    F -- Não --> I
    I --> J[Grava plano com status 'proposto']
    J --> K[Mostra a prévia: blocos, conflitos e não encaixadas]
    K --> L{Decisão do usuário}
    L -- Aprovar --> M[Revalida e aplica os horários nas atividades · histórico]
    L -- Rejeitar --> N[status 'rejeitado' · histórico]
    M --> O([Programação do dia atualizada])
    N --> O2([Plano descartado])
```

### 2.4 Conversa com a IA

```mermaid
sequenceDiagram
    actor U as Usuário
    participant UI as Tela Assistente
    participant API as /api/assistente (servidor)
    participant DB as Supabase (RLS)
    participant BR as BrasilAPI
    participant AI as API de IA (Gemini)

    U->>UI: Digita "Como está minha programação de amanhã?"
    UI->>API: POST mensagem + conversationId
    API->>DB: Autentica a sessão e grava a mensagem do usuário
    API->>DB: Lê perfil, objetivos, disponibilidade, atividades e histórico
    API->>BR: Feriados do ano (cache 24 h)
    API->>AI: system + contexto + histórico + ferramentas de proposta
    alt IA pede uma ferramenta (ex.: propor_reorganizacao)
        AI-->>API: tool_use
        API->>API: Valida com Zod e checa a posse das atividades
        API->>DB: Grava o plano 'proposto'
        API->>AI: tool_result (id da proposta)
    end
    AI-->>API: Resposta final em texto
    API->>DB: Grava a resposta (+ id da proposta)
    API-->>UI: Resposta + cartão de proposta
    UI-->>U: Exibe a resposta e anuncia em aria-live
```

### 2.5 Aprovação de recomendações

```mermaid
flowchart TD
    A([Cartão de proposta]) --> B[Mostra resumo e justificativa]
    B --> C[Lista as mudanças: antes → depois]
    C --> D{Usuário escolhe}
    D -- Aprovar --> E[Servidor confere: plano 'proposto' e do próprio usuário]
    E --> F{Itens ainda válidos?}
    F -- Não --> G[Informa quais itens mudaram e oferece nova proposta]
    F -- Sim --> H[Aplica as mudanças em transação lógica]
    H --> I[status 'aprovado' · histórico 'plano_aprovado']
    D -- Rejeitar --> J[status 'rejeitado' · histórico 'plano_rejeitado']
    D -- Pedir ajustes --> K[Abre o chat com o contexto da proposta]
    K --> L[IA gera uma nova proposta] --> A
    I --> M([Tela atualizada])
    J --> M
```

### 2.6 Reorganização da rotina

```mermaid
flowchart TD
    A([Gatilho]) --> A1{Origem}
    A1 -- Briefing: 'atividades adiadas com frequência' --> B
    A1 -- Chat: 'reorganize minha semana' --> B
    A1 -- Planejamento: 'Reorganizar adiadas' --> B
    B[Seleciona atrasadas e adiadas] --> C[Calcula espaço livre nos próximos 7 dias]
    C --> D[Distribui por prioridade sem exceder a disponibilidade diária]
    D --> E[IA justifica e ajusta, se configurada]
    E --> F[Plano 'proposto' com escopo 'reorganizacao']
    F --> G([Fluxo de aprovação 2.5])
```

### 2.7 Configuração de lembretes

```mermaid
flowchart TD
    A([Lembretes]) --> B[Novo lembrete]
    B --> C[Título, data e hora, recorrência e atividade vinculada opcional]
    C --> D{Data e hora válidas?}
    D -- Não --> E[Erro junto ao campo] --> C
    D -- Sim --> F[Grava o lembrete 'agendado']
    F --> G[App aberto: verificação periódica a cada 60 s]
    G --> H{remind_at chegou?}
    H -- Não --> G
    H -- Sim --> I[Cria a notificação · lembrete 'enviado']
    I --> J{Recorrente?}
    J -- Sim --> K[Reprograma para a próxima ocorrência]
    J -- Não --> L
    K --> L{Permissão do navegador concedida?}
    L -- Sim --> M[Notificação do navegador]
    L -- Não --> N[Somente a central e o contador do sino]
```

### 2.8 Consulta de insights

```mermaid
flowchart TD
    A([Insights]) --> B[Escolhe o período: 7 ou 30 dias]
    B --> C[Calcula os indicadores a partir do histórico e das atividades]
    C --> D[Mostra taxa de conclusão, concluídas por dia, adiamentos e categorias]
    D --> E[Detecta padrões: dia mais produtivo, mais adiadas, período de pico]
    E --> F{Gerar resumo semanal?}
    F -- Sim --> G{IA configurada?}
    G -- Sim --> H[IA redige o resumo e as sugestões a partir dos indicadores]
    H --> I[Grava em insights]
    G -- Não --> J[Avisa que a IA não está configurada; indicadores continuam disponíveis]
    F -- Não --> K
    I --> K[Linha do tempo do histórico com filtros]
```

---

## 3. Wireframes de baixa fidelidade

Os wireframes estão na página **03 · Wireframes** do Figma, em escala de cinza, priorizando a organização dos blocos e a navegação. Abaixo, a estrutura de cada tela (mobile, 360 px):

| Tela | Estrutura (de cima para baixo) |
|---|---|
| Entrar | Logotipo · título · e-mail · senha · botão "Entrar" · link "Criar conta" |
| Cadastro | Logotipo · título · nome · e-mail · senha (com regra) · botão · link "Já tenho conta" |
| Configuração inicial | Indicador de etapa (1/4) · título da etapa · campos · "Pular" + "Continuar" |
| Painel | Topo (saudação, sino) · briefing · agora/a seguir · programação · resumo 2×2 · objetivos · "+" · barra inferior |
| Tarefas | Topo · busca · filtros (chips) · seções Atrasadas/Hoje/Próximas/Sem data · cartões com checkbox e menu · "+" |
| Objetivos | Topo · "+ Objetivo" · cartões com progresso, prazo e nº de atividades |
| Calendário | Mês (grade 7 colunas) com pontos e feriados · agenda do dia selecionado |
| Assistente | Topo com conversas · mensagens · sugestões rápidas · campo e "Enviar" |
| Planejamento | Seletor Dia/Semana · data · "Gerar plano" · blocos de horário · conflitos · não encaixadas · Aprovar/Rejeitar |
| Lembretes | Abas Lembretes/Notificações · lista · "+ Lembrete" |
| Insights | Período · 4 indicadores · gráfico de barras · padrões · resumo semanal · histórico |
| Perfil | Dados pessoais · preferências · disponibilidade semanal |
| Configurações | Aparência (tema) · notificações · segurança (senha) · dados e IA · sair |

## 4. Protótipo navegável

O protótipo de alta fidelidade (página **07 · Protótipo** do Figma) conecta as telas mobile nos fluxos:

1. Entrar → Painel.
2. Painel → Tarefas → nova atividade → Tarefas.
3. Painel → Assistente → proposta → aprovação → Painel.
4. Painel → Planejamento → aprovar → Painel.
5. Barra inferior: navegação entre Painel, Tarefas, Assistente, Calendário e Mais.

## 5. Projeto no Figma

Arquivo: **NEXO — Assistente Pessoal Inteligente**. O link real está registrado no [README](../README.md#figma).

| Página | Conteúdo |
|---|---|
| 01 · Identidade visual | Logotipo, paleta (claro/escuro), tipografia, ícones, botões, campos, componentes e estados |
| 02 · Arquitetura | Navegação, mapa de telas e organização dos módulos |
| 03 · Wireframes | Baixa fidelidade das telas principais |
| 04 · Mobile | 11 telas a 390 px |
| 05 · Tablet | Telas principais a 768 px |
| 06 · Desktop | Telas principais a 1440 px |
| 07 · Protótipo | Telas mobile conectadas com interações de clique |
