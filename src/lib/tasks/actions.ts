"use server";

import { revalidatePath } from "next/cache";
import { getProfile, requireUser } from "@/lib/auth/session";
import { localDateString, localTimeString, zonedToUtc } from "@/lib/dates";
import { logActivity } from "@/lib/history/log";
import { nextOccurrence } from "@/lib/tasks/rules";
import { getTask } from "@/lib/tasks/queries";
import { fieldErrorsOf, postponeSchema, taskSchema, type TaskInput } from "@/lib/validation/schemas";
import type { ActionState, Task } from "@/lib/types";

function revalidateTaskViews() {
  for (const p of ["/tarefas", "/painel", "/calendario", "/planejamento", "/insights", "/lembretes", "/objetivos"]) revalidatePath(p);
}

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    kind: formData.get("kind") || "tarefa",
    category: formData.get("category") || "pessoal",
    priority: formData.get("priority") || "media",
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    durationMinutes: formData.get("durationMinutes"),
    recurrence: formData.get("recurrence") || "nenhuma",
    recurrenceUntil: formData.get("recurrenceUntil"),
    goalId: formData.get("goalId"),
    createReminder: formData.get("createReminder") === "on",
  });
}

/** Converte a entrada validada em colunas da tabela tasks. */
function toRow(input: TaskInput, tz: string, defaultMinutes: number) {
  let startAt: string | null = null;
  let endAt: string | null = null;
  let duration = input.durationMinutes ?? null;
  if (input.date && input.startTime) {
    const start = zonedToUtc(input.date, input.startTime, tz);
    const end = input.endTime
      ? zonedToUtc(input.date, input.endTime, tz)
      : new Date(start.getTime() + (duration ?? defaultMinutes) * 60000);
    startAt = start.toISOString();
    endAt = end.toISOString();
    duration = Math.round((end.getTime() - start.getTime()) / 60000);
  }
  return {
    title: input.title,
    description: input.description ?? null,
    kind: input.kind,
    category: input.category,
    priority: input.priority,
    due_date: input.date ?? null,
    start_at: startAt,
    end_at: endAt,
    duration_minutes: duration,
    recurrence: input.recurrence,
    recurrence_until: input.recurrence === "nenhuma" ? null : (input.recurrenceUntil ?? null),
    goal_id: input.goalId ?? null,
  };
}

export async function saveTaskAction(taskId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  const row = toRow(parsed.data, profile.timezone, profile.default_task_minutes);

  let saved: Task | null = null;
  if (taskId) {
    const before = await getTask(supabase, user.id, taskId);
    if (!before) return { ok: false, message: "Atividade não encontrada." };
    const { data, error } = await supabase
      .from("tasks")
      .update({ ...row, series_id: row.recurrence === "nenhuma" ? before.series_id : (before.series_id ?? crypto.randomUUID()) })
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return { ok: false, message: "Não foi possível salvar. Verifique os dados e tente novamente." };
    saved = data as Task;
    await logActivity(supabase, { userId: user.id, event: "editada", taskId, title: saved.title, category: saved.category });
  } else {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...row, user_id: user.id, series_id: row.recurrence === "nenhuma" ? null : crypto.randomUUID() })
      .select()
      .single();
    if (error) return { ok: false, message: "Não foi possível criar a atividade. Verifique os dados e tente novamente." };
    saved = data as Task;
    await logActivity(supabase, { userId: user.id, event: "criada", taskId: saved.id, title: saved.title, category: saved.category });
  }

  // RF34 — lembrete automático com a antecedência padrão do perfil
  if (parsed.data.createReminder && saved.start_at) {
    const remindAt = new Date(new Date(saved.start_at).getTime() - profile.reminder_lead_minutes * 60000);
    if (remindAt.getTime() > Date.now()) {
      await supabase.from("reminders").insert({
        user_id: user.id,
        task_id: saved.id,
        title: saved.title,
        remind_at: remindAt.toISOString(),
        recurrence: saved.recurrence === "diaria" ? "diaria" : saved.recurrence === "semanal" ? "semanal" : "nenhuma",
      });
    }
  }
  revalidateTaskViews();
  return { ok: true, message: taskId ? "Atividade atualizada." : "Atividade criada." };
}

