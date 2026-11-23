/**
 * Validação das propostas da IA (RNF05, RN08, RN09) — puro e testável.
 * Converte a entrada da ferramenta "propor_alteracoes" em itens de plano,
 * rejeitando qualquer coisa inconsistente ANTES de gravar no banco.
 */
import { z } from "zod";
import { isValidDateStr, isValidTimeStr, localDateString, zonedToUtc } from "@/lib/dates";
import { findOverlaps, type FixedItem } from "@/lib/planning/scheduler";
import { CATEGORIES, PRIORITIES, type PlanScope, type Task } from "@/lib/types";

const timeStr = z.string().refine(isValidTimeStr, "horário deve estar no formato HH:mm");
const dateStr = z.string().refine(isValidDateStr, "data deve estar no formato AAAA-MM-DD");

export const proposalItemSchema = z.object({
  acao: z.enum(["reagendar", "priorizar", "criar"]),
  tarefa_id: z.string().optional(),
  titulo: z.string().trim().min(1).max(160).optional(),
  data: dateStr.optional(),
  inicio: timeStr.optional(),
  fim: timeStr.optional(),
  duracao_minutos: z.number().int().min(5).max(720).optional(),
  prioridade: z.enum(PRIORITIES).optional(),
  categoria: z.enum(CATEGORIES).optional(),
  tipo: z.enum(["tarefa", "habito", "compromisso"]).optional(),
  motivo: z.string().trim().min(1).max(300),
});

export const proposalSchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  justificativa: z.string().trim().min(1).max(800),
  escopo: z.enum(["diario", "semanal", "reorganizacao", "sugestao"]),
  itens: z.array(proposalItemSchema).min(1, "inclua ao menos um item").max(20, "no máximo 20 itens"),
});

export type ProposalInput = z.infer<typeof proposalSchema>;

export interface ValidatedPlanItem {
  action: "agendar" | "reagendar" | "priorizar" | "criar";
  task_id: string | null;
  title: string;
  start_at: string | null;
  end_at: string | null;
  due_date: string | null;
  priority: Task["priority"] | null;
  new_task: Record<string, unknown> | null;
  previous: Record<string, unknown> | null;
  note: string;
  position: number;
}

export type ValidatedProposal =
  | {
      ok: true;
      plan: { scope: PlanScope; start_date: string; end_date: string; summary: string; notes: string[] };
      items: ValidatedPlanItem[];
    }
  | { ok: false; errors: string[] };

export const PROPOSAL_TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    titulo: { type: "string", description: "Título curto da proposta, ex.: 'Reorganização da semana'." },
    justificativa: { type: "string", description: "Por que estas mudanças ajudam o usuário (1 a 3 frases)." },
    escopo: { type: "string", enum: ["diario", "semanal", "reorganizacao", "sugestao"] },
    itens: {
      type: "array",
      description: "Mudanças propostas (1 a 20).",
      items: {
        type: "object",
        properties: {
          acao: { type: "string", enum: ["reagendar", "priorizar", "criar"], description: "reagendar: novo dia/horário para uma atividade existente; priorizar: nova prioridade; criar: nova atividade." },
          tarefa_id: { type: "string", description: "id da atividade existente (obrigatório para reagendar e priorizar)." },
          titulo: { type: "string", description: "Título da nova atividade (obrigatório para criar)." },
          data: { type: "string", description: "Data no formato AAAA-MM-DD." },
          inicio: { type: "string", description: "Horário de início HH:mm (horário local do usuário)." },
          fim: { type: "string", description: "Horário de término HH:mm." },
          duracao_minutos: { type: "integer", description: "Duração estimada, se não houver horário de término." },
          prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
          categoria: { type: "string", enum: ["trabalho", "estudos", "pessoal", "saude", "casa", "financas", "outros"] },
          tipo: { type: "string", enum: ["tarefa", "habito", "compromisso"] },
          motivo: { type: "string", description: "Justificativa curta desta mudança." },
        },
        required: ["acao", "motivo"],
      },
    },
  },
  required: ["titulo", "justificativa", "escopo", "itens"],
};

/**
 * Valida a proposta contra os dados reais do usuário.
 * @param tasks atividades do usuário (somente as dele: vieram do banco com RLS)
 */
