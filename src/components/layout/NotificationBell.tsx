"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const POLL_MS = 60_000;

/**
 * Sino de notificações (RF38): mostra o total não lido e, a cada 60 s com o app aberto,
 * processa lembretes vencidos no servidor. Se o usuário permitiu, também exibe
 * notificações do navegador (RF35).
 */
export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (busy.current || document.visibilityState === "hidden") return;
      busy.current = true;
      try {
        const res = await fetch("/api/notificacoes", { method: "POST" });
        if (!res.ok) return;
        const data = (await res.json()) as { unread: number; created: { id: string; title: string; body: string | null; link: string | null }[] };
        if (cancelled) return;
        setUnread(data.unread);
        if (data.created.length && "Notification" in window && Notification.permission === "granted") {
          for (const n of data.created) {
            const notification = new Notification(n.title, { body: n.body ?? undefined, tag: n.id, icon: "/icon.svg" });
            notification.onclick = () => {
              window.focus();
              if (n.link) window.location.href = n.link;
            };
          }
        }
      } catch {
        // Falha de rede: tenta de novo no próximo ciclo
      } finally {
        busy.current = false;
      }
    }
    sync();
    const timer = setInterval(sync, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const label = unread > 0 ? `Notificações: ${unread} não lida${unread > 1 ? "s" : ""}` : "Notificações";
  return (
    <Link href="/lembretes?aba=notificacoes" className="icon-btn" aria-label={label} title={label}>
      <Icon name="lembretes" />
      {unread > 0 ? (
        <span className="icon-btn__count" aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
