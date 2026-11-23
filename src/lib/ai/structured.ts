import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAi } from "@/lib/ai/client";
import { BRIEFING_SYSTEM_PROMPT, PLAN_REVIEW_SYSTEM_PROMPT, WEEKLY_SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/prompts";

/**
 * Chamadas de IA com saída estruturada (JSON validado por esquema).
 * Cada função retorna null se a IA não estiver configurada ou falhar;
 * quem chama usa então a alternativa baseada em regras (sem fingir que houve IA).
 */

export const briefingOutput = z.object({
  mensagens: z.array(z.object({ texto: z.string(), acao_rotulo: z.string(), acao_link: z.string() })),
});
export type BriefingOutput = z.infer<typeof briefingOutput>;

export const weeklySummaryOutput = z.object({
  titulo: z.string(),
  resumo: z.string(),
  destaques: z.array(z.string()),
  sugestoes: z.array(z.string()),
});
export type WeeklySummaryOutput = z.infer<typeof weeklySummaryOutput>;

export const planReviewOutput = z.object({
  resumo: z.string(),
  observacoes: z.array(z.string()),
  blocos: z.array(z.object({ tarefa_id: z.string(), data: z.string(), inicio: z.string(), fim: z.string() })),
});
export type PlanReviewOutput = z.infer<typeof planReviewOutput>;

async function parseWith<T extends z.ZodType>(
  schema: T,
  system: string,
  user: string,
  effort: "low" | "medium",
): Promise<z.infer<T> | null> {
  const ai = getAi();
  if (!ai) return null;
  try {
    const res = await ai.client.messages.parse({
      model: ai.model,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: zodOutputFormat(schema), effort },
    });
    if (res.stop_reason === "refusal") return null;
    return (res.parsed_output as z.infer<T> | null) ?? null;
  } catch (err) {
    console.error("[ia] falha na saída estruturada", err instanceof Error ? err.message : err);
    return null;
  }
}

export function generateBriefingWithAi(payload: unknown) {
  return parseWith(briefingOutput, BRIEFING_SYSTEM_PROMPT, `Dados para o briefing de hoje (JSON):\n${JSON.stringify(payload)}`, "low");
}

export function generateWeeklySummaryWithAi(payload: unknown) {
  return parseWith(weeklySummaryOutput, WEEKLY_SUMMARY_SYSTEM_PROMPT, `Indicadores da semana (JSON):\n${JSON.stringify(payload)}`, "low");
}

export function reviewPlanWithAi(payload: unknown) {
  return parseWith(planReviewOutput, PLAN_REVIEW_SYSTEM_PROMPT, `Rascunho do planejamento (JSON):\n${JSON.stringify(payload)}`, "medium");
}
