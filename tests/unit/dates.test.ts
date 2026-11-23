import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonthsClamped,
  diffDays,
  formatDateLong,
  isValidDateStr,
  isValidTimeStr,
  localDateString,
  localTimeString,
  minutesToTime,
  startOfWeekMonday,
  weekdayOf,
  zonedToUtc,
} from "@/lib/dates";

describe("datas e fuso horário", () => {
  it("converte horário de Brasília para UTC (UTC−3)", () => {
    expect(zonedToUtc("2026-11-23", "18:30", "America/Sao_Paulo").toISOString()).toBe("2026-11-23T21:30:00.000Z");
  });

  it("converte horário do Amazonas (UTC−4)", () => {
    expect(zonedToUtc("2026-11-23", "08:00", "America/Manaus").toISOString()).toBe("2026-11-23T12:00:00.000Z");
  });

  it("obtém data e hora locais de um instante UTC", () => {
    const d = new Date("2026-11-24T02:30:00Z"); // 23:30 do dia 23 em Brasília
    expect(localDateString(d, "America/Sao_Paulo")).toBe("2026-11-23");
    expect(localTimeString(d, "America/Sao_Paulo")).toBe("23:30");
  });

  it("calcula dia da semana e soma de dias atravessando meses", () => {
    expect(weekdayOf("2026-11-23")).toBe(1); // segunda-feira
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(diffDays("2026-11-23", "2026-12-25")).toBe(32);
  });

  it("soma meses limitando ao último dia do mês", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2026-11-15", 1)).toBe("2026-12-15");
  });

  it("encontra a segunda-feira da semana", () => {
    expect(startOfWeekMonday("2026-11-29")).toBe("2026-11-23"); // domingo → segunda anterior
    expect(startOfWeekMonday("2026-11-23")).toBe("2026-11-23");
  });

  it("valida formatos de data e hora", () => {
    expect(isValidDateStr("2026-02-29")).toBe(false);
    expect(isValidDateStr("2028-02-29")).toBe(true);
    expect(isValidTimeStr("24:00")).toBe(false);
    expect(isValidTimeStr("07:05")).toBe(true);
    expect(minutesToTime(18 * 60 + 30)).toBe("18:30");
  });

  it("formata datas em português", () => {
    expect(formatDateLong("2026-11-23")).toBe("segunda-feira, 23 de novembro");
  });
});
