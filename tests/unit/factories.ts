import type { AvailabilitySlot, Task } from "@/lib/types";

let n = 0;
/** Cria uma atividade de teste com valores padrão. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  n += 1;
  return {
    id: overrides.id ?? `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    user_id: "u1",
    goal_id: null,
    series_id: null,
    title: `Tarefa ${n}`,
    description: null,
    kind: "tarefa",
    category: "pessoal",
    priority: "media",
    status: "pendente",
    due_date: null,
    start_at: null,
    end_at: null,
    duration_minutes: 30,
    recurrence: "nenhuma",
    recurrence_until: null,
    postponed_count: 0,
    completed_at: null,
    created_at: "2026-11-01T12:00:00Z",
    updated_at: "2026-11-01T12:00:00Z",
    ...overrides,
  };
}

export function slot(weekday: number, start: string, end: string): AvailabilitySlot {
  return { id: `s-${weekday}-${start}`, user_id: "u1", weekday, start_time: `${start}:00`, end_time: `${end}:00`, created_at: "" };
}

/** Instante UTC a partir de data/hora de Brasília (UTC−3, sem horário de verão). */
export function brt(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-03:00`);
}
