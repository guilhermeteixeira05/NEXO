import { describe, expect, it } from "vitest";
import { estimatedMinutes, groupTasks, isFrequentlyPostponed, isOverdue, nextOccurrence, tasksOnDate } from "@/lib/tasks/rules";
import { brt, makeTask } from "./factories";

const TZ = "America/Sao_Paulo";
const NOW = brt("2026-11-23", "14:00"); // segunda-feira, 14h

describe("RN03 — recorrência", () => {
  it("diária, semanal e mensal", () => {
    expect(nextOccurrence("2026-11-23", "diaria")).toBe("2026-11-24");
    expect(nextOccurrence("2026-11-23", "semanal")).toBe("2026-11-30");
    expect(nextOccurrence("2026-01-31", "mensal")).toBe("2026-02-28");
  });
  it("dias úteis pula o fim de semana", () => {
    expect(nextOccurrence("2026-11-27", "dias_uteis")).toBe("2026-11-30"); // sexta → segunda
    expect(nextOccurrence("2026-11-23", "dias_uteis")).toBe("2026-11-24");
  });
  it("respeita a data final e a ausência de recorrência", () => {
    expect(nextOccurrence("2026-11-23", "semanal", "2026-11-29")).toBeNull();
    expect(nextOccurrence("2026-11-23", "nenhuma")).toBeNull();
  });
});

describe("RN01 — atraso", () => {
  it("prazo de ontem está atrasado; prazo de hoje não", () => {
    expect(isOverdue(makeTask({ due_date: "2026-11-22" }), NOW, TZ)).toBe(true);
    expect(isOverdue(makeTask({ due_date: "2026-11-23" }), NOW, TZ)).toBe(false);
  });
  it("compromisso que já terminou está atrasado se não concluído", () => {
    const t = makeTask({ kind: "compromisso", start_at: brt("2026-11-23", "09:00").toISOString(), end_at: brt("2026-11-23", "10:00").toISOString() });
    expect(isOverdue(t, NOW, TZ)).toBe(true);
    expect(isOverdue({ ...t, status: "concluida" }, NOW, TZ)).toBe(false);
  });
});

describe("RN05 e agrupamento", () => {
  it("adiada 2 vezes ou mais é frequente", () => {
    expect(isFrequentlyPostponed(makeTask({ postponed_count: 2 }))).toBe(true);
    expect(isFrequentlyPostponed(makeTask({ postponed_count: 1 }))).toBe(false);
  });
  it("agrupa em atrasadas, hoje, próximas, sem data e concluídas", () => {
    const tasks = [
      makeTask({ title: "A", due_date: "2026-11-20" }),
      makeTask({ title: "B", due_date: "2026-11-23" }),
      makeTask({ title: "C", due_date: "2026-11-25" }),
      makeTask({ title: "D" }),
      makeTask({ title: "E", status: "concluida", completed_at: NOW.toISOString() }),
      makeTask({ title: "F", status: "cancelada" }),
    ];
    const g = groupTasks(tasks, NOW, TZ);
    expect(g.atrasadas.map((t) => t.title)).toEqual(["A"]);
    expect(g.hoje.map((t) => t.title)).toEqual(["B"]);
    expect(g.proximas.map((t) => t.title)).toEqual(["C"]);
    expect(g.sem_data.map((t) => t.title)).toEqual(["D"]);
    expect(g.concluidas.map((t) => t.title)).toEqual(["E"]);
  });
  it("agenda do dia em ordem cronológica, itens sem horário por último", () => {
    const list = tasksOnDate(
      [
        makeTask({ title: "sem horário", due_date: "2026-11-23", priority: "alta" }),
        makeTask({ title: "18h", start_at: brt("2026-11-23", "18:00").toISOString(), end_at: brt("2026-11-23", "19:00").toISOString() }),
        makeTask({ title: "9h", start_at: brt("2026-11-23", "09:00").toISOString(), end_at: brt("2026-11-23", "10:00").toISOString() }),
      ],
      "2026-11-23",
      TZ,
    );
    expect(list.map((t) => t.title)).toEqual(["9h", "18h", "sem horário"]);
  });
  it("estima a duração pelo horário, pela duração ou pelo padrão", () => {
    expect(estimatedMinutes(makeTask({ start_at: brt("2026-11-23", "09:00").toISOString(), end_at: brt("2026-11-23", "10:30").toISOString() }))).toBe(90);
    expect(estimatedMinutes(makeTask({ duration_minutes: 45 }))).toBe(45);
    expect(estimatedMinutes(makeTask({ duration_minutes: null }), 25)).toBe(25);
  });
});
