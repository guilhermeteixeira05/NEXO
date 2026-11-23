import { describe, expect, it } from "vitest";
import { fetchHolidays, parseHolidaysResponse } from "@/lib/holidays/brasilapi";
import { signUpSchema, taskSchema } from "@/lib/validation/schemas";

describe("validação de formulários (servidor)", () => {
  const base = { title: "Treino", kind: "tarefa", category: "saude", priority: "media", recurrence: "nenhuma", createReminder: false };
  it("compromisso exige data, início e término coerentes (RN02)", () => {
    const r = taskSchema.safeParse({ ...base, kind: "compromisso", date: "2026-11-24", startTime: "19:00", endTime: "18:00" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain("Informe um horário de término depois do início.");
    expect(taskSchema.safeParse({ ...base, kind: "compromisso" }).success).toBe(false);
  });
  it("aceita tarefa só com título e converte campos vazios", () => {
    const r = taskSchema.safeParse({ ...base, date: "", startTime: "", durationMinutes: "", goalId: "" });
    expect(r.success).toBe(true);
    expect(r.data?.date).toBeUndefined();
  });
  it("campo ausente no formulário (FormData.get → null) é tratado como vazio", () => {
    // Regressão: com "Não se repete", o campo "Repetir até" não é exibido e chegava como null.
    const r = taskSchema.safeParse({ ...base, date: "", recurrenceUntil: null, durationMinutes: null, goalId: null });
    expect(r.success).toBe(true);
  });
  it("recorrência exige data inicial", () => {
    expect(taskSchema.safeParse({ ...base, recurrence: "semanal" }).success).toBe(false);
  });
  it("cadastro valida e-mail e senha com mensagens claras", () => {
    const r = signUpSchema.safeParse({ fullName: "C", email: "invalido", password: "123" });
    expect(r.success).toBe(false);
    const msgs = r.error!.issues.map((i) => i.message).join(" ");
    expect(msgs).toMatch(/e-mail válido/);
    expect(msgs).toMatch(/8 caracteres/);
  });
});

describe("BrasilAPI — tratamento da resposta e de erros", () => {
  it("interpreta e ordena os feriados", () => {
    const r = parseHolidaysResponse([
      { date: "2026-12-25", name: "Natal", type: "national" },
      { date: "2026-01-01", name: "Confraternização mundial", type: "national" },
    ]);
    expect(r.ok && r.holidays.map((h) => h.name)).toEqual(["Confraternização mundial", "Natal"]);
  });
  it("rejeita formato inesperado", () => {
    expect(parseHolidaysResponse({ message: "erro" }).ok).toBe(false);
  });
  it("trata 404 e falha de rede sem lançar exceção", async () => {
    const notFound = (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch;
    const offline = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    const r1 = await fetchHolidays(2026, notFound);
    const r2 = await fetchHolidays(2026, offline);
    expect(r1).toEqual({ ok: false, error: "A BrasilAPI não tem feriados para 2026." });
    expect(r2).toEqual({ ok: false, error: "Não foi possível consultar a BrasilAPI." });
    expect((await fetchHolidays(1800)).ok).toBe(false);
  });
});
