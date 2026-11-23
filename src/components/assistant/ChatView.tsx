"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PlanCard } from "@/components/planning/PlanCard";
import { Icon } from "@/components/ui/Icon";
import type { Conversation, PlanWithItems } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: PlanWithItems | null;
  error?: boolean;
}

const SUGGESTIONS = [
  "Como está minha programação de amanhã?",
  "Quais tarefas ainda preciso concluir?",
  "Estou acumulando atividades?",
  "Como posso organizar melhor minha semana?",
  "Reorganize minhas atividades considerando meus horários disponíveis.",
];

/**
 * Interface de conversa com a IA (RF19–RF24). Mensagens novas são anunciadas por
 * aria-live; o indicador "NEXO está pensando…" mostra o status (H1).
 */
export function ChatView({
  conversations,
  conversationId,
  initialMessages,
  tz,
  aiReady,
  initialPrompt,
}: {
  conversations: Pick<Conversation, "id" | "title" | "updated_at">[];
  conversationId: string | null;
  initialMessages: ChatMessage[];
  tz: string;
  aiReady: boolean;
  initialPrompt?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [convId, setConvId] = useState<string | null>(conversationId);
  const [text, setText] = useState(initialPrompt ?? "");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const seq = useRef(0);
  const localId = (prefix: string) => {
    seq.current += 1;
    return `${prefix}-${seq.current}`;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function send(content: string) {
    const message = content.trim();
    if (!message || sending) return;
    setSending(true);
    setText("");
    const tempId = localId("tmp");
    setMessages((m) => [...m, { id: tempId, role: "user", content: message }]);
    try {
      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId ?? undefined, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.conversationId && data.conversationId !== convId) {
        setConvId(data.conversationId);
        router.replace(`/assistente?c=${data.conversationId}`, { scroll: false });
      }
      if (!res.ok) {
        const errId = localId("err");
        setMessages((m) => [...m, { id: errId, role: "assistant", content: data.error ?? "Não foi possível falar com o assistente.", error: true }]);
      } else {
        const fallbackId = localId("a");
        setMessages((m) => [
          ...m.map((x) => (x.id === tempId && data.userMessage ? { ...x, id: data.userMessage.id } : x)),
          { id: data.assistantMessage?.id ?? fallbackId, role: "assistant", content: data.assistantMessage?.content ?? "", plan: data.plan ?? null },
        ]);
      }
    } catch {
      const errId = localId("err");
      setMessages((m) => [...m, { id: errId, role: "assistant", content: "Sem conexão com o servidor. Verifique sua internet e tente novamente.", error: true }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="chat">
      <aside className="chat__aside" aria-label="Conversas">
        <Link href="/assistente?nova=1" className="btn btn--secondary btn--sm">
          <Icon name="adicionar" size={18} /> Nova conversa
        </Link>
        <nav aria-label="Conversas anteriores" className="stack" style={{ gap: 4 }}>
          {conversations.map((c) => (
            <Link key={c.id} href={`/assistente?c=${c.id}`} className="menu__item" aria-current={c.id === convId ? "page" : undefined}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="chat__main">
        {!aiReady ? (
          <div className="alert alert--warning" role="note">
            <Icon name="alerta" size={18} />
            <span>
              A IA ainda não está configurada neste ambiente (falta <code>GEMINI_API_KEY</code> no servidor). O chat não envia respostas
              simuladas. Veja o README para ativar.
            </span>
          </div>
        ) : null}

        <div className="chat__log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensagens da conversa">
          {messages.length === 0 ? (
            <div className="stack">
              <div className="bubble-row">
                <span className="bubble__avatar">
                  <Icon name="assistente" size={18} />
                </span>
                <div className="bubble">
                  Olá! Eu sou o NEXO. Posso consultar sua programação, analisar suas tarefas e objetivos e propor uma organização melhor —
                  sempre com a sua aprovação. Como posso ajudar?
                </div>
              </div>
            </div>
          ) : null}
          {messages.map((m) => (
            <div key={m.id} className="stack" style={{ gap: 8 }}>
              <div className={`bubble-row${m.role === "user" ? " bubble-row--user" : ""}`}>
                {m.role === "assistant" ? (
                  <span className="bubble__avatar">
                    <Icon name={m.error ? "alerta" : "assistente"} size={18} />
                  </span>
                ) : null}
                <div className="bubble" style={m.error ? { borderColor: "var(--color-danger)" } : undefined}>
                  <span className="sr-only">{m.role === "user" ? "Você disse: " : "NEXO respondeu: "}</span>
                  {m.content}
                </div>
              </div>
              {m.plan ? <PlanCard plan={m.plan} tz={tz} headingLevel={3} /> : null}
            </div>
          ))}
          {sending ? (
            <div className="bubble-row" role="status">
              <span className="bubble__avatar">
                <Icon name="assistente" size={18} />
              </span>
              <div className="bubble">
                <span className="typing" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="sr-only">NEXO está pensando…</span>
                <span aria-hidden="true" className="small muted" style={{ marginLeft: 8 }}>
                  NEXO está pensando…
                </span>
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="chips" role="group" aria-label="Sugestões de perguntas">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={sending || !aiReady}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <label htmlFor="mensagem" className="sr-only">
            Mensagem para o NEXO
          </label>
          <textarea
            id="mensagem"
            ref={inputRef}
            className="textarea"
            rows={1}
            maxLength={2000}
            placeholder="Pergunte ao NEXO…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            aria-describedby="dica-mensagem"
          />
          <button type="submit" className="btn btn--primary btn--icon" style={{ width: 48, height: 48 }} disabled={sending || !text.trim()} aria-label="Enviar mensagem">
            <Icon name="enviar" size={20} />
          </button>
        </form>
        <p id="dica-mensagem" className="xsmall muted">
          Enter envia · Shift + Enter quebra linha. O NEXO usa seus dados do app e nunca altera nada sem a sua aprovação.
        </p>
      </div>
    </div>
  );
}
