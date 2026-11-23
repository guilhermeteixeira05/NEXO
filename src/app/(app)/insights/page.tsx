import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import { EmptyState, PageHeader, ProgressBar, SectionTitle, Stat } from "@/components/ui/Misc";
import { requireUser } from "@/lib/auth/session";
import { addDays, formatDateShort, formatDateTime, formatDayMonth, formatWeekdayShort, startOfWeekMonday } from "@/lib/dates";
import { generateWeeklySummaryAction } from "@/lib/insights/actions";
import { computeMetrics, describePatterns, ruleBasedSuggestions } from "@/lib/insights/metrics";
import { getWeeklySummary } from "@/lib/insights/service";
import { loadUserSnapshot } from "@/lib/snapshot";
import { FOCUS_LABELS, type ActivityEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Insights e histórico" };

const EVENT_INFO: Record<ActivityEvent, { label: string; icon: IconName; color: string }> = {
  criada: { label: "Criada", icon: "adicionar", color: "var(--color-text-muted)" },
  editada: { label: "Editada", icon: "editar", color: "var(--color-text-muted)" },
  concluida: { label: "Concluída", icon: "confirmar", color: "var(--color-success)" },
  reaberta: { label: "Reaberta", icon: "repetir", color: "var(--color-text-muted)" },
  adiada: { label: "Adiada", icon: "adiar", color: "var(--color-warning)" },
  reagendada: { label: "Reagendada", icon: "relogio", color: "var(--color-accent)" },
  excluida: { label: "Excluída", icon: "excluir", color: "var(--color-danger)" },
  plano_aprovado: { label: "Plano aprovado", icon: "planejamento", color: "var(--color-accent)" },
  plano_rejeitado: { label: "Plano rejeitado", icon: "planejamento", color: "var(--color-text-muted)" },
  objetivo_concluido: { label: "Objetivo concluído", icon: "objetivos", color: "var(--color-success)" },
};

const FILTERS = [
  { key: "todos", label: "Tudo" },
  { key: "concluida", label: "Concluídas" },
  { key: "adiada", label: "Adiadas" },
] as const;

export default async function InsightsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase } = await requireUser();
  const snapshot = await loadUserSnapshot({ activityDays: 45 });
  const sp = await searchParams;
  const days = sp.periodo === "30" ? 30 : 7;
  const filter = FILTERS.some((f) => f.key === sp.historico) ? sp.historico! : "todos";
  const tz = snapshot.profile.timezone;
  const m = computeMetrics({
    periodStart: addDays(snapshot.today, -(days - 1)),
    days,
    log: snapshot.activity,
    tasks: snapshot.tasks,
    goals: snapshot.goals,
    now: snapshot.now,
    tz,
  });
  const patterns = describePatterns(m);
  const suggestions = ruleBasedSuggestions(m, FOCUS_LABELS[snapshot.profile.focus_period]);
  const weekStart = startOfWeekMonday(addDays(snapshot.today, -7)); // última semana completa
  const thisWeek = startOfWeekMonday(snapshot.today);
  const summary = (await getWeeklySummary(supabase, snapshot.userId, thisWeek)) ?? (await getWeeklySummary(supabase, snapshot.userId, weekStart));
  const maxDay = Math.max(1, ...m.completedByDay.map((d) => d.count));
  const chartDays = days === 7 ? m.completedByDay : m.completedByDay.slice(-14);
  const history = snapshot.activity.filter((e) => filter === "todos" || e.event === filter).slice(0, 40);

  return (
    <>
      <PageHeader
        title="Insights e histórico"
        subtitle={`Período: ${formatDateShort(m.periodStart)} a ${formatDateShort(m.periodEnd)}`}
        actions={
          <nav className="segmented" aria-label="Período">
            <Link href="/insights?periodo=7" className="segmented__option" aria-current={days === 7 ? "page" : undefined}>
              7 dias
            </Link>
            <Link href="/insights?periodo=30" className="segmented__option" aria-current={days === 30 ? "page" : undefined}>
              30 dias
            </Link>
          </nav>
        }
      />

      <section aria-labelledby="titulo-indicadores" className="stack">
        <h2 id="titulo-indicadores" className="sr-only">
          Indicadores de produtividade
        </h2>
        <div className="stats">
          <Stat label="Taxa de conclusão" value={m.completionRate === null ? "—" : `${m.completionRate}%`} hint="Concluídas ÷ previstas no período" />
          <Stat label="Concluídas" value={m.completed} hint={`${m.created} criada(s) no período`} />
          <Stat label="Adiamentos" value={m.postponed} hint={m.mostPostponed.length ? `${m.mostPostponed.length} atividade(s) adiadas 2×+` : "Nenhuma repetição"} />
          <Stat label="Atrasadas agora" value={m.overdueNow} hint={`${m.pendingNow} pendente(s) no total`} />
        </div>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="titulo-grafico">
          <h2 id="titulo-grafico" style={{ fontSize: "var(--text-lg)" }}>
            Concluídas por dia{days === 30 ? " (últimos 14 dias)" : ""}
          </h2>
          <div className="bars" style={{ ["--bars" as string]: chartDays.length }} aria-hidden="true">
            {chartDays.map((d) => (
              <div key={d.date} className="bars__col">
                <span className="bars__value">{d.count}</span>
                <span className={`bars__bar${d.count === maxDay && d.count > 0 ? " bars__bar--max" : ""}`} style={{ height: `${(d.count / maxDay) * 100}%` }} />
                <span className="bars__label">{days === 7 ? formatWeekdayShort(d.date) : formatDayMonth(d.date).slice(0, 2)}</span>
              </div>
            ))}
          </div>
          <table className="sr-only">
            <caption>Atividades concluídas por dia</caption>
            <thead>
              <tr>
                <th scope="col">Dia</th>
                <th scope="col">Concluídas</th>
              </tr>
            </thead>
            <tbody>
              {chartDays.map((d) => (
                <tr key={d.date}>
                  <td>{formatDateShort(d.date)}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {m.completedByCategory.length ? (
            <div className="stack" style={{ gap: 8 }}>
              <h3 className="section-label">Por categoria</h3>
              {m.completedByCategory.map((c) => (
                <div key={c.category} className="stack" style={{ gap: 4 }}>
                  <div className="panel__header small">
                    <span>{c.label}</span>
                    <span className="secondary">{c.count}</span>
                  </div>
                  <ProgressBar value={(c.count / Math.max(1, m.completed)) * 100} label={`${c.label}: ${c.count} conclusões`} />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="stack stack--lg">
          <section className={`panel${summary?.source === "ia" ? " panel--accent" : ""}`} aria-labelledby="titulo-resumo-semanal">
            <div className="panel__header">
              <h2 id="titulo-resumo-semanal" style={{ fontSize: "var(--text-lg)" }}>
                {summary?.title ?? "Resumo semanal"}
              </h2>
              {summary ? <span className="badge">{summary.source === "ia" ? "IA" : "Regras"}</span> : null}
            </div>
            {summary ? (
              <>
                <p className="xsmall muted">
                  Semana de {formatDateShort(summary.periodStart)} a {formatDateShort(summary.periodEnd)} · gerado em {formatDateTime(summary.createdAt, tz)}
                </p>
                <p className="small">{summary.summary}</p>
                {summary.highlights.length ? (
                  <ul className="stack small secondary" style={{ gap: 2, paddingLeft: 18, margin: 0 }}>
                    {summary.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                ) : null}
                {summary.suggestions.length ? (
                  <>
                    <h3 className="section-label">Sugestões para a próxima semana</h3>
                    <ul className="stack small" style={{ gap: 2, paddingLeft: 18, margin: 0 }}>
                      {summary.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </>
            ) : (
              <p className="small secondary">Gere um resumo da semana atual com destaques e sugestões personalizadas.</p>
            )}
            <div className="actions">
              <ActionButton action={generateWeeklySummaryAction.bind(null, thisWeek)} pendingText="Gerando resumo…">
                <Icon name="assistente" size={18} /> {summary ? "Gerar novamente" : "Gerar resumo da semana"}
              </ActionButton>
            </div>
          </section>

          <section className="panel" aria-labelledby="titulo-padroes">
            <h2 id="titulo-padroes" style={{ fontSize: "var(--text-lg)" }}>
              Padrões identificados
            </h2>
            {patterns.length ? (
              <ul className="stack small secondary" style={{ gap: 4, paddingLeft: 18, margin: 0 }}>
                {patterns.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Conclua e adie atividades por alguns dias para o NEXO identificar padrões.</p>
            )}
            <h3 className="section-label">Sugestões de melhoria</h3>
            <ul className="stack small" style={{ gap: 4, paddingLeft: 18, margin: 0 }}>
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>

          {m.goals.length ? (
            <section className="panel" aria-labelledby="titulo-acomp-objetivos">
              <h2 id="titulo-acomp-objetivos" style={{ fontSize: "var(--text-lg)" }}>
                Acompanhamento de objetivos
              </h2>
              {m.goals.map((g) => (
                <div key={g.id} className="stack" style={{ gap: 4 }}>
                  <div className="panel__header small">
                    <span>{g.title}</span>
                    <span className="secondary">
                      {g.progress}% · {g.linkedDone}/{g.linkedTotal} atividades
                    </span>
                  </div>
                  <ProgressBar value={g.progress} label={`Progresso de ${g.title}`} />
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>

      <section className="stack" aria-labelledby="titulo-historico">
        <SectionTitle id="titulo-historico" title="Histórico" />
        <nav className="chips" aria-label="Filtrar histórico">
          {FILTERS.map((f) => (
            <Link key={f.key} href={`/insights?periodo=${days}&historico=${f.key}`} className="chip" aria-current={filter === f.key ? "page" : undefined}>
              {f.label}
            </Link>
          ))}
        </nav>
        {history.length ? (
          <ol className="panel history" role="list">
            {history.map((e) => {
              const info = EVENT_INFO[e.event];
              const det = e.details as { para?: string; vezes?: number; aplicados?: number };
              return (
                <li key={e.id} className="history__item">
                  <span style={{ color: info.color }}>
                    <Icon name={info.icon} size={20} />
                  </span>
                  <span className="stack" style={{ gap: 2 }}>
                    <span>
                      <strong>{info.label}</strong>
                      {e.task_title ? `: ${e.task_title}` : ""}
                      {e.event === "adiada" && det.para ? ` → ${formatDayMonth(det.para)}${det.vezes ? ` (${det.vezes}º adiamento)` : ""}` : ""}
                      {e.event === "plano_aprovado" && det.aplicados !== undefined ? ` (${det.aplicados} alteração(ões))` : ""}
                    </span>
                    <span className="history__when">{formatDateTime(e.created_at, tz)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState title="Nenhum registro no histórico ainda.">Concluir, adiar e aprovar planos gera registros aqui automaticamente.</EmptyState>
        )}
      </section>
    </>
  );
}
