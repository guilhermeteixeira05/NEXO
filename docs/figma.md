# Projeto Visual no Figma

**Arquivo:** NEXO — Assistente Pessoal Inteligente
**Link:** <https://www.figma.com/design/9hzmKgGYbPMaTvYTgbRyRn>
Criado em 23/11/2026 na conta do grupo (equipe "A equipe de Gabriel", plano Starter), pela integração oficial do Figma (MCP). O arquivo é editável e pode ser compartilhado pelo botão **Share** do Figma.

## Limitações do plano Starter e como foram contornadas

| Limitação | Efeito | Solução adotada |
|---|---|---|
| No máximo **3 páginas** por arquivo | Não foi possível criar 7 páginas | As 7 páginas pedidas viraram **seções nomeadas** distribuídas em 3 páginas (tabela abaixo). Em um plano sem esse limite (Professional ou o plano educacional do Figma, se o grupo for elegível), cada seção pode ser movida para uma página própria. |
| Coleções de variáveis com **1 modo** | Não há modo Claro/Escuro na mesma coleção | Duas coleções com os mesmos nomes de token: **Tema escuro** e **Tema claro** (as telas usam o tema escuro, a assinatura visual do NEXO). |
| Conexões de protótipo só entre quadros de **nível superior** | Quadros dentro de seções não podem ser destino | As telas do protótipo ficam logo abaixo da faixa "07 · Protótipo", direto na página. |

## Organização

| Página do arquivo | Seção | Conteúdo |
|---|---|---|
| **01–02 · Identidade visual e Arquitetura** | 01 · Identidade visual | Logotipo (variantes), paleta dos dois temas, escala tipográfica (Space Grotesk + Inter), 28 ícones como componentes, Botão (4 estilos × 4 estados = 16 variantes, propriedade de texto "Rótulo"), Campo (4 estados), Selo de prioridade (4), Cartão de atividade (3 estados), Navegação inferior (5), Item de menu lateral (2), Barra superior, Balão de mensagem (2), Cartão de proposta, Cartão de indicador, Cartão de briefing, Alternador (2) |
| | 02 · Arquitetura | Estrutura de navegação por faixa, mapa de telas, organização dos módulos (com integrantes e tabelas), 8 fluxos principais e grade do dashboard por breakpoint |
| **03 · Wireframes** | 03 · Wireframes | 13 telas em baixa fidelidade (360 px) com anotações |
| **04–07 · Mobile, Tablet, Desktop e Protótipo** | 04 · Mobile | 12 telas a 390 × 844 (Entrar, Cadastro, Configuração inicial, Painel, Tarefas, Objetivos, Calendário, Assistente, Planejamento, Lembretes, Insights, Configurações), com rolagem e barra inferior fixa |
| | 05 · Tablet | Painel, Tarefas, Assistente e Calendário a 820 × 1180 (menu recolhido, 2 colunas) |
| | 06 · Desktop | Painel, Tarefas, Assistente, Planejamento e Insights a 1440 × 1024 (menu completo, 2–3 colunas) |
| | 07 · Protótipo | 13 telas conectadas (62 interações de clique) e fluxos iniciais "Fluxo principal do NEXO" e "Explorar a partir do Painel" |

## Design system

- **Variáveis:** coleção "Primitivas" (30 cores), "Tema escuro" e "Tema claro" (18 tokens semânticos cada, com *code syntax* `var(--color-…)` igual ao CSS do projeto) e "Espaçamento e raio" (14 tokens).
- **Estilos:** 10 estilos de texto e 3 de efeito (Elevação/1, Elevação/2, Brilho/Ciano).
- **Componentes:** todos com Auto Layout; variantes combinadas em *component sets*; telas montadas com **instâncias**, então alterar um componente atualiza todas as telas.
- **Correspondência com o código:** os nomes dos tokens do Figma são os mesmos de `src/styles/tokens.css`, e os ícones têm os mesmos traçados de `src/components/ui/Icon.tsx`.

## Como apresentar o protótipo

1. Abra a página **04–07 · Mobile, Tablet, Desktop e Protótipo**.
2. No painel direito (sem nada selecionado), em **Prototype → Flows**, escolha **Fluxo principal do NEXO** e clique em ▶ (Present).
3. Percurso sugerido para o vídeo: Entrar → Painel → "Reorganizar tarde" → Assistente (proposta) → Aprovar → Painel → Mais → Planejamento → Aprovar plano.
