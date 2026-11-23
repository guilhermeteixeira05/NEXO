import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { aiErrorMessage, getAi } from "@/lib/ai/client";
import { buildContextText } from "@/lib/ai/context";
import { runGeminiToolLoop, type ToolResult, type ToolSpec } from "@/lib/ai/gemini";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { PROPOSAL_TOOL_INPUT_SCHEMA, validateProposal } from "@/lib/ai/proposals";
import { dateRange, isValidDateStr, localDateString, localTimeString } from "@/lib/dates";
import { getAiProvider } from "@/lib/env";
import { holidayMap } from "@/lib/holidays/brasilapi";
import { buildSchedule } from "@/lib/planning/scheduler";
import { savePlan } from "@/lib/planning/service";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { UserSnapshot } from "@/lib/snapshot";

const MAX_TOOL_ROUNDS = 5;

/** Ferramentas oferecidas à IA (mesmas para Gemini e Claude). */
export const ASSISTANT_TOOLS: ToolSpec[] = [
  {
    name: "consultar_planejador",
    description:
      "Calcula, com os dados reais do usuário, os horários livres e um rascunho de encaixe das atividades pendentes para um período. Somente leitura: não altera nada. Use antes de propor horários.",
    parameters: {
      type: "object",
      properties: {
        data_inicio: { type: "string", description: "Data inicial AAAA-MM-DD (hoje ou futura)." },
        dias: { type: "integer", description: "Quantidade de dias (1 a 7)." },
      },
      required: ["data_inicio", "dias"],
    },
  },
  {
    name: "propor_alteracoes",
    description:
      "Cria uma PROPOSTA de alterações (reagendar, mudar prioridade ou criar atividades) que o usuário vai aprovar ou rejeitar na tela. Não aplica nada sozinha. Os dados são validados; se houver erro, corrija e chame de novo.",
    parameters: PROPOSAL_TOOL_INPUT_SCHEMA,
  },
];

export interface ChatResult {
  ok: boolean;
  text: string;
  planId: string | null;
  error?: string;
}

function runPlannerTool(input: unknown, snapshot: UserSnapshot): ToolResult {
  const i = (input ?? {}) as { data_inicio?: string; dias?: number };
  const start = typeof i.data_inicio === "string" && isValidDateStr(i.data_inicio) ? i.data_inicio : snapshot.today;
  if (start < snapshot.today) return { content: "data_inicio não pode estar no passado.", isError: true };
  const days = Math.min(7, Math.max(1, Math.round(Number(i.dias) || 1)));
  const tz = snapshot.profile.timezone;
  const r = buildSchedule({
    dates: dateRange(start, days),
    tz,
    availability: snapshot.availability,
    tasks: snapshot.tasks,
    now: snapshot.now,
    defaultMinutes: snapshot.profile.default_task_minutes,
    holidays: holidayMap(snapshot.holidays),
  });
  return {
    isError: false,
    content: JSON.stringify({
      minutos_livres_por_dia: r.freeMinutesByDate,
      compromissos_e_itens_com_horario: r.fixed.map((f) => ({ id: f.id, titulo: f.title, inicio: `${localDateString(f.start, tz)} ${localTimeString(f.start, tz)}`, fim: localTimeString(f.end, tz) })),
      rascunho_de_encaixe: r.blocks.map((b) => ({ tarefa_id: b.taskId, titulo: b.title, data: b.date, inicio: localTimeString(b.start, tz), fim: localTimeString(b.end, tz), motivo: b.reason })),
      nao_encaixadas: r.unscheduled,
      conflitos: r.conflicts.map((c) => c.message),
      observacoes: r.notes,
    }),
  };
}

/** Executa uma ferramenta pedida pela IA. Propostas só são gravadas depois de validadas (RNF05). */
function makeToolExecutor(supabase: ServerSupabase, snapshot: UserSnapshot, onPlan: (id: string) => void) {
  return async (name: string, input: unknown): Promise<ToolResult> => {
    if (name === "consultar_planejador") return runPlannerTool(input, snapshot);
    if (name === "propor_alteracoes") {
      const v = validateProposal(input, {
        tasks: snapshot.tasks,
        tz: snapshot.profile.timezone,
        now: snapshot.now,
        defaultMinutes: snapshot.profile.default_task_minutes,
      });
      if (!v.ok) return { isError: true, content: `Proposta inválida. Corrija e tente de novo:\n- ${v.errors.join("\n- ")}` };
      const id = await savePlan(supabase, snapshot.userId, { ...v.plan, source: "ia", conflicts: [], unscheduled: [] }, v.items);
      if (!id) return { isError: true, content: "Falha ao gravar a proposta. Informe o usuário." };
      onPlan(id);
      return { isError: false, content: `Proposta criada com ${v.items.length} item(ns) e exibida ao usuário para aprovação. Nada foi alterado ainda.` };
    }
    return { isError: true, content: `Ferramenta desconhecida: ${name}` };
  };
}

