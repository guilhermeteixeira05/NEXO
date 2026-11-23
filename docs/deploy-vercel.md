# Publicação (Supabase + Vercel)

> Estas etapas exigem as contas do grupo e devem ser feitas por um integrante. Nenhuma credencial deve ser colada no chat nem versionada.

## 1. Banco de dados — Supabase

1. Crie uma conta em <https://supabase.com> e um projeto (região **South America (São Paulo)**). Guarde a senha do banco num gerenciador de senhas.
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/migrations/20261123000000_nexo_schema.sql` e clique em **Run**. Deve aparecer "Success. No rows returned".
3. Em **Authentication → URL Configuration**:
   - **Site URL:** a URL da Vercel (ex.: `https://nexo-a3.vercel.app`); localmente, `http://localhost:3000`.
   - **Redirect URLs:** adicione `http://localhost:3000/**` e `https://SEU-PROJETO.vercel.app/**`.
4. Em **Authentication → Providers → Email**: mantenha a confirmação de e-mail ligada em produção. Para um projeto **de teste** usado pela suíte E2E, desligue "Confirm email".
5. Em **Project Settings → API** (ou **API Keys**), copie a **Project URL** e a chave **publishable** (`sb_publishable_…`; projetos antigos mostram a "anon"). **Nunca** use a `service_role`/`secret` no NEXO.

## 2. IA — Anthropic

1. Crie a chave em <https://console.anthropic.com> → **API Keys** (requer créditos na conta).
2. Opcional: defina um limite de gastos mensal em **Billing → Limits**.

## 3. Ambiente local

```bash
cp .env.example .env.local     # no PowerShell: Copy-Item .env.example .env.local
# edite .env.local com URL, chave publishable, ANTHROPIC_API_KEY e NEXT_PUBLIC_SITE_URL
npm install
npm run dev                    # http://localhost:3000
```

## 4. Vercel

1. Envie o repositório ao GitHub (ver [CONTRIBUTING.md](../CONTRIBUTING.md#publicar-o-repositório-no-github)).
2. Em <https://vercel.com/new>, importe o repositório. A Vercel detecta Next.js (Build: `next build`; Node 20 ou mais recente).
3. Em **Environment Variables** (Production e Preview), cadastre:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave publishable |
| `ANTHROPIC_API_KEY` | chave da Anthropic (**somente servidor**) |
| `ANTHROPIC_MODEL` | `claude-haiku-5-5` (opcional) |
| `NEXT_PUBLIC_SITE_URL` | `https://SEU-PROJETO.vercel.app` |

4. Clique em **Deploy**. Ao terminar, volte ao Supabase (passo 1.3) e confirme a URL da Vercel.
5. Teste em produção: cadastro → configuração inicial → nova atividade → Assistente → Planejamento → Calendário (feriados).
6. Rode o Lighthouse e o WAVE na URL pública e anote os resultados nos relatórios.

Também é possível publicar pela CLI: `npx vercel` (login com a conta do grupo) e depois `npx vercel --prod`.

## 5. Verificações após o deploy

| Verificação | Esperado |
|---|---|
| `/` abre sem login | Página de apresentação |
| `/painel` sem login | Redireciona para `/entrar` |
| Cadastro | E-mail de confirmação (produção) ou entrada direta (teste) |
| Chat | Resposta da IA; sem chave, aviso "IA não configurada" |
| Calendário de dezembro | Natal marcado como feriado (BrasilAPI) |
| Cabeçalhos | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |
