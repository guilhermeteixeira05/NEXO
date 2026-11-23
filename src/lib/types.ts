/**
 * Tipos de domínio do NEXO — espelham as tabelas de
 * supabase/migrations/20261123000000_nexo_schema.sql.
 * Este arquivo é o "contrato" compartilhado entre os módulos (ver docs/divisao-equipe.md).
 */

export const CATEGORIES = ["trabalho", "estudos", "pessoal", "saude", "casa", "financas", "outros"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["baixa", "media", "alta", "urgente"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_KINDS = ["tarefa", "compromisso", "habito"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export const TASK_STATUSES = ["pendente", "concluida", "cancelada"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const RECURRENCES = ["nenhuma", "diaria", "dias_uteis", "semanal", "mensal"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export const REMINDER_RECURRENCES = ["nenhuma", "diaria", "semanal"] as const;
export type ReminderRecurrence = (typeof REMINDER_RECURRENCES)[number];

export const FOCUS_PERIODS = ["manha", "tarde", "noite"] as const;
export type FocusPeriod = (typeof FOCUS_PERIODS)[number];

export const THEMES = ["sistema", "claro", "escuro"] as const;
export type ThemePreference = (typeof THEMES)[number];

export const GOAL_STATUSES = ["ativo", "concluido", "pausado"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export type PlanScope = "diario" | "semanal" | "reorganizacao" | "sugestao";
export type PlanStatus = "proposto" | "aprovado" | "rejeitado" | "descartado";
export type PlanItemAction = "agendar" | "reagendar" | "priorizar" | "criar";

export interface Profile {
  id: string;
  full_name: string;
  occupation: string | null;
  timezone: string;
  focus_period: FocusPeriod;
  default_task_minutes: number;
  reminder_lead_minutes: number;
  proactive_enabled: boolean;
  theme: ThemePreference;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: Category;
  target_date: string | null;
  status: GoalStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  user_id: string;
  weekday: number;
  start_time: string; // HH:mm:ss
  end_time: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  series_id: string | null;
  title: string;
  description: string | null;
  kind: TaskKind;
  category: Category;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  recurrence: Recurrence;
  recurrence_until: string | null;
  postponed_count: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityEvent =
  | "criada"
  | "editada"
  | "concluida"
  | "reaberta"
  | "adiada"
  | "reagendada"
  | "excluida"
  | "plano_aprovado"
  | "plano_rejeitado"
  | "objetivo_concluido";

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  task_id: string | null;
  plan_id: string | null;
  event: ActivityEvent;
  task_title: string | null;
  category: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  plan_id: string | null;
  created_at: string;
}

export interface PlanConflict {
  type: "sobreposicao" | "fora_disponibilidade" | "sobrecarga";
  message: string;
  date?: string;
  taskIds?: string[];
}

export interface UnscheduledTask {
  taskId: string;
  title: string;
  reason: string;
}

export interface Plan {
  id: string;
  user_id: string;
  scope: PlanScope;
  start_date: string;
  end_date: string;
  status: PlanStatus;
  source: "ia" | "local";
  summary: string | null;
  notes: string[];
  conflicts: PlanConflict[];
  unscheduled: UnscheduledTask[];
  created_at: string;
  decided_at: string | null;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  user_id: string;
  task_id: string | null;
  action: PlanItemAction;
  title: string;
  start_at: string | null;
  end_at: string | null;
  due_date: string | null;
  priority: Priority | null;
  new_task: { kind?: TaskKind; category?: Category; priority?: Priority; duration_minutes?: number } | null;
  previous: { start_at?: string | null; end_at?: string | null; due_date?: string | null; priority?: Priority } | null;
  note: string | null;
  position: number;
  created_at: string;
}

export interface PlanWithItems extends Plan {
  items: PlanItem[];
}

export interface Reminder {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  remind_at: string;
  recurrence: ReminderRecurrence;
  status: "agendado" | "enviado" | "dispensado";
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  kind: "lembrete" | "atraso" | "proativo" | "sistema";
  title: string;
  body: string | null;
  link: string | null;
  dedupe_key: string | null;
  read_at: string | null;
  created_at: string;
}

export interface InsightRecord {
  id: string;
  user_id: string;
  kind: "resumo_semanal" | "briefing";
  period_start: string;
  period_end: string;
  title: string;
  content: unknown;
  metrics: Record<string, unknown>;
  source: "ia" | "regras";
  created_at: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

// ----------------------------------------------------------------------------
// Rótulos em português (interface)
// ----------------------------------------------------------------------------
export const CATEGORY_LABELS: Record<Category, string> = {
  trabalho: "Trabalho",
  estudos: "Estudos",
  pessoal: "Pessoal",
  saude: "Saúde",
  casa: "Casa",
  financas: "Finanças",
  outros: "Outros",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORITY_WEIGHT: Record<Priority, number> = { baixa: 1, media: 2, alta: 3, urgente: 4 };

export const KIND_LABELS: Record<TaskKind, string> = {
  tarefa: "Tarefa",
  compromisso: "Compromisso",
  habito: "Hábito",
};

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  nenhuma: "Não se repete",
  diaria: "Todos os dias",
  dias_uteis: "Dias úteis (seg–sex)",
  semanal: "Toda semana",
  mensal: "Todo mês",
};

export const REMINDER_RECURRENCE_LABELS: Record<ReminderRecurrence, string> = {
  nenhuma: "Uma vez",
  diaria: "Todos os dias",
  semanal: "Toda semana",
};

export const FOCUS_LABELS: Record<FocusPeriod, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  pausado: "Pausado",
};

export const PLAN_SCOPE_LABELS: Record<PlanScope, string> = {
  diario: "Plano do dia",
  semanal: "Plano da semana",
  reorganizacao: "Reorganização",
  sugestao: "Sugestão do assistente",
};

/** Resultado padrão de server actions consumidas por useActionState. */
export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const initialActionState: ActionState = { ok: false };
