import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import { generateBriefingWithAi, generateWeeklySummaryWithAi } from "@/lib/ai/structured";
import { isAiConfigured } from "@/lib/env";
import { holidayMap } from "@/lib/holidays/brasilapi";
import { computeMetrics, describePatterns, ruleBasedSuggestions, type PeriodMetrics } from "@/lib/insights/metrics";
import { computeSignals, isAllowedActionHref, type Signal } from "@/lib/insights/signals";
import { buildSchedule } from "@/lib/planning/scheduler";
import { FOCUS_LABELS, type InsightRecord } from "@/lib/types";
import type { UserSnapshot } from "@/lib/snapshot";

export interface BriefingMessage {
  text: string;
  actionLabel: string;
  actionHref: string;
}

export interface Briefing {
  messages: BriefingMessage[];
  source: "ia" | "regras";
  generatedAt: string;
}

export function signalsFor(snapshot: UserSnapshot): Signal[] {
  const tz = snapshot.profile.timezone;
  const schedule = buildSchedule({
    dates: [snapshot.today],
    tz,
    availability: snapshot.availability,
    tasks: [],
    now: snapshot.now,
    holidays: holidayMap(snapshot.holidays),
  });
  return computeSignals({
    tasks: snapshot.tasks,
    now: snapshot.now,
    tz,
    freeMinutesToday: snapshot.availability.length ? schedule.freeMinutesByDate[snapshot.today] : undefined,
    holidays: snapshot.holidays,
    plans: snapshot.recentPlans,
  });
}

function fromSignals(signals: Signal[]): Briefing {
  return {
    source: "regras",
    generatedAt: new Date().toISOString(),
    messages: signals.slice(0, 3).map((s) => ({ text: s.message, actionLabel: s.action.label, actionHref: s.action.href })),
  };
}

/**
 * Briefing proativo do Painel (RF25, RN12): gerado pela IA no máximo uma vez por dia
 * (ou ao pedir "Atualizar"); sem IA, usa os sinais das regras (identificados como tal).
 */
export async function getBriefing(supabase: ServerSupabase, snapshot: UserSnapshot, opts: { refresh?: boolean } = {}): Promise<Briefing | null> {
  if (!snapshot.profile.proactive_enabled) return null;
  const signals = signalsFor(snapshot);
  if (!isAiConfigured()) return fromSignals(signals);

  if (!opts.refresh) {
    const { data } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", snapshot.userId)
      .eq("kind", "briefing")
      .eq("period_start", snapshot.today)
      .maybeSingle();
    if (data) {
      const rec = data as InsightRecord;
      return { ...(rec.content as Omit<Briefing, "generatedAt">), generatedAt: rec.created_at };
    }
  }

  const ai = await generateBriefingWithAi({
    usuario: { nome: snapshot.profile.full_name.split(" ")[0] || undefined, periodo_de_foco: FOCUS_LABELS[snapshot.profile.focus_period] },
    agora: snapshot.now.toISOString(),
    sinais: signals.slice(0, 5).map((s) => ({ tipo: s.kind, mensagem_base: s.message, acao_rotulo: s.action.label, acao_link: s.action.href })),
  });
  if (!ai || ai.mensagens.length === 0) return fromSignals(signals);

  const fallbackHref = signals[0]?.action.href ?? "/painel";
  const briefing: Briefing = {
    source: "ia",
    generatedAt: new Date().toISOString(),
    messages: ai.mensagens.slice(0, 3).map((m, i) => ({
      text: m.texto.slice(0, 400),
      actionLabel: (m.acao_rotulo || signals[i]?.action.label || "Ver detalhes").slice(0, 40),
      actionHref: isAllowedActionHref(m.acao_link) ? m.acao_link : (signals[i]?.action.href ?? fallbackHref),
    })),
  };
  await supabase.from("insights").upsert(
    {
      user_id: snapshot.userId,
      kind: "briefing",
      period_start: snapshot.today,
      period_end: snapshot.today,
      title: "Briefing do dia",
      content: { messages: briefing.messages, source: briefing.source },
      metrics: { sinais: signals.map((s) => s.kind) },
      source: "ia",
      created_at: briefing.generatedAt,
    },
    { onConflict: "user_id,kind,period_start" },
  );
  return briefing;
}

