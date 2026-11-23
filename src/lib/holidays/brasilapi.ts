/**
 * Integração com a API pública BrasilAPI — feriados nacionais (RF45).
 * Documentação: https://brasilapi.com.br/docs#tag/Feriados-Nacionais
 * Endpoint: GET https://brasilapi.com.br/api/feriados/v1/{ano}
 */
import { z } from "zod";
import type { Holiday } from "@/lib/types";

export const BRASILAPI_HOLIDAYS_URL = "https://brasilapi.com.br/api/feriados/v1";
const TIMEOUT_MS = 8000;

const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1),
  type: z.string().default("national"),
});
const responseSchema = z.array(holidaySchema);

export type HolidaysResult = { ok: true; holidays: Holiday[] } | { ok: false; error: string };

/** Interpreta e valida a resposta da BrasilAPI (exportada para testes). */
export function parseHolidaysResponse(json: unknown): HolidaysResult {
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "A BrasilAPI retornou dados em formato inesperado." };
  return {
    ok: true,
    holidays: parsed.data.map((h) => ({ date: h.date, name: h.name, type: h.type })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * Consulta os feriados de um ano. Resultados ficam em cache por 24 h no servidor (RN14).
 * Nunca lança erro: retorna { ok: false } com mensagem amigável.
 */
export async function fetchHolidays(year: number, fetchImpl: typeof fetch = fetch): Promise<HolidaysResult> {
  if (!Number.isInteger(year) || year < 1900 || year > 2199) {
    return { ok: false, error: "Ano fora do intervalo suportado pela BrasilAPI (1900–2199)." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${BRASILAPI_HOLIDAYS_URL}/${year}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    } as RequestInit);
    if (!res.ok) {
      return {
        ok: false,
        error: res.status === 404 ? `A BrasilAPI não tem feriados para ${year}.` : `A BrasilAPI respondeu com erro ${res.status}.`,
      };
    }
    return parseHolidaysResponse(await res.json());
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return { ok: false, error: aborted ? "A BrasilAPI demorou para responder." : "Não foi possível consultar a BrasilAPI." };
  } finally {
    clearTimeout(timer);
  }
}

/** Feriados de um intervalo de datas (pode atravessar a virada do ano). */
export async function fetchHolidaysBetween(startDate: string, endDate: string): Promise<HolidaysResult> {
  const y1 = Number(startDate.slice(0, 4));
  const y2 = Number(endDate.slice(0, 4));
  const years = y1 === y2 ? [y1] : [y1, y2];
  const results = await Promise.all(years.map((y) => fetchHolidays(y)));
  const failed = results.find((r) => !r.ok);
  if (failed && !failed.ok) return failed;
  const all = results.flatMap((r) => (r.ok ? r.holidays : []));
  return { ok: true, holidays: all.filter((h) => h.date >= startDate && h.date <= endDate) };
}

export function holidayMap(holidays: Holiday[]): Map<string, string> {
  return new Map(holidays.map((h) => [h.date, h.name]));
}
