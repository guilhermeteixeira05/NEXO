"use server";

import { revalidatePath } from "next/cache";
import { getProfile, requireUser } from "@/lib/auth/session";
import { zonedToUtc } from "@/lib/dates";
import { fieldErrorsOf, reminderSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/lib/types";

function revalidateReminderViews() {
  revalidatePath("/lembretes");
  revalidatePath("/painel");
}

export async function saveReminderAction(reminderId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const parsed = reminderSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    time: formData.get("time"),
    recurrence: formData.get("recurrence") || "nenhuma",
    taskId: formData.get("taskId"),
  });
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  const remindAt = zonedToUtc(parsed.data.date, parsed.data.time, profile.timezone);
  if (parsed.data.recurrence === "nenhuma" && remindAt.getTime() < Date.now() - 60000) {
    return { ok: false, message: "Escolha uma data e hora no futuro.", fieldErrors: { time: ["Escolha um horário no futuro."] } };
  }
  const row = {
    title: parsed.data.title,
    remind_at: remindAt.toISOString(),
    recurrence: parsed.data.recurrence,
    task_id: parsed.data.taskId ?? null,
    status: "agendado" as const,
  };
  const { error } = reminderId
    ? await supabase.from("reminders").update(row).eq("id", reminderId).eq("user_id", user.id)
    : await supabase.from("reminders").insert({ ...row, user_id: user.id });
  if (error) return { ok: false, message: "Não foi possível salvar o lembrete." };
  revalidateReminderViews();
  return { ok: true, message: reminderId ? "Lembrete atualizado." : "Lembrete criado." };
}

export async function toggleReminderAction(reminderId: string, active: boolean): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("reminders")
    .update({ status: active ? "agendado" : "dispensado" })
    .eq("id", reminderId)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível alterar o lembrete." };
  revalidateReminderViews();
  return { ok: true, message: active ? "Lembrete ativado." : "Lembrete pausado." };
}

export async function deleteReminderAction(reminderId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("reminders").delete().eq("id", reminderId).eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível excluir o lembrete." };
  revalidateReminderViews();
  return { ok: true, message: "Lembrete excluído." };
}

export async function markNotificationsReadAction(ids?: string[]): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  const { error } = await q;
  if (error) return { ok: false, message: "Não foi possível marcar como lidas." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Notificações marcadas como lidas." };
}
