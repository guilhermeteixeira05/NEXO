"use client";

import { useCallback, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { TaskForm, type GoalOption } from "@/components/tasks/TaskForm";

/**
 * Criação rápida de atividade a partir de qualquer tela (heurística H7):
 * botão flutuante no celular e botão no cabeçalho a partir de 769 px.
 */
export function QuickAdd({ goals, tz, variant }: { goals: GoalOption[]; tz: string; variant: "fab" | "topbar" }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      {variant === "fab" ? (
        <button type="button" className="fab" onClick={() => setOpen(true)} aria-label="Nova atividade" aria-haspopup="dialog">
          <Icon name="adicionar" size={28} />
        </button>
      ) : (
        <button type="button" className="btn btn--primary btn--sm topbar__new" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <Icon name="adicionar" size={20} />
          Nova atividade
        </button>
      )}
      <Dialog open={open} onClose={close} title="Nova atividade" description="Campos marcados como opcionais podem ficar em branco.">
        <TaskForm goals={goals} tz={tz} onDone={close} />
      </Dialog>
    </>
  );
}
