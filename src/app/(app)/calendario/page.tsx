import type { Metadata } from "next";
import Link from "next/link";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, Notice, PageHeader, SectionTitle } from "@/components/ui/Misc";
import { getProfile, requireUser } from "@/lib/auth/session";
import {
  addDays,
  capitalize,
  formatDateLong,
  formatDayMonth,
  formatMonthYear,
  isValidDateStr,
  localDateString,
  weekdayOf,
  WEEKDAY_INITIALS,
  WEEKDAY_NAMES,
} from "@/lib/dates";
import { fetchHolidays } from "@/lib/holidays/brasilapi";
import { listGoals } from "@/lib/profile/queries";
import { listTasks } from "@/lib/tasks/queries";
import { isOverdue, taskDate, tasksOnDate } from "@/lib/tasks/rules";

export const metadata: Metadata = { title: "Calendário" };

const pad = (n: number) => String(n).padStart(2, "0");

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const tz = profile.timezone;
  const sp = await searchParams;
  const now = new Date();
  const today = localDateString(now, tz);
  const selected = sp.dia && isValidDateStr(sp.dia) ? sp.dia : today;
  const [year, month] = (sp.mes && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : selected.slice(0, 7)).split("-").map(Number);
  const monthStart = `${year}-${pad(month)}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;

  const [tasks, goals, holidaysRes] = await Promise.all([
    listTasks(supabase, user.id, { status: ["pendente", "concluida"] }),
    listGoals(supabase, user.id, { status: "ativo" }),
    fetchHolidays(year),
  ]);
  const holidays = holidaysRes.ok ? holidaysRes.holidays : [];
  const holidayByDate = new Map(holidays.map((h) => [h.date, h.name]));
  const countByDate = new Map<string, number>();
  for (const t of tasks) {
    const d = taskDate(t, tz);
    if (d && d >= monthStart && d <= monthEnd && t.status !== "cancelada") countByDate.set(d, (countByDate.get(d) ?? 0) + 1);
  }

  // Grade começando no domingo (padrão dos calendários brasileiros)
  const lead = weekdayOf(monthStart);
  const cells: { date: string; inMonth: boolean }[] = [];
  for (let i = -lead; i < daysInMonth + ((7 - ((lead + daysInMonth) % 7)) % 7); i++) {
    const date = addDays(monthStart, i);
    cells.push({ date, inMonth: i >= 0 && i < daysInMonth });
  }
  const dayTasks = tasksOnDate(tasks, selected, tz);
  const monthHolidays = holidays.filter((h) => h.date >= monthStart && h.date <= monthEnd);
  const goalOptions = goals.map((g) => ({ id: g.id, title: g.title }));

  return (
    <>
      <PageHeader title="Calendário" subtitle="Suas atividades por dia, com os feriados nacionais da BrasilAPI." />
      {!holidaysRes.ok ? (
        <Notice tone="warning">
          <span>Feriados indisponíveis no momento: {holidaysRes.error} O calendário continua funcionando normalmente.</span>
        </Notice>
      ) : null}
      <div className="grid-2">
        <section className="panel calendar" aria-labelledby="titulo-mes">
          <div className="calendar__nav">
            <Link href={`/calendario?mes=${prevMonth}`} className="btn btn--icon btn--ghost" aria-label="Mês anterior">
              <Icon name="seta-esquerda" />
            </Link>
            <h2 id="titulo-mes" aria-live="polite">
              {formatMonthYear(year, month)}
            </h2>
            <Link href={`/calendario?mes=${nextMonth}`} className="btn btn--icon btn--ghost" aria-label="Próximo mês">
              <Icon name="seta-direita" />
            </Link>
          </div>
          <div className="calendar__grid">
            {WEEKDAY_INITIALS.map((d, i) => (
              <span key={i} className="calendar__weekday" aria-hidden="true" title={WEEKDAY_NAMES[i]}>
                {d}
              </span>
            ))}
          </div>
          <ul className="calendar__grid" role="list" aria-label={`Dias de ${formatMonthYear(year, month)}`} style={{ margin: 0, padding: 0 }}>
            {cells.map((c) => {
              const count = countByDate.get(c.date) ?? 0;
              const holiday = holidayByDate.get(c.date);
              const label = [
                capitalize(formatDateLong(c.date)),
                holiday ? `feriado: ${holiday}` : null,
                count ? `${count} atividade${count > 1 ? "s" : ""}` : "sem atividades",
                c.date === today ? "hoje" : null,
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <li key={c.date} style={{ display: "grid" }}>
                  <Link
                    href={`/calendario?mes=${c.date.slice(0, 7)}&dia=${c.date}`}
                    className={`calendar__day${c.inMonth ? "" : " calendar__day--outside"}${holiday ? " calendar__day--holiday" : ""}${c.date === today ? " calendar__day--today" : ""}`}
                    aria-current={c.date === selected ? "date" : undefined}
                    aria-label={label}
                  >
                    <span aria-hidden="true">{Number(c.date.slice(8))}</span>
                    <span className="calendar__dots" aria-hidden="true">
                      {holiday ? <span className="calendar__dot calendar__dot--holiday" /> : null}
                      {count ? <span className="calendar__dot" /> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="legend" aria-hidden="true">
            <span className="legend__item">
              <span className="calendar__dot" /> Atividades
            </span>
            <span className="legend__item">
              <span className="calendar__dot calendar__dot--holiday" /> Feriado nacional
            </span>
          </div>
          {monthHolidays.length ? (
            <div className="stack" style={{ gap: 4 }}>
              <h3 className="section-label">Feriados nacionais do mês (BrasilAPI)</h3>
              <ul className="stack" role="list" style={{ gap: 2 }}>
                {monthHolidays.map((h) => (
                  <li key={h.date} className="small secondary">
                    <Icon name="feriado" size={14} className="" /> {formatDayMonth(h.date)} · {h.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="stack" aria-labelledby="titulo-dia">
          <SectionTitle
            id="titulo-dia"
            title={capitalize(formatDateLong(selected))}
            action={
              <Link href={`/planejamento?escopo=diario&data=${selected >= today ? selected : today}`} className="link-btn">
                Planejar dia
              </Link>
            }
          />
          {holidayByDate.get(selected) ? (
            <Notice tone="warning" icon="feriado">
              <span>Feriado nacional: {holidayByDate.get(selected)}</span>
            </Notice>
          ) : null}
          {dayTasks.length ? (
            <ul className="task-list" role="list">
              {dayTasks.map((t) => (
                <TaskItem key={t.id} task={t} tz={tz} goals={goalOptions} today={today} showDate={false} overdue={isOverdue(t, now, tz)} />
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma atividade neste dia.">Use “Nova atividade” para cadastrar um compromisso ou tarefa.</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
