import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";

export default function NotFound() {
  return (
    <PublicShell showAuthLinks={false}>
      <section className="auth-card" aria-labelledby="titulo-404">
        <h1 id="titulo-404">Página não encontrada</h1>
        <p className="secondary">O endereço pode ter sido digitado errado ou a página não existe mais.</p>
        <div className="actions">
          <Link href="/painel" className="btn btn--primary">
            Ir para o Painel
          </Link>
          <Link href="/" className="btn btn--secondary">
            Página inicial
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
