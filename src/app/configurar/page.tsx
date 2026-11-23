import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { Notice } from "@/components/ui/Misc";
import { isAiConfigured, isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Configurar o ambiente" };

/** Exibida quando faltam variáveis de ambiente: explica como ativar cada integração. */
export default function SetupPage() {
  const db = isSupabaseConfigured();
  const ai = isAiConfigured();
  return (
    <PublicShell showAuthLinks={db}>
      <section className="auth-card setup" style={{ maxWidth: 720 }} aria-labelledby="titulo-config">
        <div className="auth-card__head">
          <h1 id="titulo-config">Configurar o NEXO</h1>
          <p className="secondary">Esta instalação ainda não tem todas as integrações ativas. Siga os passos abaixo (detalhes no README).</p>
        </div>
        <Notice tone={db ? "success" : "warning"}>
          <strong>Banco de dados (Supabase): {db ? "configurado" : "não configurado"}</strong>
          {!db ? <span>Sem o banco, não é possível criar contas nem salvar dados.</span> : null}
        </Notice>
        <Notice tone={ai ? "success" : "warning"}>
          <strong>Inteligência artificial: {ai ? "configurada" : "não configurada"}</strong>
          {!ai ? <span>Sem a chave, o chat informa que a IA está indisponível e o planejamento usa apenas o algoritmo local.</span> : null}
        </Notice>
        <ol>
          <li>
            Crie um projeto gratuito em <a href="https://supabase.com/dashboard" rel="noreferrer" target="_blank">supabase.com</a> e, no SQL
            Editor, execute o arquivo <code>supabase/migrations/20261123000000_nexo_schema.sql</code>.
          </li>
          <li>
            Copie <code>.env.example</code> para <code>.env.local</code> e preencha <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (Project Settings → API).
          </li>
          <li>
            Para a IA, crie uma chave gratuita no{" "}
            <a href="https://aistudio.google.com/apikey" rel="noreferrer" target="_blank">
              Google AI Studio
            </a>{" "}
            e defina <code>GEMINI_API_KEY</code> (somente no servidor).
          </li>
          <li>Reinicie o servidor (<code>npm run dev</code>) ou faça um novo deploy na Vercel.</li>
        </ol>
        {db ? (
          <Link href="/entrar" className="btn btn--primary">
            Ir para Entrar
          </Link>
        ) : null}
      </section>
    </PublicShell>
  );
}
