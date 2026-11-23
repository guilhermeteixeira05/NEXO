import type { Metadata } from "next";
import Link from "next/link";
import { BriefingPanel } from "@/components/dashboard/BriefingPanel";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Notice, ProgressBar, SectionTitle, Stat } from "@/components/ui/Misc";
import { firstName, requireUser } from "@/lib/auth/session";
import { addDays, capitalize, diffDays, formatDateLong, formatDayMonth, greeting } from "@/lib/dates";
import { computeMetrics } from "@/lib/insights/metrics";
import { getBriefing } from "@/lib/insights/service";
import { loadUserSnapshot } from "@/lib/snapshot";
import { isOverdue, tasksOnDate } from "@/lib/tasks/rules";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase } = await requireUser();
  const snapshot = await loadUserSnapshot();
  const sp = await searchParams;
  const { profile, now, today, tasks } = snapshot;
  const tz = profile.timezone;
  const briefing = await getBriefing(supabase, snapshot);
  const goals = snapshot.goals.map((g) => ({ id: g.id, title: g.title }));

  const pending = tasks.filter((t) => t.status === "pendente");
  const overdue = pending.filter((t) => isOverdue(t, now, tz));
  const todayList = tasksOnDate(tasks, today, tz);
  const in2h = now.getTime() + 2 * 3600000;
  const upcoming = pending
    .filter((t) => t.start_at && t.end_at && new Date(t.end_at).getTime() > now.getTime() && new Date(t.start_at).getTime() <= in2h)
    .sort((a, b) => a.start_at!.localeCompare(b.start_at!));
  const week = computeMetrics({ periodStart: addDays(today, -6), days: 7, log: snapshot.activity, tasks, goals: snapshot.goals, now, tz });
  const nextHoliday = snapshot.holidays.find((h) => h.date >= today);
  const activeGoals = snapshot.goals.filter((g) => g.status === "ativo").slice(0, 3);

  return (
    <>
      <header className="page-header">
        <div className="page-header__text">
          <h1>
            {greeting(now, tz)}
            {profile.full_name ? `, ${firstName(profile.full_name)}` : ""}
          </h1>
          <p className="page-header__subtitle">
            {capitalize(formatDateLong(today))}
            {nextHoliday
              ? ` · Próximo feriado nacional: ${nextHoliday.name}, ${formatDayMonth(nextHoliday.date)}${diffDays(today, nextHoliday.date) === 0 ? " (hoje)" : ""}`
              : ""}
          </p>
        </div>
      </header>

      {sp.bemvindo ? (
        <Notice tone="success">
          <strong>Tudo pronto!</strong>
          <span>Cadastre suas atividades pelo botão “Nova atividade” e peça ao Assistente para organizar sua semana.</span>
        </Notice>
      ) : null}
      {snapshot.holidaysError ? (
        <Notice tone="warning">
          <span>Feriados indisponíveis no momento: {snapshot.holidaysError}</span>
        </Notice>
      ) : null}
      {snapshot.availability.length === 0 ? (
        <Notice tone="info">
          <span>
            Cadastre seus horários livres em <Link href="/perfil#disponibilidade">Perfil → Disponibilidade</Link> para o planejamento funcionar.
          </span>
        </Notice>
      ) : null}

      <div className="grid-dashboard">
        <div className="stack stack--lg">
          <BriefingPanel briefing={briefing} />
          <section aria-labelledby="titulo-agora" className="stack">
            <SectionTitle id="titulo-agora" title="Agora e a seguir" />
            {upcoming.length ? (
              <ul className="task-list" role="list">
                {upcoming.map((t) => (
                  <TaskItem key={t.id} task={t} tz={tz} goals={goals} today={today} showDate={false} />
                ))}
              </ul>
            ) : (
              <p className="small muted">Nada nas próximas 2 horas.</p>
            )}
          </section>
        </div>

        <section aria-labelledby="titulo-programacao" id="programacao" className="stack" tabIndex={-1}>
          <SectionTitle
            id="titulo-programacao"
            title="Programação de hoje"
            action={
              <Link href="/planejamento?escopo=diario" className="link-btn">
                Planejar o dia
              </Link>
            }
          />
          {overdue.length ? (
            <>
              <h3 className="section-label section-label--danger">Atrasadas · {overdue.length}</h3>
              <ul className="task-list" role="list">
                {overdue.slice(0, 5).map((t) => (
                  <TaskItem key={t.id} task={t} tz={tz} goals={goals} today={today} overdue />
                ))}
              </ul>
            </>
          ) : null}
          <h3 className="section-label">Hoje · {todayList.length}</h3>
          {todayList.length ? (
            <ul className="task-list" role="list">
              {todayList.map((t) => (
                <TaskItem key={t.id} task={t} tz={tz} goals={goals} today={today} showDate={false} overdue={isOverdue(t, now, tz)} />
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma atividade para hoje." action={{ href: "/tarefas", label: "Ver todas as tarefas" }}>
              Aproveite para adiantar algo importante ou planejar a semana.
            </EmptyState>
          )}
        </section>

        <div className="stack stack--lg">
          <section aria-labelledby="titulo-resumo" className="stack">
            <SectionTitle id="titulo-resumo" title="Resumo" />
            <div className="stats">
              <Stat label="Pendentes hoje" value={todayList.filter((t) => t.status === "pendente").length} hint={`${pending.length} no total`} />
              <Stat label="Atrasadas" value={overdue.length} hint={overdue.length ? "Reorganize no Planejamento" : "Tudo em dia"} />
              <Stat label="Concluídas (7 dias)" value={week.completed} hint={`${week.postponed} adiamento(s)`} />
              <Stat label="Taxa de conclusão" value={week.completionRate === null ? "—" : `${week.completionRate}%`} hint="Últimos 7 dias" />
            </div>
          </section>
          <section aria-labelledby="titulo-objetivos" className="stack">
            <SectionTitle
              id="titulo-objetivos"
              title="Objetivos em foco"
              action={
                <Link href="/objetivos" className="link-btn">
                  Ver todos
                </Link>
              }
            />
            {activeGoals.length ? (
              <ul className="stack" role="list">
                {activeGoals.map((g) => (
                  <li key={g.id} className="panel" style={{ gap: 8 }}>
                    <div className="panel__header">
                      <span style={{ fontWeight: 600 }}>{g.title}</span>
                      <span className="small" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                        {g.progress}%
                      </span>
                    </div>
                    <ProgressBar value={g.progress} label={`Progresso de ${g.title}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhum objetivo ativo." action={{ href: "/objetivos", label: "Criar objetivo" }} />
            )}
          </section>
          <Link href="/assistente" className="btn btn--secondary">
            <Icon name="assistente" size={20} /> Conversar com o assistente
          </Link>
        </div>
      </div>
    </>
  );
}
