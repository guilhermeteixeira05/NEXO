"use client";

import { useActionForm } from "@/components/ui/useActionForm";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FormAlert, SelectField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { deleteReminderAction, saveReminderAction, toggleReminderAction } from "@/lib/reminders/actions";
import { formatDateTime } from "@/lib/dates";
import { initialActionState, REMINDER_RECURRENCES, REMINDER_RECURRENCE_LABELS, type Reminder } from "@/lib/types";

export function ReminderForm({
  tasks,
  defaultDate,
  onDone,
}: {
  tasks: { id: string; title: string }[];
  defaultDate: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const { state, pending, onSubmit } = useActionForm(saveReminderAction.bind(null, null), initialActionState);
  const e = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Lembrete criado.");
      onDone();
    }
  }, [state, toast, onDone]);
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <FormAlert message={state.ok ? undefined : state.message} ok={false} />
      <TextField label="Título" name="title" required maxLength={160} placeholder="Ex.: Beber água" errors={e.title} autoFocus />
      <div className="form-row form-row--2">
        <TextField label="Data" name="date" type="date" defaultValue={defaultDate} required errors={e.date} />
        <TextField label="Hora" name="time" type="time" defaultValue="09:00" required errors={e.time} />
      </div>
      <SelectField label="Repetição" name="recurrence" defaultValue="nenhuma" options={REMINDER_RECURRENCES.map((r) => ({ value: r, label: REMINDER_RECURRENCE_LABELS[r] }))} />
      <SelectField
        label="Atividade vinculada"
        name="taskId"
        optional
        defaultValue=""
        options={[{ value: "", label: "Nenhuma (lembrete avulso)" }, ...tasks.map((t) => ({ value: t.id, label: t.title }))]}
      />
      <div className="actions actions--end">
        <SubmitButton pending={pending}>Criar lembrete</SubmitButton>
      </div>
    </form>
  );
}

export function NewReminderButton({ tasks, defaultDate }: { tasks: { id: string; title: string }[]; defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" className="btn btn--primary" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="adicionar" size={20} /> Novo lembrete
      </button>
      <Dialog open={open} onClose={close} title="Novo lembrete" description="Os lembretes aparecem na central de notificações e, se você permitir, como notificação do navegador.">
        <ReminderForm tasks={tasks} defaultDate={defaultDate} onDone={close} />
      </Dialog>
    </>
  );
}

/** Item de lembrete (RF33, RF35): pausar/ativar e excluir. */
export function ReminderItem({ reminder, tz, taskTitle }: { reminder: Reminder; tz: string; taskTitle?: string }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const active = reminder.status === "agendado";
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      toast(r.message ?? "", r.ok ? "info" : "error");
    });
  return (
    <li className="task" aria-busy={pending} style={{ paddingLeft: 12 }}>
      <span style={{ color: "var(--color-accent)", flexShrink: 0 }}>
        <Icon name={reminder.recurrence === "nenhuma" ? "relogio" : "repetir"} />
      </span>
      <div className="task__body">
        <span className="task__title">{reminder.title}</span>
        <span className="task__meta">
          <span>
            {reminder.status === "enviado" ? "Enviado em " : active ? "Próximo: " : "Pausado · "}
            {formatDateTime(reminder.remind_at, tz)}
          </span>
          <span>{REMINDER_RECURRENCE_LABELS[reminder.recurrence]}</span>
          {taskTitle ? <span>Atividade: {taskTitle}</span> : null}
        </span>
      </div>
      <div className="task__side">
        {reminder.status !== "enviado" ? (
          <label className="switch" style={{ minHeight: 44 }}>
            <span className="sr-only">{active ? `Pausar lembrete “${reminder.title}”` : `Ativar lembrete “${reminder.title}”`}</span>
            <input type="checkbox" role="switch" checked={active} disabled={pending} onChange={() => run(() => toggleReminderAction(reminder.id, !active))} />
          </label>
        ) : null}
        <button type="button" className="btn btn--icon btn--ghost" aria-label={`Excluir lembrete “${reminder.title}”`} disabled={pending} onClick={() => run(() => deleteReminderAction(reminder.id))}>
          <Icon name="excluir" size={20} />
        </button>
      </div>
    </li>
  );
}

/** Ativa as notificações do navegador (RF35) — pede permissão somente por ação do usuário. */
const noopSubscribe = () => () => {};
const readPermission = (): NotificationPermission | "indisponivel" =>
  "Notification" in window ? Notification.permission : "indisponivel";

export function BrowserNotificationToggle() {
  const current = useSyncExternalStore(noopSubscribe, readPermission, () => "default" as const);
  const [override, setPerm] = useState<NotificationPermission | null>(null);
  const perm = override ?? current;
  if (perm === "indisponivel") return <p className="small muted">Este navegador não oferece notificações.</p>;
  if (perm === "granted") return <p className="small secondary">Notificações do navegador ativadas para lembretes enquanto o NEXO estiver aberto.</p>;
  if (perm === "denied")
    return <p className="small secondary">As notificações foram bloqueadas no navegador. Para ativar, altere a permissão do site nas configurações do navegador.</p>;
  return (
    <button type="button" className="btn btn--secondary btn--sm" onClick={async () => setPerm(await Notification.requestPermission())}>
      <Icon name="lembretes" size={18} /> Permitir notificações do navegador
    </button>
  );
}

export function NotificationLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  return href ? (
    <Link href={href} className="task__title" style={{ textDecoration: "none", color: "inherit" }}>
      {children}
    </Link>
  ) : (
    <span className="task__title">{children}</span>
  );
}
