import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/AuthForms";
import { PublicShell } from "@/components/layout/PublicShell";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  if (!isSupabaseConfigured()) redirect("/configurar");
  return (
    <PublicShell showAuthLinks={false}>
      <section className="auth-card" aria-labelledby="titulo-cadastro">
        <div className="auth-card__head">
          <h1 id="titulo-cadastro">Criar sua conta</h1>
          <p className="secondary">Leva menos de um minuto. Depois, você configura sua rotina em 4 etapas rápidas.</p>
        </div>
        <SignUpForm />
      </section>
    </PublicShell>
  );
}
