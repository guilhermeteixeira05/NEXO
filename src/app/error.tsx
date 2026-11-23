"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Erro inesperado: mensagem clara e opção de recuperação (heurística H9). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="conteudo" className="page" style={{ maxWidth: 640 }}>
      <div className="panel" role="alert">
        <h1>Algo deu errado</h1>
        <p className="secondary">
          Não foi possível carregar esta página. Verifique sua conexão e tente novamente. Se o problema continuar, o servidor pode estar sem a
          configuração do banco de dados.
        </p>
        <div className="actions">
          <button type="button" className="btn btn--primary" onClick={reset}>
            Tentar novamente
          </button>
          <Link href="/configurar" className="btn btn--secondary">
            Ver configuração
          </Link>
        </div>
        {error.digest ? <p className="xsmall muted">Código do erro: {error.digest}</p> : null}
      </div>
    </main>
  );
}
