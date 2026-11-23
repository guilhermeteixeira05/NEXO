import { z } from "zod";
import { isValidDateStr, isValidTimeStr } from "@/lib/dates";
import {
  CATEGORIES,
  FOCUS_PERIODS,
  GOAL_STATUSES,
  PRIORITIES,
  RECURRENCES,
  REMINDER_RECURRENCES,
  TASK_KINDS,
  THEMES,
} from "@/lib/types";

/**
 * Esquemas de validação (Zod) usados no SERVIDOR para todas as entradas.
 * Mensagens em português e orientadas à correção (heurística H9).
 */

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalText = (max: number, label: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, `${label}: use no máximo ${max} caracteres.`).optional());
const dateStr = (label: string) =>
  z.string().refine(isValidDateStr, `${label}: informe uma data válida.`);
const optionalDate = (label: string) => z.preprocess(emptyToUndefined, dateStr(label).optional());
const optionalTime = (label: string) =>
  z.preprocess(emptyToUndefined, z.string().refine(isValidTimeStr, `${label}: use o formato HH:mm.`).optional());

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome (pelo menos 2 letras).").max(120, "Nome muito longo."),
  email: z.email("Informe um e-mail válido, como nome@exemplo.com."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha pode ter no máximo 72 caracteres."),
});

export const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const passwordSchema = z
  .object({
    password: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não coincidem.", path: ["confirm"] });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome.").max(120),
  occupation: optionalText(120, "Ocupação"),
  timezone: z.string().trim().min(1).max(64).default("America/Sao_Paulo"),
});

export const preferencesSchema = z.object({
  focusPeriod: z.enum(FOCUS_PERIODS, "Escolha um período de foco."),
  defaultTaskMinutes: z.coerce.number().int().min(5, "Mínimo de 5 minutos.").max(480, "Máximo de 480 minutos."),
  reminderLeadMinutes: z.coerce.number().int().min(0).max(1440, "Máximo de 1440 minutos (24 h)."),
  proactiveEnabled: z.boolean(),
  theme: z.enum(THEMES).optional(),
});

export const themeSchema = z.enum(THEMES);

export const availabilitySlotSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    start: z.string().refine(isValidTimeStr, "Use o formato HH:mm."),
    end: z.string().refine(isValidTimeStr, "Use o formato HH:mm."),
  })
  .refine((s) => s.end > s.start, { message: "O fim precisa ser depois do início.", path: ["end"] });

export const availabilitySchema = z.array(availabilitySlotSchema).max(28, "No máximo 4 janelas por dia.");

export const goalSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome ao objetivo.").max(120, "Use no máximo 120 caracteres."),
  description: optionalText(1000, "Descrição"),
  category: z.enum(CATEGORIES),
  targetDate: optionalDate("Prazo"),
  status: z.enum(GOAL_STATUSES).default("ativo"),
  progress: z.coerce.number().int().min(0, "O progresso vai de 0 a 100.").max(100, "O progresso vai de 0 a 100."),
});

export const taskSchema = z
  .object({
    title: z.string().trim().min(1, "Dê um título à atividade.").max(160, "Use no máximo 160 caracteres."),
    description: optionalText(2000, "Descrição"),
    kind: z.enum(TASK_KINDS),
    category: z.enum(CATEGORIES),
    priority: z.enum(PRIORITIES),
    date: optionalDate("Data"),
    startTime: optionalTime("Início"),
    endTime: optionalTime("Término"),
    durationMinutes: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(5, "Duração mínima de 5 minutos.").max(720, "Duração máxima de 12 horas.").optional(),
    ),
    recurrence: z.enum(RECURRENCES),
    recurrenceUntil: optionalDate("Repetir até"),
    goalId: z.preprocess(emptyToUndefined, z.uuid("Objetivo inválido.").optional()),
    createReminder: z.boolean().default(false),
  })
  .superRefine((t, ctx) => {
    if (t.kind === "compromisso") {
      if (!t.date) ctx.addIssue({ code: "custom", path: ["date"], message: "Compromissos precisam de uma data." });
      if (!t.startTime) ctx.addIssue({ code: "custom", path: ["startTime"], message: "Informe o horário de início." });
      if (!t.endTime) ctx.addIssue({ code: "custom", path: ["endTime"], message: "Informe o horário de término." });
    }
    if (t.startTime && !t.date) ctx.addIssue({ code: "custom", path: ["date"], message: "Informe a data para usar um horário." });
    if (t.endTime && !t.startTime) ctx.addIssue({ code: "custom", path: ["startTime"], message: "Informe o início antes do término." });
    if (t.startTime && t.endTime && t.endTime <= t.startTime)
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "Informe um horário de término depois do início." });
    if (t.recurrence !== "nenhuma" && !t.date)
      ctx.addIssue({ code: "custom", path: ["date"], message: "Atividades recorrentes precisam de uma data inicial." });
    if (t.recurrenceUntil && t.date && t.recurrenceUntil < t.date)
      ctx.addIssue({ code: "custom", path: ["recurrenceUntil"], message: "A data final precisa ser depois da data inicial." });
  });

export type TaskInput = z.infer<typeof taskSchema>;

export const postponeSchema = z.object({
  taskId: z.uuid(),
  newDate: dateStr("Nova data"),
});

export const reminderSchema = z.object({
  title: z.string().trim().min(1, "Dê um título ao lembrete.").max(160),
  date: dateStr("Data"),
  time: z.string().refine(isValidTimeStr, "Use o formato HH:mm."),
  recurrence: z.enum(REMINDER_RECURRENCES),
  taskId: z.preprocess(emptyToUndefined, z.uuid().optional()),
});

export const chatRequestSchema = z.object({
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1, "Escreva uma mensagem.").max(2000, "Mensagem muito longa (máx. 2000 caracteres)."),
});

export const generatePlanSchema = z.object({
  scope: z.enum(["diario", "semanal", "reorganizacao"]),
  startDate: dateStr("Data"),
});

/** Converte erros do Zod em um mapa campo → mensagens. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
