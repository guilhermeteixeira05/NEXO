import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { ActivityEvent, ActivityLogEntry } from "@/lib/types";

/**
 * Registro no histórico (Módulo 6). Todos os módulos usam esta função para que
 * conclusões, adiamentos e planos alimentem os insights.
 */
export async function logActivity(
  supabase: ServerSupabase,
  entry: {
    userId: string;
    event: ActivityEvent;
    taskId?: string | null;
    planId?: string | null;
    title?: string | null;
    category?: string | null;
    details?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from("activity_log").insert({
    user_id: entry.userId,
    event: entry.event,
    task_id: entry.taskId ?? null,
    plan_id: entry.planId ?? null,
    task_title: entry.title?.slice(0, 160) ?? null,
    category: entry.category ?? null,
    details: entry.details ?? {},
  });
  if (error) console.error("[histórico] falha ao registrar evento", entry.event, error.message);
}

export async function listActivity(
  supabase: ServerSupabase,
  userId: string,
  opts: { since?: string; limit?: number; events?: ActivityEvent[] } = {},
): Promise<ActivityLogEntry[]> {
  let q = supabase.from("activity_log").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (opts.since) q = q.gte("created_at", opts.since);
  if (opts.events?.length) q = q.in("event", opts.events);
  const { data } = await q.limit(opts.limit ?? 500);
  return (data ?? []) as ActivityLogEntry[];
}
