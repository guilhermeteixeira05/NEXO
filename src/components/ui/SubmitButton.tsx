"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Botão de envio com estado de carregamento (heurística H1 — visibilidade do status). */
export function SubmitButton({
  children,
  pendingText = "Salvando…",
  variant = "primary",
  block = false,
  className = "",
  pending: pendingProp,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  block?: boolean;
  className?: string;
  /** Estado de envio vindo de useActionForm (formulários enviados pelo onSubmit). */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      className={`btn btn--${variant}${block ? " btn--block" : ""} ${className}`}
      disabled={pending}
      aria-disabled={pending}
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
