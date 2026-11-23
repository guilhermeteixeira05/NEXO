import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import { dateRange, isValidDateStr, isValidTimeStr, localDateString, localTimeString, WEEKDAY_NAMES, zonedToUtc } from "@/lib/dates";
import { holidayMap } from "@/lib/holidays/brasilapi";
import { buildSchedule, validateBlocks, type ScheduledBlock, type SchedulerResult } from "@/lib/planning/scheduler";
import { reviewPlanWithAi } from "@/lib/ai/structured";
import { isAiConfigured } from "@/lib/env";
import { isOverdue } from "@/lib/tasks/rules";
import type { ValidatedPlanItem } from "@/lib/ai/proposals";
import type { Plan, PlanItem, PlanScope, PlanWithItems } from "@/lib/types";
import type { UserSnapshot } from "@/lib/snapshot";

export async function savePlan(
  supabase: ServerSupabase,
  userId: string,
  plan: Pick<Plan, "scope" | "start_date" | "end_date" | "source" | "summary" | "notes" | "conflicts" | "unscheduled">,
  items: ValidatedPlanItem[],
): Promise<string | null> {
  const { data, error } = await supabase
    .from("plans")
    .insert({ ...plan, user_id: userId, status: "proposto" })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[planejamento] falha ao gravar plano", error?.message);
    return null;
  }
  if (items.length) {
    const { error: itemsError } = await supabase.from("plan_items").insert(items.map((i) => ({ ...i, plan_id: data.id, user_id: userId })));
    if (itemsError) {
      console.error("[planejamento] falha ao gravar itens", itemsError.message);
      await supabase.from("plans").delete().eq("id", data.id).eq("user_id", userId);
      return null;
    }
  }
  return data.id as string;
}

export async function getPlanWithItems(supabase: ServerSupabase, userId: string, planId: string): Promise<PlanWithItems | null> {
  const [{ data: plan }, { data: items }] = await Promise.all([
    supabase.from("plans").select("*").eq("id", planId).eq("user_id", userId).maybeSingle(),
    supabase.from("plan_items").select("*").eq("plan_id", planId).eq("user_id", userId).order("position"),
  ]);
  if (!plan) return null;
  return { ...(plan as Plan), items: (items ?? []) as PlanItem[] };
}

export async function getPlansWithItems(supabase: ServerSupabase, userId: string, planIds: string[]): Promise<Map<string, PlanWithItems>> {
  const out = new Map<string, PlanWithItems>();
  if (!planIds.length) return out;
  const [{ data: plans }, { data: items }] = await Promise.all([
    supabase.from("plans").select("*").eq("user_id", userId).in("id", planIds),
    supabase.from("plan_items").select("*").eq("user_id", userId).in("plan_id", planIds).order("position"),
  ]);
  for (const p of (plans ?? []) as Plan[]) out.set(p.id, { ...p, items: [] });
  for (const i of (items ?? []) as PlanItem[]) out.get(i.plan_id)?.items.push(i);
  return out;
}

export async function listPlans(
  supabase: ServerSupabase,
  userId: string,
  opts: { status?: Plan["status"]; limit?: number } = {},
): Promise<PlanWithItems[]> {
  let q = supabase.from("plans").select("id").eq("user_id", userId);
  if (opts.status) q = q.eq("status", opts.status);
  const { data } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 10);
  const ids = (data ?? []).map((r) => r.id as string);
  const map = await getPlansWithItems(supabase, userId, ids);
  return ids.map((id) => map.get(id)).filter((p): p is PlanWithItems => Boolean(p));
}

function daysForScope(scope: PlanScope): number {
  return scope === "diario" ? 1 : 7;
}

/** Converte blocos do planejador em itens de plano. */
function blocksToItems(blocks: ScheduledBlock[], snapshot: UserSnapshot): ValidatedPlanItem[] {
  const byId = new Map(snapshot.tasks.map((t) => [t.id, t]));
  return blocks
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map((b, index) => {
      const t = byId.get(b.taskId);
      return {
        action: t?.start_at ? "reagendar" : "agendar",
        task_id: b.taskId,
        title: b.title,
        start_at: b.start.toISOString(),
        end_at: b.end.toISOString(),
        due_date: b.date,
        priority: null,
        new_task: null,
        previous: t ? { start_at: t.start_at, end_at: t.end_at, due_date: t.due_date, priority: t.priority } : null,
        note: b.reason,
        position: index,
      };
    });
}

export interface GeneratedPlan {
  planId: string | null;
  source: "ia" | "local";
  aiFallbackReason?: string;
  result: SchedulerResult;
}

/**
 * Gera um plano (diário, semanal ou de reorganização) — RF26 a RF32.
 * 1) Planejador local; 2) revisão da IA (se configurada) com validação; 3) grava como "proposto".
 */
