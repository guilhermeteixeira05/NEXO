/**
 * Sinais proativos (RF25) — regras determinísticas que alimentam o briefing do Painel.
 * A IA reescreve esses sinais de forma personalizada; sem IA, eles são exibidos como estão.
 */
import { addDays, DEFAULT_TZ, diffDays, formatDayMonth, localDateString, localTimeString, toLocalParts } from "@/lib/dates";
import { estimatedMinutes, isFrequentlyPostponed, isOverdue, taskDate } from "@/lib/tasks/rules";
import type { Holiday, Plan, Task } from "@/lib/types";

export type SignalKind =
  | "proximo_compromisso"
  | "pendentes_hoje"
  | "atrasadas"
  | "adiadas_frequentes"
  | "dia_sobrecarregado"
  | "plano_amanha"
  | "feriado_proximo"
  | "dia_livre";

export interface Signal {
  kind: SignalKind;
  priority: number; // maior = mais importante
  message: string;
  action: { label: string; href: string };
}

/** Rotas internas permitidas para ações (validação de links vindos da IA). */
export const ALLOWED_ACTION_PREFIXES = ["/painel", "/tarefas", "/planejamento", "/assistente", "/calendario", "/lembretes", "/insights", "/objetivos"];

export function isAllowedActionHref(href: string): boolean {
  return (
    href.startsWith("/") &&
    !href.startsWith("//") &&
    ALLOWED_ACTION_PREFIXES.some((p) => href === p || href.startsWith(p + "?") || href.startsWith(p + "/") || href.startsWith(p + "#"))
  );
}

export function computeSignals(params: {
  tasks: Task[];
  now: Date;
  tz?: string;
  freeMinutesToday?: number;
  holidays?: Holiday[];
  plans?: Pick<Plan, "scope" | "start_date" | "status">[];
}): Signal[] {
  const tz = params.tz ?? DEFAULT_TZ;
  const now = params.now;
  const today = localDateString(now, tz);
  const tomorrow = addDays(today, 1);
  const pending = params.tasks.filter((t) => t.status === "pendente");
  const signals: Signal[] = [];

  const upcoming = pending
    .filter((t) => t.start_at && new Date(t.start_at).getTime() > now.getTime() && taskDate(t, tz) === today)
    .sort((a, b) => a.start_at!.localeCompare(b.start_at!));
  if (upcoming[0]) {
    const t = upcoming[0];
    signals.push({
      kind: "proximo_compromisso",
      priority: 80,
      message: `Hoje você tem “${t.title}” às ${localTimeString(new Date(t.start_at!), tz)}. Deseja consultar sua programação?`,
      action: { label: "Ver programação", href: "/painel#programacao" },
    });
  }

  const todayPending = pending.filter((t) => taskDate(t, tz) === today && !t.start_at);
  if (todayPending.length >= 2) {
    signals.push({
      kind: "pendentes_hoje",
      priority: 70,
      message: `Você possui ${todayPending.length} tarefas pendentes para hoje. Sugiro reservar um horário para concluí-las.`,
      action: { label: "Planejar o dia", href: "/planejamento?escopo=diario" },
    });
  }

  const overdue = pending.filter((t) => isOverdue(t, now, tz));
  if (overdue.length > 0) {
    signals.push({
      kind: "atrasadas",
      priority: 90,
      message:
        overdue.length === 1
          ? `“${overdue[0].title}” está atrasada. Que tal reorganizar para concluí-la ainda hoje?`
          : `Você tem ${overdue.length} atividades atrasadas. Posso sugerir uma nova distribuição.`,
      action: { label: "Reorganizar", href: "/planejamento?escopo=reorganizacao" },
    });
  }

  const frequent = pending.filter((t) => isFrequentlyPostponed(t));
  if (frequent.length > 0) {
    signals.push({
      kind: "adiadas_frequentes",
      priority: 75,
      message: `Percebi que ${frequent.length === 1 ? `“${frequent[0].title}” está sendo adiada` : "algumas atividades estão sendo adiadas"} com frequência. Posso sugerir uma nova organização para sua semana?`,
      action: { label: "Ver proposta", href: "/planejamento?escopo=reorganizacao" },
    });
  }

  if (params.freeMinutesToday !== undefined) {
    const neededToday = pending
      .filter((t) => taskDate(t, tz) === today && !t.start_at)
      .reduce((s, t) => s + estimatedMinutes(t), 0);
    if (neededToday > params.freeMinutesToday && neededToday > 0) {
      signals.push({
        kind: "dia_sobrecarregado",
        priority: 72,
        message: `Hoje há ${Math.round(neededToday / 60)} h de tarefas e cerca de ${Math.round(params.freeMinutesToday / 60)} h livres. Vale mover algo para outro dia.`,
        action: { label: "Reorganizar", href: "/planejamento?escopo=diario" },
      });
    }
  }

  const hour = toLocalParts(now, tz).hour;
  const hasTomorrowPlan = (params.plans ?? []).some((p) => p.start_date === tomorrow && p.status === "aprovado");
  if (hour >= 17 && !hasTomorrowPlan && pending.some((t) => taskDate(t, tz) === tomorrow || !taskDate(t, tz))) {
    signals.push({
      kind: "plano_amanha",
      priority: 60,
      message: "Quer deixar sua programação de amanhã pronta? Organizo suas atividades nos horários disponíveis.",
      action: { label: "Planejar amanhã", href: `/planejamento?escopo=diario&data=${tomorrow}` },
    });
  }

  const nextHoliday = (params.holidays ?? []).find((h) => h.date >= today && diffDays(today, h.date) <= 7);
  if (nextHoliday) {
    const days = diffDays(today, nextHoliday.date);
    signals.push({
      kind: "feriado_proximo",
      priority: 40,
      message: `${days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias (${formatDayMonth(nextHoliday.date)})`} é feriado nacional: ${nextHoliday.name}. Confira se seus prazos e compromissos continuam valendo.`,
      action: { label: "Ver calendário", href: "/calendario" },
    });
  }

  if (signals.length === 0) {
    signals.push({
      kind: "dia_livre",
      priority: 10,
      message: pending.length === 0 ? "Nenhuma atividade pendente. Que tal definir um objetivo ou planejar a semana?" : "Tudo em dia por aqui. Aproveite para adiantar uma atividade importante.",
      action: pending.length === 0 ? { label: "Criar objetivo", href: "/objetivos" } : { label: "Ver tarefas", href: "/tarefas" },
    });
  }

  return signals.sort((a, b) => b.priority - a.priority);
}
