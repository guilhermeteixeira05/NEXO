"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type Tone = "info" | "error";
interface ToastItem {
  id: number;
  text: string;
  tone: Tone;
}

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

/**
 * Avisos rápidos após ações (concluir, adiar, aprovar...). Região aria-live
 * anuncia o texto a leitores de tela (WCAG 4.1.3). Ficam 7 s na tela e podem ser fechados.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (text: string, tone: Tone = "info") => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-2), { id, text, tone }]);
      setTimeout(() => dismiss(id), 7000);
    },
    [dismiss],
  );
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast${t.tone === "error" ? " toast--error" : ""}`}>
            <Icon name={t.tone === "error" ? "alerta" : "confirmar"} size={18} />
            <span className="toast__text">{t.text}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Fechar aviso">
              <Icon name="fechar" size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