export interface WeeklySummary {
  title: string;
  summary: string;
  highlights: string[];
  suggestions: string[];
  source: "ia" | "regras";
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export function metricsForWeek(snapshot: UserSnapshot, weekStart: string): PeriodMetrics {
  return computeMetrics({
    periodStart: weekStart,
    days: 7,
    log: snapshot.activity,
    tasks: snapshot.tasks,
    goals: snapshot.goals,
    now: snapshot.now,
    tz: snapshot.profile.timezone,
  });
}

/** Resumo semanal (RF42): IA quando disponível; senão, resumo por regras identificado. */
export async function createWeeklySummary(supabase: ServerSupabase, snapshot: UserSnapshot, weekStart: string): Promise<WeeklySummary> {
  const m = metricsForWeek(snapshot, weekStart);
  const patterns = describePatterns(m);
  const rules = ruleBasedSuggestions(m, FOCUS_LABELS[snapshot.profile.focus_period]);
  const payload = {
    periodo: { inicio: m.periodStart, fim: m.periodEnd },
    concluidas: m.completed,
    adiamentos: m.postponed,
    criadas: m.created,
    taxa_de_conclusao_pct: m.completionRate,
    atrasadas_agora: m.overdueNow,
    concluidas_por_dia: m.completedByDay,
    por_categoria: m.completedByCategory,
    mais_adiadas: m.mostPostponed,
    padroes: patterns,
    objetivos: m.goals,
    periodo_de_foco_declarado: FOCUS_LABELS[snapshot.profile.focus_period],
  };
  const ai = isAiConfigured() ? await generateWeeklySummaryWithAi(payload) : null;
  const summary: WeeklySummary = ai
    ? {
        title: ai.titulo.slice(0, 160) || "Resumo da semana",
        summary: ai.resumo,
        highlights: ai.destaques.slice(0, 3),
        suggestions: ai.sugestoes.slice(0, 3),
        source: "ia",
        periodStart: m.periodStart,
        periodEnd: m.periodEnd,
        createdAt: new Date().toISOString(),
      }
    : {
        title: "Resumo da semana",
        summary:
          m.completed === 0
            ? "Nenhuma atividade foi concluída neste período."
            : `Você concluiu ${m.completed} atividade(s)${m.completionRate !== null ? ` (${m.completionRate}% do que estava previsto)` : ""} e registrou ${m.postponed} adiamento(s).`,
        highlights: patterns.slice(0, 3),
        suggestions: rules.slice(0, 3),
        source: "regras",
        periodStart: m.periodStart,
        periodEnd: m.periodEnd,
        createdAt: new Date().toISOString(),
      };
  await supabase.from("insights").upsert(
    {
      user_id: snapshot.userId,
      kind: "resumo_semanal",
      period_start: m.periodStart,
      period_end: m.periodEnd,
      title: summary.title,
      content: { summary: summary.summary, highlights: summary.highlights, suggestions: summary.suggestions },
      metrics: payload,
      source: summary.source,
      created_at: summary.createdAt,
    },
    { onConflict: "user_id,kind,period_start" },
  );
  return summary;
}

export async function getWeeklySummary(supabase: ServerSupabase, userId: string, weekStart: string): Promise<WeeklySummary | null> {
  const { data } = await supabase
    .from("insights")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", "resumo_semanal")
    .eq("period_start", weekStart)
    .maybeSingle();
  if (!data) return null;
  const rec = data as InsightRecord;
  const c = rec.content as { summary: string; highlights: string[]; suggestions: string[] };
  return {
    title: rec.title,
    summary: c.summary,
    highlights: c.highlights ?? [],
    suggestions: c.suggestions ?? [],
    source: rec.source,
    periodStart: rec.period_start,
    periodEnd: rec.period_end,
    createdAt: rec.created_at,
  };
}
