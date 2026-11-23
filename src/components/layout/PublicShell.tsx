import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

export function PublicShell({ children, showAuthLinks = true }: { children: ReactNode; showAuthLinks?: boolean }) {
  return (
    <div className="public">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="public__header">
        <Logo />
        {showAuthLinks ? (
          <nav aria-label="Acesso" className="actions">
            <Link href="/entrar" className="btn btn--ghost btn--sm">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn btn--primary btn--sm">
              Criar conta
            </Link>
          </nav>
        ) : null}
      </header>
      <main id="conteudo" tabIndex={-1} className="public__main">
        {children}
      </main>
      <footer className="public__footer">
        NEXO — Projeto acadêmico A3 · Usabilidade, Desenvolvimento Web, Mobile e Jogos · Feriados: BrasilAPI
      </footer>
    </div>
  );
}
