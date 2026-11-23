"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Diálogo acessível baseado no elemento <dialog> nativo:
 * foco preso dentro do diálogo, Esc fecha e o foco volta ao botão que o abriu
 * (WCAG 2.1.2, 2.4.3 — heurística H3).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  variant = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "default" | "sheet";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog${variant === "sheet" ? " dialog--sheet" : ""}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // clique fora fecha
      }}
    >
      {open ? (
        <div className="dialog__inner">
          <div className="dialog__header">
            <div className="stack" style={{ gap: 4 }}>
              <h2 id={titleId}>{title}</h2>
              {description ? (
                <p id={descId} className="secondary small">
                  {description}
                </p>
              ) : null}
            </div>
            <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Fechar">
              <Icon name="fechar" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
