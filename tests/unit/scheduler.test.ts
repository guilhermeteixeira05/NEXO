import { describe, expect, it } from "vitest";
import { buildSchedule, findOverlaps, subtractIntervals, validateBlocks } from "@/lib/planning/scheduler";
import { localTimeString } from "@/lib/dates";
import { brt, makeTask, slot } from "./factories";

const TZ = "America/Sao_Paulo";
const MORNING = brt("2026-11-23", "08:00"); // segunda, 8h
const EVENINGS = [slot(1, "18:00", "22:00"), slot(2, "19:00", "22:00")]; // segunda e terça

describe("subtração de intervalos", () => {
  it("remove o trecho ocupado do meio da janela", () => {
    const r = subtractIntervals([{ start: 0, end: 10 * 60000 * 6 }], [{ start: 20 * 60000, end: 30 * 60000 }]);
    expect(r).toEqual([
      { start: 0, end: 20 * 60000 },
      { start: 30 * 60000, end: 60 * 60000 },
    ]);
  });
});

describe("RN06 — planejador local", () => {
  it("encaixa tarefas somente nas janelas livres, por prioridade", () => {
    const r = buildSchedule({
      dates: ["2026-11-23"],
      tz: TZ,
      availability: EVENINGS,
      now: MORNING,
      tasks: [makeTask({ title: "baixa", priority: "baixa", duration_minutes: 60 }), makeTask({ title: "urgente", priority: "urgente", duration_minutes: 60 })],
    });
    expect(r.blocks.map((b) => b.title)).toEqual(["urgente", "baixa"]);
    expect(localTimeString(r.blocks[0].start, TZ)).toBe("18:00");
    expect(localTimeString(r.blocks[1].start, TZ)).toBe("19:10"); // intervalo de 10 min
    expect(r.unscheduled).toHaveLength(0);
  });

  it("não sobrepõe compromissos fixos (com 10 min de folga)", () => {
    const meeting = makeTask({ title: "Reunião", kind: "compromisso", start_at: brt("2026-11-23", "18:30").toISOString(), end_at: brt("2026-11-23", "19:30").toISOString() });
    const r = buildSchedule({ dates: ["2026-11-23"], tz: TZ, availability: EVENINGS, now: MORNING, tasks: [meeting, makeTask({ title: "Estudar", duration_minutes: 60 })] });
    expect(r.blocks).toHaveLength(1);
    expect(localTimeString(r.blocks[0].start, TZ)).toBe("19:40");
    expect(r.fixed.map((f) => f.title)).toEqual(["Reunião"]);
  });

  it("prioriza atrasadas e adiadas, e lista o que não coube", () => {
    const r = buildSchedule({
      dates: ["2026-11-23"],
      tz: TZ,
      availability: [slot(1, "18:00", "19:00")],
      now: MORNING,
      tasks: [
        makeTask({ title: "normal", priority: "alta", duration_minutes: 50 }),
        makeTask({ title: "atrasada", priority: "baixa", due_date: "2026-11-20", duration_minutes: 50 }),
      ],
    });
    expect(r.blocks.map((b) => b.title)).toEqual(["atrasada"]);
    expect(r.unscheduled.map((u) => u.title)).toEqual(["normal"]);
    expect(r.notes.join(" ")).toMatch(/não couberam/);
  });

  it("não agenda no passado: hoje começa a partir de agora", () => {
    const r = buildSchedule({ dates: ["2026-11-23"], tz: TZ, availability: EVENINGS, now: brt("2026-11-23", "20:02"), tasks: [makeTask({ duration_minutes: 30 })] });
    expect(localTimeString(r.blocks[0].start, TZ)).toBe("20:05");
  });

  it("respeita o prazo: não agenda depois do vencimento", () => {
    const r = buildSchedule({
      dates: ["2026-11-23", "2026-11-24"],
      tz: TZ,
      availability: [slot(2, "19:00", "22:00")], // só terça
      now: MORNING,
      tasks: [makeTask({ title: "prazo segunda", due_date: "2026-11-23", duration_minutes: 30 })],
    });
    expect(r.blocks).toHaveLength(0);
    expect(r.unscheduled[0].reason).toMatch(/antes do prazo|horários livres/);
  });

  it("sem disponibilidade, explica como resolver", () => {
    const r = buildSchedule({ dates: ["2026-11-23"], tz: TZ, availability: [], now: MORNING, tasks: [makeTask()] });
    expect(r.unscheduled[0].reason).toMatch(/Disponibilidade/);
    expect(r.notes.join(" ")).toMatch(/Cadastre seus horários livres/);
  });

  it("menciona feriados no período", () => {
    const r = buildSchedule({ dates: ["2026-12-25"], tz: TZ, availability: [], now: MORNING, tasks: [], holidays: new Map([["2026-12-25", "Natal"]]) });
    expect(r.notes.join(" ")).toMatch(/Natal/);
  });
});

describe("RN07 — conflitos", () => {
  it("detecta sobreposição entre compromissos", () => {
    const a = { id: "a", title: "Treino", kind: "compromisso" as const, start: brt("2026-11-23", "18:30"), end: brt("2026-11-23", "19:30") };
    const b = { id: "b", title: "Orientador", kind: "compromisso" as const, start: brt("2026-11-23", "19:00"), end: brt("2026-11-23", "20:00") };
    const c = findOverlaps([a, b], TZ);
    expect(c).toHaveLength(1);
    expect(c[0].message).toContain("Treino");
    expect(c[0].message).toContain("Orientador");
  });

  it("aponta tarefa com horário fora da disponibilidade", () => {
    const t = makeTask({ title: "Ler", start_at: brt("2026-11-23", "07:00").toISOString(), end_at: brt("2026-11-23", "08:00").toISOString() });
    const r = buildSchedule({ dates: ["2026-11-23"], tz: TZ, availability: EVENINGS, now: brt("2026-11-23", "06:00"), tasks: [t] });
    expect(r.conflicts.some((c) => c.type === "fora_disponibilidade")).toBe(true);
  });

  it("valida blocos propostos pela IA", () => {
    const fixed = [{ id: "m", title: "Reunião", kind: "compromisso" as const, start: brt("2026-11-23", "18:30"), end: brt("2026-11-23", "19:30") }];
    const ok = validateBlocks([{ taskId: "t", start: brt("2026-11-23", "20:00"), end: brt("2026-11-23", "21:00") }], fixed, EVENINGS, TZ);
    const clash = validateBlocks([{ taskId: "t", start: brt("2026-11-23", "19:00"), end: brt("2026-11-23", "20:00") }], fixed, EVENINGS, TZ);
    const outside = validateBlocks([{ taskId: "t", start: brt("2026-11-23", "10:00"), end: brt("2026-11-23", "11:00") }], fixed, EVENINGS, TZ);
    expect(ok).toEqual([]);
    expect(clash.join()).toMatch(/compromisso fixo/);
    expect(outside.join()).toMatch(/fora dos horários livres/);
  });
});
