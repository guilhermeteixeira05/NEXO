import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import { localDateString } from "@/lib/dates";
import { isOverdue } from "@/lib/tasks/rules";
import type { AppNotification, Reminder, Task } from "@/lib/types";

/** Próximo disparo de um lembrete recorrente (sempre no futuro). */
export function nextReminderTime(remindAt: Date, recurrence: Reminder["recurrence"], now: Date): Date | null {
  if (recurrence === "nenhuma") return null;
  const step = recurrence === "diaria" ? 86400000 : 7 * 86400000;
  let t = remindAt.getTime();
  while (t <= now.getTime()) t += step;
  return new Date(t);
}

export async function listReminders(supabase: ServerSupabase, userId: string): Promise<Reminder[]> {
  const { data } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .order("status")
    .order("remind_at", { ascending: true })
    .limit(200);
  return (data ?? []) as Reminder[];
}

export async function listNotifications(supabase: ServerSupabase, userId: string, limit = 50): Promise<AppNotification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AppNotification[];
}

export async function countUnread(supabase: ServerSupabase, userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

/**
 * Processa lembretes vencidos e pendências (RN10, RN11). É chamado pelo app aberto
 * a cada 60 s (rota /api/notificacoes) e ao carregar o Painel.
 * Retorna as notificações criadas nesta execução (para notificação do navegador).
 */
export async function syncNotifications(
  supabase: ServerSupabase,
  userId: string,
  now: Date,
  tz: string,
): Promise<AppNotification[]> {
  const created: AppNotification[] = [];

  const { data: due } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "agendado")
    .lte("remind_at", now.toISOString())
    .limit(50);

  for (const r of (due ?? []) as Reminder[]) {
    const remindAt = new Date(r.remind_at);
    const { data: n } = await supabase
      .from("notifications")
      .upsert(
        {
          user_id: userId,
          kind: "lembrete",
          title: r.title,
          body: `Lembrete de ${remindAt.toLocaleString("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" })}.`,
          link: r.task_id ? "/tarefas" : "/lembretes",
          dedupe_key: `lembrete:${r.id}:${r.remind_at}`,
        },
        { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
      )
      .select()
      .maybeSingle();
    if (n) created.push(n as AppNotification);
    const next = nextReminderTime(remindAt, r.recurrence, now);
    await supabase
      .from("reminders")
      .update(next ? { remind_at: next.toISOString() } : { status: "enviado" })
      .eq("id", r.id)
      .eq("user_id", userId);
  }

  // Pendências atrasadas: no máximo uma notificação por dia
  const { data: pending } = await supabase
    .from("tasks")
    .select("id,title,status,due_date,start_at,end_at")
    .eq("user_id", userId)
    .eq("status", "pendente")
    .limit(500);
  const overdue = ((pending ?? []) as Task[]).filter((t) => isOverdue(t, now, tz));
  if (overdue.length > 0) {
    const today = localDateString(now, tz);
    const { data: n } = await supabase
      .from("notifications")
      .upsert(
        {
          user_id: userId,
          kind: "atraso",
          title: overdue.length === 1 ? "1 atividade atrasada" : `${overdue.length} atividades atrasadas`,
          body: overdue
            .slice(0, 3)
            .map((t) => `“${t.title}”`)
            .join(", ") + (overdue.length > 3 ? " e outras." : "."),
          link: "/planejamento?escopo=reorganizacao",
          dedupe_key: `atraso:${today}`,
        },
        { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
      )
      .select()
      .maybeSingle();
    if (n) created.push(n as AppNotification);
  }
  return created;
}
