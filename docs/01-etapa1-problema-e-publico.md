# Etapa 1 — Definição do Problema e Público-Alvo

> Projeto A3 — Usabilidade, Desenvolvimento Web, Mobile e Jogos · Sistemas de Informação
> Produto: **NEXO — Assistente Pessoal Inteligente**

Entregáveis desta etapa, segundo a apostila da Aula 04 (seção 1.4): mapeamento da dor do usuário, personas, matriz de proposta de valor e delimitação do escopo funcional.

---

## 1. Tema

Assistente pessoal com inteligência artificial para organizar e otimizar a rotina: tarefas, compromissos, objetivos, lembretes e planejamento, tudo em uma única aplicação web responsiva.

## 2. Situação-problema

Pessoas que conciliam trabalho, estudos e vida pessoal costumam espalhar suas responsabilidades entre vários aplicativos: agenda, lista de tarefas, bloco de notas, aplicativo de mensagens e lembretes do celular. Essa fragmentação gera três efeitos:

1. **Perda de visão do todo.** Nenhuma ferramenta mostra, ao mesmo tempo, o que precisa ser feito, quando há tempo livre para fazer e qual objetivo cada atividade atende.
2. **Planejamento manual e cansativo.** Decidir *quando* fazer cada tarefa exige cruzar prazos, prioridades e horários disponíveis. Quando o dia sai do previsto, refazer o plano dá trabalho, e a tarefa simplesmente é adiada.
3. **Falta de consistência.** Atividades importantes e pouco urgentes (estudar, treinar, avançar em um objetivo) são adiadas repetidamente, e a pessoa só percebe o padrão quando o prazo já passou.

## 3. Mapeamento da dor do usuário

| Dor | Como aparece no dia a dia | Consequência |
|---|---|---|
| Informações fragmentadas | Compromissos na agenda, tarefas em um app, metas em um caderno | Esquecimentos e retrabalho para consolidar a semana |
| Dificuldade de priorizar | Tudo parece urgente; a lista só cresce | Ansiedade e escolha da tarefa mais fácil, não da mais importante |
| Planejamento que não considera o tempo real | A lista de tarefas ignora reuniões, aulas e deslocamentos | Planos irreais, que viram frustração no fim do dia |
| Adiamentos recorrentes | A mesma tarefa é empurrada por vários dias | Prazos perdidos e objetivos abandonados |
| Lembretes genéricos | Alarmes sem contexto ("Estudar") | Lembrete ignorado |
| Replanejar dá trabalho | Um imprevisto desorganiza o restante da semana | O usuário desiste de seguir o plano |
| Pouca percepção do próprio progresso | Não há registro do que foi concluído ou adiado | Sensação de improdutividade e dificuldade de melhorar a rotina |

## 4. Justificativa

Ferramentas de produtividade com IA já existem (ver a [análise de concorrentes](02-etapa2-analise-concorrentes.md)), mas costumam se concentrar em um único aspecto: agendamento automático de tarefas (Motion), listas de tarefas (Todoist), espaço de trabalho e documentos (Notion) ou assistente conversacional genérico (Gemini). Há espaço para uma solução que **una conversa, planejamento e acompanhamento sobre os mesmos dados do usuário**, em português, com controle humano explícito sobre qualquer alteração proposta pela IA e com acessibilidade como requisito desde o início.

O projeto também atende aos critérios mínimos do Projeto A3: aplicação web responsiva e acessível (WCAG 2.1 AA), consumo de API pública (BrasilAPI — feriados nacionais), persistência em nuvem e documentação de heurísticas de Nielsen.

## 5. Objetivo geral

Desenvolver um assistente pessoal inteligente que ajude o usuário a organizar e otimizar a própria rotina, transformando objetivos, compromissos e responsabilidades em planejamentos personalizados, lembretes e recomendações.

## 6. Objetivos específicos

1. Permitir o cadastro de perfil, preferências, objetivos e disponibilidade semanal do usuário.
2. Oferecer o gerenciamento completo de tarefas, compromissos e hábitos, com prioridades, categorias, prazos e recorrência.
3. Disponibilizar um assistente conversacional que responda perguntas sobre a rotina usando os dados reais do usuário.
4. Gerar planejamentos diários e semanais que considerem prioridades, prazos, compromissos fixos e horários disponíveis, identificando conflitos.
5. Apresentar recomendações proativas e propostas de reorganização sempre como **prévia**, aplicadas somente após aprovação do usuário.
6. Emitir lembretes e notificações de atividades próximas e pendentes.
7. Registrar o histórico de conclusões e adiamentos e transformá-lo em indicadores, padrões e resumos semanais.
8. Contextualizar o calendário e o planejamento com os feriados nacionais obtidos da BrasilAPI.
9. Garantir uma interface responsiva (Mobile First), acessível (WCAG 2.1 AA) e alinhada a pelo menos cinco heurísticas de Nielsen.

