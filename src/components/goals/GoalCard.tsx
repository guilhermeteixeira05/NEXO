"use client";

import { useActionForm } from "@/components/ui/useActionForm";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FormAlert, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/Misc";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { deleteGoalAction, saveGoalAction } from "@/lib/profile/actions";
import { formatDateShort } from "@/lib/dates";
import { CATEGORIES, CATEGORY_LABELS, GOAL_STATUSES, GOAL_STATUS_LABELS, initialActionState, type Goal } from "@/lib/types";

export function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const toast = useToast();
  const { state, pending, onSubmit } = useActionForm(saveGoalAction.bind(null, goal?.id ?? null), initialActionState);
  const e = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Objetivo salvo.");
      onDone();
    }
  }, [state, toast, onDone]);
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <FormAlert message={state.ok ? undefined : state.message} ok={false} />
      <TextField label="Objetivo" name="title" defaultValue={goal?.title} required maxLength={120} placeholder="Ex.: Concluir a pós-graduação" errors={e.title} autoFocus />
      <TextAreaField label="Descrição" name="description" defaultValue={goal?.description ?? ""} optional rows={2} maxLength={1000} errors={e.description} />
      <div className="form-row form-row--2">
        <SelectField label="Categoria" name="category" defaultValue={goal?.category ?? "pessoal"} options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} />
        <TextField label="Prazo" name="targetDate" type="date" defaultValue={goal?.target_date ?? ""} optional errors={e.targetDate} />
      </div>
      <div className="form-row form-row--2">
        <SelectField label="Situação" name="status" defaultValue={goal?.status ?? "ativo"} options={GOAL_STATUSES.map((s) => ({ value: s, label: GOAL_STATUS_LABELS[s] }))} />
        <TextField label="Progresso (%)" name="progress" type="number" min={0} max={100} step={5} defaultValue={goal?.progress ?? 0} errors={e.progress} />
      </div>
      <div className="actions actions--end">
        <SubmitButton pending={pending}>{goal ? "Salvar objetivo" : "Criar objetivo"}</SubmitButton>
      </div>
    </form>
  );
}

export function NewGoalButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" className="btn btn--primary" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="adicionar" size={20} /> Novo objetivo
      </button>
      <Dialog open={open} onClose={close} title="Novo objetivo">
        <GoalForm onDone={close} />
      </Dialog>
    </>
  );
}

/** Cartão de objetivo (RF06, RF41): progresso e atividades vinculadas. */
export function GoalCard({ goal, linkedDone, linkedTotal }: { goal: Goal; linkedDone: number; linkedTotal: number }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const close = useCallback(() => setEditing(false), []);
  return (
    <li className="panel" aria-busy={pending}>
      <div className="panel__header" style={{ alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontFamily: "var(--font-sans)", fontWeight: 600, overflowWrap: "anywhere" }}>{goal.title}</h2>
          <p className="xsmall muted">
            {CATEGORY_LABELS[goal.category]} · {GOAL_STATUS_LABELS[goal.status]}
            {goal.target_date ? ` · prazo ${formatDateShort(goal.target_date)}` : ""} · {linkedDone} de {linkedTotal} atividade(s) concluída(s)
          </p>
        </div>
        <span className="small" style={{ color: "var(--color-accent)", fontWeight: 700 }}>
          {goal.progress}%
        </span>
      </div>
      {goal.description ? <p className="small secondary">{goal.description}</p> : null}
      <ProgressBar value={goal.progress} label={`Progresso de ${goal.title}`} />
      <div className="actions">
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditing(true)}>
          <Icon name="editar" size={18} /> Editar
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(true)}>
          <Icon name="excluir" size={18} /> Excluir
        </button>
      </div>
      <Dialog open={editing} onClose={close} title="Editar objetivo">
        <GoalForm goal={goal} onDone={close} />
      </Dialog>
      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Excluir objetivo?" description="As atividades vinculadas serão mantidas, apenas sem vínculo. Esta ação não pode ser desfeita.">
        <div className="actions actions--end">
          <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setConfirming(false);
              start(async () => {
                const r = await deleteGoalAction(goal.id);
                toast(r.message ?? "", r.ok ? "info" : "error");
              });
            }}
          >
            Excluir
          </button>
        </div>
      </Dialog>
    </li>
  );
}
