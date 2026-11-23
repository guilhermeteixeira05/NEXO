/**
 * Indicadores de produtividade e padrões (Módulo 6) — funções puras.
 * Calculados a partir do histórico (activity_log) e das atividades.
 */
import { addDays, DEFAULT_TZ, localDateString, toLocalParts, WEEKDAY_NAMES } from "@/lib/dates";
import { isFrequentlyPostponed, isOverdue } from "@/lib/tasks/rules";
import { CATEGORY_LABELS, type ActivityLogEntry, type Category, type Goal, type Task } from "@/lib/types";

export interface PeriodMetrics {
  periodStart: string;
  periodEnd: string;
  completed: number;
  postponed: number;
  created: number;
  overdueNow: number;
  pendingNow: number;
  completionRate: number | null; // 0–100
  completedByDay: { date: string; count: number }[];
  completedByCategory: { category: string; label: string; count: number }[];
  mostPostponed: { id: string; title: string; count: number }[];
  bestWeekday: { weekday: number; name: string; count: number } | null;
  peakPeriod: { period: "madrugada" | "manha" | "tarde" | "noite"; label: string; count: number } | null;
  goals: { id: string; title: string; progress: number; status: string; linkedDone: number; linkedTotal: number }[];
}

const PERIOD_LABELS = { madrugada: "Madrugada (0h–5h)", manha: "Manhã (5h–12h)", tarde: "Tarde (12h–18h)", noite: "Noite (18h–24h)" } as const;

function periodOfHour(h: number): keyof typeof PERIOD_LABELS {
  if (h < 5) return "madrugada";
  if (h < 12) return "manha";
  if (h < 18) return "tarde";
  return "noite";
}

export function computeMetrics(params: {
  periodStart: string;
  days: number;
  log: ActivityLogEntry[];
  tasks: Task[];
  goals: Goal[];
  now: Date;
  tz?: string;
}): PeriodMetrics {
  const tz = params.tz ?? DEFAULT_TZ;
  const periodEnd = addDays(params.periodStart, params.days - 1);
  const inPeriod = (iso: string) => {
    const d = localDateString(new Date(iso), tz);
    return d >= params.periodStart && d <= periodEnd;
  };
  const events = params.log.filter((e) => inPeriod(e.created_at));
  const completedEvents = events.filter((e) => e.event === "concluida");
  const postponedEvents = events.filter((e) => e.event === "adiada");
  const createdEvents = events.filter((e) => e.event === "criada");

  const byDay = new Map<string, number>();
  for (let i = 0; i < params.days; i++) byDay.set(addDays(params.periodStart, i), 0);
  const byCategory = new Map<string, number>();
  const byWeekday = new Map<number, number>();
  const byPeriod = new Map<keyof typeof PERIOD_LABELS, number>();
  for (const e of completedEvents) {
    const date = new Date(e.created_at);
    const d = localDateString(date, tz);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
    const cat = e.category ?? "outros";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
    const p = toLocalParts(date, tz);
    byWeekday.set(p.weekday, (byWeekday.get(p.weekday) ?? 0) + 1);
    const per = periodOfHour(p.hour);
    byPeriod.set(per, (byPeriod.get(per) ?? 0) + 1);
  }

  // Taxa de conclusão: concluídas no período ÷ (concluídas + pendentes que venceram no período)
  const today = localDateString(params.now, tz);
  const missed = params.tasks.filter((t) => {
    if (t.status !== "pendente") return false;
    const due = t.end_at ? localDateString(new Date(t.end_at), tz) : t.due_date;
    return Boolean(due && due >= params.periodStart && due <= periodEnd && due < today);
  }).length;
  const denominator = completedEvents.length + missed;
  const completionRate = denominator === 0 ? null : Math.round((completedEvents.length / denominator) * 100);

  const bestWeekdayEntry = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0];
  const peakEntry = [...byPeriod.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    periodStart: params.periodStart,
    periodEnd,
    completed: completedEvents.length,
    postponed: postponedEvents.length,
    created: createdEvents.length,
    overdueNow: params.tasks.filter((t) => isOverdue(t, params.now, tz)).length,
    pendingNow: params.tasks.filter((t) => t.status === "pendente").length,
    completionRate,
    completedByDay: [...byDay.entries()].map(([date, count]) => ({ date, count })),
    completedByCategory: [...byCategory.entries()]
      .map(([category, count]) => ({ category, label: CATEGORY_LABELS[category as Category] ?? category, count }))
      .sort((a, b) => b.count - a.count),
    mostPostponed: params.tasks
      .filter((t) => isFrequentlyPostponed(t))
      .sort((a, b) => b.postponed_count - a.postponed_count)
      .slice(0, 3)
      .map((t) => ({ id: t.id, title: t.title, count: t.postponed_count })),
    bestWeekday: bestWeekdayEntry
      ? { weekday: bestWeekdayEntry[0], name: WEEKDAY_NAMES[bestWeekdayEntry[0]], count: bestWeekdayEntry[1] }
      : null,
    peakPeriod: peakEntry ? { period: peakEntry[0], label: PERIOD_LABELS[peakEntry[0]], count: peakEntry[1] } : null,
    goals: params.goals.map((g) => {
      const linked = params.tasks.filter((t) => t.goal_id === g.id);
      return {
        id: g.id,
        title: g.title,
        progress: g.progress,
        status: g.status,
        linkedDone: linked.filter((t) => t.status === "concluida").length,
        linkedTotal: linked.length,
      };
    }),
  };
}

