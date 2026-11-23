# Etapa 2 — Fundamentação de Usabilidade e Acessibilidade

> Entregável 3 de 3 da Etapa 2. A apostila exige o **atendimento comprovado de pelo menos 5 heurísticas de Nielsen**, com documentação explícita, e conformidade com a **WCAG 2.1 nível AA**. As evidências de implementação (telas e arquivos) estão no [relatório de usabilidade](relatorio-usabilidade.md) e no [relatório de acessibilidade](relatorio-acessibilidade.md).

---

## 1. As 10 heurísticas de Nielsen aplicadas ao NEXO

As dez heurísticas de usabilidade foram propostas por Jakob Nielsen (1994) e são mantidas pelo Nielsen Norman Group. A tabela descreve cada heurística, como ela se aplica ao NEXO e o status de aplicação.

| # | Heurística | Aplicação no NEXO | Status |
|---|---|---|---|
| H1 | **Visibilidade do status do sistema** | Indicador "NEXO está pensando…" durante as respostas da IA; botões com estado de carregamento; mensagens de sucesso e erro anunciadas em região `aria-live`; contador de notificações não lidas; barra de progresso na configuração inicial e nos objetivos; item ativo destacado na navegação. | **Aplicada** |
| H2 | **Correspondência entre o sistema e o mundo real** | Linguagem do cotidiano ("Adiar para amanhã", "Programação de hoje", "Horários livres"); datas no formato brasileiro; feriados nacionais no calendário; categorias familiares (trabalho, estudos, casa); a semana começa no domingo, como nos calendários brasileiros. | **Aplicada** |
| H3 | **Controle e liberdade do usuário** | A IA **nunca** altera dados sem aprovação: propostas podem ser aprovadas, rejeitadas ou ajustadas; diálogos podem ser fechados com Esc ou com o botão "Cancelar"; etapas da configuração inicial podem ser puladas; o assistente proativo pode ser desligado. | **Aplicada** |
| H4 | **Consistência e padrões** | Design system único (cores, tipografia, botões, campos e cartões) para todas as telas; o mesmo formulário de atividade em Tarefas, Calendário e Painel; os mesmos ícones e cores de prioridade em todo o sistema; a navegação mantém a mesma ordem em todos os tamanhos de tela. | **Aplicada** |
| H5 | **Prevenção de erros** | Confirmação antes de excluir; validação de horários (término posterior ao início); bloqueio de datas inválidas; o servidor revalida cada proposta da IA antes de aplicá-la; detecção de conflitos de horário antes de aprovar um plano. | **Aplicada** |
| H6 | **Reconhecimento em vez de memorização** | Painel com a programação do dia, a próxima atividade e as pendências sem precisar navegar; sugestões de perguntas prontas no chat; prévia das propostas mostrando o "antes → depois" de cada atividade; filtros visíveis na lista de tarefas. | **Aplicada** |
| H7 | **Flexibilidade e eficiência de uso** | Criação rápida de atividade pelo botão "+" em qualquer tela principal; adiamento com um toque ("Amanhã", "Próxima semana"); o chat permite pedir alterações em linguagem natural; atalhos de teclado nativos (Enter envia, Esc fecha). | **Aplicada** |
| H8 | **Estética e design minimalista** | Uma ação principal por tela; cartões com apenas as informações essenciais e detalhes sob demanda; navegação inferior com 5 itens no celular; uso contido de cor (azul e ciano para ação e destaque, cores de estado só para estado). | **Aplicada** |
| H9 | **Ajudar o usuário a reconhecer, diagnosticar e recuperar-se de erros** | Mensagens em linguagem simples, junto ao campo com erro e associadas por `aria-describedby`, que dizem o que fazer ("Informe um horário de término depois do início"); falhas da IA ou da BrasilAPI explicam o problema e oferecem "Tentar novamente". | **Aplicada** |
| H10 | **Ajuda e documentação** | Estados vazios que explicam o que fazer ("Você ainda não tem objetivos. Crie o primeiro…"); textos de apoio nos campos de disponibilidade e preferências; exemplos de perguntas no chat; seção "Como o NEXO usa seus dados" nas configurações. | **Aplicada** |

As dez heurísticas foram planejadas para o NEXO, superando o mínimo de cinco exigido pela apostila. Para a avaliação, a equipe destaca as **cinco heurísticas centrais**, com evidência detalhada no relatório de usabilidade: **H1, H3, H5, H6 e H9**.

## 2. Princípios da WCAG 2.1

A WCAG 2.1 (W3C, 2018) organiza os critérios em quatro princípios. Nível de conformidade pretendido: **AA**.

### 2.1 Perceptível

A informação e os componentes da interface devem ser apresentados de forma que o usuário consiga percebê-los.

