import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/AuthForms";
import { PublicShell } from "@/components/layout/PublicShell";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!isSupabaseConfigured()) redirect("/configurar");
  const sp = await searchParams;
  const next = sp.proxima && sp.proxima.startsWith("/") && !sp.proxima.startsWith("//") ? sp.proxima : "/painel";
  const notice = sp.erro === "confirmacao" ? "O link de confirmação é inválido ou expirou. Entre ou cadastre-se novamente." : undefined;
  return (
    <PublicShell showAuthLinks={false}>
      <section className="auth-card" aria-labelledby="titulo-entrar">
        <div className="auth-card__head">
          <h1 id="titulo-entrar">Entrar no NEXO</h1>
          <p className="secondary">Seu assistente pessoal para organizar tarefas, compromissos e objetivos.</p>
        </div>
        <SignInForm next={next} notice={notice} />
      </section>
    </PublicShell>
  );
}