/** Frases de padrões identificados, em português (RF43). */
export function describePatterns(m: PeriodMetrics): string[] {
  const out: string[] = [];
  if (m.bestWeekday && m.bestWeekday.count > 0)
    out.push(`${m.bestWeekday.name} foi seu dia mais produtivo (${m.bestWeekday.count} conclusões).`);
  if (m.peakPeriod && m.peakPeriod.count > 0) out.push(`Você conclui mais atividades no período: ${m.peakPeriod.label.toLowerCase()}.`);
  for (const p of m.mostPostponed) out.push(`“${p.title}” foi adiada ${p.count} vezes.`);
  if (m.completedByCategory[0]) {
    const total = m.completedByCategory.reduce((s, c) => s + c.count, 0);
    const top = m.completedByCategory[0];
    out.push(`${top.label} representa ${Math.round((top.count / total) * 100)}% das conclusões.`);
  }
  if (m.overdueNow > 0) out.push(`Há ${m.overdueNow} atividade(s) atrasada(s) neste momento.`);
  return out;
}

/** Sugestões de melhoria derivadas dos padrões (RF44) — base para a IA e alternativa sem IA. */
export function ruleBasedSuggestions(m: PeriodMetrics, focusLabel?: string): string[] {
  const out: string[] = [];
  if (m.mostPostponed.length > 0)
    out.push(`Divida “${m.mostPostponed[0].title}” em blocos menores e reserve um horário fixo para ela.`);
  if (m.completionRate !== null && m.completionRate < 60)
    out.push("Sua taxa de conclusão está abaixo de 60%: planeje menos atividades por dia e priorize as mais importantes.");
  if (m.peakPeriod && focusLabel && !m.peakPeriod.label.toLowerCase().startsWith(focusLabel.toLowerCase()))
    out.push(`Você indicou foco pela ${focusLabel.toLowerCase()}, mas conclui mais no período ${m.peakPeriod.label.toLowerCase()}. Ajuste suas preferências se fizer sentido.`);
  if (m.overdueNow > 2) out.push("Use “Reorganizar adiadas” no Planejamento para redistribuir as atividades atrasadas.");
  if (out.length === 0) out.push("Continue assim: mantenha o planejamento diário para preservar a consistência.");
  return out;
}
