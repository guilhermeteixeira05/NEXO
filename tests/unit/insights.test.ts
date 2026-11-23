import { describe, expect, it } from "vitest";
import { computeMetrics, describePatterns, ruleBasedSuggestions } from "@/lib/insights/metrics";
import { computeSignals, isAllowedActionHref } from "@/lib/insights/signals";
import type { ActivityLogEntry } from "@/lib/types";
import { brt, makeTask } from "./factories";

const TZ = "America/Sao_Paulo";
const NOW = brt("2026-11-23", "14:00");

function log(event: ActivityLogEntry["event"], at: Date, category = "estudos", title = "x"): ActivityLogEntry {
  return { id: `${event}-${at.toISOString()}-${title}`, user_id: "u1", task_id: null, plan_id: null, event, task_title: title, category, details: {}, created_at: at.toISOString() };
}

describe("Módulo 6 — indicadores", () => {
  const activity = [
    log("concluida", brt("2026-11-19", "09:30")), // quinta
    log("concluida", brt("2026-11-19", "10:30"), "trabalho"),
    log("concluida", brt("2026-11-20", "21:00")),
    log("adiada", brt("2026-11-21", "08:00")),
    log("criada", brt("2026-11-21", "08:00")),
    log("concluida", brt("2026-11-01", "09:00")), // fora do período
  ];
  const tasks = [makeTask({ due_date: "2026-11-22", title: "perdida" }), makeTask({ postponed_count: 3, title: "Inglês" })];
  const m = computeMetrics({ periodStart: "2026-11-17", days: 7, log: activity, tasks, goals: [], now: NOW, tz: TZ });

  it("conta conclusões, adiamentos e criações do período", () => {
    expect(m.completed).toBe(3);
    expect(m.postponed).toBe(1);
    expect(m.created).toBe(1);
    expect(m.completedByDay).toHaveLength(7);
    expect(m.completedByDay.find((d) => d.date === "2026-11-19")?.count).toBe(2);
  });
  it("taxa de conclusão = concluídas ÷ (concluídas + vencidas não concluídas)", () => {
    expect(m.completionRate).toBe(75); // 3 / (3 + 1)
  });
  it("identifica padrões: dia mais produtivo, período de pico e mais adiadas", () => {
    expect(m.bestWeekday?.name).toBe("Quinta");
    expect(m.peakPeriod?.period).toBe("manha");
    expect(m.mostPostponed[0]).toMatchObject({ title: "Inglês", count: 3 });
    const p = describePatterns(m).join(" ");
    expect(p).toMatch(/Quinta/);
    expect(p).toMatch(/Inglês/);
    expect(ruleBasedSuggestions(m, "Noite").join(" ")).toMatch(/Inglês|foco/);
  });
});

describe("RF25 — sinais proativos", () => {
  it("gera alertas de compromisso, atraso e adiamentos com links internos", () => {
    const signals = computeSignals({
      now: NOW,
      tz: TZ,
      tasks: [
        makeTask({ title: "Treino de peito", kind: "compromisso", start_at: brt("2026-11-23", "18:30").toISOString(), end_at: brt("2026-11-23", "19:30").toISOString() }),
        makeTask({ title: "Relatório", due_date: "2026-11-22" }),
        makeTask({ title: "Inglês", postponed_count: 2 }),
      ],
      holidays: [{ date: "2026-11-25", name: "Feriado teste", type: "national" }],
    });
    const kinds = signals.map((s) => s.kind);
    expect(kinds).toEqual(expect.arrayContaining(["proximo_compromisso", "atrasadas", "adiadas_frequentes", "feriado_proximo"]));
    expect(signals[0].kind).toBe("atrasadas"); // maior prioridade
    expect(signals.find((s) => s.kind === "proximo_compromisso")?.message).toBe(
      "Hoje você tem “Treino de peito” às 18:30. Deseja consultar sua programação?",
    );
    for (const s of signals) expect(isAllowedActionHref(s.action.href)).toBe(true);
  });
  it("bloqueia links externos sugeridos pela IA", () => {
    expect(isAllowedActionHref("https://exemplo.com")).toBe(false);
    expect(isAllowedActionHref("//exemplo.com")).toBe(false);
    expect(isAllowedActionHref("/planejamento?escopo=diario")).toBe(true);
    expect(isAllowedActionHref("/admin")).toBe(false);
  });
});
