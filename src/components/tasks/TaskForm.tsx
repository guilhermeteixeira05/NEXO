"use client";

import { useActionForm } from "@/components/ui/useActionForm";
import { useEffect, useState } from "react";
import { FormAlert, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { saveTaskAction } from "@/lib/tasks/actions";
import { localDateString, localTimeString } from "@/lib/dates";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  initialActionState,
  KIND_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  RECURRENCES,
  RECURRENCE_LABELS,
  TASK_KINDS,
  type Task,
  type TaskKind,
} from "@/lib/types";

export interface GoalOption {
  id: string;
  title: string;
}

/** Formulário de atividade (RF09, RF10, RF14, RF15, RF34) — usado em Tarefas, Painel e Calendário. */
export function TaskForm({
  task,
  goals,
  tz,
  defaultDate,
  onDone,
}: {
  task?: Task;
  goals: GoalOption[];
  tz: string;
  defaultDate?: string;
  onDone?: () => void;
}) {
  const toast = useToast();
  const { state, pending, onSubmit } = useActionForm(saveTaskAction.bind(null, task?.id ?? null), initialActionState);
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? "tarefa");
  const [recurrence, setRecurrence] = useState(task?.recurrence ?? "nenhuma");
  const e = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Atividade salva.");
      onDone?.();
    }
  }, [state, toast, onDone]);

  const date = task?.start_at ? localDateString(new Date(task.start_at), tz) : (task?.due_date ?? defaultDate ?? "");
  const start = task?.start_at ? localTimeString(new Date(task.start_at), tz) : "";
  const end = task?.end_at ? localTimeString(new Date(task.end_at), tz) : "";

  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <FormAlert message={state.ok ? undefined : state.message} ok={false} />
      <TextField
        label="Título"
        name="title"
        defaultValue={task?.title}
        required
        maxLength={160}
        placeholder="Ex.: Estudar capítulo 3"
        errors={e.title}
        autoFocus
      />
      <fieldset>
        <legend>Tipo</legend>
        <div className="segmented" role="radiogroup" aria-label="Tipo da atividade">
          {TASK_KINDS.map((k) => (
            <label key={k} className="segmented__option" data-selected={kind === k} style={{ cursor: "pointer" }}>
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="sr-only"
              />
              {KIND_LABELS[k]}
            </label>
          ))}
        </div>
        <p className="field__hint" style={{ marginTop: 6 }}>
          {kind === "compromisso"
            ? "Compromissos têm horário fixo e não são movidos pelo planejamento."
            : kind === "habito"
              ? "Hábitos costumam se repetir (ex.: treino, leitura)."
              : "Tarefas podem ter só um prazo; o NEXO sugere quando fazê-las."}
        </p>
      </fieldset>
      <div className="form-row form-row--2">
        <SelectField
          label="Categoria"
          name="category"
          defaultValue={task?.category ?? "pessoal"}
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          errors={e.category}
        />
        <SelectField
          label="Prioridade"
          name="priority"
          defaultValue={task?.priority ?? "media"}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
          errors={e.priority}
        />
      </div>
      <div className="form-row form-row--3">
        <TextField label={kind === "compromisso" ? "Data" : "Data ou prazo"} name="date" type="date" defaultValue={date} optional={kind !== "compromisso"} errors={e.date} />
        <TextField label="Início" name="startTime" type="time" defaultValue={start} optional={kind !== "compromisso"} errors={e.startTime} />
        <TextField label="Término" name="endTime" type="time" defaultValue={end} optional={kind !== "compromisso"} errors={e.endTime} />
      </div>
      <div className="form-row form-row--2">
        <TextField
          label="Duração estimada (min)"
          name="durationMinutes"
          type="number"
          inputMode="numeric"
          min={5}
          max={720}
          step={5}
          defaultValue={task?.duration_minutes ?? ""}
          optional
          hint="Usada pelo planejamento quando não há horário."
          errors={e.durationMinutes}
        />
        <SelectField
          label="Objetivo vinculado"
          name="goalId"
          defaultValue={task?.goal_id ?? ""}
          optional
          options={[{ value: "", label: "Nenhum" }, ...goals.map((g) => ({ value: g.id, label: g.title }))]}
          errors={e.goalId}
        />
      </div>
      <div className="form-row form-row--2">
        <SelectField
          label="Repetição"
          name="recurrence"
          value={recurrence}
          onChange={(ev) => setRecurrence(ev.target.value as typeof recurrence)}
          options={RECURRENCES.map((r) => ({ value: r, label: RECURRENCE_LABELS[r] }))}
          errors={e.recurrence}
        />
        {recurrence !== "nenhuma" ? (
          <TextField label="Repetir até" name="recurrenceUntil" type="date" defaultValue={task?.recurrence_until ?? ""} optional errors={e.recurrenceUntil} />
        ) : null}
      </div>
      <TextAreaField label="Descrição" name="description" defaultValue={task?.description ?? ""} optional rows={3} maxLength={2000} errors={e.description} />
      <label className="checkbox">
        <input type="checkbox" name="createReminder" defaultChecked={!task} />
        <span>Criar lembrete com a antecedência padrão (quando houver horário)</span>
      </label>
      <div className="actions actions--end">
        <SubmitButton pending={pending} pendingText="Salvando…">{task ? "Salvar alterações" : "Criar atividade"}</SubmitButton>
      </div>
    </form>
  );
}
