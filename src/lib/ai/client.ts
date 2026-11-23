import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicConfig } from "@/lib/env";

/**
 * Cliente da API Anthropic (Claude). Instanciado somente no servidor:
 * a chave ANTHROPIC_API_KEY nunca chega ao navegador.
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
  "A inteligência artificial ainda não está configurada neste ambiente. Defina ANTHROPIC_API_KEY no servidor (veja o README).";

/** Mensagem amigável para erros da API (sem expor detalhes internos). */
export function aiErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "A chave da API de IA é inválida. Verifique ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.PermissionDeniedError) return "A chave da API de IA não tem permissão para este modelo.";
  if (err instanceof Anthropic.NotFoundError) return "O modelo de IA configurado não foi encontrado. Verifique ANTHROPIC_MODEL.";
  if (err instanceof Anthropic.RateLimitError) return "Muitas solicitações à IA em pouco tempo. Aguarde alguns segundos e tente novamente.";
  if (err instanceof Anthropic.BadRequestError) return "A IA não conseguiu processar este pedido. Tente reformular a mensagem.";
  if (err instanceof Anthropic.APIConnectionError) return "Não foi possível conectar ao serviço de IA. Verifique a conexão e tente novamente.";
  if (err instanceof Anthropic.APIError) return "O serviço de IA está instável no momento. Tente novamente em instantes.";
  return "Ocorreu um erro inesperado ao falar com a IA.";
}
