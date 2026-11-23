import "server-only";
import { GoogleGenAI, ThinkingLevel, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import { z } from "zod";
import { getGeminiConfig } from "@/lib/env";

/**
 * Integração com a Google Gemini API (cota gratuita) — somente no servidor.
 * SDK oficial @google/genai: https://ai.google.dev/gemini-api/docs
 */
let cached: { ai: GoogleGenAI; model: string; key: string } | null = null;

export function getGemini(): { ai: GoogleGenAI; model: string } | null {
  const cfg = getGeminiConfig();
  if (!cfg) return null;
  if (!cached || cached.key !== cfg.apiKey || cached.model !== cfg.model) {
    cached = { ai: new GoogleGenAI({ apiKey: cfg.apiKey }), model: cfg.model, key: cfg.apiKey };
  }
  return { ai: cached.ai, model: cached.model };
}

/** "LOW" é aceito por todos os modelos Flash/Flash-Lite atuais (o "MINIMAL" não existe em todos). */
const THINKING = { thinkingLevel: ThinkingLevel.LOW };

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

/** Converte o histórico (texto) para o formato do Gemini, unindo turnos seguidos do mesmo papel. */
export function toGeminiContents(history: { role: "user" | "assistant"; content: string }[]): Content[] {
  const out: Content[] = [];
  for (const m of history) {
    const role = m.role === "assistant" ? "model" : "user";
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts = [...(last.parts ?? []), { text: m.content }];
    else out.push({ role, parts: [{ text: m.content }] });
  }
  return out;
}

export interface ToolResult {
  content: string;
  isError: boolean;
}

/**
 * Laço de conversa com ferramentas (function calling).
 * O conteúdo do modelo é devolvido sem alterações (preserva as assinaturas de raciocínio).
 */
export async function runGeminiToolLoop(params: {
  system: string[];
  history: { role: "user" | "assistant"; content: string }[];
  tools: ToolSpec[];
  executeTool: (name: string, input: unknown) => Promise<ToolResult>;
  maxRounds: number;
}): Promise<{ text: string; truncated: boolean; blocked: boolean }> {
  const gemini = getGemini();
  if (!gemini) throw new Error("Gemini não configurado");
  const contents = toGeminiContents(params.history);
  const functionDeclarations: FunctionDeclaration[] = params.tools.map((t) => ({
    name: t.name,
    description: t.description,
    parametersJsonSchema: t.parameters,
  }));

  for (let round = 0; round <= params.maxRounds; round++) {
    const response = await gemini.ai.models.generateContent({
      model: gemini.model,
      contents,
      config: {
        systemInstruction: params.system.join("\n\n"),
        tools: [{ functionDeclarations }],
        thinkingConfig: THINKING,
        maxOutputTokens: 4096,
      },
    });
    const calls = response.functionCalls ?? [];
    const candidate = response.candidates?.[0];
    if (calls.length === 0 || round === params.maxRounds || !candidate?.content) {
      const finish = String(candidate?.finishReason ?? "");
      return {
        text: (response.text ?? "").trim(),
        truncated: finish === "MAX_TOKENS",
        blocked: !response.text && /SAFETY|BLOCK|PROHIBITED|RECITATION/.test(finish + String(response.promptFeedback?.blockReason ?? "")),
      };
    }
    contents.push(candidate.content);
    const parts: Part[] = [];
    for (const call of calls) {
      const r = await params.executeTool(call.name ?? "", call.args ?? {});
      parts.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: r.isError ? { error: r.content } : { result: r.content },
        },
      });
    }
    contents.push({ role: "user", parts });
  }
  return { text: "", truncated: false, blocked: false };
}

/** Saída estruturada: JSON validado pelo esquema Zod. Retorna null em caso de falha. */
export async function geminiStructured<T extends z.ZodType>(schema: T, system: string, user: string): Promise<z.infer<T> | null> {
  const gemini = getGemini();
  if (!gemini) return null;
  try {
    const response = await gemini.ai.models.generateContent({
      model: gemini.model,
      contents: [{ role: "user", parts: [{ text: user }] }],
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        thinkingConfig: THINKING,
        maxOutputTokens: 4000,
      },
    });
    const parsed = schema.safeParse(JSON.parse(response.text ?? ""));
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.error("[ia/gemini] falha na saída estruturada", err instanceof Error ? err.message : err);
    return null;
  }
}