## 7. Público-alvo

Público geral, com foco em pessoas que precisam conciliar responsabilidades profissionais, acadêmicas e pessoais:

- estudantes de graduação e pós-graduação que trabalham ou estagiam;
- profissionais com rotina híbrida ou com muitos compromissos;
- pessoas com horários irregulares (plantões, turnos) que precisam encaixar tarefas pessoais nos intervalos.

Requisitos de uso: smartphone ou computador com navegador atualizado e acesso à internet. Não é necessário conhecimento técnico.

## 8. Personas

> **Aviso metodológico.** As personas abaixo são **hipóteses de projeto**, construídas a partir da situação-problema e da experiência da equipe. Não resultam de entrevistas ou pesquisas com usuários reais. Elas devem ser validadas (ou corrigidas) nos testes de usabilidade com participantes previstos na Etapa 4 — ver [roteiro de testes com usuários](relatorio-usabilidade.md#3-roteiro-de-teste-de-usabilidade-com-usuários).

### Persona 1 — Camila, a profissional que estuda

| | |
|---|---|
| **Perfil** | 27 anos, analista de marketing em regime híbrido, cursa pós-graduação EAD |
| **Dispositivos** | Notebook no trabalho, smartphone no restante do dia |
| **Ferramentas atuais** | Agenda do Google para reuniões, um app de notas para tarefas, lembretes do celular |
| **Objetivos** | Concluir a pós no prazo, manter três treinos por semana, ter fins de semana livres |
| **Dores** | Esquece entregas da pós porque elas não aparecem na mesma tela das reuniões; os treinos são os primeiros a sair da agenda quando o trabalho aperta |
| **O que espera do NEXO** | Uma visão única do dia e alguém que avise com antecedência e proponha onde encaixar o que ficou para trás |
| **Citação (hipotética)** | "Eu não preciso de mais uma lista. Preciso que alguém me diga quando fazer cada coisa." |

### Persona 2 — Rafael, o estudante estagiário

| | |
|---|---|
| **Perfil** | 20 anos, estudante de Sistemas de Informação, estagiário 6 h por dia |
| **Dispositivos** | Smartphone (uso principal) e computador do laboratório |
| **Ferramentas atuais** | Grupo de mensagens da turma, anotações soltas, calendário do celular |
| **Objetivos** | Ser aprovado em todas as disciplinas, entregar os trabalhos em grupo, aprender inglês |
| **Dores** | Adia tarefas grandes até a véspera; não sabe quanto tempo livre realmente tem; perde prazos que chegam pelo grupo da turma |
| **O que espera do NEXO** | Transformar trabalhos grandes em blocos de tempo e ser alertado quando estiver acumulando atividades |
| **Citação (hipotética)** | "Quando vejo, a semana acabou e o trabalho ainda está no zero." |

### Persona 3 — Marta, a plantonista

| | |
|---|---|
| **Perfil** | 41 anos, enfermeira em escala de plantões, mãe de dois filhos |
| **Dispositivos** | Smartphone; usa letras ampliadas no celular |
| **Ferramentas atuais** | Calendário de papel na geladeira e alarmes do celular |
| **Objetivos** | Não esquecer consultas e compromissos dos filhos, organizar a casa e reservar tempo para descanso |
| **Dores** | A escala muda todo mês; o que funciona em uma semana não serve para a seguinte; aplicativos com letras pequenas e muitos menus a cansam |
| **O que espera do NEXO** | Informar seus horários livres e receber um plano simples, com letras legíveis e lembretes claros |
| **Citação (hipotética)** | "Meu tempo livre muda toda semana. O plano precisa mudar junto." |

A persona 3 reforça os requisitos de acessibilidade (texto redimensionável até 200%, contraste, alvos de toque grandes) e de disponibilidade configurável por dia da semana.

## 9. Matriz de proposta de valor

Baseada no *Value Proposition Canvas* (perfil do cliente × mapa de valor).

### 9.1 Perfil do cliente

| Tarefas do cliente (*jobs*) | Dores (*pains*) | Ganhos esperados (*gains*) |
|---|---|---|
| Registrar tarefas, compromissos e prazos | Informação espalhada em vários apps | Ver o dia inteiro em uma tela |
| Decidir o que fazer primeiro | Tudo parece urgente | Saber a próxima ação sem pensar muito |
| Encaixar tarefas no tempo livre | Planos irreais, que ignoram compromissos | Um plano viável, que respeita a disponibilidade |
| Manter hábitos (estudo, treino) | Adiamentos recorrentes | Consistência e progresso visível nos objetivos |
| Replanejar após imprevistos | Refazer o plano dá trabalho | Reorganização rápida com um toque |
| Lembrar do que é importante | Lembretes genéricos ou esquecidos | Avisos no momento certo e com contexto |
| Avaliar a própria semana | Não há registro do que foi feito | Resumo semanal e indicadores claros |

### 9.2 Mapa de valor

| Produtos e serviços | Aliviadores de dor | Criadores de ganho |
|---|---|---|
| Gerenciador de tarefas, compromissos e hábitos com recorrência | Centraliza tudo em um único cadastro, usado por todos os módulos | Painel do dia com próxima atividade, pendências e alertas |
| Calendário com feriados nacionais (BrasilAPI) | Mostra feriados que afetam prazos e disponibilidade | Planejamento contextualizado com o calendário brasileiro |
| Planejamento diário e semanal | Considera disponibilidade, compromissos fixos, prioridades e prazos; aponta conflitos | Plano viável gerado em segundos |
| Assistente conversacional com IA | Responde em linguagem natural sobre a rotina real do usuário | Análises e sugestões personalizadas |
| Assistente proativo | Detecta acúmulo de tarefas e adiamentos frequentes | Recomendações antes que o problema aconteça |
| Propostas com aprovação | A IA nunca altera dados sem autorização | Confiança e controle sobre a própria agenda |
| Lembretes e notificações | Avisos de atividades próximas e pendentes | Menos esquecimentos |
| Histórico e insights | Registro automático de conclusões e adiamentos | Indicadores, padrões e resumo semanal |

### 9.3 Declaração de proposta de valor

> **Para** pessoas que precisam conciliar trabalho, estudos e vida pessoal, **o NEXO é** um assistente pessoal inteligente **que** transforma tarefas, compromissos e objetivos em um plano diário viável, conversa sobre a rotina e avisa antes que algo saia do controle. **Diferentemente de** listas de tarefas, calendários ou chatbots isolados, **o NEXO** usa os mesmos dados do usuário em todos os módulos e só altera a agenda com a aprovação dele.

## 10. Escopo funcional

### 10.1 Dentro do escopo (versão acadêmica)

| Módulo | Funcionalidades |
|---|---|
| **1 — Usuários e perfil** | Cadastro; login e logout; configuração inicial guiada; perfil; preferências pessoais; objetivos; disponibilidade semanal; configurações da conta |
| **2 — Tarefas e organização** | Criar, editar e excluir tarefas, compromissos e hábitos; concluir e adiar; prioridades; categorias; prazos; recorrência; calendário; programação diária |
| **3 — Assistente com IA** | Conversa; consultas sobre a rotina; análise de perfil, tarefas e objetivos; recomendações; propostas de reorganização; aprovação ou rejeição |
| **4 — Planejamento inteligente** | Planejamento diário e semanal; organização por prioridade; respeito à disponibilidade; identificação de conflitos; reorganização de adiadas; sugestões de melhoria |
| **5 — Lembretes** | Configuração de lembretes; avisos de atividades próximas; lembretes recorrentes; notificações de pendências; notificações personalizadas |
| **6 — Histórico e insights** | Histórico de concluídas e adiadas; indicadores de produtividade; acompanhamento de objetivos; resumo semanal; padrões; sugestões de melhoria |
| **API pública** | Feriados nacionais da BrasilAPI no calendário, no painel, no planejamento e no contexto da IA |

### 10.2 Fora do escopo desta versão

- Consultoria individualizada de investimentos.
- Prescrição de dietas.
- Diagnósticos médicos.
- Prescrição de exercícios físicos.
- Reconhecimento contínuo de voz.
- Automação irrestrita de dispositivos.
- Integração obrigatória com dezenas de aplicativos externos.

Treinos, estudos, refeições e outras atividades podem ser cadastrados como **compromissos ou hábitos organizacionais**. O NEXO organiza *quando* fazê-los, sem prescrever *o que* fazer neles. O assistente é instruído a recusar pedidos de diagnóstico, dieta, treino ou investimento e a recomendar um profissional.

### 10.3 Premissas e restrições

- A IA funciona por API real (Google Gemini no nível gratuito; Anthropic Claude como alternativa), chamada apenas pelo servidor. Sem chave configurada, o chat informa que a IA está indisponível; ele nunca simula respostas.
- Toda alteração sugerida pela IA é apresentada como prévia e depende de aprovação explícita.
- Lembretes são exibidos dentro da aplicação e, com permissão do usuário, como notificação do navegador enquanto o NEXO estiver aberto. Notificações *push* com o aplicativo fechado ficam para versões futuras.
- Os feriados considerados são apenas os nacionais, que é o que a BrasilAPI disponibiliza.
