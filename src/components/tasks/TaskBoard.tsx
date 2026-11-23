"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Misc";
import { TaskItem } from "@/components/tasks/TaskItem";
import type { GoalOption } from "@/components/tasks/TaskForm";
import { groupTasks, SECTION_LABELS, type TaskSection } from "@/lib/tasks/rules";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, PRIORITY_LABELS, type Task } from "@/lib/types";

type QuickFilter = "todas" | "hoje" | "atrasadas" | "alta";
const QUICK: { key: QuickFilter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "hoje", label: "Hoje" },
  { key: "atrasadas", label: "Atrasadas" },
  { key: "alta", label: "Alta prioridade" },
];
const ORDER: TaskSection[] = ["atrasadas", "hoje", "proximas", "sem_data", "concluidas"];

/** Lista de atividades com busca e filtros (RF14, RF16). */
export function TaskBoard({ tasks, goals, tz, today, nowIso }: { tasks: Task[]; goals: GoalOption[]; tz: string; today: string; nowIso: string }) {
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<QuickFilter>("todas");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return tasks.filter(
      (t) =>
        (!q || t.title.toLocaleLowerCase("pt-BR").includes(q) || (t.description ?? "").toLocaleLowerCase("pt-BR").includes(q)) &&
        (!category || t.category === category) &&
        (!priority || t.priority === priority) &&
        (quick !== "alta" || t.priority === "alta" || t.priority === "urgente"),
    );
  }, [tasks, query, category, priority, quick]);

  const groups = useMemo(() => groupTasks(filtered, now, tz), [filtered, now, tz]);
  const sections = ORDER.filter((s) => (quick === "hoje" ? s === "hoje" : quick === "atrasadas" ? s === "atrasadas" : true));
  const total = sections.reduce((n, s) => n + groups[s].length, 0);

  return (
    <div className="stack stack--lg">
      <div className="stack" role="search" aria-label="Buscar e filtrar atividades">
        <div className="field">
          <label htmlFor="busca-tarefas" className="sr-only">
            Buscar atividades
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: 12, color: "var(--color-text-muted)" }}>
              <Icon name="buscar" />
            </span>
            <input
              id="busca-tarefas"
              type="search"
              className="input"
              style={{ paddingLeft: 48 }}
              placeholder="Buscar atividades"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="chips" role="group" aria-label="Filtro rápido">
          {QUICK.map((f) => (
            <button key={f.key} type="button" className="chip" aria-pressed={quick === f.key} onClick={() => setQuick(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="form-row form-row--2">
          <div className="field">
            <label className="field__label" htmlFor="filtro-categoria">
              Categoria
            </label>
            <select id="filtro-categoria" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="filtro-prioridade">
              Prioridade
            </label>
            <select id="filtro-prioridade" className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Todas as prioridades</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="small muted" role="status" aria-live="polite">
          {total} atividade{total === 1 ? "" : "s"} encontrada{total === 1 ? "" : "s"}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState title={tasks.length === 0 ? "Você ainda não tem atividades." : "Nenhuma atividade com esses filtros."}>
          {tasks.length === 0 ? "Use o botão “Nova atividade” para cadastrar a primeira tarefa, compromisso ou hábito." : "Limpe a busca ou escolha outro filtro."}
        </EmptyState>
      ) : (
        sections
          .filter((s) => groups[s].length > 0)
          .map((s) => (
            <section key={s} aria-labelledby={`secao-${s}`} className="stack">
              <h2 id={`secao-${s}`} className={`section-label${s === "atrasadas" ? " section-label--danger" : ""}`}>
                {SECTION_LABELS[s]} · {groups[s].length}
              </h2>
              <ul className="task-list" role="list">
                {groups[s].map((t) => (
                  <TaskItem key={t.id} task={t} tz={tz} goals={goals} today={today} overdue={s === "atrasadas"} />
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
