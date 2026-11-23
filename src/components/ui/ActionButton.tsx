"use client";

import { useTransition, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import type { ActionState } from "@/lib/types";

/** Botão que executa uma Server Action e mostra o resultado em um aviso (H1). */
export function ActionButton({
  action,
  children,
  pendingText = "Aguarde…",
  className = "btn btn--secondary btn--sm",
  ariaLabel,
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  pendingText?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      aria-label={ariaLabel}
      onClick={() =>
        start(async () => {
          const r = await action();
          toast(r.message ?? (r.ok ? "Feito." : "Não foi possível concluir."), r.ok ? "info" : "error");
        })
      }
    >
      {pending ? (
        <>
          <span className="btn__spinner" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
