import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ApiError as GeminiApiError } from "@google/genai";
import { getAnthropicConfig } from "@/lib/env";

/**
 * Cliente da API Anthropic (Claude). Instanciado somente no servidor:
 * a chave nunca chega ao navegador. O cliente do Gemini fica em ./gemini.ts.
 */
let cached: { client: Anthropic; model: string } | null = null;

export function getAi(): { client: Anthropic; model: string } | null {
  const cfg = getAnthropicConfig();
  if (!cfg) return null;
  if (!cached || cached.model !== cfg.model) {
    cached = { client: new Anthropic({ apiKey: cfg.apiKey, maxRetries: 2, timeout: 60_000 }), model: cfg.model };
  }
  return cached;
}

export const AI_NOT_CONFIGURED =
  "A inteligência artificial ainda não está configurada neste ambiente. Defina GEMINI_API_KEY (gratuita no Google AI Studio) no servidor — veja o README.";

function messageForStatus(status: number): string {
  if (status === 400) return "A IA não conseguiu processar este pedido. Tente reformular a mensagem.";
  if (status === 401 || status === 403) return "A chave da API de IA é inválida ou não tem permissão. Verifique a chave no servidor.";
  if (status === 404) return "O modelo de IA configurado não foi encontrado. Verifique GEMINI_MODEL (ou ANTHROPIC_MODEL).";
  if (status === 429)
    return "O limite gratuito de uso da IA foi atingido por agora. Aguarde um minuto (ou até amanhã, se for o limite diário) e tente novamente.";
  return "O serviço de IA está instável no momento. Tente novamente em instantes.";
}

/** Mensagem amigável para erros da API de IA (sem expor detalhes internos). */
export function aiErrorMessage(err: unknown): string {
  if (err instanceof GeminiApiError) return messageForStatus(err.status);
  if (err instanceof Anthropic.APIConnectionError) return "Não foi possível conectar ao serviço de IA. Verifique a conexão e tente novamente.";
  if (err instanceof Anthropic.APIError) return messageForStatus(err.status ?? 500);
  if (err instanceof Error && /fetch failed|ENOTFOUND|ECONNRESET|network/i.test(err.message)) {
    return "Não foi possível conectar ao serviço de IA. Verifique a conexão e tente novamente.";
  }
  return "Ocorreu um erro inesperado ao falar com a IA.";
}