export async function generatePlan(
  supabase: ServerSupabase,
  snapshot: UserSnapshot,
  scope: Exclude<PlanScope, "sugestao">,
  startDate: string,
): Promise<GeneratedPlan> {
  const tz = snapshot.profile.timezone;
  const start = startDate < snapshot.today ? snapshot.today : startDate;
  const dates = dateRange(start, daysForScope(scope));
  const holidays = holidayMap(snapshot.holidays);

  // Reorganização (RF31): só atrasadas e adiadas são redistribuídas; itens com horário continuam como obstáculos.
  const isTarget = (t: (typeof snapshot.tasks)[number]) =>
    t.status === "pendente" && t.kind !== "compromisso" && (isOverdue(t, snapshot.now, tz) || t.postponed_count > 0);
  const tasks =
    scope === "reorganizacao"
      ? snapshot.tasks
          .filter((t) => t.status === "pendente")
          .flatMap((t) => (isTarget(t) ? [{ ...t, start_at: null, end_at: null }] : t.start_at && t.end_at ? [t] : []))
      : snapshot.tasks;

  const result = buildSchedule({
    dates,
    tz,
    availability: snapshot.availability,
    tasks,
    now: snapshot.now,
    defaultMinutes: snapshot.profile.default_task_minutes,
    holidays,
  });

  let blocks = result.blocks;
  let notes = [...result.notes];
  let summary = `${scope === "diario" ? "Plano do dia" : scope === "semanal" ? "Plano da semana" : "Reorganização das atividades adiadas"}: ${blocks.length} bloco(s) encaixado(s).`;
  let source: "ia" | "local" = "local";
  let aiFallbackReason: string | undefined;

  if (isAiConfigured() && blocks.length > 0) {
    const draft = {
      periodo: { inicio: dates[0], fim: dates[dates.length - 1] },
      periodo_de_maior_foco: snapshot.profile.focus_period,
      janelas_livres: dates.map((d) => ({
        data: d,
        dia: WEEKDAY_NAMES[new Date(`${d}T12:00:00Z`).getUTCDay()],
        janelas: snapshot.availability
          .filter((a) => a.weekday === new Date(`${d}T12:00:00Z`).getUTCDay())
          .map((a) => `${a.start_time.slice(0, 5)}-${a.end_time.slice(0, 5)}`),
        feriado: holidays.get(d) ?? null,
      })),
      compromissos_fixos: result.fixed.map((f) => ({ titulo: f.title, data: localDateString(f.start, tz), inicio: localTimeString(f.start, tz), fim: localTimeString(f.end, tz) })),
      blocos: blocks.map((b) => ({ tarefa_id: b.taskId, titulo: b.title, data: b.date, inicio: localTimeString(b.start, tz), fim: localTimeString(b.end, tz), motivo: b.reason })),
      nao_encaixadas: result.unscheduled,
      conflitos: result.conflicts.map((c) => c.message),
    };
    const review = await reviewPlanWithAi(draft);
    if (review) {
      const allowed = new Map(blocks.map((b) => [b.taskId, b]));
      const candidate: ScheduledBlock[] = [];
      let invalid = false;
      for (const rb of review.blocos) {
        const original = allowed.get(rb.tarefa_id);
        if (!original || !isValidDateStr(rb.data) || !isValidTimeStr(rb.inicio) || !isValidTimeStr(rb.fim) || !dates.includes(rb.data)) {
          invalid = true;
          break;
        }
        candidate.push({ ...original, date: rb.data, start: zonedToUtc(rb.data, rb.inicio, tz), end: zonedToUtc(rb.data, rb.fim, tz) });
      }
      const errors = invalid ? ["formato inválido"] : validateBlocks(candidate, result.fixed, snapshot.availability, tz);
      if (!invalid && errors.length === 0 && candidate.length === blocks.length) {
        blocks = candidate;
        source = "ia";
      } else {
        aiFallbackReason = "A revisão da IA sugeriu horários inválidos; foi mantido o rascunho do planejador local.";
        source = "local";
      }
      notes = [...review.observacoes.slice(0, 4), ...notes];
      if (review.resumo) summary = review.resumo;
      if (aiFallbackReason) notes.push(aiFallbackReason);
    } else {
      aiFallbackReason = "A IA não respondeu; o plano foi gerado pelo planejador local.";
      notes.push(aiFallbackReason);
    }
  }

  const items = blocksToItems(blocks, snapshot);
  const planId =
    items.length > 0 || result.unscheduled.length > 0 || result.conflicts.length > 0
      ? await savePlan(
          supabase,
          snapshot.userId,
          {
            scope,
            start_date: dates[0],
            end_date: dates[dates.length - 1],
            source,
            summary,
            notes,
            conflicts: result.conflicts,
            unscheduled: result.unscheduled,
          },
          items,
        )
      : null;
  return { planId, source, aiFallbackReason, result: { ...result, blocks } };
}

/** Data inicial do plano: a solicitada (se válida e não passada) ou hoje. */
export function defaultStartDate(today: string, requested?: string | null): string {
  return requested && isValidDateStr(requested) && requested >= today ? requested : today;
}