/** RF12 — concluir (ou reabrir). Atividades recorrentes geram a próxima ocorrência (RN03). */
export async function toggleCompleteAction(taskId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const task = await getTask(supabase, user.id, taskId);
  if (!task) return { ok: false, message: "Atividade não encontrada." };

  if (task.status === "concluida") {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "pendente", completed_at: null })
      .eq("id", taskId)
      .eq("user_id", user.id);
    if (error) return { ok: false, message: "Não foi possível reabrir a atividade." };
    await logActivity(supabase, { userId: user.id, event: "reaberta", taskId, title: task.title, category: task.category });
    revalidateTaskViews();
    return { ok: true, message: `“${task.title}” foi reaberta.` };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: "concluida", completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível concluir a atividade." };
  await logActivity(supabase, { userId: user.id, event: "concluida", taskId, title: task.title, category: task.category });

  let extra = "";
  const baseDate = task.start_at ? localDateString(new Date(task.start_at), profile.timezone) : task.due_date;
  if (task.recurrence !== "nenhuma" && baseDate) {
    const next = nextOccurrence(baseDate, task.recurrence, task.recurrence_until);
    if (next) {
      let startAt: string | null = null;
      let endAt: string | null = null;
      if (task.start_at && task.end_at) {
        const s = zonedToUtc(next, localTimeString(new Date(task.start_at), profile.timezone), profile.timezone);
        startAt = s.toISOString();
        endAt = new Date(s.getTime() + (new Date(task.end_at).getTime() - new Date(task.start_at).getTime())).toISOString();
      }
      const { data: created } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          goal_id: task.goal_id,
          series_id: task.series_id ?? task.id,
          title: task.title,
          description: task.description,
          kind: task.kind,
          category: task.category,
          priority: task.priority,
          due_date: next,
          start_at: startAt,
          end_at: endAt,
          duration_minutes: task.duration_minutes,
          recurrence: task.recurrence,
          recurrence_until: task.recurrence_until,
        })
        .select("id")
        .single();
      if (created) {
        await logActivity(supabase, { userId: user.id, event: "criada", taskId: created.id, title: task.title, category: task.category, details: { origem: "recorrencia" } });
        extra = ` Próxima ocorrência: ${next.split("-").reverse().join("/")}.`;
      }
    }
  }
  revalidateTaskViews();
  return { ok: true, message: `“${task.title}” concluída.${extra}` };
}

/** RF13 / RN04 — adiar para uma nova data, mantendo o horário local. */
export async function postponeTaskAction(taskId: string, newDate: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const parsed = postponeSchema.safeParse({ taskId, newDate });
  if (!parsed.success) return { ok: false, message: "Escolha uma data válida." };
  const task = await getTask(supabase, user.id, taskId);
  if (!task || task.status !== "pendente") return { ok: false, message: "Somente atividades pendentes podem ser adiadas." };

  let startAt = task.start_at;
  let endAt = task.end_at;
  if (task.start_at && task.end_at) {
    const s = zonedToUtc(parsed.data.newDate, localTimeString(new Date(task.start_at), profile.timezone), profile.timezone);
    startAt = s.toISOString();
    endAt = new Date(s.getTime() + (new Date(task.end_at).getTime() - new Date(task.start_at).getTime())).toISOString();
  }
  const previousDate = task.start_at ? localDateString(new Date(task.start_at), profile.timezone) : task.due_date;
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: parsed.data.newDate, start_at: startAt, end_at: endAt, postponed_count: task.postponed_count + 1 })
    .eq("id", taskId)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível adiar a atividade." };
  await logActivity(supabase, {
    userId: user.id,
    event: "adiada",
    taskId,
    title: task.title,
    category: task.category,
    details: { de: previousDate, para: parsed.data.newDate, vezes: task.postponed_count + 1 },
  });
  // Lembretes pendentes desta atividade acompanham o novo horário
  if (startAt) {
    await supabase
      .from("reminders")
      .update({ remind_at: new Date(new Date(startAt).getTime() - profile.reminder_lead_minutes * 60000).toISOString() })
      .eq("task_id", taskId)
      .eq("user_id", user.id)
      .eq("status", "agendado");
  }
  revalidateTaskViews();
  return { ok: true, message: `“${task.title}” adiada para ${parsed.data.newDate.split("-").reverse().join("/")}.` };
}

/** RF11 — excluir (com confirmação na interface). */
export async function deleteTaskAction(taskId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const task = await getTask(supabase, user.id, taskId);
  if (!task) return { ok: false, message: "Atividade não encontrada." };
  await logActivity(supabase, { userId: user.id, event: "excluida", taskId, title: task.title, category: task.category });
  const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível excluir a atividade." };
  revalidateTaskViews();
  return { ok: true, message: `“${task.title}” excluída.` };
}
