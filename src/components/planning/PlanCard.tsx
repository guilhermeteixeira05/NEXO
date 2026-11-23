"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { approvePlanAction, rejectPlanAction } from "@/lib/planning/actions";
import { capitalize, formatDateLong, formatDayMonth, formatTime, localDateString } from "@/lib/dates";
import { PLAN_SCOPE_LABELS, PRIORITY_LABELS, type PlanItem, type PlanWithItems } from "@/lib/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  proposto: { label: "Aguardando sua aprovação", cls: "badge--accent" },
  aprovado: { label: "Aprovado", cls: "badge--success" },
  rejeitado: { label: "Rejeitado", cls: "badge--warning" },
  descartado: { label: "Descartado", cls: "" },
};

function describeItem(item: PlanItem, tz: string): { title: string; before?: string; after: string; tag: string } {
  const when = (start: string | null | undefined, end: string | null | undefined, date: string | null | undefined) =>
    start ? `${formatDayMonth(localDateString(new Date(start), tz))} ${formatTime(start, tz)}${end ? "–" + formatTime(end, tz) : ""}` : date ? formatDayMonth(date) : "sem data";
  if (item.action === "priorizar") {
    return {
      title: item.title,
      tag: "Prioridade",
      before: item.previous?.priority ? PRIORITY_LABELS[item.previous.priority] : undefined,
      after: item.priority ? PRIORITY_LABELS[item.priority] : "—",
    };
  }
  if (item.action === "criar") {
    return { title: item.title, tag: "Nova atividade", after: when(item.start_at, item.end_at, item.due_date) };
  }
  const prev = item.previous;
  const hadBefore = prev && (prev.start_at || prev.due_date);
  return {
    title: item.title,
    tag: item.action === "agendar" ? "Encaixar" : "Reagendar",
    before: hadBefore ? when(prev?.start_at, prev?.end_at, prev?.due_date) : "sem horário",
    after: when(item.start_at, item.end_at, item.due_date),
  };
}

/**
 * Prévia de um plano ou proposta da IA (RF23, RF24). Nada é aplicado sem "Aprovar"
 * (heurísticas H3 — controle do usuário — e H5 — prevenção de erros).
 */
export function PlanCard({ plan, tz, headingLevel = 2 }: { plan: PlanWithItems; tz: string; headingLevel?: 2 | 3 }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(plan.status);
  const H = headingLevel === 2 ? "h2" : "h3";
  const st = STATUS[status] ?? STATUS.proposto;

  const decide = (kind: "aprovar" | "rejeitar") =>
    start(async () => {
      const r = kind === "aprovar" ? await approvePlanAction(plan.id) : await rejectPlanAction(plan.id);
      toast(r.message ?? "", r.ok ? "info" : "error");
      if (r.ok) setStatus(kind === "aprovar" ? "aprovado" : "rejeitado");
    });

  const byDate = new Map<string, PlanItem[]>();
  for (const item of plan.items) {
    const d = item.start_at ? localDateString(new Date(item.start_at), tz) : (item.due_date ?? "sem-data");
    byDate.set(d, [...(byDate.get(d) ?? []), item]);
  }
  const adjustPrompt = encodeURIComponent(`Quero ajustar a proposta “${plan.summary ?? PLAN_SCOPE_LABELS[plan.scope]}”: `);

  return (
    <article className={`panel${status === "proposto" ? " panel--accent" : ""}`} aria-labelledby={`plano-${plan.id}`} aria-busy={pending}>
      <div className="panel__header" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="stack" style={{ gap: 4 }}>
          <span className="section-label">
            {PLAN_SCOPE_LABELS[plan.scope]} · {plan.source === "ia" ? "revisado pela IA" : "planejador local"}
          </span>
          <H id={`plano-${plan.id}`} style={{ fontSize: "var(--text-lg)" }}>
            {plan.summary ?? PLAN_SCOPE_LABELS[plan.scope]}
          </H>
        </div>
        <span className={`badge ${st.cls}`}>{st.label}</span>
      </div>

      {plan.items.length === 0 ? <p className="small muted">Nenhuma alteração de horário neste plano.</p> : null}
      {[...byDate.entries()].map(([date, items]) => (
        <div key={date} className="stack" style={{ gap: 8 }}>
          {byDate.size > 1 || plan.scope !== "diario" ? (
            <p className="section-label">{date === "sem-data" ? "Sem data" : capitalize(formatDateLong(date))}</p>
          ) : null}
          <ul className="stack" role="list" style={{ gap: 8 }}>
            {items.map((item) => {
              const d = describeItem(item, tz);
              return (
                <li key={item.id} className="change">
                  <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{d.title}</span>
                    {item.note ? <span className="xsmall muted">{item.note}</span> : null}
                  </span>
                  <span className="change__arrow">
                    <span className="sr-only">{d.tag}: </span>
                    {d.before ? (
                      <>
                        <span className="change__before">{d.before}</span>
                        <span aria-hidden="true"> → </span>
                        <span className="sr-only"> para </span>
                      </>
                    ) : null}
                    {d.after}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {plan.conflicts.length ? (
        <div className="alert alert--warning" role="note">
          <Icon name="alerta" size={18} />
          <div className="stack" style={{ gap: 4 }}>
            <strong>Atenção</strong>
            <ul className="stack" role="list" style={{ gap: 2 }}>
              {plan.conflicts.map((c, i) => (
                <li key={i} className="small">
                  {c.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {plan.unscheduled.length ? (
        <div className="stack" style={{ gap: 4 }}>
          <strong className="small">Não encaixadas ({plan.unscheduled.length})</strong>
          <ul className="stack" role="list" style={{ gap: 2 }}>
            {plan.unscheduled.map((u) => (
              <li key={u.taskId} className="small secondary">
                “{u.title}” — {u.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {plan.notes.length ? (
        <div className="stack" style={{ gap: 4 }}>
          <strong className="small">Sugestões de melhoria</strong>
          <ul className="stack" role="list" style={{ gap: 2 }}>
            {plan.notes.map((n, i) => (
              <li key={i} className="small secondary">
                • {n}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status === "proposto" ? (
        <div className="actions">
          <button type="button" className="btn btn--primary" disabled={pending || plan.items.length === 0} onClick={() => decide("aprovar")}>
            {pending ? <span className="btn__spinner" aria-hidden="true" /> : <Icon name="confirmar" size={20} />}
            Aprovar
          </button>
          <Link href={`/assistente?prompt=${adjustPrompt}`} className="btn btn--secondary">
            Pedir ajustes
          </Link>
          <button type="button" className="btn btn--ghost" disabled={pending} onClick={() => decide("rejeitar")}>
            Rejeitar
          </button>
        </div>
      ) : null}
    </article>
  );
}
