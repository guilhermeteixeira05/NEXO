/**
 * Regras de negócio das atividades (puras, sem acesso ao banco).
 * RN01 (atraso), RN03 (recorrência), RN05 (adiadas com frequência).
 */
import { addDays, addMonthsClamped, DEFAULT_TZ, localDateString, weekdayOf } from "@/lib/dates";
import { PRIORITY_WEIGHT, type Recurrence, type Task } from "@/lib/types";

export const FREQUENT_POSTPONE_THRESHOLD = 2;

/** RN03 — próxima data de uma atividade recorrente, ou null se a série terminou. */
export function nextOccurrence(dateStr: string, recurrence: Recurrence, until?: string | null): string | null {
  let next: string;
  switch (recurrence) {
    case "nenhuma":
      return null;
    case "diaria":
      next = addDays(dateStr, 1);
      break;
    case "dias_uteis": {
      next = addDays(dateStr, 1);
      while (weekdayOf(next) === 0 || weekdayOf(next) === 6) next = addDays(next, 1);
      break;
    }
    case "semanal":
      next = addDays(dateStr, 7);
      break;
    case "mensal":
      next = addMonthsClamped(dateStr, 1);
      break;
    default:
      return null;
  }
  if (until && next > until) return null;
  return next;
}

/** Data de referência da atividade (data do horário ou prazo). */
export function taskDate(task: Pick<Task, "start_at" | "due_date">, tz: string = DEFAULT_TZ): string | null {
  if (task.start_at) return localDateString(new Date(task.start_at), tz);
  return task.due_date;
}

/** RN01 — atrasada: pendente e prazo (ou término) já passou. */
export function isOverdue(
  task: Pick<Task, "status" | "due_date" | "end_at" | "start_at">,
  now: Date,
  tz: string = DEFAULT_TZ,
): boolean {
  if (task.status !== "pendente") return false;
  if (task.end_at) return new Date(task.end_at).getTime() < now.getTime();
  if (task.due_date) return task.due_date < localDateString(now, tz);
  return false;
}

/** RN05 */
export function isFrequentlyPostponed(task: Pick<Task, "postponed_count" | "status">): boolean {
  return task.status === "pendente" && task.postponed_count >= FREQUENT_POSTPONE_THRESHOLD;
}

/** Ordenação padrão das atividades pendentes: atrasadas, prioridade, data, título. */
export function compareTasks(a: Task, b: Task, now: Date, tz: string = DEFAULT_TZ): number {
  const oa = isOverdue(a, now, tz) ? 1 : 0;
  const ob = isOverdue(b, now, tz) ? 1 : 0;
  if (oa !== ob) return ob - oa;
  const da = taskSortKey(a);
  const db = taskSortKey(b);
  if (da !== db) return da < db ? -1 : 1;
  const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  if (pw !== 0) return pw;
  return a.title.localeCompare(b.title, "pt-BR");
}

function taskSortKey(task: Task): string {
  if (task.start_at) return new Date(task.start_at).toISOString();
  if (task.due_date) return `${task.due_date}T99`; // sem horário: depois dos itens com horário do mesmo dia
  return "9999";
}

export type TaskSection = "atrasadas" | "hoje" | "proximas" | "sem_data" | "concluidas";

export const SECTION_LABELS: Record<TaskSection, string> = {
  atrasadas: "Atrasadas",
  hoje: "Hoje",
  proximas: "Próximas",
  sem_data: "Sem data",
  concluidas: "Concluídas recentemente",
};

export function sectionOf(task: Task, now: Date, tz: string = DEFAULT_TZ): TaskSection {
  if (task.status === "concluida") return "concluidas";
  if (isOverdue(task, now, tz)) return "atrasadas";
  const d = taskDate(task, tz);
  if (!d) return "sem_data";
  return d === localDateString(now, tz) ? "hoje" : d < localDateString(now, tz) ? "atrasadas" : "proximas";
}

export function groupTasks(tasks: Task[], now: Date, tz: string = DEFAULT_TZ): Record<TaskSection, Task[]> {
  const groups: Record<TaskSection, Task[]> = { atrasadas: [], hoje: [], proximas: [], sem_data: [], concluidas: [] };
  for (const t of tasks) if (t.status !== "cancelada") groups[sectionOf(t, now, tz)].push(t);
  for (const key of Object.keys(groups) as TaskSection[]) {
    if (key === "concluidas") groups[key].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
    else groups[key].sort((a, b) => compareTasks(a, b, now, tz));
  }
  return groups;
}

/** Atividades de uma data específica (agenda do dia), em ordem cronológica. */
export function tasksOnDate(tasks: Task[], dateStr: string, tz: string = DEFAULT_TZ): Task[] {
  return tasks
    .filter((t) => t.status !== "cancelada" && taskDate(t, tz) === dateStr)
    .sort((a, b) => {
      if (a.start_at && b.start_at) return a.start_at.localeCompare(b.start_at);
      if (a.start_at) return -1;
      if (b.start_at) return 1;
      return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    });
}

/** Duração estimada em minutos (horário > duração informada > padrão do perfil). */
export function estimatedMinutes(task: Pick<Task, "start_at" | "end_at" | "duration_minutes">, fallback = 30): number {
  if (task.start_at && task.end_at) {
    return Math.max(5, Math.round((new Date(task.end_at).getTime() - new Date(task.start_at).getTime()) / 60000));
  }
  return task.duration_minutes ?? fallback;
}
