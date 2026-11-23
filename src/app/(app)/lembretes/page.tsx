import type { Metadata } from "next";
import Link from "next/link";
import { BrowserNotificationToggle, NewReminderButton, NotificationLink, ReminderItem } from "@/components/reminders/ReminderViews";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui/Misc";
import { getProfile, requireUser } from "@/lib/auth/session";
import { formatDateTime, localDateString } from "@/lib/dates";
import { markNotificationsReadAction } from "@/lib/reminders/actions";
import { listNotifications, listReminders, syncNotifications } from "@/lib/reminders/service";

export const metadata: Metadata = { title: "Lembretes" };

const KIND_ICON = { lembrete: "relogio", atraso: "alerta", proativo: "assistente", sistema: "info" } as const;

export default async function RemindersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const sp = await searchParams;
  const tab = sp.aba === "notificacoes" ? "notificacoes" : "lembretes";
  const now = new Date();
  await syncNotifications(supabase, user.id, now, profile.timezone);
  const [reminders, notifications, { data: taskRows }] = await Promise.all([
    listReminders(supabase, user.id),
    listNotifications(supabase, user.id, 50),
    supabase.from("tasks").select("id,title").eq("user_id", user.id).eq("status", "pendente").order("created_at", { ascending: false }).limit(100),
  ]);
  const tasks = (taskRows ?? []) as { id: string; title: string }[];
  const taskTitle = new Map(tasks.map((t) => [t.id, t.title]));
  const unread = notifications.filter((n) => !n.read_at).length;
  const markAll = markNotificationsReadAction.bind(null, undefined);

  return (
    <>
      <PageHeader
        title="Lembretes e notificações"
        subtitle="Lembretes avulsos ou de atividades, avisos de pendências e mensagens do assistente."
        actions={<NewReminderButton tasks={tasks} defaultDate={localDateString(now, profile.timezone)} />}
      />
      <nav className="segmented" aria-label="Seções" style={{ maxWidth: 480 }}>
        <Link href="/lembretes" className="segmented__option" aria-current={tab === "lembretes" ? "page" : undefined}>
          Lembretes ({reminders.length})
        </Link>
        <Link href="/lembretes?aba=notificacoes" className="segmented__option" aria-current={tab === "notificacoes" ? "page" : undefined}>
          Notificações{unread ? ` (${unread})` : ""}
        </Link>
      </nav>

      {tab === "lembretes" ? (
        <section className="stack" aria-labelledby="titulo-lembretes">
          <h2 id="titulo-lembretes" className="sr-only">
            Lembretes
          </h2>
          <div className="panel">
            <BrowserNotificationToggle />
          </div>
          {reminders.length ? (
            <ul className="task-list" role="list">
              {reminders.map((r) => (
                <ReminderItem key={r.id} reminder={r} tz={profile.timezone} taskTitle={r.task_id ? taskTitle.get(r.task_id) : undefined} />
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhum lembrete cadastrado.">
              Crie lembretes avulsos (ex.: beber água) ou marque “Criar lembrete” ao cadastrar uma atividade com horário.
            </EmptyState>
          )}
        </section>
      ) : (
        <section className="stack" aria-labelledby="titulo-notificacoes">
          <SectionTitle
            id="titulo-notificacoes"
            title="Central de notificações"
            action={unread ? <ActionButton action={markAll} className="link-btn">Marcar todas como lidas</ActionButton> : null}
          />
          {notifications.length ? (
            <ul className="task-list" role="list">
              {notifications.map((n) => (
                <li key={n.id} className="task" style={{ paddingLeft: 12, opacity: n.read_at ? 0.8 : 1 }}>
                  <span style={{ color: n.kind === "atraso" ? "var(--color-danger)" : "var(--color-accent)", flexShrink: 0 }}>
                    <Icon name={KIND_ICON[n.kind]} />
                  </span>
                  <div className="task__body">
                    <NotificationLink href={n.link}>
                      {!n.read_at ? <span className="sr-only">Não lida: </span> : null}
                      {n.title}
                    </NotificationLink>
                    {n.body ? <span className="small secondary">{n.body}</span> : null}
                    <span className="task__meta">{formatDateTime(n.created_at, profile.timezone)}</span>
                  </div>
                  {!n.read_at ? <span className="badge badge--accent">Nova</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma notificação por enquanto.">Os lembretes vencidos e os avisos de atividades atrasadas aparecem aqui.</EmptyState>
          )}
        </section>
      )}
    </>
  );
}
