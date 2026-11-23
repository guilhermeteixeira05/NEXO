import type { Metadata } from "next";
import { ChatView, type ChatMessage } from "@/components/assistant/ChatView";
import { PageHeader } from "@/components/ui/Misc";
import { getProfile, requireUser } from "@/lib/auth/session";
import { isAiConfigured } from "@/lib/env";
import { getPlansWithItems } from "@/lib/planning/service";
import type { Conversation, Message } from "@/lib/types";

export const metadata: Metadata = { title: "Assistente" };

export default async function AssistantPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const sp = await searchParams;

  const { data: convs } = await supabase
    .from("conversations")
    .select("id,title,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);
  const conversations = (convs ?? []) as Pick<Conversation, "id" | "title" | "updated_at">[];
  const conversationId = sp.nova ? null : (sp.c && conversations.some((c) => c.id === sp.c) ? sp.c : (conversations[0]?.id ?? null));

  let messages: ChatMessage[] = [];
  if (conversationId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);
    const rows = (data ?? []) as Message[];
    const plans = await getPlansWithItems(supabase, user.id, rows.map((m) => m.plan_id).filter((id): id is string => Boolean(id)));
    messages = rows.map((m) => ({ id: m.id, role: m.role, content: m.content, plan: m.plan_id ? (plans.get(m.plan_id) ?? null) : null }));
  }

  return (
    <>
      <PageHeader title="Assistente NEXO" subtitle="Pergunte sobre sua rotina ou peça uma reorganização. Você aprova cada mudança." />
      <ChatView
        key={conversationId ?? "nova"}
        conversations={conversations}
        conversationId={conversationId}
        initialMessages={messages}
        tz={profile.timezone}
        aiReady={isAiConfigured()}
        initialPrompt={sp.prompt?.slice(0, 500)}
      />
    </>
  );
}
