# Como contribuir com o NEXO

Guia para os integrantes do grupo: Guilherme Pereira Teixeira, Gabriel Pereira e Henrique Araujo Soares. Frentes de trabalho, responsáveis e contratos entre módulos: [docs/divisao-equipe.md](docs/divisao-equipe.md).

## Branches

| Branch | Uso |
|---|---|
| `main` | Versão estável, publicada na Vercel. Só recebe merge de `develop`. |
| `develop` | Integração. Recebe os Pull Requests das features. |
| `feature/interface` | Frente 1 — interface, navegação, design system, responsividade |
| `feature/usuarios` | Frente 2 — cadastro, autenticação, perfil, objetivos |
| `feature/tarefas` | Frente 3 — tarefas, calendário, disponibilidade |
| `feature/ia` | Frente 4 — assistente, IA, planejamento |
| `feature/lembretes` | Frente 5 — lembretes, notificações, histórico, insights, BrasilAPI |

Para tarefas menores, crie branches a partir da sua feature: `feature/tarefas-filtro-por-data`.

## Fluxo de trabalho

```bash
git checkout develop && git pull
git checkout feature/tarefas            # sua branch
git merge develop                        # traga as novidades do grupo
# ... implemente ...
npm run check && npm run build           # obrigatório antes do PR
git add -A
git commit -m "feat: filtro de tarefas por data"
git push origin feature/tarefas
```

Depois, abra um **Pull Request** de `feature/…` para `develop` no GitHub, descreva o que mudou e como testar, e peça revisão a um colega. Para publicar, abra um PR de `develop` para `main`.

## Padrão de commits (Conventional Commits, em português)

| Prefixo | Quando | Exemplo |
|---|---|---|
| `feat:` | Nova funcionalidade | `feat: lembretes recorrentes semanais` |
| `fix:` | Correção | `fix: horário do lembrete após adiar` |
| `docs:` | Documentação | `docs: atualização do README` |
| `test:` | Testes | `test: validação de responsividade` |
| `style:` | Só aparência/CSS | `style: contraste do botão secundário` |
| `refactor:` | Reorganização sem mudar o comportamento | `refactor: extrai cálculo de métricas` |
| `chore:` | Configuração e dependências | `chore: atualiza next para 16.4.7` |

Commits pequenos e frequentes, um assunto por commit. **Cada integrante deve commitar com o próprio usuário do Git**, porque a rubrica avalia a colaboração no histórico:

```bash
git config user.name "Seu Nome"
git config user.email "seu-email-do-github@exemplo.com"
```

## Regras de qualidade

1. TypeScript sem `any` desnecessário; ESLint sem erros.
2. Toda entrada do usuário é validada no servidor (Zod) e toda Server Action chama `requireUser()`.
3. Cores, espaçamentos e raios só pelos tokens de `src/styles/tokens.css`; Mobile First com `min-width` nos breakpoints da apostila (481, 769, 1025, 1201 px).
4. Acessibilidade: rótulo visível em todo campo, alvos de toque ≥ 44 px, foco visível, textos alternativos, nada transmitido só por cor.
5. Mudança no banco = nova migração + tipos em `src/lib/types.ts` + teste em `tests/db/`.
6. Nunca versionar `.env.local`, chaves ou senhas. Se uma chave vazar, revogue-a imediatamente no painel do serviço.
7. Atualize a documentação em `docs/` quando mudar um comportamento descrito lá.

## Publicar o repositório no GitHub

O repositório oficial é <https://github.com/guilhermeteixeira05/NEXO>, com `main`, `develop` e as 5 branches `feature/*`. Cada integrante clona e trabalha na sua branch:

```bash
git clone https://github.com/guilhermeteixeira05/NEXO.git
cd NEXO
git switch feature/SUA-FRENTE      # ex.: feature/tarefas
```

No primeiro `git push`, o Git Credential Manager abre a janela "Connect to GitHub": clique em **Sign in with your browser**, entre na sua conta e clique em **Authorize git-ecosystem**.

Configuração do repositório (feita pelo dono):

1. Em **Settings → Collaborators**, convide Gabriel Pereira e Henrique Araujo Soares (cada um aceita o convite recebido por e-mail).
2. Recomendado: em **Settings → Branches**, proteja `main` e `develop` (exigir Pull Request e 1 aprovação).
