# Roteiro do Vídeo de Apresentação (até 10 minutos)

> Exigência da apostila (seção 1.2): "demonstração técnica e pitch do projeto com duração máxima de 10 minutos, apresentando o problema, a solução, a arquitetura e a conformidade heurística".
> Sugestão de divisão: cada integrante apresenta a parte que desenvolveu. Grave em 1080p, com o navegador a 100% e o modo "Não perturbe" ativado.

| Tempo | Bloco | Quem | O que mostrar | Fala-guia |
|---|---|---|---|---|
| 0:00–0:45 | Abertura e problema | Integrante 1 | Tela de apresentação (`/`) | "Quem concilia trabalho, estudo e vida pessoal espalha compromissos em vários apps e adia o que é importante. O NEXO nasceu para resolver isso." |
| 0:45–1:30 | Público e personas | Integrante 2 | Slide ou `docs/01-etapa1…` | Apresentar Camila, Rafael e Marta, deixando claro que são **hipóteses de projeto**; matriz de proposta de valor em uma frase. |
| 1:30–2:15 | Concorrentes e diferencial | Integrante 4 | Quadro comparativo | "Motion planeja, Todoist lista, Notion organiza, Gemini conversa. O NEXO une isso sobre os mesmos dados e só muda sua agenda com a sua aprovação." |
| 2:15–3:00 | Design e protótipo | Integrante 1 | Figma: identidade visual → protótipo em Present | Design system com variáveis e componentes; responsividade em mobile, tablet e desktop. |
| 3:00–4:00 | Cadastro e configuração | Integrante 2 | Cadastro → 4 etapas → Painel | Disponibilidade semanal; mostrar "Pular" e "Voltar" (H3). |
| 4:00–5:00 | Tarefas e calendário | Integrante 3 | Nova atividade (compromisso com erro de horário → mensagem), concluir, adiar com 1 toque, calendário com feriado | Prevenção e recuperação de erros (H5, H9); feriados da **BrasilAPI** (API pública). |
| 5:00–6:30 | IA e planejamento | Integrante 4 | Assistente: "Como está minha programação de amanhã?" → "Reorganize minhas atividades…" → cartão de proposta → Aprovar; Planejamento com conflitos | A IA usa os dados reais, propõe e espera aprovação; validação no servidor; chave protegida no servidor. |
| 6:30–7:30 | Lembretes e insights | Integrante 5 | Novo lembrete, central de notificações, Insights (gráfico, padrões, resumo semanal) | Histórico alimentando indicadores; o briefing proativo do Painel. |
| 7:30–8:30 | Arquitetura e qualidade | Integrante 4 ou 1 | Diagrama de `docs/arquitetura-aplicacao.md`; terminal com `npm run check` e Playwright | Next.js + Supabase (RLS) + Google Gemini + BrasilAPI; 117 testes automatizados (inclusive fluxos com login no Supabase real); Lighthouse Acessibilidade 100. |
| 8:30–9:30 | Responsividade e acessibilidade | Integrante 1 | DevTools: 320 → 768 → 1440 px; navegação só pelo teclado; tema escuro | Mobile First com os breakpoints da apostila; WCAG 2.1 AA; alvos de 44 px; as 10 heurísticas (destacar H1, H3, H5, H6, H9). |
| 9:30–10:00 | Encerramento | Todos | Links do deploy, GitHub e Figma | Agradecimento e próximos passos (push com o app fechado, integração com agenda externa). |

## Checklist de gravação

- [ ] Conta de demonstração com dados preparados **e identificados como demonstração** (ex.: "Camila Demo").
- [ ] IA configurada no ambiente publicado (sem a chave, mostrar o aviso honesto de "IA não configurada").
- [ ] Notificações do navegador permitidas, para mostrar um lembrete disparando.
- [ ] Teste o roteiro inteiro uma vez antes de gravar (cronometrado).
- [ ] Não mostrar `.env.local`, painéis com chaves nem e-mails pessoais na tela.
- [ ] Exportar em MP4 e conferir o áudio.
