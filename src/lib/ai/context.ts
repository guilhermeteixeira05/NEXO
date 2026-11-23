/**
 * Monta o contexto AUTORIZADO que a IA recebe (RNF07): perfil, preferências,
 * objetivos, disponibilidade, atividades, indicadores recentes e feriados.
 * Não inclui e-mail, senha nem identificadores de autenticação.
 */
import { addDays, localDateString, localTimeString, WEEKDAY_NAMES } from "@/lib/dates";
import { computeMetrics } from "@/lib/insights/metrics";
import { computeSignals } from "@/lib/insights/signals";
import { isOverdue } from "@/lib/tasks/rules";
import { FOCUS_LABELS } from "@/lib/types";
import type { ActivityLogEntry, AvailabilitySlot, Goal, Holiday, Profile, Task } from "@/lib/types";

export interface ContextInput {
  profile: Pick<Profile, "full_name" | "occupation" | "timezone" | "focus_period" | "default_task_minutes">;
  now: Date;
  tasks: Task[];
  goals: Goal[];
  availability: AvailabilitySlot[];
  activity: ActivityLogEntry[];
  holidays: Holiday[];
}

function localStamp(iso: string | null, tz: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${localDateString(d, tz)} ${localTimeString(d, tz)}`;
}

export function buildContextData(input: ContextInput) {
  const tz = input.profile.timezone;
  const today = localDateString(input.now, tz);
  const availability: Record<string, string[]> = {};
  for (const slot of input.availability) {
    const day = WEEKDAY_NAMES[slot.weekday].toLowerCase();
    (availability[day] ??= []).push(`${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`);
  }
  const pending = input.tasks
    .filter((t) => t.status === "pendente")
    .slice(0, 80)
    .map((t) => ({
      id: t.id,
      titulo: t.title,
      tipo: t.kind,
      categoria: t.category,
      prioridade: t.priority,
      data: t.due_date,
      inicio: localStamp(t.start_at, tz),
      fim: localStamp(t.end_at, tz),
      duracao_min: t.duration_minutes,
      recorrencia: t.recurrence === "nenhuma" ? undefined : t.recurrence,
      adiamentos: t.postponed_count || undefined,
      objetivo_id: t.goal_id ?? undefined,
      atrasada: isOverdue(t, input.now, tz) || undefined,
    }));
  const completed = input.tasks
    .filter((t) => t.status === "concluida")
    .slice(0, 30)
    .map((t) => ({ titulo: t.title, categoria: t.category, concluida_em: localStamp(t.completed_at, tz) }));
  const weekStart = addDays(today, -6);
  const metrics = computeMetrics({ periodStart: weekStart, days: 7, log: input.activity, tasks: input.tasks, goals: input.goals, now: input.now, tz });
  const signals = computeSignals({ tasks: input.tasks, now: input.now, tz, holidays: input.holidays });

  return {
    agora: `${today} ${localTimeString(input.now, tz)} (${WEEKDAY_NAMES[new Date(`${today}T12:00:00Z`).getUTCDay()].toLowerCase()}), fuso ${tz}`,
    usuario: {
      nome: input.profile.full_name || undefined,
      ocupacao: input.profile.occupation || undefined,
      periodo_de_maior_foco: FOCUS_LABELS[input.profile.focus_period],
      duracao_padrao_tarefa_min: input.profile.default_task_minutes,
    },
    disponibilidade_semanal: Object.keys(availability).length ? availability : "não cadastrada",
    objetivos: input.goals.map((g) => ({
      id: g.id,
      titulo: g.title,
      categoria: g.category,
      status: g.status,
      progresso: g.progress,
      prazo: g.target_date ?? undefined,
    })),
    atividades_pendentes: pending,
    concluidas_ultimos_7_dias: completed,
    indicadores_ultimos_7_dias: {
      concluidas: metrics.completed,
      adiamentos: metrics.postponed,
      taxa_de_conclusao_pct: metrics.completionRate,
      atrasadas_agora: metrics.overdueNow,
    },
    feriados_nacionais_proximos: input.holidays.slice(0, 8).map((h) => ({ data: h.date, nome: h.name })),
    alertas_detectados: signals.filter((s) => s.kind !== "dia_livre").map((s) => s.message),
  };
}

export function buildContextText(input: ContextInput): string {
  return `Contexto do usuário (dados reais do NEXO, em JSON):\n${JSON.stringify(buildContextData(input))}`;
}
