/**
 * Planejador local (Módulo 4) — puro e determinístico.
 *
 * Encaixa atividades pendentes nas janelas de disponibilidade do usuário sem
 * sobrepor compromissos (RN06), detecta conflitos (RN07) e lista o que não coube.
 * É usado sozinho quando a IA não está configurada e como rascunho que a IA revisa.
 */
import { DEFAULT_TZ, formatDayMonth, localDateString, localTimeString, timeToMinutes, weekdayOf, zonedToUtc } from "@/lib/dates";
import { estimatedMinutes, isOverdue } from "@/lib/tasks/rules";
import { PRIORITY_WEIGHT, type AvailabilitySlot, type PlanConflict, type Task, type UnscheduledTask } from "@/lib/types";

export interface Interval {
  start: number; // epoch ms
  end: number;
}

export interface FixedItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  kind: Task["kind"];
}

export interface ScheduledBlock {
  taskId: string;
  title: string;
  date: string;
  start: Date;
  end: Date;
  reason: string;
}

export interface SchedulerInput {
  dates: string[];
  tz?: string;
  availability: Pick<AvailabilitySlot, "weekday" | "start_time" | "end_time">[];
  tasks: Task[]; // todas as atividades pendentes relevantes
  now: Date;
  defaultMinutes?: number;
  bufferMinutes?: number;
  holidays?: Map<string, string>; // data → nome
}

export interface SchedulerResult {
  blocks: ScheduledBlock[];
  fixed: FixedItem[];
  conflicts: PlanConflict[];
  unscheduled: UnscheduledTask[];
  notes: string[];
  freeMinutesByDate: Record<string, number>;
}

const MINUTE = 60000;

/** Subtrai uma lista de intervalos ocupados de intervalos livres. */
export function subtractIntervals(free: Interval[], busy: Interval[]): Interval[] {
  let result = [...free];
  for (const b of busy) {
    const next: Interval[] = [];
    for (const f of result) {
      if (b.end <= f.start || b.start >= f.end) {
        next.push(f);
        continue;
      }
      if (b.start > f.start) next.push({ start: f.start, end: b.start });
      if (b.end < f.end) next.push({ start: b.end, end: f.end });
    }
    result = next;
  }
  return result.filter((i) => i.end - i.start >= 5 * MINUTE).sort((a, b) => a.start - b.start);
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Janelas de disponibilidade de uma data, convertidas para instantes. */
export function availabilityWindows(
  dateStr: string,
  availability: SchedulerInput["availability"],
  tz: string = DEFAULT_TZ,
): Interval[] {
  const wd = weekdayOf(dateStr);
  return availability
    .filter((a) => a.weekday === wd)
    .map((a) => ({
      start: zonedToUtc(dateStr, a.start_time.slice(0, 5), tz).getTime(),
      end: zonedToUtc(dateStr, a.end_time.slice(0, 5), tz).getTime(),
    }))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
}

function roundUpTo5(ms: number): number {
  const step = 5 * MINUTE;
  return Math.ceil(ms / step) * step;
}

/** Pontuação de prioridade para ordenar o encaixe (RN06). */
export function schedulingScore(task: Task, now: Date, tz: string): number {
  let score = PRIORITY_WEIGHT[task.priority] * 100;
  if (isOverdue(task, now, tz)) score += 1000;
  if (task.goal_id) score += 30;
  score += Math.min(task.postponed_count, 5) * 15;
  return score;
}

/** Detecta sobreposições entre itens com horário (RN07). */
export function findOverlaps(items: FixedItem[], tz: string = DEFAULT_TZ): PlanConflict[] {
  const conflicts: PlanConflict[] = [];
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (b.start.getTime() >= a.end.getTime()) break;
      const date = localDateString(a.start, tz);
      conflicts.push({
        type: "sobreposicao",
        date,
        taskIds: [a.id, b.id],
        message: `${formatDayMonth(date)}: “${a.title}” (${localTimeString(a.start, tz)}–${localTimeString(a.end, tz)}) sobrepõe “${b.title}” (${localTimeString(b.start, tz)}–${localTimeString(b.end, tz)}).`,
      });
    }
  }
  return conflicts;
}