| Critério | Nível | Como o NEXO atende |
|---|---|---|
| 1.1.1 Conteúdo não textual | A | Ícones decorativos com `aria-hidden="true"`; ícones que funcionam como botão têm nome acessível (`aria-label`) |
| 1.3.1 Informações e relações | A | HTML semântico (`header`, `nav`, `main`, `section`, `h1`–`h3`, `ul`, `table`, `fieldset`/`legend`); rótulos associados aos campos |
| 1.3.2 Sequência significativa | A | Ordem do DOM igual à ordem visual em todas as faixas de tela |
| 1.3.4 Orientação | AA | Funciona em retrato e paisagem, sem bloqueio de orientação |
| 1.3.5 Identificar o propósito da entrada | AA | `autocomplete` em nome, e-mail e senha |
| 1.4.1 Uso de cor | A | Prioridade e status indicados por cor **e** por texto ou ícone |
| 1.4.3 Contraste (mínimo) | AA | Texto com contraste ≥ 4,5:1 (≥ 3:1 para texto grande) nos temas claro e escuro |
| 1.4.4 Redimensionar texto | AA | Unidades `rem`; layout funcional com zoom de 200% |
| 1.4.10 Refluxo | AA | Sem rolagem horizontal a 320 px de largura (Mobile First) |
| 1.4.11 Contraste não textual | AA | Bordas de campos, ícones de ação e indicador de foco com contraste ≥ 3:1 |
| 1.4.12 Espaçamento de texto | AA | Sem alturas fixas em contêineres de texto |
| 1.4.13 Conteúdo em foco ou *hover* | AA | Sem *tooltips* que escondam conteúdo; menus abrem por clique |

### 2.2 Operável

Os componentes e a navegação devem ser operáveis por qualquer forma de entrada.

| Critério | Nível | Como o NEXO atende |
|---|---|---|
| 2.1.1 Teclado | A | Todos os controles são elementos nativos (`button`, `a`, `input`, `select`) acessíveis pelo teclado |
| 2.1.2 Sem bloqueio do teclado | A | Diálogos nativos (`<dialog>`) fecham com Esc e devolvem o foco |
| 2.2.1 Tempo ajustável | A | Nenhuma mensagem some sozinha antes de 6 s; notificações ficam na central até serem lidas |
| 2.3.1 Três flashes | A | Nenhuma animação piscante; animações respeitam `prefers-reduced-motion` |
| 2.4.1 Ignorar blocos | A | Link "Pular para o conteúdo" no início de cada página |
| 2.4.2 Página com título | A | `<title>` específico por rota ("Tarefas · NEXO") |
| 2.4.3 Ordem do foco | A | Ordem lógica; o foco vai para o diálogo ao abri-lo |
| 2.4.4 Finalidade do link | A | Textos de link descritivos |
| 2.4.6 Cabeçalhos e rótulos | AA | Um `h1` por página; rótulos visíveis em todos os campos |
| 2.4.7 Foco visível | AA | Anel de foco de 3 px em ciano/azul com contraste ≥ 3:1 |
| 2.5.3 Rótulo no nome | A | O nome acessível contém o texto visível do botão |
| Alvos de toque (critério da apostila) | — | Mínimo de 44 × 44 px em todos os controles interativos |

### 2.3 Compreensível

As informações e a operação da interface devem ser compreensíveis.

| Critério | Nível | Como o NEXO atende |
|---|---|---|
| 3.1.1 Idioma da página | A | `<html lang="pt-BR">` |
| 3.2.1 / 3.2.2 Em foco / Em entrada | A | Nenhuma mudança de contexto ao focar ou preencher; ações só no envio |
| 3.2.3 Navegação consistente | AA | Mesma navegação e mesma ordem em todas as páginas |
| 3.2.4 Identificação consistente | AA | O mesmo ícone e o mesmo rótulo para a mesma função |
| 3.3.1 Identificação do erro | A | Erros descritos em texto, junto ao campo, com `aria-invalid` |
| 3.3.2 Rótulos ou instruções | A | Rótulos visíveis e dicas de formato |
| 3.3.3 Sugestão de erro | AA | A mensagem diz como corrigir |
| 3.3.4 Prevenção de erros | AA | Confirmação de exclusões e aprovação explícita das propostas da IA |

### 2.4 Robusto

O conteúdo deve ser interpretado de forma confiável por diferentes agentes de usuário, incluindo tecnologias assistivas.

| Critério | Nível | Como o NEXO atende |
|---|---|---|
| 4.1.1 Análise sintática | A | HTML válido gerado pelo React; sem IDs duplicados |
| 4.1.2 Nome, função, valor | A | Componentes nativos; `aria-pressed`, `aria-expanded` e `aria-current` onde aplicável |
| 4.1.3 Mensagens de status | AA | Regiões `role="status"`/`aria-live="polite"` para carregamentos, sucesso e novas mensagens do chat |

## 3. Diretrizes de design derivadas

1. **Mobile First** com as faixas da apostila (320, 481, 769, 1025, 1201 px) e `min-width` nas media queries.
2. **Navegação adaptativa:** barra inferior no celular; barra lateral recolhida no tablet grande; barra lateral completa no desktop.
3. **Tokens de cor** em variáveis CSS, com tema claro e escuro automáticos (`prefers-color-scheme`) e escolha manual.
4. **Tipografia** base de 16 px (1 rem) e escala modular; altura de linha ≥ 1,5 no corpo do texto.
5. **Feedback imediato** para toda ação (H1) e linguagem simples (H2, H9).
6. **A IA como copiloto, não como piloto automático** (H3, H5): toda mudança é proposta, revisada e aprovada.

## Referências

- NIELSEN, Jakob. *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group, 1994 (atualizado em 2024). Disponível em: <https://www.nngroup.com/articles/ten-usability-heuristics/>. Acesso em: 23 nov. 2026.
- W3C. *Web Content Accessibility Guidelines (WCAG) 2.1*. W3C Recommendation, 2023. Disponível em: <https://www.w3.org/TR/WCAG21/>. Acesso em: 23 nov. 2026.
- BENYON, David. *Interação humano-computador*. 2. ed. São Paulo: Pearson Prentice Hall, 2011.
- KALBACH, James. *Design de navegação web: otimizando a experiência do usuário*. Porto Alegre: Bookman, 2009.
