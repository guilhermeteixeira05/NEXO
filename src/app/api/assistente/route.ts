import { NextResponse, type NextRequest } from "next/server";
import { getUserOrNull } from "@/lib/auth/session";
import { AI_NOT_CONFIGURED } from "@/lib/ai/client";
import { runAssistantTurn } from "@/lib/ai/chat";
import { isAiConfigured } from "@/lib/env";
import { getPlanWithItems } from "@/lib/planning/service";
import { loadUserSnapshot } from "@/lib/snapshot";
import { chatRequestSchema } from "@/lib/validation/schemas";
import type { Message } from "@/lib/types";

export const maxDuration = 60;

/**
 * POST /api/assistente — envia uma mensagem ao assistente NEXO.
 * Corpo: { conversationId?: string, message: string }
 * A chave da IA fica somente neste servidor.
 */
export async function POST(request: NextRequest) {
  const { supabase, user } = await getUserOrNull();
  if (!supabase || !user) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Mensagem inválida." }, { status: 400 });

  if (!isAiConfigured()) return NextResponse.json({ error: AI_NOT_CONFIGURED, code: "not_configured" }, { status: 503 });

  // Conversa (cria se necessário)
  let conversationId = parsed.data.conversationId ?? null;
  if (conversationId) {
    const { data } = await supabase.from("conversations").select("id").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
    if (!data) conversationId = null;
  }
  if (!conversationId) {
    const title = parsed.data.message.length > 60 ? parsed.data.message.slice(0, 57) + "…" : parsed.data.message;
    const { data, error } = await supabase.from("conversations").insert({ user_id: user.id, title }).select("id").single();
    if (error || !data) return NextResponse.json({ error: "Não foi possível iniciar a conversa." }, { status: 500 });
    conversationId = data.id as string;
  }

  const { data: userMsg, error: msgError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: parsed.data.message })
    .select()
    .single();
  if (msgError || !userMsg) return NextResponse.json({ error: "Não foi possível registrar a mensagem." }, { status: 500 });

  const { data: historyRows } = await supabase
    .from("messages")
    .select("role,content,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(20);
  const history = ((historyRows ?? []) as Pick<Message, "role" | "content">[]).reverse();
  // A API exige começar com mensagem do usuário
  while (history.length && history[0].role !== "user") history.shift();

  const snapshot = await loadUserSnapshot();
  const result = await runAssistantTurn({ supabase, snapshot, history });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Falha ao consultar a IA.", conversationId, userMessage: userMsg }, { status: 502 });
  }

  const { data: assistantMsg } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, user_id: user.id, role: "assistant", content: result.text.slice(0, 12000), plan_id: result.planId })
    .select()
    .single();
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", user.id);

  const plan = result.planId ? await getPlanWithItems(supabase, user.id, result.planId) : null;
  return NextResponse.json({ conversationId, userMessage: userMsg, assistantMessage: assistantMsg, plan });
}
