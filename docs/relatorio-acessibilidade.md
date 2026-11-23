# Relatório de Acessibilidade — WCAG 2.1 nível AA

> Base: [fundamentação de usabilidade](02-etapa2-fundamentacao-usabilidade.md). Este relatório registra o que foi **implementado** e o que foi **verificado**, separando verificações automáticas, revisões manuais e itens pendentes.

## 1. Resultados das ferramentas (executadas em 23/11/2026)

### axe-core 4.14 (via Playwright, regras `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`)

| Página | Tema claro | Tema escuro |
|---|---|---|
| `/` (apresentação) | 0 violações · 22 regras aprovadas | 0 violações · 22 regras aprovadas |
| `/configurar` | 0 violações · 23 regras aprovadas | 0 violações · 23 regras aprovadas |
| 404 | 0 violações · 19 regras aprovadas | 0 violações · 19 regras aprovadas |

O axe marcou 1 item como "incompleto" (`color-contrast`, revisão manual) em cada página, porque não calcula contraste sobre fundos com gradiente. A revisão manual encontrou e **corrigiu** dois problemas:

1. O fim do gradiente do título (#22D3EE) tinha ~1,7:1 sobre o fundo claro → criado `--gradient-text` por tema: claro #1F57E7 → #0E7490 (≥ 5:1) e escuro #6E97FF → #22D3EE (≥ 7:1).
2. No ponto mais escuro dos brilhos do fundo público (14% de opacidade), o texto do rodapé (#5B6B84) ficaria em ~4,1:1 → brilhos reduzidos para 8% e rodapé com a cor secundária (#4A5872, ~5,9:1).

### axe-core nas telas autenticadas (Supabase real, tema claro, 1440 px)

| Tela | Violações | Regras aprovadas | Incompletos (revisão manual) |
|---|---|---|---|
| `/painel` | 0 | 26 | `color-contrast` em 5 elementos |
| `/tarefas` | 0 | 27 | — |
| `/calendario` | 0 | 25 | — |
| `/planejamento` | 0 | 27 | `color-contrast` em 1 elemento |
| `/assistente` | 0 | 23 | — |
| `/objetivos` | 0 | 24 | — |
| `/lembretes` | 0 | 26 | — |
| `/insights` | 0 | 28 | — |
| `/perfil` | 0 | 26 | — |
| `/configuracoes` | 0 | 27 | — |

Os relatórios estão em `docs/relatorios/axe/app-*.json`. Os itens "incompletos" são elementos sobre fundos que o axe não consegue medir e ainda precisam de revisão manual (ver Pendências).

A mesma suíte encontrou e **corrigiu**: `aria-pressed` em `<label>` nos seletores segmentados (axe crítico `aria-allowed-attr`) e o campo de data de "Adiar" com 40 px de altura.

### Lighthouse 13.6 (categoria Acessibilidade)

| Página | Celular | Desktop |
|---|---|---|
| `/` | 100 | 100 |
| `/configurar` | 100 | 100 |

Os relatórios completos estão em `docs/relatorios/lighthouse/*.json` (abra em <https://googlechrome.github.io/lighthouse/viewer/>).

### WAVE (WebAIM)

**Pendente**: a extensão WAVE precisa ser executada manualmente no navegador sobre a aplicação publicada. Registre aqui o número de erros e alertas de contraste por página.

## 2. Critérios implementados

| Critério | Implementação | Como verificar |
|---|---|---|
| 1.1.1 Conteúdo não textual | Ícones `aria-hidden`; botões só com ícone têm `aria-label` (ex.: "Concluir “Treino”") | axe `button-name`, `image-alt` |
| 1.3.1 Informações e relações | `header`/`nav`/`main`/`section`, um `h1` por página, `fieldset`/`legend`, listas `ul`/`ol`, tabela acessível com os dados do gráfico | axe; teste E2E de `h1` único |
| 1.3.2 Sequência significativa | Ordem do DOM = ordem visual; grids só reposicionam colunas | Navegação por Tab |
| 1.3.4 Orientação | Sem bloqueio; media query de paisagem para celulares baixos | Girar o aparelho |
| 1.3.5 Propósito da entrada | `autocomplete="name"`, `email`, `current-password`, `new-password` | Inspeção |
| 1.4.1 Uso de cor | Prioridade = cor + texto; atraso = cor + ícone + texto "Atrasada" | Revisão visual |
| 1.4.3 Contraste | Tokens calculados: texto principal ≥ 7:1, secundário ≥ 5:1 nos dois temas | axe `color-contrast` |
| 1.4.4 Redimensionar texto | Tipografia em `rem`; teste com fonte a 200% sem rolagem horizontal | Playwright (aprovado) |
| 1.4.10 Refluxo | Mobile First; nenhuma rolagem horizontal de 320 a 1920 px | Playwright, 8 larguras (aprovado) |
| 1.4.11 Contraste não textual | Bordas de campos #6B7A96 / #5470B8 (≥ 3:1); anel de foco de 3 px | Cálculo dos tokens |
| 1.4.12 Espaçamento de texto | Sem alturas fixas em blocos de texto | Inspeção |
| 2.1.1 Teclado | Somente elementos nativos (`button`, `a`, `input`, `select`, `details`, `dialog`) | Navegação por Tab |
| 2.1.2 Sem bloqueio | `<dialog>` nativo com Esc e retorno do foco | Teste manual |
| 2.2.1 Tempo ajustável | Avisos ficam 7 s e podem ser fechados; notificações permanecem na central | Inspeção |
| 2.3.1 / 2.3.3 Animações | Sem piscadas; `prefers-reduced-motion` desliga animações | CSS `base.css` |
| 2.4.1 Ignorar blocos | Link "Pular para o conteúdo" é o primeiro item da tabulação | Playwright (aprovado) |
| 2.4.2 Título da página | `"<Tela> · NEXO"` em todas as rotas | Playwright (aprovado) |
| 2.4.3 Ordem do foco | Foco vai para o título ao trocar de etapa na configuração inicial | Teste manual |
| 2.4.6 Cabeçalhos e rótulos | Rótulos visíveis em todos os campos | axe `label` |
| 2.4.7 Foco visível | `:focus-visible` com contorno de 3 px (azul no claro, ciano no escuro) | Navegação por Tab |
| 2.5.3 Rótulo no nome | O nome acessível começa pelo texto visível | axe |
| 3.1.1 Idioma | `<html lang="pt-BR">` | Playwright (aprovado) |
| 3.2.3 / 3.2.4 Consistência | Mesma navegação e mesmos componentes em todas as telas | Revisão |
| 3.3.1–3.3.3 Erros | Texto junto ao campo, `aria-invalid`, sugestão de correção | Teste manual |
| 3.3.4 Prevenção de erros | Confirmação de exclusão; propostas exigem aprovação | Teste manual |
| 4.1.1 Análise (ids únicos) | Cada logotipo tem o próprio `id` de gradiente; o teste com login confere que nenhuma das 10 telas repete `id` | Playwright (aprovado) |
| 4.1.2 Nome, função, valor | `aria-pressed` (em botões), rádios nativos nos seletores segmentados, `aria-current`, `aria-expanded`, `role="switch"`, `role="progressbar"` com valores | axe |
| 4.1.3 Mensagens de status | `role="status"`/`aria-live` nos avisos, no chat (`role="log"`) e nas contagens de filtro | Leitor de tela |
| Alvos de toque (apostila) | Mínimo de 44 × 44 px; botões de 48 px; interruptores acionados pelo rótulo inteiro | Playwright (aprovado nas páginas públicas e nas 10 telas autenticadas) |

## 3. Pendências

| Item | Responsável | Como fazer |
|---|---|---|
| Revisar o contraste dos itens "incompletos" do axe no Painel (5) e no Planejamento (1) | Integrante 1 | DevTools → inspecionar o elemento → contraste ≥ 4,5:1 |
| Executar WAVE nas telas publicadas | Integrante 1 | Extensão WAVE no Chrome/Firefox |
| Teste com leitor de tela (NVDA no Windows ou TalkBack no Android) | Equipe | Percorrer o fluxo: cadastro → criar atividade → aprovar plano |
| Teste com zoom de 200% nas telas autenticadas | Equipe | Ctrl + "+" no navegador |
