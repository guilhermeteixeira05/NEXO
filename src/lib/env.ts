/**
 * Leitura centralizada das variáveis de ambiente.
 * As funções não lançam erro na importação: cada recurso verifica se está
 * configurado e mostra uma mensagem clara quando não está.
 */

export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

/**
 * Provedores de IA suportados (somente no servidor):
 * - "gemini": Google Gemini API — possui cota gratuita (padrão do projeto acadêmico);
 * - "anthropic": Anthropic Claude — pago por uso.
 * AI_PROVIDER força um provedor; sem ela, usa o primeiro que tiver chave (Gemini, depois Anthropic).
 */
export type AiProvider = "gemini" | "anthropic";

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: "Google Gemini",
  anthropic: "Anthropic Claude",
};

export function getAiProvider(): AiProvider | null {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  if (forced === "gemini") return hasGemini ? "gemini" : null;
  if (forced === "anthropic") return hasAnthropic ? "anthropic" : null;
  if (hasGemini) return "gemini";
  if (hasAnthropic) return "anthropic";
  return null;
}

/** Somente no servidor. */
export function getGeminiConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return { apiKey, model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite" };
}

/** Somente no servidor. */
export function getAnthropicConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return { apiKey, model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5" };
}

export function isAiConfigured(): boolean {
  return getAiProvider() !== null;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
