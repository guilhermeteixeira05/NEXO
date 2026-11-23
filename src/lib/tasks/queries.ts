import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

/**
 * Consultas de atividades (Módulo 2). Contrato usado por Painel, Calendário,
 * Planejamento, IA, Lembretes e Insights — todos leem as mesmas linhas.
 */
export async function listTasks(
  supabase: ServerSupabase,
  userId: string,
  opts: { status?: Task["status"][]; from?: string; to?: string; completedSince?: string; limit?: number } = {},
): Promise<Task[]> {
  let q = supabase.from("tasks").select("*").eq("user_id", userId);
  if (opts.status?.length) q = q.in("status", opts.status);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 500);
  if (error) {
    console.error("[tarefas] erro ao listar", error.message);
    return [];
  }
  let tasks = (data ?? []) as Task[];
  if (opts.completedSince) {
    tasks = tasks.filter((t) => t.status !== "concluida" || (t.completed_at ?? "") >= opts.completedSince!);
  }
  return tasks;
}

/** Pendentes + concluídas nos últimos N dias (visão padrão das telas). */
export async function listActiveTasks(supabase: ServerSupabase, userId: string, completedDays = 7): Promise<Task[]> {
  const since = new Date(Date.now() - completedDays * 86400000).toISOString();
  const [pending, done] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", userId).eq("status", "pendente").limit(500),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "concluida")
      .gte("completed_at", since)
      .order("completed_at", { ascending: false })
      .limit(200),
  ]);
  return [...((pending.data ?? []) as Task[]), ...((done.data ?? []) as Task[])];
}

export async function getTask(supabase: ServerSupabase, userId: string, taskId: string): Promise<Task | null> {
  const { data } = await supabase.from("tasks").select("*").eq("id", taskId).eq("user_id", userId).maybeSingle();
  return (data as Task) ?? null;
}
