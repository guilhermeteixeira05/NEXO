/**
 * Novas tentativas em falhas temporárias do Gemini, usando o SDK @google/genai DE VERDADE
 * com uma função fetch de teste (nenhuma chamada sai para a internet nem consome cota).
 * Os intervalos entre tentativas são encurtados só aqui, para o teste ser rápido;
 * o número de tentativas e os códigos repetidos são os mesmos usados no app.
 */
import { ApiError, GoogleGenAI } from "@google/genai";
import { describe, expect, it } from "vitest";
import { GEMINI_HTTP_OPTIONS } from "@/lib/ai/gemini";

const ok = () =>
  new Response(JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "OK" }] }, finishReason: "STOP" }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { code: status, message, status: "ERRO" } }), {
    status,
    headers: { "content-type": "application/json" },
  });

/** Cliente com a configuração do app e uma fetch que devolve as respostas na ordem dada. */
function clientWith(responses: Array<() => Response>) {
  let calls = 0;
  const ai = new GoogleGenAI({
    apiKey: "chave-de-teste",
    httpOptions: {
      ...GEMINI_HTTP_OPTIONS,
      retryOptions: { ...GEMINI_HTTP_OPTIONS.retryOptions, initialDelay: 0.01, maxDelay: 0.02 },
      fetch: async () => {
        const next = responses[Math.min(calls, responses.length - 1)];
        calls++;
        return next();
      },
    },
  });
  const ask = () => ai.models.generateContent({ model: "gemini-teste", contents: "Oi" });
  return { ask, calls: () => calls };
}

describe("Gemini — novas tentativas em falhas temporárias", () => {
  it("503 (alta demanda) duas vezes e depois sucesso: a resposta chega na 3ª tentativa", async () => {
    const c = clientWith([() => fail(503, "high demand"), () => fail(503, "high demand"), ok]);
    const r = await c.ask();
    expect(r.text).toBe("OK");
    expect(c.calls()).toBe(3);
  });

  it("desiste depois de 3 tentativas e mantém o erro com status (para a mensagem ao usuário)", async () => {
    const c = clientWith([() => fail(503, "high demand")]);
    const err = await c.ask().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(503);
    expect(c.calls()).toBe(3);
  });

  it("429 (limite da cota gratuita) não é repetido", async () => {
    const c = clientWith([() => fail(429, "quota"), ok]);
    const err = await c.ask().catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(429);
    expect(c.calls()).toBe(1);
  });

  it("erro de requisição (400) não é repetido", async () => {
    const c = clientWith([() => fail(400, "bad request"), ok]);
    const err = await c.ask().catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(400);
    expect(c.calls()).toBe(1);
  });

  it("a configuração do app repete só 408 e 5xx, com até 3 tentativas", () => {
    expect(GEMINI_HTTP_OPTIONS.retryOptions.attempts).toBe(3);
    expect(GEMINI_HTTP_OPTIONS.retryOptions.httpStatusCodes).not.toContain(429);
    expect(GEMINI_HTTP_OPTIONS.retryOptions.httpStatusCodes).toEqual(expect.arrayContaining([408, 500, 502, 503, 504]));
  });
});
