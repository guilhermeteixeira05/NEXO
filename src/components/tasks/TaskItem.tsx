"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { PriorityBadge } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { TaskForm, type GoalOption } from "@/components/tasks/TaskForm";
import { deleteTaskAction, postponeTaskAction, toggleCompleteAction } from "@/lib/tasks/actions";
import { addDays, formatDayMonth, formatTime, localDateString, weekdayOf } from "@/lib/dates";
import { CATEGORY_LABELS, KIND_LABELS, type Task } from "@/lib/types";

function nextMonday(today: string) {
  const wd = weekdayOf(today);
  return addDays(today, wd === 1 ? 7 : (8 - wd) % 7 || 7);
}

/**
 * Cartão de atividade (RF10–RF13): concluir, adiar (1 toque), editar e excluir com confirmação.
 */
export function TaskItem({
  task,
  tz,
  goals,
  today,
  overdue = false,
  showDate = true,
}: {
  task: Task;
  tz: string;
  goals: GoalOption[];
  today: string;
  overdue?: boolean;
  showDate?: boolean;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [customDate, setCustomDate] = useState(addDays(today, 1));
  const menuRef = useRef<HTMLDetailsElement>(null);
  const done = task.status === "concluida";

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    if (menuRef.current) menuRef.current.open = false;
    startTransition(async () => {
      const r = await fn();
      toast(r.message ?? (r.ok ? "Feito." : "Algo deu errado."), r.ok ? "info" : "error");
    });
  };
  const closeEdit = useCallback(() => setEditing(false), []);

  const dateLabel = task.start_at
    ? `${showDate ? formatDayMonth(localDateString(new Date(task.start_at), tz)) + " · " : ""}${formatTime(task.start_at, tz)}${task.end_at ? "–" + formatTime(task.end_at, tz) : ""}`
    : task.due_date && showDate
      ? task.due_date === today
        ? "Hoje"
        : formatDayMonth(task.due_date)
      : null;

  return (
    <li className={`task${done ? " task--done" : ""}${overdue ? " task--overdue" : ""}`} aria-busy={pending}>
      <button
        type="button"
        className="task__check"
        onClick={() => run(() => toggleCompleteAction(task.id))}
        aria-pressed={done}
        aria-label={done ? `Reabrir “${task.title}”` : `Concluir “${task.title}”`}
        disabled={pending}
      >
        <span className="task__box">{done ? <Icon name="confirmar" size={16} /> : null}</span>
      </button>
      <div className="task__body">
        <span className="task__title">{task.title}</span>
        <span className="task__meta">
          {overdue ? (
            <span className="task__meta-item task__meta-item--danger">
              <Icon name="alerta" size={14} /> Atrasada
            </span>
          ) : null}
          {dateLabel ? (
            <span className="task__meta-item">
              <Icon name="relogio" size={14} />
              {dateLabel}
            </span>
          ) : null}
          <span>{task.kind !== "tarefa" ? `${KIND_LABELS[task.kind]} · ` : ""}{CATEGORY_LABELS[task.category]}</span>
          {task.recurrence !== "nenhuma" ? (
            <span className="task__meta-item">
              <Icon name="repetir" size={14} />
              <span className="sr-only">Recorrente</span>
            </span>
          ) : null}
          {task.postponed_count >= 2 && !done ? <span className="task__meta-item">Adiada {task.postponed_count}×</span> : null}
        </span>
      </div>
      <div className="task__side">
        <span className="task__badge">
          <PriorityBadge priority={task.priority} />
        </span>
        <details className="menu" ref={menuRef}>
          <summary className="btn btn--icon btn--ghost" aria-label={`Ações para “${task.title}”`}>
            <Icon name="pontos" />
          </summary>
          <div className="menu__panel">
            {!done ? (
              <>
                <p className="menu__label">Adiar</p>
                <button type="button" className="menu__item" onClick={() => run(() => postponeTaskAction(task.id, addDays(today, 1)))}>
                  <Icon name="adiar" size={20} /> Para amanhã
                </button>
                <button type="button" className="menu__item" onClick={() => run(() => postponeTaskAction(task.id, nextMonday(today)))}>
                  <Icon name="adiar" size={20} /> Para a próxima semana
                </button>
                <div className="menu__item" style={{ gap: 8 }}>
                  <label htmlFor={`adiar-${task.id}`} className="sr-only">
                    Adiar para a data
                  </label>
                  <input
                    id={`adiar-${task.id}`}
                    type="date"
                    className="input"
                    style={{ minHeight: 44, padding: "4px 8px" }}
                    min={addDays(today, 1)}
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => run(() => postponeTaskAction(task.id, customDate))}>
                    Adiar
                  </button>
                </div>
                <div className="menu__sep" />
              </>
            ) : null}
            <button type="button" className="menu__item" onClick={() => { if (menuRef.current) menuRef.current.open = false; setEditing(true); }}>
              <Icon name="editar" size={20} /> Editar
            </button>
            <button type="button" className="menu__item menu__item--danger" onClick={() => { if (menuRef.current) menuRef.current.open = false; setConfirming(true); }}>
              <Icon name="excluir" size={20} /> Excluir
            </button>
          </div>
        </details>
      </div>
      <Dialog open={editing} onClose={closeEdit} title="Editar atividade">
        <TaskForm task={task} goals={goals} tz={tz} onDone={closeEdit} />
      </Dialog>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Excluir atividade?"
        description={`“${task.title}” será removida. O registro da exclusão fica no histórico. Esta ação não pode ser desfeita.`}
      >
        <div className="actions actions--end">
          <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              setConfirming(false);
              run(() => deleteTaskAction(task.id));
            }}
          >
            Excluir
          </button>
        </div>
      </Dialog>
    </li>
  );
}