export function validateProposal(raw: unknown, ctx: { tasks: Task[]; tz: string; now: Date; defaultMinutes: number }): ValidatedProposal {
  const parsed = proposalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "proposta"}: ${i.message}`) };
  }
  const p = parsed.data;
  const today = localDateString(ctx.now, ctx.tz);
  const byId = new Map(ctx.tasks.map((t) => [t.id, t]));
  const errors: string[] = [];
  const items: ValidatedPlanItem[] = [];
  const timed: FixedItem[] = [];

  p.itens.forEach((it, index) => {
    const label = `itens[${index}]`;
    const task = it.tarefa_id ? byId.get(it.tarefa_id) : undefined;
    if (it.acao !== "criar") {
      if (!it.tarefa_id || !task) return void errors.push(`${label}: tarefa_id inexistente — use um id de "atividades_pendentes".`);
      if (task.status !== "pendente") return void errors.push(`${label}: a atividade “${task.title}” não está pendente.`);
    }
    if (it.data && it.data < today) return void errors.push(`${label}: a data ${it.data} já passou.`);

    let startAt: Date | null = null;
    let endAt: Date | null = null;
    if (it.inicio) {
      if (!it.data) return void errors.push(`${label}: informe "data" junto com "inicio".`);
      startAt = zonedToUtc(it.data, it.inicio, ctx.tz);
      if (it.fim) endAt = zonedToUtc(it.data, it.fim, ctx.tz);
      else {
        const minutes = it.duracao_minutos ?? task?.duration_minutes ?? ctx.defaultMinutes;
        endAt = new Date(startAt.getTime() + minutes * 60000);
      }
      if (endAt.getTime() <= startAt.getTime()) return void errors.push(`${label}: "fim" precisa ser depois de "inicio".`);
      if (startAt.getTime() < ctx.now.getTime()) return void errors.push(`${label}: o horário ${it.data} ${it.inicio} já passou.`);
    }

    if (it.acao === "reagendar") {
      if (!it.data) return void errors.push(`${label}: informe a nova "data".`);
      if (task!.kind === "compromisso") return void errors.push(`${label}: “${task!.title}” é um compromisso fixo e não pode ser movido por proposta.`);
      items.push({
        action: "reagendar",
        task_id: task!.id,
        title: task!.title,
        start_at: startAt?.toISOString() ?? null,
        end_at: endAt?.toISOString() ?? null,
        due_date: it.data,
        priority: it.prioridade ?? null,
        new_task: null,
        previous: { start_at: task!.start_at, end_at: task!.end_at, due_date: task!.due_date, priority: task!.priority },
        note: it.motivo,
        position: index,
      });
      if (startAt && endAt) timed.push({ id: task!.id, title: task!.title, start: startAt, end: endAt, kind: task!.kind });
    } else if (it.acao === "priorizar") {
      if (!it.prioridade) return void errors.push(`${label}: informe a nova "prioridade".`);
      items.push({
        action: "priorizar",
        task_id: task!.id,
        title: task!.title,
        start_at: null,
        end_at: null,
        due_date: null,
        priority: it.prioridade,
        new_task: null,
        previous: { priority: task!.priority },
        note: it.motivo,
        position: index,
      });
    } else {
      if (!it.titulo) return void errors.push(`${label}: informe o "titulo" da nova atividade.`);
      const kind = it.tipo ?? "tarefa";
      if (kind === "compromisso" && !(startAt && endAt)) return void errors.push(`${label}: compromissos precisam de data, início e fim.`);
      items.push({
        action: "criar",
        task_id: null,
        title: it.titulo,
        start_at: startAt?.toISOString() ?? null,
        end_at: endAt?.toISOString() ?? null,
        due_date: it.data ?? null,
        priority: it.prioridade ?? "media",
        new_task: { kind, category: it.categoria ?? "pessoal", priority: it.prioridade ?? "media", duration_minutes: it.duracao_minutos ?? null },
        previous: null,
        note: it.motivo,
        position: index,
      });
      if (startAt && endAt) timed.push({ id: `novo-${index}`, title: it.titulo, start: startAt, end: endAt, kind });
    }
  });

  // Conflitos com compromissos e tarefas já agendadas que NÃO estão sendo movidas
  const moving = new Set(items.filter((i) => i.task_id).map((i) => i.task_id!));
  const existing: FixedItem[] = ctx.tasks
    .filter((t) => t.status === "pendente" && t.start_at && t.end_at && !moving.has(t.id))
    .map((t) => ({ id: t.id, title: t.title, start: new Date(t.start_at!), end: new Date(t.end_at!), kind: t.kind }));
  const proposedIds = new Set(timed.map((t) => t.id));
  for (const c of findOverlaps([...existing, ...timed], ctx.tz)) {
    if (c.taskIds?.some((id) => proposedIds.has(id))) errors.push(`conflito: ${c.message}`);
  }

  if (errors.length) return { ok: false, errors };

  const dates = items.map((i) => i.due_date ?? (i.start_at ? localDateString(new Date(i.start_at), ctx.tz) : today)).sort();
  return {
    ok: true,
    plan: {
      scope: p.escopo,
      start_date: dates[0] ?? today,
      end_date: dates[dates.length - 1] ?? today,
      summary: p.titulo,
      notes: [p.justificativa],
    },
    items,
  };
}