function systemTexts(snapshot: UserSnapshot): [string, string] {
  return [
    ASSISTANT_SYSTEM_PROMPT,
    buildContextText({
      profile: snapshot.profile,
      now: snapshot.now,
      tasks: snapshot.tasks,
      goals: snapshot.goals,
      availability: snapshot.availability,
      activity: snapshot.activity,
      holidays: snapshot.holidays,
    }),
  ];
}

const REFUSAL_TEXT = "Não posso ajudar com esse pedido. Posso ajudar a organizar suas tarefas, compromissos e objetivos.";
const TRUNCATED_SUFFIX = "\n\n(Resposta interrompida por tamanho. Peça para eu continuar.)";

/**
 * Executa uma rodada de conversa (RF19–RF23): envia contexto + histórico,
 * executa as ferramentas pedidas e devolve o texto final e a proposta criada.
 */
export async function runAssistantTurn(params: {
  supabase: ServerSupabase;
  snapshot: UserSnapshot;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<ChatResult> {
  const provider = getAiProvider();
  if (!provider) return { ok: false, text: "", planId: null, error: "not_configured" };
  let planId: string | null = null;
  const executeTool = makeToolExecutor(params.supabase, params.snapshot, (id) => (planId = id));
  const fallback = () => (planId ? "Preparei uma proposta logo abaixo para sua aprovação." : "Não consegui formular uma resposta. Pode reformular?");

  try {
    if (provider === "gemini") {
      const r = await runGeminiToolLoop({
        system: systemTexts(params.snapshot),
        history: params.history,
        tools: ASSISTANT_TOOLS,
        executeTool,
        maxRounds: MAX_TOOL_ROUNDS,
      });
      if (r.blocked) return { ok: true, planId, text: REFUSAL_TEXT };
      return { ok: true, planId, text: (r.text || fallback()) + (r.truncated ? TRUNCATED_SUFFIX : "") };
    }
    return await runClaudeLoop(params, executeTool, () => planId, fallback);
  } catch (err) {
    console.error("[ia] erro na conversa", err instanceof Error ? err.message : err);
    return { ok: false, planId, text: "", error: aiErrorMessage(err) };
  }
}

async function runClaudeLoop(
  params: { snapshot: UserSnapshot; history: { role: "user" | "assistant"; content: string }[] },
  executeTool: (name: string, input: unknown) => Promise<ToolResult>,
  currentPlan: () => string | null,
  fallback: () => string,
): Promise<ChatResult> {
  const ai = getAi();
  if (!ai) return { ok: false, text: "", planId: null, error: "not_configured" };
  const [prompt, context] = systemTexts(params.snapshot);
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: prompt, cache_control: { type: "ephemeral" } },
    { type: "text", text: context },
  ];
  const tools: Anthropic.Tool[] = ASSISTANT_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Tool.InputSchema,
  }));
  const messages: Anthropic.MessageParam[] = params.history.map((m) => ({ role: m.role, content: m.content }));

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await ai.client.messages.create({ model: ai.model, max_tokens: 4096, system, tools, messages, output_config: { effort: "medium" } });
    if (response.stop_reason === "refusal") return { ok: true, planId: currentPlan(), text: REFUSAL_TEXT };
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0 || round === MAX_TOOL_ROUNDS) {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { ok: true, planId: currentPlan(), text: (text || fallback()) + (response.stop_reason === "max_tokens" ? TRUNCATED_SUFFIX : "") };
    }
    // Devolve o conteúdo do assistente sem alterações (inclui blocos de raciocínio).
    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const r = await executeTool(tu.name, tu.input);
      results.push({ type: "tool_result", tool_use_id: tu.id, content: r.content, is_error: r.isError });
    }
    messages.push({ role: "user", content: results });
  }
  return { ok: true, planId: currentPlan(), text: fallback() };
}
