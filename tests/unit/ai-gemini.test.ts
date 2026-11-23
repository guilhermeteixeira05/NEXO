/**
 * Integração com o Gemini SEM chamadas reais (não consome cota): o cliente do
 * Google é substituído por um dublê que devolve respostas roteirizadas.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const calls: Array<{ model: string; contents: unknown[]; config: Record<string, unknown> }> = [];
let scripted: unknown[] = [];

vi.mock("@google/genai", () => {
  class GoogleGenAI {
    models = {
      generateContent: async (req: { model: string; contents: unknown[]; config: Record<string, unknown> }) => {
        calls.push(structuredClone(req));
        const next = scripted.shift();
        if (next instanceof Error) throw next;
        return next;
      },
    };
  }
  class ApiError extends Error {
    status: number;
    constructor(o: { message: string; status: number }) {
      super(o.message);
      this.status = o.status;
    }
  }
  return { GoogleGenAI, ApiError, ThinkingLevel: { LOW: "LOW" } };
});

const { geminiStructured, runGeminiToolLoop, toGeminiContents } = await import("@/lib/ai/gemini");
const { getAiProvider } = await import("@/lib/env");
const { aiErrorMessage } = await import("@/lib/ai/client");
const { ApiError } = await import("@google/genai");

beforeEach(() => {
  calls.length = 0;
  scripted = [];
  vi.stubEnv("GEMINI_API_KEY", "chave-de-teste");
  vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash-lite");
});
afterEach(() => vi.unstubAllEnvs());

describe("escolha do provedor de IA", () => {
  it("usa o Gemini quando há GEMINI_API_KEY e permite forçar o Claude", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "x");
    expect(getAiProvider()).toBe("gemini");
    vi.stubEnv("AI_PROVIDER", "anthropic");
    expect(getAiProvider()).toBe("anthropic");
  });
  it("sem nenhuma chave, a IA fica desligada (sem respostas simuladas)", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(getAiProvider()).toBeNull();
  });
});

describe("histórico no formato do Gemini", () => {
  it("converte papéis e une mensagens seguidas do mesmo papel", () => {
    expect(
      toGeminiContents([
        { role: "user", content: "a" },
        { role: "user", content: "b" },
        { role: "assistant", content: "c" },
      ]),
    ).toEqual([
      { role: "user", parts: [{ text: "a" }, { text: "b" }] },
      { role: "model", parts: [{ text: "c" }] },
    ]);
  });
});

describe("laço de ferramentas (function calling)", () => {
  it("executa a ferramenta, devolve o resultado com id/nome e preserva o conteúdo do modelo", async () => {
    const modelTurn = { role: "model", parts: [{ functionCall: { id: "c1", name: "consultar_planejador", args: { dias: 1 } }, thoughtSignature: "sig" }] };
    scripted = [
      { functionCalls: [{ id: "c1", name: "consultar_planejador", args: { dias: 1 } }], candidates: [{ content: modelTurn }] },
      { text: "Amanhã você tem 2 horas livres.", functionCalls: undefined, candidates: [{ content: { role: "model", parts: [] }, finishReason: "STOP" }] },
    ];
    const executeTool = vi.fn(async () => ({ content: '{"livre":120}', isError: false }));
    const r = await runGeminiToolLoop({
      system: ["instruções", "contexto"],
      history: [{ role: "user", content: "Como está meu dia?" }],
      tools: [{ name: "consultar_planejador", description: "d", parameters: { type: "object", properties: {} } }],
      executeTool,
      maxRounds: 5,
    });
    expect(r).toEqual({ text: "Amanhã você tem 2 horas livres.", truncated: false, blocked: false });
    expect(executeTool).toHaveBeenCalledWith("consultar_planejador", { dias: 1 });
    expect(calls).toHaveLength(2);
    expect(calls[0].config).toMatchObject({ systemInstruction: "instruções\n\ncontexto", thinkingConfig: { thinkingLevel: "LOW" } });
    expect((calls[0].config.tools as { functionDeclarations: { parametersJsonSchema: unknown }[] }[])[0].functionDeclarations[0].parametersJsonSchema).toEqual({
      type: "object",
      properties: {},
    });
    // 2ª chamada: histórico + turno do modelo intacto (com assinatura) + resposta da função
    expect(calls[1].contents[1]).toEqual(modelTurn);
    expect(calls[1].contents[2]).toEqual({
      role: "user",
      parts: [{ functionResponse: { id: "c1", name: "consultar_planejador", response: { result: '{"livre":120}' } } }],
    });
  });

  it("envia erros de validação como 'error' para a IA corrigir", async () => {
    scripted = [
      { functionCalls: [{ id: "c9", name: "propor_alteracoes", args: {} }], candidates: [{ content: { role: "model", parts: [] } }] },
      { text: "Corrigi a proposta.", candidates: [{ content: { role: "model", parts: [] }, finishReason: "STOP" }] },
    ];
    await runGeminiToolLoop({
      system: ["s"],
      history: [{ role: "user", content: "reorganize" }],
      tools: [],
      executeTool: async () => ({ content: "Proposta inválida", isError: true }),
      maxRounds: 5,
    });
    expect(calls[1].contents[2]).toMatchObject({ parts: [{ functionResponse: { response: { error: "Proposta inválida" } } }] });
  });

  it("identifica respostas bloqueadas por segurança e cortes por tamanho", async () => {
    scripted = [{ text: undefined, candidates: [{ content: { role: "model", parts: [] }, finishReason: "SAFETY" }] }];
    const blocked = await runGeminiToolLoop({ system: ["s"], history: [{ role: "user", content: "x" }], tools: [], executeTool: vi.fn(), maxRounds: 1 });
    expect(blocked.blocked).toBe(true);
    scripted = [{ text: "parcial", candidates: [{ content: { role: "model", parts: [] }, finishReason: "MAX_TOKENS" }] }];
    const cut = await runGeminiToolLoop({ system: ["s"], history: [{ role: "user", content: "x" }], tools: [], executeTool: vi.fn(), maxRounds: 1 });
    expect(cut).toEqual({ text: "parcial", truncated: true, blocked: false });
  });
});

describe("saída estruturada (JSON validado)", () => {
  const schema = z.object({ resumo: z.string(), sugestoes: z.array(z.string()) });
  it("pede JSON com o esquema e valida a resposta", async () => {
    scripted = [{ text: '{"resumo":"Boa semana","sugestoes":["Estudar de manhã"]}' }];
    expect(await geminiStructured(schema, "sistema", "dados")).toEqual({ resumo: "Boa semana", sugestoes: ["Estudar de manhã"] });
    expect(calls[0].config).toMatchObject({ responseMimeType: "application/json", systemInstruction: "sistema" });
    expect((calls[0].config.responseJsonSchema as { properties: Record<string, unknown> }).properties).toHaveProperty("sugestoes");
  });
  it("retorna null para JSON fora do esquema ou erro da API (quem chama usa as regras locais)", async () => {
    scripted = [{ text: '{"resumo": 1}' }];
    expect(await geminiStructured(schema, "s", "u")).toBeNull();
    scripted = [new ApiError({ message: "quota", status: 429 })];
    expect(await geminiStructured(schema, "s", "u")).toBeNull();
  });
});

describe("mensagens de erro amigáveis", () => {
  it("explica o limite da cota gratuita (429) e chave inválida", () => {
    expect(aiErrorMessage(new ApiError({ message: "x", status: 429 }))).toMatch(/limite gratuito/);
    expect(aiErrorMessage(new ApiError({ message: "x", status: 403 }))).toMatch(/chave/);
  });
});