export function buildSchedule(input: SchedulerInput): SchedulerResult {
  const tz = input.tz ?? DEFAULT_TZ;
  const buffer = (input.bufferMinutes ?? 10) * MINUTE;
  const defaultMinutes = input.defaultMinutes ?? 30;
  const dates = [...input.dates].sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const nowMs = input.now.getTime();
  const notes: string[] = [];

  const pending = input.tasks.filter((t) => t.status === "pendente");

  // 1) Itens já com horário no período são fixos (compromissos e tarefas já agendadas).
  const fixed: FixedItem[] = pending
    .filter((t) => t.start_at && t.end_at)
    .map((t) => ({ id: t.id, title: t.title, start: new Date(t.start_at!), end: new Date(t.end_at!), kind: t.kind }))
    .filter((f) => {
      const d = localDateString(f.start, tz);
      return d >= firstDate && d <= lastDate;
    });
  const fixedIds = new Set(pending.filter((t) => t.start_at && t.end_at).map((t) => t.id));

  // 2) Conflitos entre itens fixos e tarefas com horário fora da disponibilidade.
  const conflicts: PlanConflict[] = findOverlaps(fixed, tz);
  for (const f of fixed) {
    if (f.kind === "compromisso") continue;
    const d = localDateString(f.start, tz);
    const windows = availabilityWindows(d, input.availability, tz);
    const inside = windows.some((w) => f.start.getTime() >= w.start && f.end.getTime() <= w.end);
    if (!inside) {
      conflicts.push({
        type: "fora_disponibilidade",
        date: d,
        taskIds: [f.id],
        message: `${formatDayMonth(d)}: “${f.title}” às ${localTimeString(f.start, tz)} está fora dos seus horários livres.`,
      });
    }
  }

  // 3) Tempo livre por dia (disponibilidade − fixos − passado).
  const freeByDate = new Map<string, Interval[]>();
  const freeMinutesByDate: Record<string, number> = {};
  for (const d of dates) {
    const busy = fixed.map((f) => ({ start: f.start.getTime() - buffer, end: f.end.getTime() + buffer }));
    let free = subtractIntervals(availabilityWindows(d, input.availability, tz), busy);
    free = free
      .map((i) => ({ start: Math.max(i.start, roundUpTo5(nowMs)), end: i.end }))
      .filter((i) => i.end - i.start >= 5 * MINUTE);
    freeByDate.set(d, free);
    freeMinutesByDate[d] = Math.round(free.reduce((s, i) => s + (i.end - i.start), 0) / MINUTE);
    const holiday = input.holidays?.get(d);
    if (holiday) notes.push(`${formatDayMonth(d)} é feriado nacional (${holiday}). Confirme se você terá esses horários livres.`);
  }

  // 4) Candidatas: pendentes sem horário, com data no período, sem data ou atrasadas.
  const candidates = pending
    .filter((t) => !fixedIds.has(t.id) && t.kind !== "compromisso")
    .filter((t) => !t.due_date || t.due_date <= lastDate || isOverdue(t, input.now, tz))
    .sort((a, b) => {
      const s = schedulingScore(b, input.now, tz) - schedulingScore(a, input.now, tz);
      if (s !== 0) return s;
      return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
    });

  // 5) Encaixe guloso: primeira janela livre que comporta a duração, até o prazo.
  const blocks: ScheduledBlock[] = [];
  const unscheduled: UnscheduledTask[] = [];
  for (const task of candidates) {
    const minutes = estimatedMinutes(task, defaultMinutes);
    const overdue = isOverdue(task, input.now, tz);
    const allowedDates = dates.filter((d) => overdue || !task.due_date || d <= task.due_date);
    let placed = false;
    for (const d of allowedDates) {
      const free = freeByDate.get(d) ?? [];
      const idx = free.findIndex((i) => i.end - i.start >= minutes * MINUTE);
      if (idx === -1) continue;
      const slot = free[idx];
      const start = slot.start;
      const end = start + minutes * MINUTE;
      blocks.push({
        taskId: task.id,
        title: task.title,
        date: d,
        start: new Date(start),
        end: new Date(end),
        reason: overdue
          ? "Atrasada: prioridade máxima."
          : task.postponed_count >= 2
            ? `Adiada ${task.postponed_count} vezes: reservado um horário fixo.`
            : task.due_date
              ? `Prazo em ${formatDayMonth(task.due_date)}.`
              : `Prioridade ${task.priority}.`,
      });
      const remaining: Interval[] = [];
      if (end + buffer < slot.end) remaining.push({ start: end + buffer, end: slot.end });
      free.splice(idx, 1, ...remaining);
      freeByDate.set(d, free.filter((i) => i.end - i.start >= 5 * MINUTE));
      placed = true;
      break;
    }
    if (!placed) {
      const anyWindow = allowedDates.some((d) => availabilityWindows(d, input.availability, tz).length > 0);
      unscheduled.push({
        taskId: task.id,
        title: task.title,
        reason: !anyWindow
          ? "Não há horários livres cadastrados nestes dias (veja Perfil → Disponibilidade)."
          : `Não há ${minutes} minutos livres seguidos${task.due_date && !overdue ? " antes do prazo" : ""}.`,
      });
    }
  }

  // 6) Sugestões de melhoria (RF32)
  for (const d of dates) {
    const planned = blocks.filter((b) => b.date === d).reduce((s, b) => s + (b.end.getTime() - b.start.getTime()) / MINUTE, 0);
    const total = availabilityWindows(d, input.availability, tz).reduce((s, w) => s + (w.end - w.start) / MINUTE, 0);
    if (total > 0 && planned / total > 0.85) {
      conflicts.push({ type: "sobrecarga", date: d, message: `${formatDayMonth(d)} está com mais de 85% do tempo livre ocupado.` });
    }
  }
  if (unscheduled.length > 0) {
    notes.push(`${unscheduled.length} atividade(s) não couberam. Considere adiar, reduzir a duração ou ampliar sua disponibilidade.`);
  }
  if (input.availability.length === 0) {
    notes.push("Cadastre seus horários livres no Perfil para que o NEXO consiga encaixar as atividades.");
  }
  const postponed = blocks.filter((b) => (candidates.find((c) => c.id === b.taskId)?.postponed_count ?? 0) >= 2);
  if (postponed.length > 0) notes.push("Atividades adiadas com frequência receberam horário definido para evitar novos adiamentos.");

  return { blocks, fixed, conflicts, unscheduled, notes, freeMinutesByDate };
}

/** Valida blocos propostos (por exemplo, pela IA) contra os itens fixos e a disponibilidade. */
export function validateBlocks(
  blocks: { taskId: string; start: Date; end: Date; title?: string }[],
  fixed: FixedItem[],
  availability: SchedulerInput["availability"],
  tz: string = DEFAULT_TZ,
): string[] {
  const errors: string[] = [];
  const all: Interval[] = [];
  for (const b of blocks) {
    if (!(b.end.getTime() > b.start.getTime())) {
      errors.push(`“${b.title ?? b.taskId}”: o término precisa ser depois do início.`);
      continue;
    }
    const iv = { start: b.start.getTime(), end: b.end.getTime() };
    if (fixed.some((f) => f.id !== b.taskId && overlaps(iv, { start: f.start.getTime(), end: f.end.getTime() }))) {
      errors.push(`“${b.title ?? b.taskId}” sobrepõe um compromisso fixo.`);
    }
    if (all.some((o) => overlaps(o, iv))) errors.push(`“${b.title ?? b.taskId}” sobrepõe outro bloco do plano.`);
    const d = localDateString(b.start, tz);
    const windows = availabilityWindows(d, availability, tz);
    if (!windows.some((w) => iv.start >= w.start && iv.end <= w.end)) {
      errors.push(`“${b.title ?? b.taskId}” ficou fora dos horários livres de ${formatDayMonth(d)}.`);
    }
    all.push(iv);
  }
  return errors;
}

export function weekdayHasAvailability(dateStr: string, availability: SchedulerInput["availability"]): boolean {
  return availability.some((a) => a.weekday === weekdayOf(dateStr) && timeToMinutes(a.end_time) > timeToMinutes(a.start_time));
}
